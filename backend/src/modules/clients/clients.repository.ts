import {prisma} from '../../shared/database/prisma.js';

class ClientsRepository {
    async createClient(
        name : string,
        document : any,
        address : string,
    ){
        const client = await prisma.client.create({
            data : {
                name,
                document,
                address
            }
        })

        return client
    }

    async updateClient(
        id : string,
        data : any
    ){
        const client = await prisma.client.update({
            where : {
                id
            },
            data : {
                name : data.name,
                document : data.document,
                address : data.address
            }
        })

        return client
    }

    async findClientById(id : string){
        const client = await prisma.client.findUnique({
            where : {
                id
            }
        })

        return client
    }

    async findClientsByFilters(
        filters : any
    ){
        const clients = await prisma.client.findMany({
            where : {
                name : filters.name,
                document : filters.document,
                address : filters.address
            }
        })

        return clients
    }

    async findAllClients(){
        const clients = await prisma.client.findMany()

        return clients
    }

    async deleteClientById(id : string){
        await prisma.client.delete({
            where : {
                id
            }
        })

        return true
    }
}

export default new ClientsRepository();