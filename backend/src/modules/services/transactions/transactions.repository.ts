import {prisma} from '../../../shared/database/prisma.js'

class TransactionsRepository {
    async findTransactionById(id: string) {
        return prisma.financialTransaction.findUnique({ where: { id } })
    }

    async findServiceById(id: string) {
        return prisma.service.findUnique({ where: { id } })
    }

    async linkTransactionToService(id: string, serviceId: string) {
        const result = await prisma.financialTransaction.updateMany({
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

        return prisma.financialTransaction.findUnique({ where: { id } })
    }

    async removeServiceOrigin(id: string, serviceId: string) {
        const result = await prisma.financialTransaction.updateMany({
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

        return result.count === 1
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
