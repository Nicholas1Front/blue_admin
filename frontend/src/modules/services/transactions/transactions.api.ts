import { findTransactionsByFilters } from "../../financial/transactions/transactions.api";
import type { FinancialTransactionListItem } from "../../financial/transactions/transactions.types";
import { api } from "../../../api/axios";
import type { ApiResponse } from "../../../api/api.types";
import type {
    LinkServiceTransactionRequest,
    ServiceTitheLinkResponse,
    ServiceTransaction,
    ServiceTransactionLinkResponse,
    UnlinkServiceTransactionResponse
} from "./transactions.types";

export async function linkTransactionToService(
    serviceId: string,
    data: LinkServiceTransactionRequest
): Promise<ServiceTransactionLinkResponse> {
    const result = await api.put<ApiResponse<ServiceTransactionLinkResponse>>(
        `/services/transactions/update-origins/${encodeURIComponent(serviceId)}`,
        data
    );

    return result.data.data;
}

export async function unlinkTransactionFromService(
    transactionId: string
): Promise<UnlinkServiceTransactionResponse> {
    const result = await api.delete<ApiResponse<UnlinkServiceTransactionResponse>>(
        `/services/transactions/remove-origins/${encodeURIComponent(transactionId)}`
    );

    return result.data.data;
}

export async function getServiceTransactions(
    serviceId: string
): Promise<{ service: ServiceTransactionLinkResponse["service"]; transactions: ServiceTransaction[] }> {
    const result = await api.get<ApiResponse<{ service: ServiceTransactionLinkResponse["service"]; transactions: ServiceTransaction[] }>>(
        `/services/transactions/find-all-transactions/${encodeURIComponent(serviceId)}`
    );

    return result.data.data;
}

export async function linkTitheTransaction(
    transactionId: string,
    serviceId: string
): Promise<ServiceTitheLinkResponse> {
    const result = await api.put<ApiResponse<ServiceTitheLinkResponse>>(
        `/services/transactions/update-tithe/${encodeURIComponent(transactionId)}/${encodeURIComponent(serviceId)}`
    );

    return result.data.data;
}

export async function unlinkTitheTransaction(
    transactionId: string,
    serviceId: string
): Promise<ServiceTitheLinkResponse> {
    const result = await api.delete<ApiResponse<ServiceTitheLinkResponse>>(
        `/services/transactions/remove-tithe/${encodeURIComponent(transactionId)}/${encodeURIComponent(serviceId)}`
    );

    return result.data.data;
}


/**
 * The Services backend exposes linking/unlinking operations, but not a separate
 * endpoint for available transactions. Reuse the Financial module API and
 * filter out any transaction already associated with an origin.
 */
export async function findAvailableFinancialTransactions(): Promise<FinancialTransactionListItem[]> {
    const [incomes, expenses] = await Promise.all([
        findTransactionsByFilters({ type: "income" }),
        findTransactionsByFilters({ type: "expense" })
    ]);

    return [...incomes, ...expenses].filter(
        transaction => transaction.originId === null && transaction.originType === null
    );
}
