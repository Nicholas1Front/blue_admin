import {prisma} from '../../shared/database/prisma.js';

class AuthRepository{
    async findUserByEmail(
        email : string
    ){
        const user = await prisma.user.findUnique({
            where : {
                email
            }
        })

        return user;
    }
}

export default new AuthRepository();