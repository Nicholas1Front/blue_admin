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
