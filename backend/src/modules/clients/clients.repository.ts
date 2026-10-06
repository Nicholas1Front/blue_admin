import {prisma} from '../../shared/database/prisma.js';

class ClientsRepository {
    async createClient(
        name : string,
        document : string | null,
        address : string | null,
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
        id : string | undefined,
        name : string | undefined,
        document : string | undefined,
        address : string | undefined
    ){
        const clients = await prisma.client.findMany({
            where : {
                ...(id !== undefined && {
                    id : {
                        contains : id,
                        mode : 'insensitive'
                    }
                }),
                ...(name !== undefined && {
                    name : {
                        contains : name,
                        mode : 'insensitive'
                    }
                }),
                ...(document !== undefined && {
                    document : {
                        contains : document,
                        mode : 'insensitive'
                    }
                }),
                ...(address !== undefined && {
                    address : {
                        contains : address,
                        mode : 'insensitive'
                    }
                })
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
