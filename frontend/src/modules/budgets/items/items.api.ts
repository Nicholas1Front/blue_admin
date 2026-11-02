import { api } from "../../../api/axios";
import type { ApiResponse } from "../../../api/api.types";
import type {
    BudgetItem, BudgetItemDeleteResponse, BudgetItemMutationResponse, CreateBudgetItemRequest,
    FindBudgetItemsFilters, PaginatedBudgetItemsResponse, UpdateBudgetItemRequest
} from "./items.types";

export async function createBudgetItem(budgetId: string, data: CreateBudgetItemRequest): Promise<BudgetItemMutationResponse> {
    const result = await api.post<ApiResponse<BudgetItemMutationResponse>>(
        `/budgets/items/create-item/${encodeURIComponent(budgetId)}`, data
    );
    return result.data.data;
}
export async function updateBudgetItem(id: string, data: UpdateBudgetItemRequest): Promise<BudgetItemMutationResponse> {
    const result = await api.put<ApiResponse<BudgetItemMutationResponse>>(
        `/budgets/items/update-item/${encodeURIComponent(id)}`, data
    );
    return result.data.data;
}
export async function getBudgetItems(budgetId: string): Promise<BudgetItem[]> {
    const result = await api.get<ApiResponse<BudgetItem[]>>(
        `/budgets/items/find-items-by-budget/${encodeURIComponent(budgetId)}`
    );
    return result.data.data;
}
export async function findBudgetItems(filters: FindBudgetItemsFilters): Promise<PaginatedBudgetItemsResponse> {
    const result = await api.get<ApiResponse<PaginatedBudgetItemsResponse>>(
        "/budgets/items/find-items-by-filters", { params: filters }
    );
    return result.data.data;
}
export async function deleteBudgetItem(id: string): Promise<BudgetItemDeleteResponse> {
    const result = await api.delete<ApiResponse<BudgetItemDeleteResponse>>(
        `/budgets/items/delete-item/${encodeURIComponent(id)}`
    );
    return result.data.data;
}
