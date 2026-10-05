import {prisma} from '../../shared/database/prisma.js';

class ClientsRepository {
    async createClient(
        name : string,
        document : string | null,
        address : string,
    ){
        return prisma.client.create({
            data : {
                name,
                address,
                document
            }
        })
    }

    async updateClient(
        id : string,
        data : any
    ){
        return prisma.client.update({
            where : { id },
            data
        })
    }

    async findClientById(id : string){
        return prisma.client.findUnique({
            where : { id }
        })
    }

    async findClientsByFilters(
        filters : any
    ){
        const clients = await prisma.client.findMany({
            where : {
                name : {
                    contains : filters.name,
                    mode : 'insensitive'
                },
                address : {
                    contains : filters.address,
                    mode : 'insensitive'
                },
                document : {
                    contains : filters.document,
                    mode : 'insensitive'
                }
            }
        })

        return clients
    }

    async findAllClients(){
        return prisma.client.findMany({
            orderBy : {
                name : 'asc'
            }
        })
    }

    async deleteClientById(id : string){
        await prisma.client.delete({
            where : { id }
        })

        return true
    }
}

export default new ClientsRepository();