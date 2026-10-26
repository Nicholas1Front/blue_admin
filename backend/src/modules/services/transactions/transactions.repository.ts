import {prisma} from '../../../shared/database/prisma.js'

class TransactionsRepository {
    async findTransactionById(id: string) {
        return prisma.financialTransaction.findUnique({
            where: { id },
            include: {
                titheForService: {
                    select: { id: true }
                }
            }
        })
    }

    async findServiceById(id: string) {
        return prisma.service.findUnique({ where: { id } })
    }

    async linkTransactionToService(id: string, serviceId: string) {
        return prisma.$transaction(async (tx) => {
            const result = await tx.financialTransaction.updateMany({
                where: {
                    id,
                    originId: null,
                    originType: null
                },
                data: {
                    originId: serviceId,
                    originType: 'services'
                }
            })

            if (result.count !== 1) {
                return null
            }

            const transaction = await tx.financialTransaction.findUnique({
                where: { id }
            })

            await tx.serviceHistory.create({
                data: {
                    serviceId,
                    eventType: 'transaction_linked',
                    description: `Financial transaction ${id} linked to service.`
                }
            })

            return transaction
        })
    }

    async removeServiceOrigin(id: string, serviceId: string) {
        return prisma.$transaction(async (tx) => {
            const result = await tx.financialTransaction.updateMany({
                where: {
                    id,
                    originId: serviceId,
                    originType: 'services'
                },
                data: {
                    originId: null,
                    originType: null
                }
            })

            if (result.count !== 1) {
                return false
            }

            await tx.serviceHistory.create({
                data: {
                    serviceId,
                    eventType: 'transaction_unlinked',
                    description: `Financial transaction ${id} unlinked from service.`
                }
            })

            return true
        })
    }

    async findAllTransactionsByServiceId(serviceId: string) {
        return prisma.financialTransaction.findMany({
            where: {
                originId: serviceId,
                originType: 'services'
            },
            orderBy: [
                { referenceDate: 'desc' },
                { createdAt: 'desc' }
            ]
        })
    }

    async updateTithe(
        transactionId : string,
        serviceId : string
    ){
        return prisma.$transaction(async tx => {
            const transactionUpdate = await tx.financialTransaction.updateMany({
                where : {
                    id : transactionId,
                    originId : null,
                    originType : null
                },
                data : {
                    originId : serviceId,
                    originType : 'service_tithe'
                }
            })

            if(transactionUpdate.count !== 1){
                return null
            }

            const serviceUpdate = await tx.service.updateMany({
                where : {
                    id : serviceId,
                    titheTransactionId : null
                },
                data : {
                    titheTransactionId : transactionId,
                    titheStatus : 'concluído'
                }
            })

            if(serviceUpdate.count !== 1){
                // Throwing rolls back the transaction-origin update above.
                throw new Error('TITHE_LINK_CONFLICT')
            }

            await tx.serviceHistory.create({
                data : {
                    serviceId,
                    eventType : 'tithe_paid',
                    description : `Tithe transaction linked - transaction : ${transactionId}`
                }
            })

            const [service, transaction] = await Promise.all([
                tx.service.findUnique({ where : {id : serviceId} }),
                tx.financialTransaction.findUnique({ where : {id : transactionId} })
            ])

            return { service, transaction }
        })
    }

    async removeTithe(
        transactionId : string,
        serviceId : string
    ){
        return prisma.$transaction(async tx => {
            const serviceUpdate = await tx.service.updateMany({
                where : {
                    id : serviceId,
                    titheTransactionId : transactionId
                },
                data : {
                    titheTransactionId : null,
                    titheStatus : 'não concluído'
                }
            })

            if(serviceUpdate.count !== 1){
                return null
            }

            const transactionUpdate = await tx.financialTransaction.updateMany({
                where : {
                    id : transactionId,
                    originId : serviceId,
                    originType : 'services'
                },
                data : {
                    originId : null,
                    originType : null
                }
            })

            if(transactionUpdate.count !== 1){
                // Throwing rolls back the service tithe fields above.
                throw new Error('TITHE_LINK_CONFLICT')
            }

            await tx.serviceHistory.create({
                data : {
                    serviceId,
                    eventType : 'tithe_removed',
                    description : `Tithe transaction unlinked - transaction : ${transactionId}`
                }
            })

            const [service, transaction] = await Promise.all([
                tx.service.findUnique({ where : {id : serviceId} }),
                tx.financialTransaction.findUnique({ where : {id : transactionId} })
            ])

            return { service, transaction }
        })
    }
}

export default new TransactionsRepository()
