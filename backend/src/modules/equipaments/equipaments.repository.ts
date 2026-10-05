import {prisma} from '../../shared/database/prisma.js';

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
        data : any
    ){
        return prisma.equipament.update({
            where : { id },
            data
        })
    }

    async findEquipamentsByFilters(
        filters : any
    ){
        const equipaments = await prisma.equipament.findMany({
            where : {
                id : {
                    contains : filters.id,
                    mode : "insensitive"
                },
                clientId : {
                    contains : filters.clientId,
                    mode : 'insensitive'
                },
                type : {
                    contains : filters.type,
                    mode : "insensitive"
                },
                brand : {
                    contains : filters.brand,
                    mode : "insensitive"
                },
                model : {
                    contains : filters.model,
                    mode : "insensitive"
                },
                mainIdentification : {
                    contains : filters.mainIdentification,
                    mode : "insensitive"
                },
                additionalIdentification : {
                    contains : filters.additionalIdentification,
                    mode : "insensitive"
                },
            },
            orderBy : {
                createdAt : 'asc'
            }
        })

        return equipaments
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