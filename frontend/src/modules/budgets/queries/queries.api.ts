import { api } from "../../../api/axios";
import type { ApiResponse } from "../../../api/api.types";
import type {
    BudgetDashboardFilters, BudgetDashboardResponse, BudgetMetricsFilters,
    BudgetMetricsResponse, BudgetDetailsResponse, FindBudgetsByAdvancedFilters,
    FindBudgetsByAdvancedFiltersResponse
} from "./queries.types";

export async function getBudgetDashboard(filters: BudgetDashboardFilters): Promise<BudgetDashboardResponse> {
    const result = await api.get<ApiResponse<BudgetDashboardResponse>>("/budgets/queries/dashboard", { params: filters });
    return result.data.data;
}
export async function getBudgetMetrics(filters: BudgetMetricsFilters): Promise<BudgetMetricsResponse> {
    const result = await api.get<ApiResponse<BudgetMetricsResponse>>("/budgets/queries/metrics", { params: filters });
    return result.data.data;
}
export async function findBudgetsByAdvancedFilters(
    filters: FindBudgetsByAdvancedFilters
): Promise<FindBudgetsByAdvancedFiltersResponse> {
    const result = await api.get<ApiResponse<FindBudgetsByAdvancedFiltersResponse>>(
        "/budgets/queries/find-budgets-by-filters", { params: filters }
    );
    return result.data.data;
}
export async function getBudgetById(id: string): Promise<BudgetDetailsResponse> {
    const result = await api.get<ApiResponse<BudgetDetailsResponse>>(
        `/budgets/queries/find-budget-by-id/${encodeURIComponent(id)}`
    );
    return result.data.data;
}
