import { Prisma } from '../../../generated/prisma/client.js'
import { prisma } from '../../../shared/database/prisma.js'
import type { FindBudgetCategoriesByFiltersDTO } from './categories.schema.js'

const toDateRange = (from?: string, to?: string) => {
    if (from === undefined && to === undefined) return undefined

    const range: { gte?: Date; lt?: Date } = {}
    if (from !== undefined) range.gte = new Date(`${from}T00:00:00.000Z`)
    if (to !== undefined) {
        const endExclusive = new Date(`${to}T00:00:00.000Z`)
        endExclusive.setUTCDate(endExclusive.getUTCDate() + 1)
        range.lt = endExclusive
    }
    return range
}

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
        return prisma.budgetCategory.update({ where: { id }, data })
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
        return prisma.budgetCategory.findMany({ orderBy: { name: 'asc' } })
    }

    async findByFilters(filters: FindBudgetCategoriesByFiltersDTO) {
        const createdAt = toDateRange(filters.createdAtFrom, filters.createdAtTo)
        const updatedAt = toDateRange(filters.updatedAtFrom, filters.updatedAtTo)

        const where: Prisma.BudgetCategoryWhereInput = {
            ...(filters.id !== undefined && { id: { contains: filters.id, mode: 'insensitive' } }),
            ...(filters.name !== undefined && { name: { contains: filters.name, mode: 'insensitive' } }),
            ...(filters.description !== undefined && { description: { contains: filters.description, mode: 'insensitive' } }),
            ...(filters.isActive !== undefined && { isActive: filters.isActive }),
            ...(createdAt !== undefined && { createdAt }),
            ...(updatedAt !== undefined && { updatedAt })
        }

        const [categories, total] = await Promise.all([
            prisma.budgetCategory.findMany({
                where,
                skip: (filters.page - 1) * filters.limit,
                take: filters.limit,
                orderBy: [{ name: 'asc' }, { id: 'asc' }]
            }),
            prisma.budgetCategory.count({ where })
        ])

        return {
            categories,
            page: filters.page,
            limit: filters.limit,
            total,
            totalPages: Math.ceil(total / filters.limit)
        }
    }

    setActive(id: string, isActive: boolean) {
        return prisma.budgetCategory.update({ where: { id }, data: { isActive } })
    }
}

export default new BudgetCategoryRepository()
