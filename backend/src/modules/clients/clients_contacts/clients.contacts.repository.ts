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
        email : string | null,
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
        id : string | undefined,
        clientId : string | undefined,
        name : string | undefined,
        email : string | null | undefined,
        phoneNumber : string | undefined
    ){
        const contacts = await prisma.clientContact.findMany({
            where : {
                ...(id !== undefined &&{
                    id : {
                        contains : id,
                        mode : "insensitive"
                    }
                }),
                ...(clientId !== undefined && {
                    clientId : {
                        contains : clientId,
                        mode : 'insensitive'
                    }
                }),
                ...(name !== undefined && {
                    name : {
                        contains : name,
                        mode : 'insensitive'
                    }
                }),
                ...(email !== undefined && (
                    email === null
                        ? { email : null }
                        : {
                            email : {
                                contains : email,
                                mode : 'insensitive'
                            }
                        }
                )),
                ...(phoneNumber !== undefined && {
                    phoneNumber : {
                        contains : phoneNumber,
                        mode : 'insensitive'
                    }
                })
            },
            orderBy : {
                name : 'asc'
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
