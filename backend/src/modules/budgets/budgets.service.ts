import { AppError } from '../../shared/errors/AppError.js'
import { removeUndefined } from '../../shared/helpers/objects/removeUndefined.js'
import { allowedBudgetStatus } from './shared/allowedBudgetStatus.js'
import budgetRepository from './budgets.repository.js'
import type { CreateBudgetDTO, CreateBudgetFromServiceDTO, FindBudgetsByFiltersDTO, UpdateBudgetDTO } from './budgets.schema.js'

const fieldLabels: Record<string, string> = {
    clientId: 'cliente',
    equipamentId: 'equipamento',
    validity: 'validade',
    warranty: 'garantia',
    deliveryTime: 'prazo de entrega',
    paymentCondition: 'condição de pagamento',
    observations: 'observações',
    globalDiscount: 'desconto global',
    status: 'status'
}

class BudgetService {
    async create(data: CreateBudgetDTO) {
        const client = await budgetRepository.clientExists(data.clientId)
        if (!client) throw new AppError('Client not found', 404, 'CLIENT_NOT_FOUND')

        const equipament = await budgetRepository.clientHasEquipament(data.clientId, data.equipamentId)
        if (!equipament) {
            throw new AppError('Client does not have this equipament', 400, 'CLIENT_DOES_NOT_HAVE_EQUIPAMENT')
        }

        if (!allowedBudgetStatus.includes(data.status)) {
            throw new AppError('Invalid budget status', 400, 'INVALID_BUDGET_STATUS')
        }

        return budgetRepository.create(data)
    }

    async createFromService(data: CreateBudgetFromServiceDTO) {
        const activityIds = data.items.map(item => item.activityId)
        const categoryIds = [...new Set(data.items.map(item => item.budgetCategoryId))]

        const conversionData = await budgetRepository.findServiceForConversion(
            data.serviceId,
            activityIds,
            categoryIds
        )

        if (!conversionData.service) {
            throw new AppError('Service not found', 404, 'SERVICE_NOT_FOUND')
        }

        if (conversionData.activities.length !== data.items.length) {
            throw new AppError(
                'One or more activities were not found or do not belong to this service',
                400,
                'INVALID_SERVICE_ACTIVITIES'
            )
        }

        if (conversionData.categories.length !== categoryIds.length) {
            throw new AppError('One or more budget categories were not found', 404, 'BUDGET_CATEGORY_NOT_FOUND')
        }

        if (conversionData.categories.some(category => !category.isActive)) {
            throw new AppError(
                'Inactive categories cannot be used in new budget items',
                400,
                'BUDGET_CATEGORY_INACTIVE'
            )
        }

        const equipamentBelongsToClient = await budgetRepository.clientHasEquipament(
            conversionData.service.clientId,
            conversionData.service.equipamentId
        )
        if (!equipamentBelongsToClient) {
            throw new AppError(
                'Service client does not own the selected equipament',
                400,
                'CLIENT_DOES_NOT_HAVE_EQUIPAMENT'
            )
        }

        const activitiesById = new Map(conversionData.activities.map(activity => [activity.id, activity]))
        const items = data.items.map(incomingItem => {
            const activity = activitiesById.get(incomingItem.activityId)
            if (!activity) {
                throw new AppError('Service activity not found', 400, 'INVALID_SERVICE_ACTIVITIES')
            }

            return {
                activityId: activity.id,
                title: activity.title,
                description: activity.description,
                budgetCategoryId: incomingItem.budgetCategoryId
            }
        })

        return budgetRepository.createFromService(conversionData.service, items, new Date())
    }

    async update(id: string, data: UpdateBudgetDTO) {
        const current = await budgetRepository.findById(id)
        if (!current) throw new AppError('Budget not found', 404, 'BUDGET_NOT_FOUND')

        const cleanedData = removeUndefined(data)
        const clientChanged = cleanedData.clientId !== undefined && cleanedData.clientId !== current.clientId

        if (clientChanged && cleanedData.equipamentId === undefined) {
            throw new AppError('A new equipament must be selected when changing the client', 400, 'EQUIPAMENT_REQUIRED')
        }

        const effectiveClientId = cleanedData.clientId ?? current.clientId
        const effectiveEquipamentId = cleanedData.equipamentId ?? current.equipamentId

        if (clientChanged) {
            const client = await budgetRepository.clientExists(effectiveClientId)
            if (!client) throw new AppError('Client not found', 404, 'CLIENT_NOT_FOUND')
        }

        if (clientChanged || cleanedData.equipamentId !== undefined) {
            const equipament = await budgetRepository.clientHasEquipament(effectiveClientId, effectiveEquipamentId)
            if (!equipament) {
                throw new AppError('Client does not have this equipament', 400, 'CLIENT_DOES_NOT_HAVE_EQUIPAMENT')
            }
        }

        if (cleanedData.status !== undefined && !allowedBudgetStatus.includes(cleanedData.status)) {
            throw new AppError('Invalid budget status', 400, 'INVALID_BUDGET_STATUS')
        }

        const changedFields = Object.keys(cleanedData).map(field => fieldLabels[field] ?? field)
        const statusChanged = cleanedData.status !== undefined && cleanedData.status !== current.status
        const description = statusChanged
            ? `Status do orçamento alterado de "${current.status}" para "${cleanedData.status}". Campos alterados: ${changedFields.join(', ')}.`
            : `Orçamento atualizado. Campos alterados: ${changedFields.join(', ')}.`

        const budget = await budgetRepository.update(id, cleanedData, description)
        if (!budget) throw new AppError('Budget not found', 404, 'BUDGET_NOT_FOUND')
        return budget
    }

    async findById(id: string) {
        const budget = await budgetRepository.findById(id)
        if (!budget) throw new AppError('Budget not found', 404, 'BUDGET_NOT_FOUND')
        return budget
    }

    findByFilters(filters: FindBudgetsByFiltersDTO) {
        return budgetRepository.findByFilters(filters)
    }

    async delete(id: string) {
        const budget = await budgetRepository.findById(id)
        if (!budget) throw new AppError('Budget not found', 404, 'BUDGET_NOT_FOUND')
        await budgetRepository.delete(id)
        return true
    }
}

export default new BudgetService()
