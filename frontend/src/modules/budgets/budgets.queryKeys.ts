import type { FindBudgetsFilters } from "./budgets.types";
import type {
    BudgetDashboardFilters, BudgetMetricsFilters, FindBudgetsByAdvancedFilters
} from "./queries/queries.types";

export const budgetsQueryKeys = {
    all: ["budgets"] as const,
    list: (filters?: FindBudgetsFilters) => ["budgets", "list", filters ?? null] as const,
    queries: {
        all: ["budgets", "queries"] as const,
        dashboard: (filters: BudgetDashboardFilters) => ["budgets", "queries", "dashboard", filters] as const,
        metrics: (filters: BudgetMetricsFilters) => ["budgets", "queries", "metrics", filters] as const,
        filtered: (filters: FindBudgetsByAdvancedFilters) => ["budgets", "queries", "filtered", filters] as const,
        details: (id: string | undefined) => ["budgets", "queries", "details", id ?? null] as const
    },
    items: {
        all: ["budgets", "items"] as const,
        byBudget: (budgetId: string | undefined) => ["budgets", "items", "by-budget", budgetId ?? null] as const,
        filtered: (filters: object) => ["budgets", "items", "filtered", filters] as const
    },
    categories: {
        all: ["budgets", "categories"] as const,
        list: (filters?: object) => ["budgets", "categories", "list", filters ?? null] as const
    },
    prices: {
        all: ["budgets", "prices"] as const,
        byId: (id: string | undefined) => ["budgets", "prices", "details", id ?? null] as const,
        filtered: (filters: object) => ["budgets", "prices", "filtered", filters] as const
    }
} as const;
