import { prisma } from '../../../shared/database/prisma.js'

class BudgetQueriesRepository {
    findBudgetDetailsById(id: string) {
        return prisma.budget.findUnique({
            where: { id },
            include: {
                client: {
                    select: {
                        id: true,
                        name: true,
                        document: true,
                        address: true
                    }
                },
                equipament: {
                    select: {
                        id: true,
                        type: true,
                        brand: true,
                        model: true,
                        mainIdentification: true,
                        additionalIdentification: true
                    }
                },
                history: {
                    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }]
                },
                items: {
                    include: {
                        category: {
                            select: {
                                id: true,
                                name: true,
                                description: true,
                                isActive: true
                            }
                        }
                    },
                    orderBy: [
                        { category: { name: 'asc' } },
                        { createdAt: 'asc' },
                        { id: 'asc' }
                    ]
                }
            }
        })
    }
}

export default new BudgetQueriesRepository()
