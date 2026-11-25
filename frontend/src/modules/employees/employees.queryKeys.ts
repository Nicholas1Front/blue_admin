import type { FindEmployeesFilters } from "./employees.types";
import type { FindEngagementsFilters } from "./engagements/engagements.types";
import type { FindObligationsFilters } from "./obligations/obligations.types";
import type { FindMovementsFilters, FindEngagementMovementsFilters } from "./movements/movements.types";
import type { EmployeeDashboardFilters, EmployeeSummaryFilters, MonthlyPaymentsFilters, EmployeeHistoryFilters, EmployeeOverviewFilters } from "./queries/queries.types";
export const employeesQueryKeys = {
    all: ["employees"] as const,
    list: (filters: FindEmployeesFilters) => ["employees", "list", filters] as const,
    details: (id: string | undefined) => ["employees", "details", id ?? null] as const,
    engagements: {
        all: ["employees", "engagements"] as const,
        list: (filters: FindEngagementsFilters) => ["employees", "engagements", "list", filters] as const,
        byEmployee: (id: string | undefined) => ["employees", "engagements", "by-employee", id ?? null] as const
    },
    obligations: {
        all: ["employees", "obligations"] as const,
        filtered: (filters: FindObligationsFilters) => ["employees", "obligations", "filtered", filters] as const,
        byEngagement: (id: string | undefined) => ["employees", "obligations", "by-engagement", id ?? null] as const,
        open: (id: string | undefined) => ["employees", "obligations", "open", id ?? null] as const,
        analysis: (id: string | undefined, filters: object | undefined) => ["employees", "obligations", "analysis", id ?? null, filters ?? null] as const
    },
    movements: {
        all: ["employees", "movements"] as const,
        filtered: (filters: FindMovementsFilters) => ["employees", "movements", "filtered", filters] as const,
        byEngagement: (id: string | undefined, filters: FindEngagementMovementsFilters) => ["employees", "movements", "by-engagement", id ?? null, filters] as const,
        details: (engagementId: string | undefined, movementId: string | undefined) => ["employees", "movements", "details", engagementId ?? null, movementId ?? null] as const
    },
    queries: {
        all: ["employees", "queries"] as const,
        dashboard: (filters: EmployeeDashboardFilters) => ["employees", "queries", "dashboard", filters] as const,
        summaries: (filters: EmployeeSummaryFilters) => ["employees", "queries", "summaries", filters] as const,
        financialSummary: (id: string | undefined) => ["employees", "queries", "financial-summary", id ?? null] as const,
        monthlyPayments: (filters: MonthlyPaymentsFilters) => ["employees", "queries", "monthly-payments", filters] as const,
        history: (id: string | undefined, filters: EmployeeHistoryFilters) => ["employees", "queries", "history", id ?? null, filters] as const,
        overview: (id: string | undefined, filters: EmployeeOverviewFilters) => ["employees", "queries", "overview", id ?? null, filters] as const,
        consistency: (id: string | undefined) => ["employees", "queries", "consistency", id ?? null] as const
    }
} as const;
