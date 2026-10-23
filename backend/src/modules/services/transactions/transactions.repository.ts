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
}

export default new TransactionsRepository()
