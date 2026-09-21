import {Response,Request} from 'express';

import {
    firstUserSchema
} from './users.schema.js';

import usersService from './users.service.js';
import {AppError} from '../../shared/errors/AppError.js';

class UsersController{
    async createFirstUser(
        req : Request,
        res : Response
    ){
        const data = firstUserSchema.parse(req.body);

        const user = await usersService.createFirstUser(data);

        return res.status(200).json({
            message : 'User created successfully',
            data : user
        })
    }
}

export default new UsersController();