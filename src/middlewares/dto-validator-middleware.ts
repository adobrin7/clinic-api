import { Request, Response, NextFunction } from 'express';
import { validate, ValidationError } from 'class-validator';
import { plainToClass } from "class-transformer";
import { StatusCodes } from '../enums/status-codes';
import { requestMethods } from '../enums/request-methods';

export default class DtoValidatorMiddleware<TDto extends object> {
    private readonly dtoClassConstructor: new (...args: any[]) => TDto;

    constructor(dtoClassConstructor: new (...args: any[]) => TDto) {
        this.dtoClassConstructor = dtoClassConstructor;
    } 

    async validate(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        if (req.method === requestMethods.GET) {
            return next();
        }
        const dtoObject = plainToClass(this.dtoClassConstructor, req.body);
        const validationErrors: ValidationError[] = await validate(dtoObject);
        if (validationErrors.length > 0) {
            return res.status(StatusCodes.BAD_REQUEST).json({ errors: validationErrors });
        }
        next();
    }
}