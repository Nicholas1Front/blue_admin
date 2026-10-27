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
