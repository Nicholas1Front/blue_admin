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

        const roundMoney = (value : number) => Math.round((value + Number.EPSILON) * 100) / 100

        const sumTransactions = (type : string) => transactions.reduce(
            (totalCents, transaction) => transaction.type === type
                ? totalCents + Math.round(transaction.value * 100)
                : totalCents,
            0
        ) / 100

        const incomeTotal = sumTransactions('income')
        const expenseTotal = sumTransactions('expense')

        const normalizedHoursWorked = hoursWorked === null ? null : Number(hoursWorked)
        const normalizedCostPerHour = costPerHour === null ? null : Number(costPerHour)

        const operationalCost = normalizedHoursWorked !== null && normalizedCostPerHour !== null
            ? roundMoney(normalizedHoursWorked * normalizedCostPerHour)
            : 0

        const hasOperationalCost = operationalCost > 0
        const hasDirectCosts = expenseTotal > 0
        const titheBase = hasOperationalCost && hasDirectCosts
            ? incomeTotal - expenseTotal - operationalCost
            : incomeTotal
        const titheValue = Math.max(0, roundMoney(titheBase / 10))
        const titheStatus = service.titheStatus ?? 'aguardando'

        const normalizedTitheTransaction = (() => {
            if(!titheTransaction){
                return null
            }

            const {category, value, ...transaction} = titheTransaction

            return {
                ...transaction,
                value : Number(value),
                categoryName : category.name
            }
        })()

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
                    transaction : normalizedTitheTransaction
                },
                transactions
            },
            history
        }
    }
}

export default new QueriesService()
