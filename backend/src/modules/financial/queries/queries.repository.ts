import {prisma} from '../../../shared/database/prisma.js';

class QueriesRepository {
    async findMonthlySummary(
        year : number,
        month : number,
        limit : number
    ){
        const startDate = new Date(Date.UTC(year, month - 1, 1));
        const endDate = new Date(Date.UTC(year, month, 1));

        const dateFilter = {
            referenceDate : {
                gte : startDate,
                lt : endDate
            }
        };

        const groupedTransactions = await prisma.financialTransaction.groupBy({
            by : ['categoryId', 'type'],
            where : dateFilter,
            _sum : {
                value : true
            }
        });

        const categoryIds = [...new Set(
            groupedTransactions.map(transaction => transaction.categoryId)
        )];

        const [categories, latestTransactions] = await Promise.all([
            prisma.financialCategory.findMany({
                where : {
                    id : {
                        in : categoryIds
                    }
                },
                select : {
                    id : true,
                    name : true,
                    description : true
                }
            }),
            prisma.financialTransaction.findMany({
                where : dateFilter,
                orderBy : [
                    {referenceDate : 'desc'},
                    {createdAt : 'desc'}
                ],
                take : limit,
                include : {
                    category : {
                        select : {
                            name : true
                        }
                    }
                }
            })
        ]);

        const categoriesById = new Map(
            categories.map(category => [category.id, category] as const)
        );

        const categorySummary = groupedTransactions.flatMap(transaction => {
            const category = categoriesById.get(transaction.categoryId);

            if(!category){
                return [];
            }

            return [{
                name : category.name,
                type : transaction.type,
                description : category.description,
                value : Number(transaction._sum.value ?? 0)
            }];
        });

        const transactions = latestTransactions.map(({category, value, ...transaction}) => ({
            ...transaction,
            value : Number(value),
            categoryName : category.name
        }));

        return {
            categories : categorySummary,
            transactions
        };
    }
    
    async findYearlyTransactions(year : number){
        const startDate = new Date(0);
        startDate.setUTCFullYear(year, 0, 1);
        startDate.setUTCHours(0, 0, 0, 0);

        const endDate = new Date(0);
        endDate.setUTCFullYear(year + 1, 0, 1);
        endDate.setUTCHours(0, 0, 0, 0);

        return prisma.financialTransaction.findMany({
            where : {
                referenceDate : {
                    gte : startDate,
                    lt : endDate
                }
            },
            select : {
                value : true,
                type : true,
                referenceDate : true,
                category : {
                    select : {
                        id : true,
                        name : true,
                        description : true
                    }
                }
            },
            orderBy : {
                referenceDate : 'asc'
            }
        });
    }
}

export default new QueriesRepository();
