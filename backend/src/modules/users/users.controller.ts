import {Response,Request} from 'express';

import {
    createUserSchema,
    updateUserSchema,
    findUserByFiltersSchema
} from './users.schema.js';

import usersService from './users.service.js';
import {AppError} from '../../shared/errors/AppError.js';

class UsersController{
    // createFirstUser is only for development, delete before release
    async createFirstUser(
        req : Request,
        res : Response
    ){
        const data = createUserSchema.parse(req.body);

        const user = await usersService.createUser(data);

        return res.status(200).json({
            message : 'First user created successfully',
            data : user
        })
    }

    async createUser(
        req : Request,
        res : Response
    ){
        if(!req.user){
            throw new AppError(
                'User not authenticated',
                401,
                'USER_NOT_AUTHENTICATED'
            )
        }

        const data = createUserSchema.parse(req.body);

        const user = await usersService.createUser(data);

        return res.status(200).json({
            message : 'User created successfully',
            data : user
        })
    }

    async updateUser(
        req : Request,
        res : Response
    ){

        if(!req.user){
            throw new AppError(
                'User not authenticated',
                401,
                'USER_NOT_AUTHENTICATED'
            )
        }

        const data = updateUserSchema.parse(req.body);

        const user = await usersService.updateUser(
            req.params.id as string,
            data
        );

        return res.status(200).json({
            message : 'User updated successfully',
            data : user
        })
    }

    async findUserByFilters(
        req : Request,
        res : Response
    ){
        if(!req.user){
            throw new AppError(
                'User not authenticated',
                401,
                'USER_NOT_AUTHENTICATED'
            )
        }

        const data = findUserByFiltersSchema.parse(req.query);

        const users = await usersService.findUserByFilters(data);

        return res.status(200).json({
            message : 'Users found successfully',
            data : users
        })
    }

    async deleteUserById(
        req : Request,
        res : Response
    ){
        if(!req.user){
            throw new AppError(
                'User not authenticated',
                401,
                'USER_NOT_AUTHENTICATED'
            )
        }

        await usersService.deleteUserById(req.params.id as string);

        return res.status(200).json({
            message : 'User deleted successfully'
        })
    }
}

export default new UsersController();