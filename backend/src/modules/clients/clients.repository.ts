import {prisma} from '../../shared/database/prisma.js';
import type { Prisma } from '../../generated/prisma/client.js';

class ClientsRepository {
    async createClient(
        name : string,
        document : string | undefined,
        address : string,
    ){
        return prisma.client.create({
            data : {
                name,
                address,
                ...(document !== undefined && { document })
            }
        })
    }

    async updateClient(
        id : string,
        data : Prisma.ClientUpdateInput
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
        filters : Prisma.ClientWhereInput
    ){
        return prisma.client.findMany({
            where : filters,
            orderBy : {
                name : 'asc'
            }
        })
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