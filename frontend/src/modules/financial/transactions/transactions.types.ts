import type { FinancialNumericValue, FinancialType } from "../shared/financial.types";

export interface FinancialTransaction {
    id: string;
    description: string;
    value: FinancialNumericValue;
    type: FinancialType;
    categoryId: string;
    referenceDate: string;
    originType: string | null;
    originId: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface FinancialTransactionListItem extends FinancialTransaction {
    categoryName: string;
}

export interface CreateTransactionRequest {
    categoryId: string;
    description: string;
    value: number;
    referenceDate: string;
    originId?: string | null;
    originType?: string | null;
}

export interface UpdateTransactionRequest {
    categoryId?: string;
    description?: string;
    value?: number;
    referenceDate?: string;
    originId?: string | null;
    originType?: string | null;
}

export interface FindTransactionsByFilters {
    id?: string;
    categoryId?: string;
    description?: string;
    value?: number;
    type?: FinancialType;
    referenceDate?: string;
    originId?: string | null;
    originType?: string | null;
}

export interface PaginatedTransactionsFilters {
    year: number;
    month: number;
    page?: number;
    limit?: number;
    categoryId?: string;
    type?: FinancialType;
    description?: string;
}

export interface PaginatedTransactionsResponse {
    transactions: FinancialTransactionListItem[];
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}
