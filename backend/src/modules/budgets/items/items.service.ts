import { AppError } from '../../../shared/errors/AppError.js'
import { removeUndefined } from '../../../shared/helpers/objects/removeUndefined.js'
import budgetItemRepository from './items.repository.js'
import type { CreateBudgetItemDTO, UpdateBudgetItemDTO } from './items.schema.js'

const fieldLabels: Record<string, string> = {
    title: 'título',
    description: 'descrição',
    categoryId: 'categoria',
    quantity: 'quantidade',
    unitValue: 'valor unitário',
    discount: 'desconto'
}

class BudgetItemService {
    async create(budgetId: string, data: CreateBudgetItemDTO) {
        const result = await budgetItemRepository.create(budgetId, data)
        if (!result) throw new AppError('Budget not found', 404, 'BUDGET_NOT_FOUND')
        return result
    }

    async update(id: string, data: UpdateBudgetItemDTO) {
        const current = await budgetItemRepository.findById(id)
        if (!current) throw new AppError('Budget item not found', 404, 'BUDGET_ITEM_NOT_FOUND')

        const cleanedData = removeUndefined(data)
        const changedFields = Object.keys(cleanedData).map(field => fieldLabels[field] ?? field)
        const description = `Item "${current.title}" atualizado. Campos alterados: ${changedFields.join(', ')}.`
        const result = await budgetItemRepository.update(id, cleanedData, description)

        if (!result) throw new AppError('Budget item not found', 404, 'BUDGET_ITEM_NOT_FOUND')
        return result
    }

    async findByBudgetId(budgetId: string) {
        const budget = await budgetItemRepository.budgetExists(budgetId)
        if (!budget) throw new AppError('Budget not found', 404, 'BUDGET_NOT_FOUND')

        return budgetItemRepository.findByBudgetId(budgetId)
    }

    async delete(id: string) {
        const result = await budgetItemRepository.delete(id)
        if (!result) throw new AppError('Budget item not found', 404, 'BUDGET_ITEM_NOT_FOUND')
        return result
    }
}

export default new BudgetItemService()
