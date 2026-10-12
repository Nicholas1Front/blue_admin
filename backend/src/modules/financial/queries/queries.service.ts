import queriesRepository from './queries.repository.js';
import type {MonthlySummaryQuery, YearlySummaryQuery} from './queries.schema.js';

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
    
    async findYearlySummary(filters : YearlySummaryQuery){
        const {year} = filters;
        const transactions = await queriesRepository.findYearlyTransactions(year);

        type CategorySummary = {
            name : string;
            type : string;
            description : string | null;
            value : number;
        };

        const yearlyCategories = new Map<string, CategorySummary>();
        const monthlyCategories = new Map<number, Map<string, CategorySummary>>();

        const addCategoryValue = (
            categories : Map<string, CategorySummary>,
            key : string,
            category : Omit<CategorySummary, 'value'>,
            value : number
        ) => {
            const existingCategory = categories.get(key);

            if(existingCategory){
                existingCategory.value += value;
                return;
            }

            categories.set(key, {
                ...category,
                value
            });
        };

        for(const transaction of transactions){
            const value = Number(transaction.value);
            const categoryKey = `${transaction.category.id}:${transaction.type}`;
            const category = {
                name : transaction.category.name,
                type : transaction.type,
                description : transaction.category.description
            };
            const month = transaction.referenceDate.getUTCMonth() + 1;

            addCategoryValue(yearlyCategories, categoryKey, category, value);

            if(!monthlyCategories.has(month)){
                monthlyCategories.set(month, new Map<string, CategorySummary>());
            }

            addCategoryValue(
                monthlyCategories.get(month)!,
                categoryKey,
                category,
                value
            );
        }

        const calculateTotals = (categories : CategorySummary[]) => {
            const incomesValue = categories
                .filter(category => category.type === 'income')
                .reduce((total, category) => total + category.value, 0);

            const expensesValue = categories
                .filter(category => category.type === 'expense')
                .reduce((total, category) => total + category.value, 0);

            return {
                incomesValue,
                expensesValue,
                balanceValue : incomesValue - expensesValue
            };
        };

        const categories = [...yearlyCategories.values()];
        const monthsDetails = Array.from({length : 12}, (_, index) => {
            const month = index + 1;
            const monthSummary = [...(monthlyCategories.get(month)?.values() ?? [])];

            return {
                month,
                ...calculateTotals(monthSummary),
                categories : monthSummary
            };
        });

        return {
            year,
            ...calculateTotals(categories),
            categories,
            monthsDetails
        };
    }
}

export default new QueriesService();
