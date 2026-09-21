import type {
    createUserDTO
} from './users.dto.js'

import usersRepository from "./users.repository.js";
import {AppError} from '../../shared/errors/AppError.js';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

class UsersService{
    async createFirstUser(
        data : createUserDTO
    ){
        const existingUser = await usersRepository.findUserByEmail(data.email);

        if(existingUser){
            throw new AppError(
                'User already exists',
                400,
                'USER_ALREADY_EXISTS'
            )
        }

        const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);

        const user = await usersRepository.createUser(
            data.name,
            data.email,
            hashedPassword
        );

        if(!user){
            throw new AppError(
                'Failed to create user',
                500,
                'USER_CREATION_FAILED'
            )
        }

        return user;
    }
}

export default new UsersService();
