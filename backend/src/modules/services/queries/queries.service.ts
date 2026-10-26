import {AppError} from '../../../shared/errors/AppError.js'
import queriesRepository from './queries.repository.js'

const ACTIVITY_STATUSES = [
    'pendente',
    'em_execução',
    'concluida',
    'cancelada'
] as const

class QueriesService {
    async findServiceById(serviceId : string) {
        const result = await queriesRepository.findServiceDetailsById(serviceId)

        if(!result){
            throw new AppError('Service not found', 404, 'SERVICE_NOT_FOUND')
        }

        const {
            service,
            transactions
        } = result

        const {
            client,
            equipament,
            activities,
            history,
            titheTransaction,
            hoursWorked,
            costPerHour,
            ...serviceFields
        } = service

        const activitiesByStatus = activities.reduce<Record<string, number>>((counts, activity) => {
            counts[activity.status] = (counts[activity.status] ?? 0) + 1
            return counts
        }, Object.fromEntries(ACTIVITY_STATUSES.map(status => [status, 0])))

        const incomeTotal = transactions.reduce(
            (total, transaction) => transaction.type === 'income' ? total + transaction.value : total,
            0
        )

        const expenseTotal = transactions.reduce(
            (total, transaction) => transaction.type === 'expense' ? total + transaction.value : total,
            0
        )

        const normalizedHoursWorked = hoursWorked === null ? null : Number(hoursWorked)
        const normalizedCostPerHour = costPerHour === null ? null : Number(costPerHour)

        const operationalCost = normalizedHoursWorked !== null && normalizedCostPerHour !== null
            ? normalizedHoursWorked * normalizedCostPerHour
            : 0

        const titheValue = (incomeTotal - (expenseTotal + operationalCost)) / 10
        const titheStatus = service.titheStatus ?? 'aguardando'

        return {
            service : {
                ...serviceFields,
                hoursWorked : normalizedHoursWorked,
                costPerHour : normalizedCostPerHour
            },
            client,
            equipament,
            activities : {
                total : activities.length,
                activities_concluded : activitiesByStatus.concluida ?? 0,
                activities_pending : activitiesByStatus.pendente ?? 0,
                activities_in_progress : activitiesByStatus['em_execução'] ?? 0,
                activities_cancelled : activitiesByStatus.cancelada ?? 0,
                byStatus : activitiesByStatus,
                list : activities
            },
            financial : {
                incomeTotal,
                expenseTotal,
                operationalCost,
                tithe : {
                    status : titheStatus,
                    isPaid : titheStatus === 'concluído',
                    value : titheValue,
                    transaction : titheTransaction ? {
                        ...titheTransaction,
                        value : Number(titheTransaction.value),
                        categoryName : titheTransaction.category.name
                    } : null
                },
                transactions
            },
            history
        }
    }
}

export default new QueriesService()
