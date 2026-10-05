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
        model : string | null,
        mainIdentification : string | null,
        additionalIdentification : string | null
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
        data : {
            clientId?: string;
            type?: string;
            brand?: string;
            model?: string | null;
            mainIdentification?: string | null;
            additionalIdentification?: string | null;
        }
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
        filters : {
            id?: string;
            clientId?: string;
            type?: string;
            brand?: string;
            model?: string;
            mainIdentification?: string;
            additionalIdentification?: string;
        }
    ){
        const equipaments = await prisma.equipament.findMany({
            where : {
                ...(filters.id !== undefined && {
                    id : filters.id
                }),
                ...(filters.clientId !== undefined && {
                    clientId : filters.clientId
                }),
                ...(filters.type !== undefined && {
                    type : {
                        contains : filters.type,
                        mode : 'insensitive'
                    }
                }),
                ...(filters.brand !== undefined && {
                    brand : {
                        contains : filters.brand,
                        mode : 'insensitive'
                    }
                }),
                ...(filters.model !== undefined && {
                    model : {
                        contains : filters.model,
                        mode : 'insensitive'
                    }
                }),
                ...(filters.mainIdentification !== undefined && {
                    mainIdentification : {
                        contains : filters.mainIdentification,
                        mode : 'insensitive'
                    }
                }),
                ...(filters.additionalIdentification !== undefined && {
                    additionalIdentification : {
                        contains : filters.additionalIdentification,
                        mode : 'insensitive'
                    }
                })
            },
            orderBy : {
                brand : 'asc'
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