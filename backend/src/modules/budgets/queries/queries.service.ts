import { Prisma } from '../../../generated/prisma/client.js'
import { AppError } from '../../../shared/errors/AppError.js'
import budgetQueriesRepository from './queries.repository.js'

type DecimalValue = { toNumber(): number }
type BudgetDetails = NonNullable<Awaited<ReturnType<typeof budgetQueriesRepository.findBudgetDetailsById>>>

const toNumber = (value: DecimalValue) => value.toNumber()

class BudgetQueriesService {
    async findBudgetById(id: string) {
        const budget = await budgetQueriesRepository.findBudgetDetailsById(id)

        if (!budget) {
            throw new AppError('Budget not found', 404, 'BUDGET_NOT_FOUND')
        }

        type NormalizedItem = {
            id: string
            title: string
            description: string | null
            quantity: number
            unitValue: number
            discount: number
            grossAmount: number
            discountAmount: number
            totalAmount: number
            createdAt: Date
            updatedAt: Date
        }

        type CategoryAccumulator = {
            id: string
            name: string
            description: string | null
            isActive: boolean
            itemCount: number
            quantityTotal: Prisma.Decimal
            grossAmount: Prisma.Decimal
            itemDiscountAmount: Prisma.Decimal
            totalAmount: Prisma.Decimal
            items: NormalizedItem[]
        }

        const categories = new Map<string, CategoryAccumulator>()

        const items = budget.items.map(item => {
            const grossAmount = item.quantity.mul(item.unitValue)
            const discountAmount = grossAmount.minus(item.totalAmount)

            const normalizedItem: NormalizedItem = {
                id: item.id,
                title: item.title,
                description: item.description,
                quantity: toNumber(item.quantity),
                unitValue: toNumber(item.unitValue),
                discount: toNumber(item.discount),
                grossAmount: toNumber(grossAmount),
                discountAmount: toNumber(discountAmount),
                totalAmount: toNumber(item.totalAmount),
                createdAt: item.createdAt,
                updatedAt: item.updatedAt
            }

            const categoryId = item.category.id
            const currentCategory = categories.get(categoryId)

            if (currentCategory) {
                currentCategory.items.push(normalizedItem)
                currentCategory.itemCount += 1
                currentCategory.quantityTotal = currentCategory.quantityTotal.plus(item.quantity)
                currentCategory.grossAmount = currentCategory.grossAmount.plus(grossAmount)
                currentCategory.itemDiscountAmount = currentCategory.itemDiscountAmount.plus(discountAmount)
                currentCategory.totalAmount = currentCategory.totalAmount.plus(item.totalAmount)
            } else {
                categories.set(categoryId, {
                    id: item.category.id,
                    name: item.category.name,
                    description: item.category.description,
                    isActive: item.category.isActive,
                    itemCount: 1,
                    quantityTotal: item.quantity,
                    grossAmount,
                    itemDiscountAmount: discountAmount,
                    totalAmount: item.totalAmount,
                    items: [normalizedItem]
                })
            }

            return {
                grossAmount,
                discountAmount,
                totalAmount: item.totalAmount
            }
        })

        const groupedItems = [...categories.values()]
            .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
            .map(category => ({
                id: category.id,
                name: category.name,
                description: category.description,
                isActive: category.isActive,
                itemCount: category.itemCount,
                quantityTotal: toNumber(category.quantityTotal),
                grossAmount: toNumber(category.grossAmount),
                itemDiscountAmount: toNumber(category.itemDiscountAmount),
                totalAmount: toNumber(category.totalAmount),
                items: category.items
            }))

        const grossAmount = items.reduce(
            (total, item) => total.plus(item.grossAmount),
            new Prisma.Decimal(0)
        )
        const itemDiscountAmount = items.reduce(
            (total, item) => total.plus(item.discountAmount),
            new Prisma.Decimal(0)
        )
        const totalAmount = toNumber(budget.totalAmount)
        const globalDiscount = toNumber(budget.globalDiscount)
        const globalDiscountAmount = budget.totalAmount
            .mul(budget.globalDiscount)
            .div(100)
        const finalAmount = toNumber(budget.finalAmount)

        return {
            budget: {
                id: budget.id,
                clientId: budget.clientId,
                equipamentId: budget.equipamentId,
                validity: budget.validity,
                warranty: budget.warranty,
                deliveryTime: budget.deliveryTime,
                paymentCondition: budget.paymentCondition,
                observations: budget.observations,
                status: budget.status,
                createdAt: budget.createdAt,
                updatedAt: budget.updatedAt
            },
            client: budget.client,
            equipament: budget.equipament,
            totals: {
                itemCount: budget.items.length,
                categoryCount: groupedItems.length,
                grossAmount: toNumber(grossAmount),
                itemDiscountAmount: toNumber(itemDiscountAmount),
                totalAmount,
                globalDiscount,
                globalDiscountAmount: toNumber(globalDiscountAmount),
                finalAmount
            },
            items: {
                total: budget.items.length,
                categories: groupedItems
            },
            history: budget.history
        }
    }
}

export default new BudgetQueriesService()
