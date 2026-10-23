import {prisma} from '../../shared/database/prisma.js'

class ServiceRepository{
    async clientExists(id: string){
        return Boolean(await prisma.client.findUnique({ where: { id } }))
    }

    async clientHasEquipament(clientId: string, equipamentId: string){
        return Boolean(await prisma.equipament.findFirst({
            where: {
                id: equipamentId,
                clientId
            }
        }))
    }

    async calculateCostPerHour(){
        const monthlyExpensesValues = await prisma.monthlyExpense.findMany({
            where: { active: true },
            select: { expectedValue: true }
        })

        const totalValue = monthlyExpensesValues.reduce(
            (accumulator, currentValue) => accumulator + Number(currentValue.expectedValue),
            0
        )

        return (totalValue / 30) / 8
    }

    async createService(
        clientId: string,
        equipamentId: string,
        entryDate: Date,
        exitDate: Date | null,
        status: string,
        hoursWorked: number | null,
        costPerHour: number | null,
        eventType: string,
        description: string
    ){
        return prisma.$transaction(async (tx) => {
            const service = await tx.service.create({
                data: {
                    clientId,
                    equipamentId,
                    entryDate,
                    exitDate,
                    status,
                    hoursWorked,
                    costPerHour,
                    titheStatus: null,
                    titheTransactionId: null
                }
            })

            const history = await tx.serviceHistory.create({
                data: {
                    serviceId: service.id,
                    eventType,
                    description
                }
            })

            return { service, history }
        })
    }

    async findServiceById(id: string){
        const [service, history] = await Promise.all([
            prisma.service.findUnique({ where: { id } }),
            prisma.serviceHistory.findFirst({
                where: { serviceId: id },
                orderBy: { createdAt: 'desc' }
            })
        ])

        return { service, history }
    }

    async findServiceByFilters(
        id: string | undefined,
        clientId: string | undefined,
        equipamentId: string | undefined,
        entryDate: Date | undefined,
        exitDate: Date | null | undefined,
        status: string | undefined,
        hoursWorked: number | undefined | null,
        costPerHour: number | undefined | null,
        titheTransactionId: string | undefined | null,
        titheStatus: string | undefined | null
    ){
        return prisma.service.findMany({
            where: {
                ...(id !== undefined && {
                    id: { contains: id, mode: 'insensitive' }
                }),
                ...(clientId !== undefined && {
                    clientId: { contains: clientId, mode: 'insensitive' }
                }),
                ...(equipamentId !== undefined && {
                    equipamentId: { contains: equipamentId, mode: 'insensitive' }
                }),
                ...(entryDate !== undefined && { entryDate }),
                ...(exitDate !== undefined && { exitDate }),
                ...(status !== undefined && {
                    status: { contains: status, mode: 'insensitive' }
                }),
                ...(hoursWorked !== undefined && { hoursWorked }),
                ...(costPerHour !== undefined && { costPerHour }),
                ...(titheTransactionId !== undefined && (
                    titheTransactionId === null
                        ? { titheTransactionId: null }
                        : {
                            titheTransactionId: {
                                contains: titheTransactionId,
                                mode: 'insensitive'
                            }
                        }
                )),
                ...(titheStatus !== undefined && (
                    titheStatus === null
                        ? { titheStatus: null }
                        : {
                            titheStatus: {
                                contains: titheStatus,
                                mode: 'insensitive'
                            }
                        }
                ))
            }
        })
    }

    async findHistoriesByServiceIds(serviceIds: string[]){
        return prisma.serviceHistory.findMany({
            where: { serviceId: { in: serviceIds } },
            orderBy: { createdAt: 'asc' }
        })
    }

    async updateService(serviceId: string, data: any){
        return prisma.$transaction(async (tx) => {
            const service = await tx.service.update({
                where: { id: serviceId },
                data: {
                    clientId: data.clientId,
                    equipamentId: data.equipamentId,
                    entryDate: data.entryDate,
                    exitDate: data.exitDate,
                    hoursWorked: data.hoursWorked,
                    costPerHour: data.costPerHour
                }
            })

            const history = await tx.serviceHistory.create({
                data: {
                    serviceId,
                    eventType: data.eventType,
                    description: data.description
                }
            })

            return { service, history }
        })
    }

    async updateServiceStatus(serviceId: string, data: any){
        return prisma.$transaction(async (tx) => {
            const service = await tx.service.update({
                where: { id: serviceId },
                data: { status: data.status }
            })

            const history = await tx.serviceHistory.create({
                data: {
                    serviceId,
                    eventType: data.eventType,
                    description: data.description
                }
            })

            return { service, history }
        })
    }

    async deleteServiceById(id: string){
        await prisma.service.delete({ where: { id } })
        return true
    }
}

export default new ServiceRepository()
