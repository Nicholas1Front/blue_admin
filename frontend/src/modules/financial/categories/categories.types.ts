import type { FinancialType } from "../shared/financial.types";

export interface FinancialCategory {
    id: string;
    name: string;
    description: string | null;
    type: FinancialType;
    active: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CreateCategoryRequest {
    name: string;
    description?: string | null;
    type: FinancialType;
}

export interface UpdateCategoryRequest {
    name?: string;
    description?: string | null;
    type?: FinancialType;
}

export interface FindCategoryFilters {
    id?: string;
    name?: string;
    description?: string | null;
    type?: FinancialType;
    active?: boolean;
}
