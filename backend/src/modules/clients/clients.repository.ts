import {prisma} from '../../shared/database/prisma.js';

class ClientsRepository {
    async createClient(
        name : string,
        document : string | undefined,
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
        data : {
            name?: string;
            document?: string;
            address?: string;
        }
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
        filters : {
            name?: string;
            document?: string;
            address?: string;
        }
    ){
        const clients = await prisma.client.findMany({
            where : {
                ...(filters.name !== undefined && {
                    name : {
                        contains : filters.name,
                        mode : 'insensitive'
                    }
                }),
                ...(filters.document !== undefined && {
                    document : filters.document
                }),
                ...(filters.address !== undefined && {
                    address : {
                        contains : filters.address,
                        mode : 'insensitive'
                    }
                })
            },
            orderBy : {
                name : 'asc'
            }
        })

        return clients
    }

    async findAllClients(){
        const clients = await prisma.client.findMany({
            orderBy : {
                name : 'asc'
            }
        })

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