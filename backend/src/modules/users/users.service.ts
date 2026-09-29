import type {
    createUserDTO,
    updateUserDTO,
    findUserByFiltersDTO
} from './users.dto.js'

import usersRepository from "./users.repository.js";
import {AppError} from '../../shared/errors/AppError.js';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

class UsersService{
    async createUser(
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

        return {
            id : user.id,
            name : user.name,
            email : user.email,
            createdAt : user.createdAt,
            updatedAt : user.updatedAt
        }
    }

    async updateUser(
        id : string,
        data : updateUserDTO
    ){
        let existingUser = await usersRepository.findUserById(id);

        if(!existingUser){
            throw new AppError(
                'User not found',
                404,
                'USER_NOT_FOUND'
            )
        }

        if(data.password !== undefined){
            const passwordIsEqual = await bcrypt.compare(data.password, existingUser.passwordHash);

            if(passwordIsEqual){
                throw new AppError(
                    'Password is the same as before',
                    400,
                    'PASSWORD_IS_THE_SAME_AS_BEFORE'
                )
            }

            const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);

            existingUser.passwordHash = hashedPassword;
        }

        if(data.name !== undefined){
            existingUser.name = data.name;
        }

        if(data.email !== undefined){
            const emailExists = await usersRepository.findUserByEmail(data.email);

            if(emailExists && emailExists.id !== id){
                throw new AppError(
                    'Email already exists',
                    400,
                    'EMAIL_ALREADY_EXISTS'
                )
            }

            existingUser.email = data.email;
        }

        const updatedUser = await usersRepository.updateUser(id, existingUser);

        return {
            id : updatedUser.id,
            name : updatedUser.name,
            email : updatedUser.email,
            createdAt : updatedUser.createdAt,
            updatedAt : updatedUser.updatedAt
        }
    }

    async usersDashboard(){
        const rawUsers = await usersRepository.findAllUsers();

        if(!rawUsers){
            throw new AppError(
                'Failed to fetch users',
                500,
                'USERS_FETCH_FAILED'
            )
        }

        const users = rawUsers.map(user =>{
            return {
                id : user.id,
                name : user.name,
                email : user.email,
                createdAt : user.createdAt,
                updatedAt : user.updatedAt
            }
        })

        return users
    }

    async findUserByFilters(
        filters : findUserByFiltersDTO
    ){
        const users = await usersRepository.findUserByFilters(
            filters.id as string,
            filters.name as string,
            filters.email as string
        );

        if(!users){
            throw new AppError(
                'Failed to fetch users by filters',
                500,
                'USERS_FETCH_FAILED_BY_FILTERS'
            )
        }

        const finishedUsers = users.map(user =>{
            return {
                id : user.id,
                name : user.name,
                email : user.email,
                createdAt : user.createdAt,
                updatedAt : user.updatedAt
            }
        })

        return finishedUsers
    }

    async deleteUserById(
        id : string
    ){
        const existingUser = await usersRepository.findUserById(id);

        if(!existingUser){
            throw new AppError(
                'User not found',
                404,
                'USER_NOT_FOUND'
            )
        }

        await usersRepository.deleteUserById(id);

        return true
    }
}

export default new UsersService();
