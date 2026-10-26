import {prisma} from '../../../shared/database/prisma.js'

class QueriesRepository {
    async findServiceDetailsById(serviceId : string) {
        const [service, transactions] = await Promise.all([
            prisma.service.findUnique({
                where : {
                    id : serviceId
                },
                include : {
                    client : {
                        include : {
                            contacts : true
                        }
                    },
                    equipament : true,
                    activities : {
                        orderBy : [
                            { startAt : 'asc' },
                            { createdAt : 'asc' },
                            { id : 'asc' }
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
                                    id : true,
                                    name : true,
                                    type : true
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
                            id : true,
                            name : true,
                            type : true
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
                category : {
                    id : category.id,
                    name : category.name,
                    type : category.type
                },
                categoryName : category.name
            }))
        }
    }
}

export default new QueriesRepository()
