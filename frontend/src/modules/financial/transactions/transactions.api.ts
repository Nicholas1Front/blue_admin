import { api } from "../../../api/axios";
import type { ApiResponse } from "../../../api/api.types";
import type {
    CreateTransactionRequest,
    FinancialTransaction,
    FindTransactionsByFilters,
    PaginatedTransactionsFilters,
    PaginatedTransactionsResponse,
    UpdateTransactionRequest
} from "./transactions.types";

export async function createTransaction(
    data: CreateTransactionRequest
): Promise<FinancialTransaction> {
    const result = await api.post<ApiResponse<FinancialTransaction>>(
        "/financial/transactions/create-transaction",
        data
    );

    return result.data.data;
}

export async function updateTransaction(
    id: string,
    data: UpdateTransactionRequest
): Promise<FinancialTransaction> {
    const result = await api.put<ApiResponse<FinancialTransaction>>(
        `/financial/transactions/update-transaction/${id}`,
        data
    );

    return result.data.data;
}

export async function findTransactionsPaginated(
    filters: PaginatedTransactionsFilters
): Promise<PaginatedTransactionsResponse> {
    const result = await api.get<ApiResponse<PaginatedTransactionsResponse>>(
        "/financial/transactions/find-transactions-paginated",
        { params: filters }
    );

    return result.data.data;
}

export async function findTransactionsByFilters(
    filters: FindTransactionsByFilters
): Promise<FinancialTransaction[]> {
    const result = await api.get<ApiResponse<FinancialTransaction[]>>(
        "/financial/transactions/find-transactions-by-filters",
        { params: filters }
    );

    return result.data.data;
}

export async function deleteTransaction(id: string): Promise<void> {
    await api.delete(
        `/financial/transactions/delete-transaction/${id}`
    );
}
