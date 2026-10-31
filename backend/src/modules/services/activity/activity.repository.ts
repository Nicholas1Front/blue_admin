import {prisma} from '../../../shared/database/prisma.js';

const activityFieldLabels: Record<string, string> = {
    title: 'título',
    description: 'descrição',
    startAt: 'data de início',
    endAt: 'data de término',
    status: 'status'
}

class ActivityRepository{

    async findServiceById(
        id : string
    ){
        const service = await prisma.service.findUnique({
            where : {id}
        })

        return service
    }

    async findServicesByIds(
        servicesIds : string[]
    ){
        const services = await prisma.service.findMany({
            where : {
                id : {
                    in : servicesIds
                }
            }
        })

        return services
    }

    async addActivity(
        serviceId : string,
        title : string,
        description : string | null,
        startAt : Date | null,
        endAt : Date | null,
        status : string
    ){
        return prisma.$transaction(async tx => {
            const activity = await tx.serviceActivity.create({
                data : {
                    serviceId,
                    title,
                    description,
                    startAt,
                    endAt,
                    status
                }
            })

            await tx.serviceHistory.create({
                data : {
                    serviceId,
                    eventType : 'atividade_criada',
                    description : `Atividade criada: ${title}.`
                }
            })

            return activity
        })
    }

    async findActivityById(
        id : string
    ){
        const activity = await prisma.serviceActivity.findUnique({
            where : {
                id
            }
        })

        return activity
    } 

    async findActivitiesByServiceId(
        serviceId : string
    ){
        const activities = await prisma.serviceActivity.findMany({
            where : {
                serviceId 
            },
            orderBy : [
                { createdAt : 'asc' },
                { id : 'asc' }
            ]
        })

        return activities
    }

    async findActivitiesByFilters(
        id : string | undefined,
        serviceId : string | undefined,
        title : string | undefined,
        description : string | null | undefined,
        startAt : Date | undefined | null,
        endAt : Date | undefined | null,
        status : string | undefined
    ){
        const activities = await prisma.serviceActivity.findMany({
            where : {
                ...(id !== undefined && {
                    id : {
                        contains : id,
                        mode : 'insensitive'
                    }
                }),
                ...(serviceId !== undefined && {
                    serviceId : {
                        contains : serviceId,
                        mode : 'insensitive'
                    }
                }),
                ...(title !== undefined && {
                    title : {
                        contains : title,
                        mode : 'insensitive'
                    }
                }),
                ...(description !== undefined && (
                    description === null
                        ? { description : null }
                        : {
                            description : {
                                contains : description,
                                mode : 'insensitive'
                            }
                        }
                )),
                ...(startAt !== undefined && (
                    startAt === null
                        ? { startAt : null }
                        : {
                            startAt : {
                                gte : startAt
                            }
                        }
                )),
                ...(endAt !== undefined && (
                    endAt === null
                        ? { endAt : null }
                        : {
                            endAt : {
                                lt : endAt
                            }
                        }
                )),
                ...(status !== undefined && {
                    status : {
                        contains : status,
                        mode : 'insensitive'
                    }
                })
            },
            orderBy : [
                { createdAt : 'asc' },
                { id : 'asc' }
            ]
        })

        return activities
    }

    async updateActivity(
        id : string,
        data : any
    ){
        return prisma.$transaction(async tx => {
            const existingActivity = await tx.serviceActivity.findUnique({
                where : {id}
            })

            if(!existingActivity){
                return null
            }

            const activity = await tx.serviceActivity.update({
                where : {id},
                data : {
                    ...data
                }
            })

            await tx.serviceHistory.create({
                data : {
                    serviceId : existingActivity.serviceId,
                    eventType : 'atividade_atualizada',
                    description : `Atividade "${activity.title}" atualizada. Campos alterados: ${Object.keys(data).map(field => (activityFieldLabels[field] ?? field)).join(', ')}.`
                }
            })

            return activity
        })
    }

    async deleteActivity(id :string){
        return prisma.$transaction(async tx => {
            const activity = await tx.serviceActivity.findUnique({
                where : {id}
            })

            if(!activity){
                return false
            }

            await tx.serviceActivity.delete({
                where : {id}
            })

            await tx.serviceHistory.create({
                data : {
                    serviceId : activity.serviceId,
                    eventType : 'atividade_excluida',
                    description : `Atividade excluída: ${activity.title}.`
                }
            })

            return true
        })
    }

}

export default new ActivityRepository()
