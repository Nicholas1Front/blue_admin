import {Response,Request} from 'express';
import {
    loginSchema
} from './auth.schema.js';

import authService from './auth.service.js';

import {AppError} from '../../shared/errors/AppError.js';

class AuthController{
    async login(
        req : Request,
        res : Response
    ){
        const data = loginSchema.parse(req.body);

        const user = await authService.login(data);

        return res.status(200).json({
            message : 'User logged in successfully',
            data : user
        })
    }
}

export default new AuthController();