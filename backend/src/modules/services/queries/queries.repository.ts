import type {Prisma} from '../../../generated/prisma/client.js'
import {prisma} from '../../../shared/database/prisma.js'
import type {FindServicesByFiltersQueryDTO, ServiceCalendarQueryDTO, ServiceDashboardQueryDTO, ServiceMetricsQueryDTO} from './queries.schema.js'

const serviceSummarySelect = {
    id : true,
    clientId : true,
    equipamentId : true,
    entryDate : true,
    exitDate : true,
    status : true,
    hoursWorked : true,
    costPerHour : true,
    titheStatus : true,
    titheTransactionId : true,
    createdAt : true,
    updatedAt : true,
    client : {
        select : {
            id : true,
            name : true,
            document : true
        }
    },
    equipament : {
        select : {
            id : true,
            type : true,
            brand : true,
            model : true,
            mainIdentification : true,
            additionalIdentification : true
        }
    },
    _count : {
        select : {
            activities : true
        }
    }
} satisfies Prisma.ServiceSelect

const toDateRange = (from?: string, to?: string) => {
    if(from === undefined && to === undefined){
        return undefined
    }

    const range : {gte?: Date; lt?: Date} = {}

    if(from !== undefined){
        range.gte = new Date(`${from}T00:00:00.000Z`)
    }

    if(to !== undefined){
        const endExclusive = new Date(`${to}T00:00:00.000Z`)
        endExclusive.setUTCDate(endExclusive.getUTCDate() + 1)
        range.lt = endExclusive
    }

    return range
}

const contains = (value: string) => ({
    contains : value,
    mode : 'insensitive' as const
})

const utcDate = (year: number, month: number) => {
    const date = new Date(0)
    date.setUTCFullYear(year, month, 1)
    date.setUTCHours(0, 0, 0, 0)
    return date
}

class QueriesRepository {
    async findServiceDashboard(filters : ServiceDashboardQueryDTO) {
        const startDate = utcDate(
            filters.year,
            filters.month === undefined ? 0 : filters.month - 1
        )
        const endDate = filters.month === undefined
            ? utcDate(filters.year + 1, 0)
            : utcDate(filters.year, filters.month)

        const serviceWhere : Prisma.ServiceWhereInput = {
            entryDate : {
                gte : startDate,
                lt : endDate
            }
        }
        const transactionWhere : Prisma.FinancialTransactionWhereInput = {
            referenceDate : {
                gte : startDate,
                lt : endDate
            },
            originType : {
                in : ['services', 'service_tithe']
            },
            originId : {
                not : null
            }
        }

        const [serviceCount, statusGroups, transactions, services] = await Promise.all([
            prisma.service.count({where : serviceWhere}),
            prisma.service.groupBy({
                by : ['status'],
                where : serviceWhere,
                _count : {
                    _all : true
                }
            }),
            prisma.financialTransaction.groupBy({
                by : ['type'],
                where : transactionWhere,
                _sum : {
                    value : true
                }
            }),
            prisma.service.findMany({
                where : serviceWhere,
                select : serviceSummarySelect,
                orderBy : [
                    {entryDate : 'desc'},
                    {createdAt : 'desc'},
                    {id : 'desc'}
                ],
                skip : (filters.page - 1) * filters.limit,
                take : filters.limit
            })
        ])

        return {
            serviceCount,
            statusGroups : statusGroups.map(group => ({
                status : group.status,
                count : group._count._all
            })),
            transactions : transactions.map(group => ({
                type : group.type,
                value : Number(group._sum.value ?? 0)
            })),
            services
        }
    }

    async findMatchingTransactionServiceIds(
        where : Prisma.FinancialTransactionWhereInput
    ) {
        const groups = await prisma.financialTransaction.groupBy({
            by : ['originId'],
            where : {
                ...where,
                originId : {
                    not : null
                },
                originType : {
                    in : ['services', 'service_tithe']
                }
            },
            _count : {
                _all : true
            }
        })

        return groups.flatMap(group => group.originId === null ? [] : [group.originId])
    }

