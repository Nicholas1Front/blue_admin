import { Prisma } from '../../../generated/prisma/client.js'
import { prisma } from '../../../shared/database/prisma.js'
import { AppError } from '../../../shared/errors/AppError.js'
import type {
    CreateBudgetPriceDTO,
    FindBudgetPricesByFiltersDTO,
    UpdateBudgetPriceDTO
} from './prices.schema.js'

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

const contains = (value: string) => ({ contains: value, mode: 'insensitive' as const })

class BudgetPriceRepository {
    async create(data: CreateBudgetPriceDTO) {
        const category = await prisma.budgetCategory.findUnique({ where: { id: data.categoryId } })
        if (!category) throw new AppError('Budget category not found', 404, 'BUDGET_CATEGORY_NOT_FOUND')
        if (!category.isActive) {
            throw new AppError('Inactive categories cannot be used in budget prices', 400, 'BUDGET_CATEGORY_INACTIVE')
        }

        return prisma.budgetPrice.create({
            data: {
                categoryId: data.categoryId,
                title: data.title,
                description: data.description ?? null,
                unitValue: new Prisma.Decimal(data.unitValue)
            },
            include: { category: true }
        })
    }

    async update(id: string, data: UpdateBudgetPriceDTO) {
        const current = await prisma.budgetPrice.findUnique({ where: { id } })
        if (!current) return null

        if (data.categoryId !== undefined && data.categoryId !== current.categoryId) {
            const category = await prisma.budgetCategory.findUnique({ where: { id: data.categoryId } })
            if (!category) throw new AppError('Budget category not found', 404, 'BUDGET_CATEGORY_NOT_FOUND')
            if (!category.isActive) {
                throw new AppError('Inactive categories cannot be used in budget prices', 400, 'BUDGET_CATEGORY_INACTIVE')
            }
        }

        const updateData: Prisma.BudgetPriceUncheckedUpdateInput = {}

        if (data.categoryId !== undefined) updateData.categoryId = data.categoryId
        if (data.title !== undefined) updateData.title = data.title
        if (data.description !== undefined) updateData.description = data.description
        if (data.unitValue !== undefined) updateData.unitValue = new Prisma.Decimal(data.unitValue)

        return prisma.budgetPrice.update({
            where: { id },
            data: updateData,
            include: { category: true }
        })
    }

    findById(id: string) {
        return prisma.budgetPrice.findUnique({
            where: { id },
            include: { category: true }
        })
    }

    async findByFilters(filters: FindBudgetPricesByFiltersDTO) {
        const createdAt = toDateRange(filters.createdAtFrom, filters.createdAtTo)
        const updatedAt = toDateRange(filters.updatedAtFrom, filters.updatedAtTo)

        const where: Prisma.BudgetPriceWhereInput = {
            ...(filters.id !== undefined && { id: contains(filters.id) }),
            ...(filters.categoryId !== undefined && { categoryId: filters.categoryId }),
            ...(filters.title !== undefined && { title: contains(filters.title) }),
            ...(filters.description !== undefined && { description: contains(filters.description) }),
            ...((filters.unitValueMin !== undefined || filters.unitValueMax !== undefined) && {
                unitValue: {
                    ...(filters.unitValueMin !== undefined && { gte: new Prisma.Decimal(filters.unitValueMin) }),
                    ...(filters.unitValueMax !== undefined && { lte: new Prisma.Decimal(filters.unitValueMax) })
                }
            }),
            ...(createdAt !== undefined && { createdAt }),
            ...(updatedAt !== undefined && { updatedAt })
        }

        const [prices, total] = await Promise.all([
            prisma.budgetPrice.findMany({
                where,
                include: { category: true },
                skip: (filters.page - 1) * filters.limit,
                take: filters.limit,
                orderBy: [{ title: 'asc' }, { id: 'asc' }]
            }),
            prisma.budgetPrice.count({ where })
        ])

        return {
            prices,
            page: filters.page,
            limit: filters.limit,
            total,
            totalPages: Math.ceil(total / filters.limit)
        }
    }

    delete(id: string) {
        return prisma.budgetPrice.deleteMany({ where: { id } }).then(result => result.count > 0)
    }
}

export default new BudgetPriceRepository()
