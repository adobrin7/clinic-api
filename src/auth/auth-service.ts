import { IDataProvider } from "../common/types";
import { inject, injectable } from "inversify";
import { CONTAINER_TYPES } from "../common/constants";
import { DuplicateEntityError, InvalidParameterError, NotAuthorizedError } from "../common/errors";
import { ErrorMessageEnum, ResponseMessageEnum, TokenLifetimeEnum, UserRoleEnum } from "../common/enums";
import bcrypt from 'bcrypt';
import jwt from "jsonwebtoken";
import { IUser } from "../user/user-interface";
import UserService from "../user/user-service";
import { UpdateUserDto } from "../user/dto/update-user-dto";
import { LoginDto } from "./dto/login-dto";
import { RegisterDto } from "./dto/register-dto";
import { AuthedUser, UserPayload } from "./auth-types";
import { ResetPasswordDto } from "./dto/reset-password-dto";
import { RecoverPasswordDto } from "./dto/recover-password-dto";
import { validDto, validateDto } from "../common/decorator";

@injectable()
export class AuthService {
    constructor(
        @inject(CONTAINER_TYPES.USER_DATA_PROVIDER) private readonly provider: IDataProvider<IUser>,
        @inject(CONTAINER_TYPES.USER_SERVICE) private readonly userService: UserService
    ) {

    }

    @validateDto
    public async register(@validDto(RegisterDto) registerData: RegisterDto): Promise<AuthedUser> {
        const newUser = await this.userService.createUser(registerData);    
        const token = this.signTokenForUser(newUser as UserPayload, TokenLifetimeEnum.REGISTER_TOKEN);

        return { user: { email: newUser.email, role: newUser.role, id: newUser.id }, token };
    }

    @validateDto
    public async login(@validDto(LoginDto) loginData: LoginDto): Promise<AuthedUser> {
        const foundUser = await this.userService.getUserByEmail(loginData.email);

        // Review: return undefined or throw error when user not found? 
        // Undefined can be processed with controller to return code 400
        if (!foundUser) {
            return;
        }

        const isMatch = await bcrypt.compare(loginData.password, foundUser.password);
        if (isMatch) {
            const token = this.signTokenForUser(foundUser as UserPayload, TokenLifetimeEnum.LOGIN_TOKEN);
            return { user: { email: foundUser.email, role: foundUser.role, id: foundUser.id }, token };
        } else {
            throw new NotAuthorizedError(ErrorMessageEnum.INVALID_PASSWORD);
        }
    }

    @validateDto
    public async resetPassword(@validDto(ResetPasswordDto) resetData: ResetPasswordDto) {
        const user = await this.userService.getUserByEmail(resetData.email);
        if (!user) {
            throw new InvalidParameterError(ErrorMessageEnum.USER_NOT_FOUND.replace('%s', resetData.email));
        }

        const resetToken = this.signTokenForUser(user as UserPayload, TokenLifetimeEnum.RESET_TOKEN);
        await this.userService.updateUserResetToken(resetData.email, resetToken);

        return resetToken;
    }

    @validateDto
    public async recoverPassword(@validDto(RecoverPasswordDto) recoverData: RecoverPasswordDto) {
        const { resetToken, password } = recoverData
        const user = await this.userService.getUserByResetToken(resetToken);
        if (!user) {
            throw new InvalidParameterError(ErrorMessageEnum.INVALID_RESET_TOKEN);
        }
        await this.userService.updateUserById(user.id, new UpdateUserDto(user.email, password, user.firstName, user.role, user.resetToken));
        return ResponseMessageEnum.PASSWORD_RECOVERED;
    }

    private signTokenForUser(user: UserPayload, lifetime: string) {
        // Review: get secret key from .env file? Use email, role and id for token payload?
        // Can i consider payload as auth data I want to share with client after auth?
        return jwt.sign(
            { 
                email: user.email, 
                role: user.role, 
                id: user.id 
            }, 
            process.env.SECRET_KEY, 
            {
                expiresIn: lifetime,
            }
        );
    }
}
