export interface BudgetCategory {
    id: string; name: string; description: string | null; isActive: boolean;
    createdAt: string; updatedAt: string;
}
export interface CreateBudgetCategoryRequest { name: string; description?: string | null; }
export interface UpdateBudgetCategoryRequest { name?: string; description?: string | null; }
export interface FindBudgetCategoriesFilters {
    id?: string; name?: string; description?: string; isActive?: boolean;
    createdAtFrom?: string; createdAtTo?: string; updatedAtFrom?: string; updatedAtTo?: string;
    page?: number; limit?: number;
}
export interface PaginatedBudgetCategoriesResponse {
    categories: BudgetCategory[]; page: number; limit: number; total: number; totalPages: number;
}
