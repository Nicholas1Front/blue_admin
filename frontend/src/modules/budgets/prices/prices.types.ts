import type { BudgetNumericValue } from "../budgets.types";
import type { BudgetCategory } from "../categories/categories.types";
export interface BudgetPrice {
    id: string; categoryId: string; title: string; description: string | null;
    unitValue: BudgetNumericValue; createdAt: string; updatedAt: string;
    category: BudgetCategory;
}
export interface CreateBudgetPriceRequest { categoryId: string; title: string; description?: string | null; unitValue: number; }
export interface UpdateBudgetPriceRequest { categoryId?: string; title?: string; description?: string | null; unitValue?: number; }
export interface FindBudgetPricesFilters {
    id?: string; categoryId?: string; title?: string; description?: string;
    unitValueMin?: number; unitValueMax?: number;
    createdAtFrom?: string; createdAtTo?: string; updatedAtFrom?: string; updatedAtTo?: string;
    page?: number; limit?: number;
}
export interface PaginatedBudgetPricesResponse { prices: BudgetPrice[]; page: number; limit: number; total: number; totalPages: number; }
