import {prisma} from '../../shared/database/prisma.js';

class EquipamentsRepository{

    async findClientById(id : string){
        const client = await prisma.client.findUnique({
            where : {
                id
            }
        })

        return client
    }

    async createEquipament(
        clientId : string,
        type : string,
        brand : string,
        model : any,
        mainIdentification : any,
        additionalIdentification : any
    ){
        const equipament = await prisma.equipament.create({
            data : {
                clientId,
                type,
                brand,
                model,
                mainIdentification,
                additionalIdentification
            }
        })

        return equipament
    }

    async updateEquipament(
        id : string,
        data : any
    ){
        const equipament = await prisma.equipament.update({
            where : {
                id
            },
            data : {
                clientId : data.clientId,
                type : data.type,
                brand : data.brand,
                model : data.model,
                mainIdentification : data.mainIdentification,
                additionalIdentification : data.additionalIdentification
            }
        })

        return equipament
    }

    async findEquipamentsByFilters(
        filters : any
    ){
        const equipaments = await prisma.equipament.findMany({
            where : {
                id : filters.id,
                clientId : filters.clientId,
                type : filters.type,
                brand : filters.brand,
                model : filters.model,
                mainIdentification : filters.mainIdentification,
                additionalIdentification : filters.additionalIdentification
            }
        })

        return equipaments
    }

    async findEquipamentById(id : string){
        const equipament = await prisma.equipament.findUnique({
            where : {
                id
            }
        })

        return equipament
    }

    async deleteEquipamentById(id : string){
        await prisma.equipament.delete({
            where : {
                id
            }
        })

        return true
    }
}

export default new EquipamentsRepository()