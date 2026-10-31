import { prisma } from '../../../shared/database/prisma.js'

class BudgetCategoryRepository {
    create(data: { name: string; description?: string | null | undefined }) {
        return prisma.budgetCategory.create({
            data: {
                name: data.name,
                description: data.description ?? null,
                isActive: true
            }
        })
    }

    update(id: string, data: any) {
        return prisma.budgetCategory.update({
            where: { id },
            data
        })
    }

    findById(id: string) {
        return prisma.budgetCategory.findUnique({ where: { id } })
    }

    findByName(name: string) {
        return prisma.budgetCategory.findMany({
            where: { name: { equals: name, mode: 'insensitive' } }
        })
    }

    findAll() {
        return prisma.budgetCategory.findMany({
            orderBy: { name: 'asc' }
        })
    }

    setActive(id: string, isActive: boolean) {
        return prisma.budgetCategory.update({
            where: { id },
            data: { isActive }
        })
    }
}

export default new BudgetCategoryRepository()
