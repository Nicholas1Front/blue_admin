import {AppError} from '../../shared/errors/AppError.js';
import type {
    LoginDTO
} from './auth.dto.js';
import authRepository from "./auth.repository.js";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const SALT_ROUNDS = 10;

class AuthService{
    async login(
        data : LoginDTO
    ){
        const existingUser = await authRepository.findUserByEmail(data.email);

        if(!existingUser){
            throw new AppError(
                'User not found',
                404,
                'USER_NOT_FOUND'
            )
        }

        const passwordMatch = await bcrypt.compare(data.password, existingUser.passwordHash);

        if(!passwordMatch){
            throw new AppError(
                'Invalid password',
                401,
                'INVALID_PASSWORD'
            )
        }

        const token = jwt.sign(
            {
                id : existingUser.id,
                name : existingUser.name,
                email : existingUser.email
            },
            process.env.JWT_SECRET as string,
            {
                expiresIn : '1d'
            }
        );

        return {
            id : existingUser.id,
            name : existingUser.name,
            email : existingUser.email,
            token
        }
    }
}

export default new AuthService();