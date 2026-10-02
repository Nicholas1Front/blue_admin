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
        data : any
    ){
        const contact = await prisma.clientContact.update({
            where : {
                id
            },
            data : {
                name : data.name,
                email : data.email,
                phoneNumber : data.phoneNumber,
                clientId : data.clientId
            }
        })

        return contact
    }

    async findContactsByFilters(
        filters : any
    ){
        const contacts = await prisma.clientContact.findMany({
            where : {
                clientId : filters.clientId,
                name : filters.name,
                email : filters.email,
                phoneNumber : filters.phoneNumber
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