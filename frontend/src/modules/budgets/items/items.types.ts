import type { BudgetNumericValue } from "../budgets.types";
export interface BudgetItem {
    id: string; budgetId: string; title: string; description: string | null; categoryId: string;
    quantity: BudgetNumericValue; unitValue: BudgetNumericValue; totalAmount: BudgetNumericValue;
    discount: BudgetNumericValue; createdAt: string; updatedAt: string;
    category?: { id: string; name: string; description: string | null; isActive: boolean };
}
export interface CreateBudgetItemRequest {
    title: string; description?: string | null; categoryId: string;
    quantity: number; unitValue: number; discount?: number;
}
export interface UpdateBudgetItemRequest {
    title?: string; description?: string | null; categoryId?: string;
    quantity?: number; unitValue?: number; discount?: number;
}
export interface FindBudgetItemsFilters {
    id?: string; budgetId?: string; title?: string; description?: string; categoryId?: string;
    quantityMin?: number; quantityMax?: number; unitValueMin?: number; unitValueMax?: number;
    totalAmountMin?: number; totalAmountMax?: number; discountMin?: number; discountMax?: number;
    createdAtFrom?: string; createdAtTo?: string; updatedAtFrom?: string; updatedAtTo?: string;
    page?: number; limit?: number;
}
export interface BudgetTotals { totalAmount: BudgetNumericValue; globalDiscount: BudgetNumericValue; finalAmount: BudgetNumericValue; }
export interface BudgetItemMutationResponse { item: BudgetItem; totals: BudgetTotals; }
export interface BudgetItemDeleteResponse { totals: BudgetTotals; }
export interface PaginatedBudgetItemsResponse { items: BudgetItem[]; page: number; limit: number; total: number; totalPages: number; }
