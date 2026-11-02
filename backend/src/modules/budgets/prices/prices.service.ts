import { AppError } from '../../../shared/errors/AppError.js'
import { removeUndefined } from '../../../shared/helpers/objects/removeUndefined.js'
import budgetPriceRepository from './prices.repository.js'
import type {
    CreateBudgetPriceDTO,
    FindBudgetPricesByFiltersDTO,
    UpdateBudgetPriceDTO
} from './prices.schema.js'

class BudgetPriceService {
    async create(data: CreateBudgetPriceDTO) {
        const price = await budgetPriceRepository.create(data)
        if (!price) throw new AppError('Budget category not found', 404, 'BUDGET_CATEGORY_NOT_FOUND')
        return price
    }

    async update(id: string, data: UpdateBudgetPriceDTO) {
        const cleanedData = removeUndefined(data)
        const price = await budgetPriceRepository.update(id, cleanedData)
        if (!price) throw new AppError('Budget price not found', 404, 'BUDGET_PRICE_NOT_FOUND')
        return price
    }

    async findById(id: string) {
        const price = await budgetPriceRepository.findById(id)
        if (!price) throw new AppError('Budget price not found', 404, 'BUDGET_PRICE_NOT_FOUND')
        return price
    }

    findByFilters(filters: FindBudgetPricesByFiltersDTO) {
        return budgetPriceRepository.findByFilters(filters)
    }

    async delete(id: string) {
        const price = await budgetPriceRepository.delete(id)
        if (!price) throw new AppError('Budget price not found', 404, 'BUDGET_PRICE_NOT_FOUND')
        return true
    }
}

export default new BudgetPriceService()
