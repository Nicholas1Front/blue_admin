import {prisma} from '../../../shared/database/prisma.js';
import type { Prisma } from '../../../generated/prisma/client.js';

class ClientsContactsRepository{

    async findClientById(clientId : string){
        return prisma.client.findUnique({
            where : {
                id : clientId
            }
        })
    }

    async createContact(
        clientId : string,
        name : string,
        email : string,
        phoneNumber : string
    ){
        return prisma.clientContact.create({
            data : {
                clientId,
                name,
                email,
                phoneNumber
            }
        })
    }

    async updateContact(
        id : string,
        data : Prisma.ClientContactUpdateInput
    ){
        return prisma.clientContact.update({
            where : { id },
            data
        })
    }

    async findContactsByFilters(
        filters : Prisma.ClientContactWhereInput
    ){
        return prisma.clientContact.findMany({
            where : filters,
            orderBy : {
                name : 'asc'
            }
        })
    }

    async findContactById(id : string){
        return prisma.clientContact.findUnique({
            where : { id }
        })
    }

    async deleteContactById(id : string){
        await prisma.clientContact.delete({
            where : { id }
        })

        return true
    }
}

export default new ClientsContactsRepository()