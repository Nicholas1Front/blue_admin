import queriesRepository from './queries.repository.js';
import type {MonthlySummaryQuery} from './queries.schema.js';

class QueriesService {
    async findMonthlySummary(filters : MonthlySummaryQuery){
        const {year, month, limit} = filters;

        const summary = await queriesRepository.findMonthlySummary(
            year,
            month,
            limit
        );

        const incomesValue = summary.categories
            .filter(category => category.type === 'income')
            .reduce((total, category) => total + category.value, 0);

        const expensesValue = summary.categories
            .filter(category => category.type === 'expense')
            .reduce((total, category) => total + category.value, 0);

        return {
            year,
            month,
            incomesValue,
            expensesValue,
            balanceValue : incomesValue - expensesValue,
            categories : summary.categories,
            lastTransactions : {
                numberTransactions : limit,
                transactions : summary.transactions
            }
        };
    }
}

export default new QueriesService();
