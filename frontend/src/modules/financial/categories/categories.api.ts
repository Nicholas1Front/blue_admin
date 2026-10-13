import { api } from "../../../api/axios";
import type { ApiResponse } from "../../../api/api.types";
import type {
    CreateCategoryRequest,
    FindCategoryFilters,
    FinancialCategory,
    UpdateCategoryRequest
} from "./categories.types";

export async function getCategories(): Promise<FinancialCategory[]> {
    const result = await api.get<ApiResponse<FinancialCategory[]>>(
        "/financial/categories/find-all-categories"
    );

    return result.data.data;
}

export async function findCategories(
    filters: FindCategoryFilters
): Promise<FinancialCategory[]> {
    const result = await api.get<ApiResponse<FinancialCategory[]>>(
        "/financial/categories/find-categories-by-filters",
        { params: filters }
    );

    return result.data.data;
}

export async function createCategory(
    data: CreateCategoryRequest
): Promise<FinancialCategory> {
    const result = await api.post<ApiResponse<FinancialCategory>>(
        "/financial/categories/create-category",
        data
    );

    return result.data.data;
}

export async function updateCategory(
    id: string,
    data: UpdateCategoryRequest
): Promise<FinancialCategory> {
    const result = await api.put<ApiResponse<FinancialCategory>>(
        `/financial/categories/update-category/${id}`,
        data
    );

    return result.data.data;
}

export async function activateCategory(id: string): Promise<FinancialCategory> {
    const result = await api.patch<ApiResponse<FinancialCategory>>(
        `/financial/categories/activate-category/${id}`
    );

    return result.data.data;
}

export async function deactivateCategory(id: string): Promise<FinancialCategory> {
    const result = await api.patch<ApiResponse<FinancialCategory>>(
        `/financial/categories/deactivate-category/${id}`
    );

    return result.data.data;
}
