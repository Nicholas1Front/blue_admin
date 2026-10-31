import { AppError } from '../../../shared/errors/AppError.js'
import { removeUndefined } from '../../../shared/helpers/objects/removeUndefined.js'
import budgetCategoryRepository from './categories.repository.js'
import type { CreateBudgetCategoryDTO, UpdateBudgetCategoryDTO } from './categories.schema.js'

class BudgetCategoryService {
    async create(data: CreateBudgetCategoryDTO) {
        const existing = await budgetCategoryRepository.findByName(data.name)

        if (existing.length > 0) {
            throw new AppError('This category name is already in use', 400, 'BUDGET_CATEGORY_ALREADY_IN_USE')
        }

        return budgetCategoryRepository.create(data)
    }

    async update(id: string, data: UpdateBudgetCategoryDTO) {
        const category = await budgetCategoryRepository.findById(id)

        if (!category) {
            throw new AppError('Budget category not found', 404, 'BUDGET_CATEGORY_NOT_FOUND')
        }

        const cleanedData = removeUndefined(data)

        if (cleanedData.name !== undefined) {
            const existing = await budgetCategoryRepository.findByName(cleanedData.name as string)

            if (existing.some(item => item.id !== id)) {
                throw new AppError('This category name is already in use', 400, 'BUDGET_CATEGORY_ALREADY_IN_USE')
            }
        }

        return budgetCategoryRepository.update(id, cleanedData)
    }

    findAll() {
        return budgetCategoryRepository.findAll()
    }

    async setActive(id: string, isActive: boolean) {
        const category = await budgetCategoryRepository.findById(id)

        if (!category) {
            throw new AppError('Budget category not found', 404, 'BUDGET_CATEGORY_NOT_FOUND')
        }

        if (category.isActive === isActive) {
            throw new AppError(
                isActive ? 'Category already activated' : 'Category already deactivated',
                400,
                isActive ? 'BUDGET_CATEGORY_ALREADY_ACTIVE' : 'BUDGET_CATEGORY_ALREADY_INACTIVE'
            )
        }

        return budgetCategoryRepository.setActive(id, isActive)
    }
}

export default new BudgetCategoryService()
