import {prisma} from '../../../shared/database/prisma.js';

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
        data : any
    ){
        return prisma.clientContact.update({
            where : { id },
            data
        })
    }

    async findContactsByFilters(
        filters : any
    ){
        const contacts = await prisma.clientContact.findMany({
            where : {
                id : {
                    contains : filters.id,
                    mode : "insensitive"
                },
                clientId : {
                    contains : filters.clientId,
                    mode : "insensitive"
                },
                name : {
                    contains : filters.name,
                    mode : "insensitive"
                },
                email : {
                    contains : filters.email,
                    mode : "insensitive"
                },
                phoneNumber : {
                    contains : filters.phoneNumber,
                    mode : "insensitive"
                },
            },
            orderBy : {
                name : "asc"
            }
        })

        return contacts
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