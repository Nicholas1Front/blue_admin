import {Prisma} from '../../../generated/prisma/client.js'
import {prisma} from '../../../shared/database/prisma.js'
import type {FindServicesByFiltersQueryDTO, ServiceDashboardQueryDTO} from './queries.schema.js'

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

class QueriesRepository {
    async findServiceDashboard(filters : ServiceDashboardQueryDTO) {
        const startDate = filters.month === undefined
            ? new Date(Date.UTC(filters.year, 0, 1))
            : new Date(Date.UTC(filters.year, filters.month - 1, 1))
        const endDate = filters.month === undefined
            ? new Date(Date.UTC(filters.year + 1, 0, 1))
            : new Date(Date.UTC(filters.year, filters.month, 1))

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

        const activityWhere : Prisma.ServiceActivityWhereInput = {
            ...(filters.activityTitle !== undefined && {title : contains(filters.activityTitle)}),
            ...(filters.activityDescription !== undefined && {description : contains(filters.activityDescription)}),
            ...(filters.activityStatus !== undefined && {status : contains(filters.activityStatus)}),
            ...(toDateRange(filters.activityStartFrom, filters.activityStartTo) !== undefined && {
                startAt : toDateRange(filters.activityStartFrom, filters.activityStartTo)
            }),
            ...(toDateRange(filters.activityEndFrom, filters.activityEndTo) !== undefined && {
                endAt : toDateRange(filters.activityEndFrom, filters.activityEndTo)
            })
        }

        if(Object.keys(activityWhere).length > 0){
            andFilters.push({activities : {some : activityWhere}})
        }

        const historyWhere : Prisma.ServiceHistoryWhereInput = {
            ...(filters.historyEventType !== undefined && {eventType : contains(filters.historyEventType)}),
            ...(filters.historyDescription !== undefined && {description : contains(filters.historyDescription)}),
            ...(toDateRange(filters.historyDateFrom, filters.historyDateTo) !== undefined && {
                createdAt : toDateRange(filters.historyDateFrom, filters.historyDateTo)
            })
        }

        if(Object.keys(historyWhere).length > 0){
            andFilters.push({history : {some : historyWhere}})
        }

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
            ...(toDateRange(filters.transactionReferenceDateFrom, filters.transactionReferenceDateTo) !== undefined && {
                referenceDate : toDateRange(filters.transactionReferenceDateFrom, filters.transactionReferenceDateTo)
            })
        }

        const hasTransactionFilters = Object.keys(transactionWhere).length > 0
        const matchingTransactionIdsPromise = hasTransactionFilters
            ? this.findMatchingTransactionServiceIds(transactionWhere)
            : Promise.resolve(null)

        let searchTransactionIdsPromise : Promise<string[] | null> = Promise.resolve(null)
        if(filters.search !== undefined){
            searchTransactionIdsPromise = this.findMatchingTransactionServiceIds({
                description : contains(filters.search)
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
