import { Router } from "express";
import { IRoutes } from "../common/types";
import { inject, injectable } from "inversify";

import { UserController } from "./user-controller";
import { CONTAINER_TYPES } from "../common/constants";
import DtoValidatorMiddleware from "../common/middlewares/dto-validator-middleware";
import { CreateUserDto } from "./dto/create-user-dto";
import { UpdateUserDto } from "./dto/update-user-dto";

@injectable()
export default class UserRoutes implements IRoutes {
    private readonly _router = Router();
    private readonly createValidator = new DtoValidatorMiddleware(CreateUserDto);
    private readonly updateValidator = new DtoValidatorMiddleware(UpdateUserDto);

    constructor(
        @inject(CONTAINER_TYPES.USER_CONTROLLER) private readonly userController: UserController
    ) {
        this.setupRoutes();
    }

    private setupRoutes() {
        this._router.route('/')
            .get(this.userController.get.bind(this.userController))
            .post(
                this.createValidator.validate.bind(this.createValidator),
                this.userController.post.bind(this.userController)
            );
        this._router.route('/:id')
            .get(this.userController.getById.bind(this.userController))
            .put(
                this.updateValidator.validate.bind(this.updateValidator),
                this.userController.put.bind(this.userController))
            .delete(this.userController.delete.bind(this.userController)
        );
    }

    get router(): Router {
        return this._router;
    }
}