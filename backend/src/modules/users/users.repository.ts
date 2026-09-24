import {prisma} from '../../shared/database/prisma.js';

class UsersRepository{

    async createUser(
        name : string,
        email : string,
        passwordHash : string
    ){
        const user = await prisma.user.create({
            data : {
                name,
                email,
                passwordHash
            }
        })

        return user
    }

    async findUserById(
        id : string
    ){
        const user = await prisma.user.findUnique({
            where : {id}
        });

        return user
    }

    async findUserByEmail(
        email : string
    ){
        const user = await prisma.user.findUnique({
            where : {
                email
            }
        })

        return user
    }

    async findUserByFilters(
        id : string,
        name : string,
        email : string
    ){
        const users = await prisma.user.findMany({
            where : {
                id,
                name,
                email
            }
        });

        return users
    }

    async updateUser(
        id : string,
        data : any
    ){
        const user = await prisma.user.update({
            where : {
                id
            },
            data : {
                name : data.name,
                email : data.email,
                passwordHash : data.password
            }
        })

        return user
    }

    async deleteUserById(
        id : string
    ){
        await prisma.user.delete({
            where : {
                id
            }
        })

        return true
    }
}

export default new UsersRepository();