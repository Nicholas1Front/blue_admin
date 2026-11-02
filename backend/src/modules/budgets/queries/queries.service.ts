import { AppError } from '../../../shared/errors/AppError.js'
import budgetQueriesRepository from './queries.repository.js'

type BudgetDetails = NonNullable<Awaited<ReturnType<typeof budgetQueriesRepository.findBudgetDetailsById>>>

const toNumber = (value: { toNumber(): number }) => value.toNumber()
const roundMoney = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100
const sumMoney = (values: number[]) =>
    values.reduce((total, value) => total + Math.round(value * 100), 0) / 100

class BudgetQueriesService {
    async findBudgetById(id: string) {
        const budget = await budgetQueriesRepository.findBudgetDetailsById(id)

        if (!budget) {
            throw new AppError('Budget not found', 404, 'BUDGET_NOT_FOUND')
        }

        const categories = new Map<string, {
            id: string
            name: string
            description: string | null
            isActive: boolean
            itemCount: number
            quantityTotal: number
            grossAmount: number
            itemDiscountAmount: number
            totalAmount: number
            items: Array<{
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
            }>
        }>()

        const items = budget.items.map(item => {
            const quantity = toNumber(item.quantity)
            const unitValue = toNumber(item.unitValue)
            const discount = toNumber(item.discount)
            const grossAmount = roundMoney(quantity * unitValue)
            const totalAmount = toNumber(item.totalAmount)
            const discountAmount = roundMoney(grossAmount - totalAmount)

            const normalizedItem = {
                id: item.id,
                title: item.title,
                description: item.description,
                quantity,
                unitValue,
                discount,
                grossAmount,
                discountAmount,
                totalAmount,
                createdAt: item.createdAt,
                updatedAt: item.updatedAt
            }

            const categoryId = item.category.id
            const currentCategory = categories.get(categoryId)

            if (currentCategory) {
                currentCategory.items.push(normalizedItem)
                currentCategory.itemCount += 1
                currentCategory.quantityTotal += quantity
                currentCategory.grossAmount = roundMoney(currentCategory.grossAmount + grossAmount)
                currentCategory.itemDiscountAmount = roundMoney(currentCategory.itemDiscountAmount + discountAmount)
                currentCategory.totalAmount = roundMoney(currentCategory.totalAmount + totalAmount)
            } else {
                categories.set(categoryId, {
                    id: item.category.id,
                    name: item.category.name,
                    description: item.category.description,
                    isActive: item.category.isActive,
                    itemCount: 1,
                    quantityTotal: quantity,
                    grossAmount,
                    itemDiscountAmount: discountAmount,
                    totalAmount,
                    items: [normalizedItem]
                })
            }

            return normalizedItem
        })

        const groupedItems = [...categories.values()]
            .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
            .map(category => ({
                ...category,
                quantityTotal: roundMoney(category.quantityTotal)
            }))

        const totalAmount = toNumber(budget.totalAmount)
        const globalDiscount = toNumber(budget.globalDiscount)
        const globalDiscountAmount = roundMoney(totalAmount * globalDiscount / 100)
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
                itemCount: items.length,
                categoryCount: groupedItems.length,
                grossAmount: sumMoney(items.map(item => item.grossAmount)),
                itemDiscountAmount: sumMoney(items.map(item => item.discountAmount)),
                totalAmount,
                globalDiscount,
                globalDiscountAmount,
                finalAmount
            },
            items: {
                total: items.length,
                categories: groupedItems
            },
            history: budget.history
        }
    }
}

export default new BudgetQueriesService()
