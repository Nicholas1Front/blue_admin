import { useQuery } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import { budgetsQueryKeys } from "./budgets.queryKeys";
import {
    findBudgetsByAdvancedFilters, getBudgetById, getBudgetDashboard, getBudgetMetrics
} from "./queries/queries.api";
import type {
    BudgetDashboardFilters, BudgetMetricsFilters, FindBudgetsByAdvancedFilters
} from "./queries/queries.types";

export function useBudgetDashboard(filters: BudgetDashboardFilters, enabled = true) {
    return useQuery({
        queryKey: budgetsQueryKeys.queries.dashboard(filters),
        queryFn: () => getBudgetDashboard(filters),
        enabled
    });
}
export function useBudgetMetrics(filters: BudgetMetricsFilters, enabled = true) {
    return useQuery({
        queryKey: budgetsQueryKeys.queries.metrics(filters),
        queryFn: () => getBudgetMetrics(filters),
        enabled
    });
}
export function useBudgetsByAdvancedFilters(
    filters: FindBudgetsByAdvancedFilters, enabled = true
) {
    return useQuery({
        queryKey: budgetsQueryKeys.queries.filtered(filters),
        queryFn: () => findBudgetsByAdvancedFilters(filters),
        enabled
    });
}
export function useBudgetById(id: string | undefined) {
    return useQuery({
        queryKey: budgetsQueryKeys.queries.details(id),
        queryFn: () => getBudgetById(id!),
        enabled: Boolean(id)
    });
}
