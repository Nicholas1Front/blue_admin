import {prisma} from '../../shared/database/prisma.js';
import type { Prisma } from '../../generated/prisma/client.js';

class EquipamentsRepository{

    async findClientById(id : string){
        return prisma.client.findUnique({
            where : { id }
        })
    }

    async createEquipament(
        clientId : string,
        type : string,
        brand : string,
        model : string | null,
        mainIdentification : string | null,
        additionalIdentification : string | null
    ){
        return prisma.equipament.create({
            data : {
                clientId,
                type,
                brand,
                model,
                mainIdentification,
                additionalIdentification
            }
        })
    }

    async updateEquipament(
        id : string,
        data : Prisma.EquipamentUpdateInput
    ){
        return prisma.equipament.update({
            where : { id },
            data
        })
    }

    async findEquipamentsByFilters(
        filters : Prisma.EquipamentWhereInput
    ){
        return prisma.equipament.findMany({
            where : filters,
            orderBy : {
                brand : 'asc'
            }
        })
    }

    async findEquipamentById(id : string){
        return prisma.equipament.findUnique({
            where : { id }
        })
    }

    async deleteEquipamentById(id : string){
        await prisma.equipament.delete({
            where : { id }
        })

        return true
    }
}

export default new EquipamentsRepository()