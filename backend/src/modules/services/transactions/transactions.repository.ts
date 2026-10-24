import {prisma} from '../../../shared/database/prisma.js'

class TransactionsRepository {
    async findTransactionById(id: string) {
        return prisma.financialTransaction.findUnique({ where: { id } })
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
        return prisma.$transaction(async (tx)=>{
            const transaction = await tx.financialTransaction.update({
                where : {
                    id : transactionId
                },
                data : {
                    originId : serviceId,
                    originType : 'services'
                }
            })

            const service = await tx.service.update({
                where : {
                    id : serviceId
                },
                data : {
                    titheTransactionId : transactionId,
                    titheStatus : 'paid'
                }
            })

            const history = await tx.serviceHistory.create({
                data : {
                    serviceId : serviceId,
                    eventType : 'tithe_paid',
                    description : `Tithe transaction linked - transaction : ${transactionId}`
                }
            })

            return {
                service : service,
                transaction : transaction
            }
        })
    }

    async removeTithe(
        transactionId : string,
        serviceId : string
    ){
        return await prisma.$transaction(async (tx)=>{
            const transaction = await tx.financialTransaction.update({
                where : {
                    id : transactionId
                },
                data : {
                    originId : null,
                    originType : null
                }
            })

            const service = await tx.service.update({
                where : {
                    id : serviceId
                },
                data : {
                    titheTransactionId : null,
                    titheStatus : null
                }
            })

            const history = await tx.serviceHistory.create({
                data : {
                    serviceId : serviceId,
                    eventType : 'tithe_removed',
                    description : `Tithe transaction remove linked - transaction : ${transactionId}`
                }
            })

            return {
                service : service,
                transaction : transaction
            }
        })
    }
}

export default new TransactionsRepository()
