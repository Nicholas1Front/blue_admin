import {AppError} from '../../../shared/errors/AppError.js'
import {allowedServiceStatus} from '../shared/allowedServiceStatus.js'
import queriesRepository from './queries.repository.js'
import type {FindServicesByFiltersQueryDTO, ServiceCalendarQueryDTO, ServiceDashboardQueryDTO, ServiceMetricsQueryDTO} from './queries.schema.js'

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
                exitDateIsNull : filters.exitDateIsNull ?? null,
                hoursWorkedMin : filters.hoursWorkedMin ?? null,
                hoursWorkedMax : filters.hoursWorkedMax ?? null,
                titheStatus : filters.titheStatus ?? null,
                titheTransactionId : filters.titheTransactionId ?? null,
                activityId : filters.activityId ?? null,
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
                historyId : filters.historyId ?? null,
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

    async findServiceMetrics(filters : ServiceMetricsQueryDTO) {
        const result = await queriesRepository.findServiceMetrics(filters)
        const transactionsByService = new Map<string, typeof result.transactions>()
        for(const transaction of result.transactions){
            if(transaction.originId === null) continue
            const current = transactionsByService.get(transaction.originId) ?? []
            current.push(transaction)
            transactionsByService.set(transaction.originId, current)
        }
        const activityCountsByService = new Map<string, Record<string, number>>()
        for(const group of result.activityGroups){
            const current = activityCountsByService.get(group.serviceId) ?? {}
            current[group.status] = group.count
            activityCountsByService.set(group.serviceId, current)
        }
        const monthlyEvolution = Array.from({length : 12}, (_, index) => ({
            month : index + 1, serviceCount : 0, hoursWorked : 0, operationalCost : 0,
            incomeTotal : 0, directExpenseTotal : 0, operationalResult : 0,
            titheExpectedTotal : 0, tithePaidTotal : 0
        }))
        const serviceMetrics = result.services.map(service => {
            const linked = transactionsByService.get(service.id) ?? []
            const income = linked.reduce((sum, transaction) => transaction.originType === 'services' && transaction.type === 'income' ? sum + transaction.value : sum, 0)
            const directExpenses = linked.reduce((sum, transaction) => transaction.originType === 'services' && transaction.type === 'expense' ? sum + transaction.value : sum, 0)
            const tithePaid = linked.reduce((sum, transaction) => transaction.originType === 'service_tithe' ? sum + transaction.value : sum, 0)
            const hours = service.hoursWorked === null ? 0 : Number(service.hoursWorked)
            const operationalCost = service.hoursWorked !== null && service.costPerHour !== null ? roundMoney(hours * Number(service.costPerHour)) : 0
            const operationalResult = roundMoney(income - directExpenses - operationalCost)
            const titheExpected = Math.max(0, roundMoney(operationalResult / 10))
            return {
                id : service.id, clientId : service.clientId, clientName : service.client.name,
                month : service.entryDate.getUTCMonth() + 1, status : service.status,
                durationDays : service.exitDate === null ? null : Math.max(0, (service.exitDate.getTime() - service.entryDate.getTime()) / 86400000),
                hoursWorked : hours, operationalCost, incomeTotal : roundMoney(income),
                directExpenseTotal : roundMoney(directExpenses), operationalResult,
                titheStatus : service.titheStatus ?? 'aguardando',
                titheExpectedTotal : titheExpected, tithePaidTotal : roundMoney(tithePaid),
                activityCounts : activityCountsByService.get(service.id) ?? {}
            }
        })
        for(const metric of serviceMetrics){
            const bucket = monthlyEvolution[metric.month - 1]!
            bucket.serviceCount += 1
            bucket.hoursWorked += metric.hoursWorked
            bucket.operationalCost += metric.operationalCost
            bucket.incomeTotal += metric.incomeTotal
            bucket.directExpenseTotal += metric.directExpenseTotal
            bucket.operationalResult += metric.operationalResult
            bucket.titheExpectedTotal += metric.titheExpectedTotal
            bucket.tithePaidTotal += metric.tithePaidTotal
        }
        const selected = filters.month === undefined ? serviceMetrics : serviceMetrics.filter(service => service.month === filters.month)
        const statusCounts : Record<string, number> = Object.fromEntries(allowedServiceStatus.map(status => [status, 0]))
        const activityStatusCounts : Record<string, number> = Object.fromEntries(ACTIVITY_STATUSES.map(status => [status, 0]))
        const titheStatusCounts : Record<string, number> = {'aguardando' : 0, 'não concluído' : 0, 'concluído' : 0}
        const clients = new Map<string, {clientId : string; name : string; serviceCount : number}>()
        let hoursWorkedTotal = 0, operationalCostTotal = 0, incomeTotal = 0, directExpenseTotal = 0
        let operationalResult = 0, titheExpectedTotal = 0, tithePaidTotal = 0, tithePendingTotal = 0
        let durationDaysTotal = 0, durationCount = 0
        for(const metric of selected){
            statusCounts[metric.status] = (statusCounts[metric.status] ?? 0) + 1
            hoursWorkedTotal += metric.hoursWorked
            operationalCostTotal += metric.operationalCost
            incomeTotal += metric.incomeTotal
            directExpenseTotal += metric.directExpenseTotal
            operationalResult += metric.operationalResult
            if(metric.durationDays !== null){
                durationDaysTotal += metric.durationDays
                durationCount += 1
            }
            titheExpectedTotal += metric.titheExpectedTotal
            tithePaidTotal += metric.tithePaidTotal
            if(metric.titheStatus !== 'concluído') tithePendingTotal += metric.titheExpectedTotal
            titheStatusCounts[metric.titheStatus] = (titheStatusCounts[metric.titheStatus] ?? 0) + 1
            const client = clients.get(metric.clientId) ?? {clientId : metric.clientId, name : metric.clientName, serviceCount : 0}
            client.serviceCount += 1
            clients.set(metric.clientId, client)
            for(const [status, count] of Object.entries(metric.activityCounts)){
                activityStatusCounts[status] = (activityStatusCounts[status] ?? 0) + count
            }
        }
        return {
            period : {year : filters.year, month : filters.month ?? null, serviceDateBasis : 'entryDate', transactionAttribution : 'linkedService', monthlyEvolutionDateBasis : 'entryDate'},
            summary : {
                serviceCount : selected.length, statusCounts, activityStatusCounts,
                hoursWorkedTotal : roundMoney(hoursWorkedTotal), operationalCostTotal : roundMoney(operationalCostTotal),
                incomeTotal : roundMoney(incomeTotal), directExpenseTotal : roundMoney(directExpenseTotal),
                operationalResult : roundMoney(operationalResult),
                averageDurationDays : durationCount > 0 ? roundMoney(durationDaysTotal / durationCount) : null,
                tithe : {expectedTotal : roundMoney(titheExpectedTotal), paidTotal : roundMoney(tithePaidTotal), pendingTotal : roundMoney(tithePendingTotal), statusCounts : titheStatusCounts}
            },
            monthlyEvolution : monthlyEvolution.map(bucket => ({
                ...bucket, hoursWorked : roundMoney(bucket.hoursWorked), operationalCost : roundMoney(bucket.operationalCost),
                incomeTotal : roundMoney(bucket.incomeTotal), directExpenseTotal : roundMoney(bucket.directExpenseTotal),
                operationalResult : roundMoney(bucket.operationalResult), titheExpectedTotal : roundMoney(bucket.titheExpectedTotal),
                tithePaidTotal : roundMoney(bucket.tithePaidTotal)
            })),
            topClients : [...clients.values()].sort((a, b) => b.serviceCount - a.serviceCount || a.name.localeCompare(b.name)).slice(0, 5)
        }
    }

    async findServicesForCalendar(filters : ServiceCalendarQueryDTO) {
        const services = await queriesRepository.findServicesForCalendar(filters)
        const startDate = new Date(`${filters.startDate}T00:00:00.000Z`)
        const endDateExclusive = new Date(`${filters.endDate}T00:00:00.000Z`)
        endDateExclusive.setUTCDate(endDateExclusive.getUTCDate() + 1)
        const events = services.flatMap(service => {
            const eventsForService : Array<{date : string; eventType : 'entry' | 'exit' | 'ongoing'; serviceId : string}> = []
            const entryDate = service.entryDate
            const exitDate = service.exitDate
            if(entryDate >= startDate && entryDate < endDateExclusive){
                eventsForService.push({date : entryDate.toISOString().slice(0, 10), eventType : 'entry', serviceId : service.id})
            } else if(entryDate < startDate && (exitDate === null || exitDate >= startDate)){
                eventsForService.push({date : filters.startDate, eventType : 'ongoing', serviceId : service.id})
            }
            if(exitDate !== null && exitDate >= startDate && exitDate < endDateExclusive){
                eventsForService.push({date : exitDate.toISOString().slice(0, 10), eventType : 'exit', serviceId : service.id})
            }
            return eventsForService
        })
        return {period : filters, total : services.length, services : normalizeServiceSummaries(services), events}
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

        const titheBase = incomeTotal - expenseTotal - operationalCost
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
