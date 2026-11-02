import { api } from "../../../api/axios";
import type { ApiResponse } from "../../../api/api.types";
import type {
    BudgetCategory, CreateBudgetCategoryRequest, FindBudgetCategoriesFilters,
    PaginatedBudgetCategoriesResponse, UpdateBudgetCategoryRequest
} from "./categories.types";

export async function getBudgetCategories(): Promise<BudgetCategory[]> {
    const result = await api.get<ApiResponse<BudgetCategory[]>>("/budgets/categories/find-all-categories");
    return result.data.data;
}
export async function findBudgetCategories(filters: FindBudgetCategoriesFilters): Promise<PaginatedBudgetCategoriesResponse> {
    const result = await api.get<ApiResponse<PaginatedBudgetCategoriesResponse>>(
        "/budgets/categories/find-categories-by-filters", { params: filters }
    );
    return result.data.data;
}
export async function createBudgetCategory(data: CreateBudgetCategoryRequest): Promise<BudgetCategory> {
    const result = await api.post<ApiResponse<BudgetCategory>>("/budgets/categories/create-category", data);
    return result.data.data;
}
export async function updateBudgetCategory(id: string, data: UpdateBudgetCategoryRequest): Promise<BudgetCategory> {
    const result = await api.put<ApiResponse<BudgetCategory>>(
        `/budgets/categories/update-category/${encodeURIComponent(id)}`, data
    );
    return result.data.data;
}
export async function activateBudgetCategory(id: string): Promise<BudgetCategory> {
    const result = await api.patch<ApiResponse<BudgetCategory>>(
        `/budgets/categories/activate-category/${encodeURIComponent(id)}`
    );
    return result.data.data;
}
export async function deactivateBudgetCategory(id: string): Promise<BudgetCategory> {
    const result = await api.patch<ApiResponse<BudgetCategory>>(
        `/budgets/categories/deactivate-category/${encodeURIComponent(id)}`
    );
    return result.data.data;
}
