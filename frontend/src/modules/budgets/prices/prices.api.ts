import { api } from "../../../api/axios";
import type { ApiResponse } from "../../../api/api.types";
import type { BudgetPrice, CreateBudgetPriceRequest, FindBudgetPricesFilters, PaginatedBudgetPricesResponse, UpdateBudgetPriceRequest } from "./prices.types";

export async function createBudgetPrice(data: CreateBudgetPriceRequest): Promise<BudgetPrice> {
    const result = await api.post<ApiResponse<BudgetPrice>>("/budgets/prices/create-price", data);
    return result.data.data;
}
export async function updateBudgetPrice(id: string, data: UpdateBudgetPriceRequest): Promise<BudgetPrice> {
    const result = await api.put<ApiResponse<BudgetPrice>>(`/budgets/prices/update-price/${encodeURIComponent(id)}`, data);
    return result.data.data;
}
export async function getBudgetPriceById(id: string): Promise<BudgetPrice> {
    const result = await api.get<ApiResponse<BudgetPrice>>(`/budgets/prices/find-price-by-id/${encodeURIComponent(id)}`);
    return result.data.data;
}
export async function findBudgetPrices(filters: FindBudgetPricesFilters): Promise<PaginatedBudgetPricesResponse> {
    const result = await api.get<ApiResponse<PaginatedBudgetPricesResponse>>("/budgets/prices/find-price-by-filters", { params: filters });
    return result.data.data;
}
export async function deleteBudgetPrice(id: string): Promise<void> {
    await api.delete(`/budgets/prices/delete-price/${encodeURIComponent(id)}`);
}