    async findServicesByAdvancedFilters(filters : FindServicesByFiltersQueryDTO) {
        const andFilters : Prisma.ServiceWhereInput[] = []

        if(filters.serviceId !== undefined){
            andFilters.push({id : contains(filters.serviceId)})
        }

        if(filters.clientId !== undefined){
            andFilters.push({clientId : filters.clientId})
        }

        if(filters.clientName !== undefined){
            andFilters.push({client : {is : {name : contains(filters.clientName)}}})
        }

        if(filters.clientDocument !== undefined){
            andFilters.push({client : {is : {document : contains(filters.clientDocument)}}})
        }

        if(filters.equipamentId !== undefined){
            andFilters.push({equipamentId : filters.equipamentId})
        }

        if(filters.equipamentSearch !== undefined){
            andFilters.push({
                equipament : {
                    is : {
                        OR : [
                            {type : contains(filters.equipamentSearch)},
                            {brand : contains(filters.equipamentSearch)},
                            {model : contains(filters.equipamentSearch)},
                            {mainIdentification : contains(filters.equipamentSearch)},
                            {additionalIdentification : contains(filters.equipamentSearch)}
                        ]
                    }
                }
            })
        }

        if(filters.serviceStatus !== undefined){
            andFilters.push({status : contains(filters.serviceStatus)})
        }

        const entryDate = toDateRange(filters.entryDateFrom, filters.entryDateTo)
        if(entryDate){
            andFilters.push({entryDate})
        }

        const exitDate = toDateRange(filters.exitDateFrom, filters.exitDateTo)
        if(exitDate){
            andFilters.push({exitDate})
        }

        if(filters.exitDateIsNull !== undefined){
            andFilters.push({
                exitDate : filters.exitDateIsNull ? null : {not : null}
            })
        }

        if(filters.hoursWorkedMin !== undefined || filters.hoursWorkedMax !== undefined){
            andFilters.push({
                hoursWorked : {
                    ...(filters.hoursWorkedMin !== undefined && {gte : filters.hoursWorkedMin}),
                    ...(filters.hoursWorkedMax !== undefined && {lte : filters.hoursWorkedMax})
                }
            })
        }

        if(filters.titheStatus !== undefined){
            andFilters.push({titheStatus : contains(filters.titheStatus)})
        }

        if(filters.titheTransactionId !== undefined){
            andFilters.push({titheTransactionId : contains(filters.titheTransactionId)})
        }

        const activityStartDate = toDateRange(filters.activityStartFrom, filters.activityStartTo)
        const activityEndDate = toDateRange(filters.activityEndFrom, filters.activityEndTo)
        const activityWhere : Prisma.ServiceActivityWhereInput = {
            ...(filters.activityId !== undefined && {id : contains(filters.activityId)}),
            ...(filters.activityTitle !== undefined && {title : contains(filters.activityTitle)}),
            ...(filters.activityDescription !== undefined && {description : contains(filters.activityDescription)}),
            ...(filters.activityStatus !== undefined && {status : contains(filters.activityStatus)}),
            ...(activityStartDate !== undefined && {startAt : activityStartDate}),
            ...(activityEndDate !== undefined && {endAt : activityEndDate})
        }

        if(Object.keys(activityWhere).length > 0){
            andFilters.push({activities : {some : activityWhere}})
        }

        const historyDate = toDateRange(filters.historyDateFrom, filters.historyDateTo)
        const historyWhere : Prisma.ServiceHistoryWhereInput = {
            ...(filters.historyId !== undefined && {id : contains(filters.historyId)}),
            ...(filters.historyEventType !== undefined && {eventType : contains(filters.historyEventType)}),
            ...(filters.historyDescription !== undefined && {description : contains(filters.historyDescription)}),
            ...(historyDate !== undefined && {createdAt : historyDate})
        }

        if(Object.keys(historyWhere).length > 0){
            andFilters.push({history : {some : historyWhere}})
        }

        const transactionReferenceDate = toDateRange(
            filters.transactionReferenceDateFrom,
            filters.transactionReferenceDateTo
        )
        const transactionWhere : Prisma.FinancialTransactionWhereInput = {
            ...(filters.transactionType !== undefined && {type : filters.transactionType}),
            ...(filters.transactionCategoryId !== undefined && {categoryId : filters.transactionCategoryId}),
            ...(filters.transactionCategoryName !== undefined && {
                category : {
                    is : {
                        name : contains(filters.transactionCategoryName)
                    }
                }
            }),
            ...(filters.transactionDescription !== undefined && {
                description : contains(filters.transactionDescription)
            }),
            ...((filters.transactionValueMin !== undefined || filters.transactionValueMax !== undefined) && {
                value : {
                    ...(filters.transactionValueMin !== undefined && {gte : filters.transactionValueMin}),
                    ...(filters.transactionValueMax !== undefined && {lte : filters.transactionValueMax})
                }
            }),
            ...(transactionReferenceDate !== undefined && {referenceDate : transactionReferenceDate})
        }

        const hasTransactionFilters = Object.keys(transactionWhere).length > 0
        const matchingTransactionIdsPromise = hasTransactionFilters
            ? this.findMatchingTransactionServiceIds(transactionWhere)
            : Promise.resolve(null)

        let searchTransactionIdsPromise : Promise<string[] | null> = Promise.resolve(null)
        if(filters.search !== undefined){
            searchTransactionIdsPromise = this.findMatchingTransactionServiceIds({
                OR : [
                    {id : contains(filters.search)},
                    {description : contains(filters.search)},
                    {category : {is : {name : contains(filters.search)}}}
                ]
            })
        }

        const [matchingTransactionIds, searchTransactionIds] = await Promise.all([
            matchingTransactionIdsPromise,
            searchTransactionIdsPromise
        ])

        if(matchingTransactionIds !== null){
            if(matchingTransactionIds.length === 0){
                return {
                    total : 0,
                    services : []
                }
            }

            andFilters.push({id : {in : matchingTransactionIds}})
        }

        if(filters.search !== undefined){
            const searchOr : Prisma.ServiceWhereInput[] = [
                {id : contains(filters.search)},
                {client : {is : {name : contains(filters.search)}}},
                {client : {is : {document : contains(filters.search)}}},
                {
                    equipament : {
                        is : {
                            OR : [
                                {type : contains(filters.search)},
                                {brand : contains(filters.search)},
                                {model : contains(filters.search)},
                                {mainIdentification : contains(filters.search)},
                                {additionalIdentification : contains(filters.search)}
                            ]
                        }
                    }
                },
                {
                    activities : {
                        some : {
                            OR : [
                                {title : contains(filters.search)},
                                {description : contains(filters.search)}
                            ]
                        }
                    }
                },
                {
                    history : {
                        some : {
                            OR : [
                                {eventType : contains(filters.search)},
                                {description : contains(filters.search)}
                            ]
                        }
                    }
                }
            ]

            if(searchTransactionIds !== null && searchTransactionIds.length > 0){
                searchOr.push({id : {in : searchTransactionIds}})
            }

            andFilters.push({OR : searchOr})
        }

        const where : Prisma.ServiceWhereInput = andFilters.length > 0
            ? {AND : andFilters}
            : {}

        const [total, services] = await Promise.all([
            prisma.service.count({where}),
            prisma.service.findMany({
                where,
                select : serviceSummarySelect,
                orderBy : [
                    {entryDate : 'desc'},
                    {createdAt : 'desc'},
                    {id : 'desc'}
                ],
                skip : (filters.page - 1) * filters.limit,
                take : filters.limit
            })
        ])

        return {
            total,
            services
        }
    }

