import {prisma} from '../../shared/database/prisma.js'

class ServiceRepository{
    async clientExists(
        id : string
    ){
        const result = await prisma.client.findUnique({where : {id}})

        if(result !== null && result){
            return true
        }else{
            return false
        }
    }

    async clientHasEquipament(
        clientId : string,
        equipamentId : string
    ){
        const result = await prisma.equipament.findUnique({
            where : {
                id : equipamentId,
                clientId : clientId
            }
        })

        if(result !== null && result){
            return true
        }else{
            return false
        }
    }

    async calculateCostPerHour(){
        const monthlyExpensesValues = await prisma.monthlyExpense.findMany({
            where : {
                active : true
            },
            select : {
                expectedValue : true
            }
        })

        const totalValue = monthlyExpensesValues.reduce((accumulator, currentValue) => accumulator + Number(currentValue.expectedValue), 0)
        const costPerHour = (totalValue / 30) / 8

        return costPerHour
    }

    async createService(
        clientId : string,
        equipamentId : string,
        entryDate : Date,
        exitDate : Date | null,
        status : string,
        hoursWorked : number | null,
        costPerHour : number | null,
        eventType : string,
        description : string
    ){
        const serviceData = {
            clientId : clientId,
            equipamentId : equipamentId,
            entryDate : entryDate,
            exitDate : exitDate,
            status : status,
            hoursWorked : hoursWorked,
            costPerHour : costPerHour,
            titheTransactionId : null
        }

        return prisma.$transaction(async tx => {
            const service = await tx.service.create({
                data : serviceData
            })

            const history = await tx.serviceHistory.create({
                data : {
                    serviceId : service.id,
                    eventType : eventType,
                    description : description
                }
            })

            return {
                service : service,
                history : history
            }
        })
    }

    async findServiceById(
        id : string
    ){
        const service = await prisma.service.findUnique({
            where : {
                id 
            }
        })

        const history = await prisma.serviceHistory.findFirst({
            where : {
                serviceId : id
            },
            orderBy : {
                createdAt : 'desc'
            }
        })

        return {
            service : service,
            history : history
        }
    }

    async findServiceByFilters(
        id : string | undefined,
        clientId : string | undefined,
        equipamentId : string | undefined,
        entryDate : Date | undefined,
        exitDate : Date | null | undefined,
        status : string | undefined,
        hoursWorked : number | undefined | null,
        costPerHour : number | undefined | null,
        titheTransactionId : string | undefined | null,
        titheStatus : string | undefined | null
    ){

        const services = await prisma.service.findMany({
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
                ...(equipamentId !== undefined && {
                    equipamentId : {
                        contains : equipamentId,
                        mode : 'insensitive'
                    }
                }),
                ...(entryDate !== undefined && {
                    entryDate : entryDate
                }),
                ...(exitDate !== undefined && {
                    exitDate : exitDate
                }),
                ...(status !== undefined && {
                    status : {
                        contains : status,
                        mode : 'insensitive'
                    }
                }),
                ...(hoursWorked !== undefined && {hoursWorked}),
                ...(costPerHour !== undefined && {costPerHour}),
                ...(titheTransactionId !== undefined && (
                        titheTransactionId === null
                            ? { titheTransactionId : null }
                            : {
                                titheTransactionId : {
                                    contains : titheTransactionId,
                                    mode : 'insensitive'
                                }
                            }
                )),
                ...(titheStatus !== undefined && (
                        titheStatus === null
                            ? { titheStatus : null }
                            : {
                                titheStatus : {
                                    contains : titheStatus,
                                    mode : 'insensitive'
                                }
                            }
                ))
            }
        })


        return services
    }

    async findHistoriesByServiceIds(
        serviceIds : string[]
    ){
        const history = await prisma.serviceHistory.findMany({
            where : {
                serviceId : {
                    in : serviceIds
                }
            },
            orderBy : {
                createdAt : 'asc'
            }
        })

        return history
    }

    async updateService(
        serviceId : string,
        data : any
    ){
        return prisma.$transaction(async tx => {
            const service = await tx.service.update({
                where : {
                    id : serviceId
                },
                data : {
                    clientId : data.clientId,
                    equipamentId : data.equipamentId,
                    entryDate : data.entryDate,
                    exitDate : data.exitDate,
                    hoursWorked : data.hoursWorked,
                    costPerHour : data.costPerHour
                }
            })

            const history = await tx.serviceHistory.create({
                data : {
                    serviceId : serviceId,
                    eventType : data.eventType,
                    description : data.description
                }
            })

            return {
                service : service,
                history : history
            }
        })
    }

    async updateServiceStatus(
        serviceId : string,
        data : any
    ){
        return prisma.$transaction(async tx => {
            const service = await tx.service.update({
                where : {
                    id : serviceId
                },
                data : {
                    status : data.status
                }
            })

            const history = await tx.serviceHistory.create({
                data : {
                    serviceId : serviceId,
                    eventType : data.eventType,
                    description : data.description
                }
            })

            return {
                service : service,
                history : history
            }
        })
    }

    async deleteServiceById(
        id : string
    ){
        await prisma.service.delete({
            where : {id}
        })

        return true
    }
}

export default new ServiceRepository()
