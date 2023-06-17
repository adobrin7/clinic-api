import { inject, injectable } from 'inversify';
import { GetOptions } from '../common/types';
import { CONTAINER_TYPES } from '../common/constants';
import { HttpError } from '../common/errors';
import { ErrorMessageEnum, StatusCodeEnum } from '../common/enums';
import { merge } from 'lodash';
import { CreateUserDto } from './dto/create-user-dto';
import { UpdateUserDto } from './dto/update-user-dto';
import { validDto, validateDto } from '../common/decorator/validate-dto';
import { User } from './user';
import { UserRepository } from './user-repository';
import { EntityNotFoundError, QueryFailedError } from 'typeorm';
import { RepositoryUtils } from '../common/util/repository-utils';

@injectable()
export class UserService {
	constructor(
		@inject(CONTAINER_TYPES.USER_REPOSITORY) private readonly userRepository: UserRepository,
	) {}

	@validateDto
	public async create(@validDto(CreateUserDto) user: CreateUserDto): Promise<User> {
		await this.throwIfEmailTaken(user.email);
		const createdUser = new User();
		createdUser.email = user.email.toLowerCase();
		createdUser.role = user.role;
		createdUser.firstName = user.firstName;
		createdUser.password = user.password;
		return await this.userRepository.save(createdUser);
	}

	private async throwIfEmailTaken(email: string): Promise<void> {
		const user = await this.userRepository.findOneBy({ email: email.toLowerCase() });
		if (user) {
			throw new HttpError(
				StatusCodeEnum.CONFLICT,
				`Email adress [${user.email}] is allready in use`,
			);
		}
	}

	public async get(options: GetOptions): Promise<User[]> {
		try {
			return RepositoryUtils.findMatchingOptions(this.userRepository, options);
		} catch (err) {
			if (err instanceof QueryFailedError && err.driverError.file === 'uuid.c') {
				throw new HttpError(StatusCodeEnum.BAD_REQUEST, ErrorMessageEnum.UNKNOWN_QUERY_PARAMETER);
			}
			throw err;
		}
	}

	public async getById(id: string): Promise<User> {
		try {
			const user = await this.userRepository.findOneByOrFail({ id });
			return user;
		} catch (err) {
			if (err instanceof EntityNotFoundError) {
				throw new HttpError(StatusCodeEnum.NOT_FOUND, `User [${id}] not found`);
			}
			if (err instanceof QueryFailedError && err.driverError.file === 'uuid.c') {
				throw new HttpError(StatusCodeEnum.NOT_FOUND, `User [${id}] not found`);
			}
			throw err;
		}
	}

	public async getByEmail(email: string): Promise<User> {
		const user = await this.userRepository.findOneBy({ email: email.toLowerCase() });
		if (!user) {
			throw new HttpError(StatusCodeEnum.NOT_FOUND, `User does not exist`);
		}
		return user;
	}

	public async getByResetToken(token: string): Promise<User> {
		const user = await this.userRepository.findOneBy({ resetToken: token });
		if (!user) {
			throw new HttpError(StatusCodeEnum.NOT_FOUND, `User not found`);
		}
		return user;
	}

	public async activate(link: string) {
		const user = await this.userRepository.findOneBy({ activationLink: link });
		if (!user) {
			throw new HttpError(StatusCodeEnum.BAD_REQUEST, `Invalid activation link`);
		}
		user.isActivated = true;
		await this.userRepository.save(user);
	}

	public async updateResetToken(email: string, token: string | null): Promise<User> {
		const user = await this.getByEmail(email);
		user.resetToken = token;
		return this.userRepository.save(user);
	}

	@validateDto
	public async update(id: string, @validDto(UpdateUserDto) userDto: UpdateUserDto): Promise<User> {
		if (userDto.resetToken === undefined && userDto.email) {
			await this.throwIfEmailTaken(userDto.email);
		}
		const user = await this.getById(id);
		// Review: стоит ли использовать подобного рода неочевидные функции? Это lodash
		merge(user, userDto);
		return this.userRepository.save(user);
	}

	public async delete(id: string): Promise<void> {
		try {
			const res = await this.userRepository.delete(id);
			if (!res.affected) {
				throw new HttpError(StatusCodeEnum.CONFLICT, `User [${id}] might be allready deleted`);
			}
		} catch (err) {
			if (err instanceof QueryFailedError && err.driverError.file === 'uuid.c') {
				throw new HttpError(StatusCodeEnum.NOT_FOUND, `User [${id}] not found`);
			}
			throw err;
		}
	}
}
