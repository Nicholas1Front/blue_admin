import {prisma} from '../../../shared/database/prisma.js';

class ClientsContactsRepository{

    async findClientById(
        clientId : string
    ){
        const client = await prisma.client.findUnique({
            where : {
                id : clientId
            }
        })

        return client
    }

    async createContact(
        clientId : string,
        name : string,
        email : string,
        phoneNumber : string
    ){
        const contact = await prisma.clientContact.create({
            data : {
                clientId,
                name,
                email,
                phoneNumber
            }
        })

        return contact
    }

    async updateContact(
        id : string,
        data : {
            clientId?: string;
            name?: string;
            email?: string;
            phoneNumber?: string;
        }
    ){
        const contact = await prisma.clientContact.update({
            where : {
                id
            },
            data : {
                clientId : data.clientId,
                name : data.name,
                email : data.email,
                phoneNumber : data.phoneNumber
            }
        })

        return contact
    }

    async findContactsByFilters(
        filters : {
            clientId?: string;
            name?: string;
            email?: string;
            phoneNumber?: string;
        }
    ){
        const contacts = await prisma.clientContact.findMany({
            where : {
                ...(filters.clientId !== undefined && {
                    clientId : filters.clientId
                }),
                ...(filters.name !== undefined && {
                    name : {
                        contains : filters.name,
                        mode : 'insensitive'
                    }
                }),
                ...(filters.email !== undefined && {
                    email : {
                        contains : filters.email,
                        mode : 'insensitive'
                    }
                }),
                ...(filters.phoneNumber !== undefined && {
                    phoneNumber : {
                        contains : filters.phoneNumber
                    }
                })
            },
            orderBy : {
                name : 'asc'
            }
        })

        return contacts
    }

    async findContactById(
        id : string
    ){
        const contact = await prisma.clientContact.findUnique({
            where : {
                id
            }
        })

        return contact
    }

    async deleteContactById(
        id : string
    ){
        await prisma.clientContact.delete({
            where : {
                id
            }
        })

        return true
    }
}

export default new ClientsContactsRepository()