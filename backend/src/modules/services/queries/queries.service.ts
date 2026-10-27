import {AppError} from '../../../shared/errors/AppError.js'
import {allowedServiceStatus} from '../shared/allowedServiceStatus.js'
import queriesRepository from './queries.repository.js'
import type {FindServicesByFiltersQueryDTO, ServiceDashboardQueryDTO} from './queries.schema.js'

const ACTIVITY_STATUSES = [
    'pendente',
    'em_execução',
    'concluida',
    'cancelada'
] as const

const roundMoney = (value : number) => Math.round((value + Number.EPSILON) * 100) / 100

const normalizeServiceSummaries = <T extends {
    hoursWorked: unknown
    costPerHour: unknown
    _count: {activities: number}
}>(services : T[]) => services.map(service => {
    const {
        _count,
        hoursWorked,
        costPerHour,
        ...serviceFields
    } = service

    return {
        ...serviceFields,
        hoursWorked : hoursWorked === null ? null : Number(hoursWorked),
        costPerHour : costPerHour === null ? null : Number(costPerHour),
        activityCount : _count.activities
    }
})

class QueriesService {
    async findServiceDashboard(filters : ServiceDashboardQueryDTO) {
        const result = await queriesRepository.findServiceDashboard(filters)
        const statusCounts : Record<string, number> = Object.fromEntries(
            allowedServiceStatus.map(status => [status, 0])
        )

        for(const group of result.statusGroups){
            statusCounts[group.status] = group.count
        }

        const incomeTotal = roundMoney(result.transactions
            .filter(transaction => transaction.type === 'income')
            .reduce((total, transaction) => total + transaction.value, 0))

        const expenseTotal = roundMoney(result.transactions
            .filter(transaction => transaction.type === 'expense')
            .reduce((total, transaction) => total + transaction.value, 0))

        return {
            period : {
                year : filters.year,
                month : filters.month ?? null,
                dateBasis : 'entryDate'
            },
            serviceCount : result.serviceCount,
            statusCounts,
            financial : {
                incomeTotal,
                expenseTotal,
                balanceTotal : roundMoney(incomeTotal - expenseTotal),
                dateBasis : 'referenceDate',
                includedOrigins : ['services', 'service_tithe']
            },
            pagination : {
                page : filters.page,
                limit : filters.limit,
                total : result.serviceCount,
                totalPages : Math.ceil(result.serviceCount / filters.limit)
            },
            services : normalizeServiceSummaries(result.services)
        }
    }

    async findServicesByAdvancedFilters(filters : FindServicesByFiltersQueryDTO) {
        const result = await queriesRepository.findServicesByAdvancedFilters(filters)

        return {
            filters : {
                search : filters.search ?? null,
                serviceId : filters.serviceId ?? null,
                clientId : filters.clientId ?? null,
                clientName : filters.clientName ?? null,
                clientDocument : filters.clientDocument ?? null,
                equipamentId : filters.equipamentId ?? null,
                equipamentSearch : filters.equipamentSearch ?? null,
                serviceStatus : filters.serviceStatus ?? null,
                entryDateFrom : filters.entryDateFrom ?? null,
                entryDateTo : filters.entryDateTo ?? null,
                exitDateFrom : filters.exitDateFrom ?? null,
                exitDateTo : filters.exitDateTo ?? null,
                hoursWorkedMin : filters.hoursWorkedMin ?? null,
                hoursWorkedMax : filters.hoursWorkedMax ?? null,
                titheStatus : filters.titheStatus ?? null,
                activityTitle : filters.activityTitle ?? null,
                activityDescription : filters.activityDescription ?? null,
                activityStatus : filters.activityStatus ?? null,
                activityStartFrom : filters.activityStartFrom ?? null,
                activityStartTo : filters.activityStartTo ?? null,
                activityEndFrom : filters.activityEndFrom ?? null,
                activityEndTo : filters.activityEndTo ?? null,
                transactionType : filters.transactionType ?? null,
                transactionCategoryId : filters.transactionCategoryId ?? null,
                transactionCategoryName : filters.transactionCategoryName ?? null,
                transactionDescription : filters.transactionDescription ?? null,
                transactionValueMin : filters.transactionValueMin ?? null,
                transactionValueMax : filters.transactionValueMax ?? null,
                transactionReferenceDateFrom : filters.transactionReferenceDateFrom ?? null,
                transactionReferenceDateTo : filters.transactionReferenceDateTo ?? null,
                historyEventType : filters.historyEventType ?? null,
                historyDescription : filters.historyDescription ?? null,
                historyDateFrom : filters.historyDateFrom ?? null,
                historyDateTo : filters.historyDateTo ?? null
            },
            pagination : {
                page : filters.page,
                limit : filters.limit,
                total : result.total,
                totalPages : Math.ceil(result.total / filters.limit)
            },
            services : normalizeServiceSummaries(result.services)
        }
    }

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
