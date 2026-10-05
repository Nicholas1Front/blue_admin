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
        id : string | undefined,
        clientId : string | undefined,
        type : string | undefined,
        brand : string | undefined,
        model : string | null | undefined,
        mainIdentification : string | null | undefined,
        additionalIdentification : string | null | undefined
    ){
        const equipaments = await prisma.equipament.findMany({
            where : {
                ...(id !== undefined && {
                    id : {
                        contains : id,
                        mode : 'insensitive'
                    }
                }),
                ...(clientId !== undefined && {
                    clientId : {
                        contains : clientId,
                        mode : 'insensitive'
                    }
                }),
                ...(type !== undefined && {
                    type : {
                        contains : type,
                        mode : 'insensitive'
                    }
                }),
                ...(brand !== undefined && {
                    brand : {
                        contains : brand,
                        mode : 'insensitive'
                    }
                }),
                ...(model !== undefined && (
                    model === null
                        ? { model : null }
                        : {
                            model : {
                                contains : model,
                                mode : 'insensitive'
                            }
                        }
                )),
                ...(mainIdentification !== undefined && (
                    mainIdentification === null
                        ? { mainIdentification : null }
                        : {
                            mainIdentification : {
                                contains : mainIdentification,
                                mode : 'insensitive'
                            }
                        }
                )),
                ...(additionalIdentification !== undefined && (
                    additionalIdentification === null
                        ? { additionalIdentification : null }
                        : {
                            additionalIdentification : {
                                contains : additionalIdentification,
                                mode : 'insensitive'
                            }
                        }
                ))
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
