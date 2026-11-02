import { api } from "../../api/axios";
import type { ApiResponse } from "../../api/api.types";
import type {
    BudgetRecord, CreateBudgetFromServiceRequest, CreateBudgetRequest,
    FindBudgetsFilters, PaginatedBudgetsResponse, UpdateBudgetRequest
} from "./budgets.types";

export async function createBudget(data: CreateBudgetRequest): Promise<BudgetRecord> {
    const result = await api.post<ApiResponse<BudgetRecord>>("/budgets/create-budget", data);
    return result.data.data;
}

export async function createBudgetFromService(
    data: CreateBudgetFromServiceRequest
): Promise<BudgetRecord> {
    const result = await api.post<ApiResponse<BudgetRecord>>("/budgets/create-budget-from-service", data);
    return result.data.data;
}

export async function updateBudget(id: string, data: UpdateBudgetRequest): Promise<BudgetRecord> {
    const result = await api.put<ApiResponse<BudgetRecord>>(
        `/budgets/update-budget/${encodeURIComponent(id)}`, data
    );
    return result.data.data;
}

export async function findBudgetsByFilters(
    filters: FindBudgetsFilters
): Promise<PaginatedBudgetsResponse> {
    const result = await api.get<ApiResponse<PaginatedBudgetsResponse>>(
        "/budgets/find-budgets-by-filters", { params: filters }
    );
    return result.data.data;
}

export async function deleteBudget(id: string): Promise<void> {
    await api.delete(`/budgets/delete-budget/${encodeURIComponent(id)}`);
}
