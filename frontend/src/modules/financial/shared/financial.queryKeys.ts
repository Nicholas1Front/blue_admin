import type { FindCategoryFilters } from "../categories/categories.types";
import type {
    FindTransactionsByFilters,
    PaginatedTransactionsFilters
} from "../transactions/transactions.types";
import type { FindMonthlyExpensesFilters } from "../monthlyExpenses/monthlyExpenses.types";
import type {
    MonthlySummaryFilters,
    PeriodSummaryFilters,
    YearlySummaryFilters
} from "../queries/queries.types";

export const financialQueryKeys = {
    all: ["financial"] as const,
    categories: {
        all: ["financial", "categories"] as const,
        list: (filters?: FindCategoryFilters) =>
            ["financial", "categories", "list", filters ?? null] as const
    },
    transactions: {
        all: ["financial", "transactions"] as const,
        paginated: (filters: PaginatedTransactionsFilters) =>
            ["financial", "transactions", "paginated", filters] as const,
        filtered: (filters: FindTransactionsByFilters) =>
            ["financial", "transactions", "filtered", filters] as const
    },
    monthlyExpenses: {
        all: ["financial", "monthly-expenses"] as const,
        overview: () => ["financial", "monthly-expenses", "overview"] as const,
        filtered: (filters: FindMonthlyExpensesFilters) =>
            ["financial", "monthly-expenses", "filtered", filters] as const
    },
    queries: {
        all: ["financial", "queries"] as const,
        monthly: (filters: MonthlySummaryFilters) =>
            ["financial", "queries", "monthly", filters] as const,
        yearly: (filters: YearlySummaryFilters) =>
            ["financial", "queries", "yearly", filters] as const,
        period: (filters: PeriodSummaryFilters) =>
            ["financial", "queries", "period", filters] as const
    }
} as const;