    async findServiceMetrics(filters : ServiceMetricsQueryDTO) {
        const startDate = utcDate(filters.year, 0)
        const endDate = utcDate(filters.year + 1, 0)
        const services = await prisma.service.findMany({
            where : {entryDate : {gte : startDate, lt : endDate}},
            select : {
                id : true, clientId : true, entryDate : true, status : true,
                hoursWorked : true, costPerHour : true, titheStatus : true,
                titheTransactionId : true, client : {select : {name : true}}
            },
            orderBy : [{entryDate : 'asc'}, {id : 'asc'}]
        })
        const serviceIds = services.map(service => service.id)
        const [transactions, activityGroups] = await Promise.all([
            prisma.financialTransaction.findMany({
                where : {originId : {in : serviceIds}, originType : {in : ['services', 'service_tithe']}},
                select : {originId : true, originType : true, type : true, value : true}
            }),
            prisma.serviceActivity.groupBy({
                by : ['serviceId', 'status'],
                where : {serviceId : {in : serviceIds}},
                _count : {_all : true}
            })
        ])
        return {
            services,
            transactions : transactions.map(transaction => ({...transaction, value : Number(transaction.value)})),
            activityGroups : activityGroups.map(group => ({serviceId : group.serviceId, status : group.status, count : group._count._all}))
        }
    }

    async findServicesForCalendar(filters : ServiceCalendarQueryDTO) {
        const startDate = new Date(`${filters.startDate}T00:00:00.000Z`)
        const endDateExclusive = new Date(`${filters.endDate}T00:00:00.000Z`)
        endDateExclusive.setUTCDate(endDateExclusive.getUTCDate() + 1)
        return prisma.service.findMany({
            where : {
                entryDate : {lt : endDateExclusive},
                OR : [{exitDate : null}, {exitDate : {gte : startDate}}]
            },
            select : serviceSummarySelect,
            orderBy : [{entryDate : 'asc'}, {createdAt : 'asc'}, {id : 'asc'}]
        })
    }
    async findServiceDetailsById(serviceId : string) {
        const [service, transactions] = await Promise.all([
            prisma.service.findUnique({
                where : {
                    id : serviceId
                },
                include : {
                    client : {
                        select : {
                            name : true,
                            document : true
                        }
                    },
                    equipament : true,
                    activities : {
                        orderBy : [
                            { createdAt : 'desc' },
                            { id : 'desc' }
                        ]
                    },
                    history : {
                        orderBy : [
                            { createdAt : 'desc' },
                            { id : 'desc' }
                        ]
                    },
                    titheTransaction : {
                        include : {
                            category : {
                                select : {
                                    name : true
                                }
                            }
                        }
                    }
                }
            }),
            prisma.financialTransaction.findMany({
                where : {
                    originId : serviceId,
                    originType : 'services'
                },
                include : {
                    category : {
                        select : {
                            name : true
                        }
                    }
                },
                orderBy : [
                    { referenceDate : 'desc' },
                    { createdAt : 'desc' },
                    { id : 'asc' }
                ]
            })
        ])

        if(!service){
            return null
        }

        return {
            service,
            transactions : transactions.map(({category, value, ...transaction}) => ({
                ...transaction,
                value : Number(value),
                categoryName : category.name
            }))
        }
    }
}

export default new QueriesRepository()
