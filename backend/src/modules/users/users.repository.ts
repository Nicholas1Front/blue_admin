import {prisma} from '../../shared/database/prisma.js';

class UsersRepository{

    async createUser(
        name : string,
        email : string,
        password : string
    ){
        const user = await prisma.user.create({
            data : {
                name,
                email,
                password
            }
        })

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
}

export default new UsersRepository();