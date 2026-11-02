import {prisma} from '../../shared/database/prisma.js'

class ServiceRepository{
    async clientExists(id: string) {
        const result = await prisma.client.findUnique({where : {id}})
        return result !== null
    }

    async clientHasEquipament(clientId: string, equipamentId: string) {
        const result = await prisma.equipament.findUnique({
            where : { id: equipamentId, clientId: clientId }
        })
        return result !== null
    }

    async findBudgetForConversion(budgetId: string, budgetItemIds: string[]) {
        const budget = await prisma.budget.findUnique({
            where: { id: budgetId },
            select: {
                id: true,
                clientId: true,
                equipamentId: true,
                items: {
                    where: { id: { in: budgetItemIds } },
                    select: { id: true, title: true, description: true }
                }
            }
        })

        if (!budget) return null
        const { items, ...budgetData } = budget
        return { budget: budgetData, items }
    }

    async createServiceFromBudget(
        budget: { id: string; clientId: string; equipamentId: string },
        items: Array<{ id: string; title: string; description: string | null }>,
        requestedAt: Date
    ) {
        return prisma.$transaction(async tx => {
            const service = await tx.service.create({
                data: {
                    clientId: budget.clientId,
                    equipamentId: budget.equipamentId,
                    entryDate: requestedAt,
                    exitDate: null,
                    status: 'pendente',
                    hoursWorked: null,
                    costPerHour: null,
                    titheTransactionId: null,
                    titheStatus: 'aguardando'
                }
            })

            const history = await tx.serviceHistory.create({
                data: {
                    serviceId: service.id,
                    eventType: 'servico_criado_orcamento',
                    description: `Serviço criado a partir do orçamento ${budget.id}. ${items.length} atividade(s) importada(s).`
                }
            })

            const activities = []
            for (const item of items) {
                const activity = await tx.serviceActivity.create({
                    data: {
                        serviceId: service.id,
                        title: item.title,
                        description: item.description,
                        startAt: null,
                        endAt: null,
                        status: 'pendente',
                        createdAt: requestedAt
                    }
                })
                activities.push(activity)

                await tx.serviceHistory.create({
                    data: {
                        serviceId: service.id,
                        eventType: 'atividade_criada',
                        description: `Atividade criada a partir do orçamento: ${item.title}.`,
                        createdAt: requestedAt
                    }
                })
            }

            return { service, activities, history }
        })
    }

    async calculateCostPerHour(){
        const monthlyExpensesValues = await prisma.monthlyExpense.findMany({
            where : { active : true },
            select : { expectedValue : true }
        })
        const totalValue = monthlyExpensesValues.reduce((accumulator, currentValue) => accumulator + Number(currentValue.expectedValue), 0)
        return (totalValue / 30) / 8
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
            clientId, equipamentId, entryDate, exitDate, status,
            hoursWorked, costPerHour, titheTransactionId : null,
            titheStatus : 'aguardando'
        }
        return prisma.$transaction(async tx => {
            const service = await tx.service.create({ data : serviceData })
            const history = await tx.serviceHistory.create({
                data : { serviceId : service.id, eventType, description }
            })
            return { service, history }
        })
    }

    async findServiceById(id : string){
        const service = await prisma.service.findUnique({ where : { id } })
        const history = await prisma.serviceHistory.findFirst({
            where : { serviceId : id },
            orderBy : { createdAt : 'desc' }
        })
        return { service, history }
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
        return prisma.service.findMany({
            where : {
                ...(id !== undefined && { id : { contains : id, mode : 'insensitive' } }),
                ...(clientId !== undefined && { clientId : { contains : clientId, mode : 'insensitive' } }),
                ...(equipamentId !== undefined && { equipamentId : { contains : equipamentId, mode : 'insensitive' } }),
                ...(entryDate !== undefined && { entryDate }),
                ...(exitDate !== undefined && { exitDate }),
                ...(status !== undefined && { status : { contains : status, mode : 'insensitive' } }),
                ...(hoursWorked !== undefined && {hoursWorked}),
                ...(costPerHour !== undefined && {costPerHour}),
                ...(titheTransactionId !== undefined && (
                    titheTransactionId === null ? { titheTransactionId : null } :
                    { titheTransactionId : { contains : titheTransactionId, mode : 'insensitive' } }
                )),
                ...(titheStatus !== undefined && (
                    titheStatus === null ? { titheStatus : null } :
                    { titheStatus : { contains : titheStatus, mode : 'insensitive' } }
                ))
            }
        })
    }

    async findHistoriesByServiceIds(serviceIds : string[]){
        return prisma.serviceHistory.findMany({
            where : { serviceId : { in : serviceIds } },
            orderBy : { createdAt : 'asc' }
        })
    }

    async updateService(serviceId : string, data : any){
        return prisma.$transaction(async tx => {
            const service = await tx.service.update({
                where : { id : serviceId },
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
                data : { serviceId, eventType : data.eventType, description : data.description }
            })
            return { service, history }
        })
    }

    async updateServiceStatus(serviceId : string, data : any){
        return prisma.$transaction(async tx => {
            const service = await tx.service.update({
                where : { id : serviceId },
                data : { status : data.status }
            })
            const history = await tx.serviceHistory.create({
                data : { serviceId, eventType : data.eventType, description : data.description }
            })
            return { service, history }
        })
    }

    async deleteServiceById(id : string){
        return prisma.$transaction(async tx => {
            await tx.financialTransaction.updateMany({
                where : { originId : id },
                data : { originId : null, originType : null }
            })
            await tx.service.delete({ where : {id} })
            return true
        })
    }
}

export default new ServiceRepository()
