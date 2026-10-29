import { api } from "../../api/axios";
import type { ApiResponse } from "../../api/api.types";
import type {
    CreateServiceRequest,
    FindServicesByAdvancedFilters,
    FindServicesByAdvancedFiltersResponse,
    FindServicesByFilters,
    FindServicesByLegacyFilters,
    ServiceDashboardFilters,
    ServiceDashboardResponse,
    ServiceDetailsResponse,
    ServiceHistoryEvent,
    ServiceMutationResponse,
    ServiceRecord,
    UpdateServiceRequest,
    UpdateServiceStatusRequest
} from "./services.types";

export async function createService(
    data: CreateServiceRequest
): Promise<ServiceMutationResponse> {
    const result = await api.post<ApiResponse<ServiceMutationResponse>>(
        "/services/create-service",
        data
    );

    return result.data.data;
}

export async function updateService(
    id: string,
    data: UpdateServiceRequest
): Promise<ServiceMutationResponse> {
    const result = await api.put<ApiResponse<ServiceMutationResponse>>(
        `/services/update-service/${encodeURIComponent(id)}`,
        data
    );

    return result.data.data;
}

export async function updateServiceStatus(
    id: string,
    data: UpdateServiceStatusRequest
): Promise<ServiceMutationResponse> {
    const result = await api.patch<ApiResponse<ServiceMutationResponse>>(
        `/services/update-status/${encodeURIComponent(id)}`,
        data
    );

    return result.data.data;
}

/**
 * Legacy service filter endpoint. Unlike the advanced query endpoint, this
 * returns raw Service records and can optionally include history per service.
 */
export async function findServicesByLegacyFilters(
    filters: FindServicesByLegacyFilters
): Promise<Array<ServiceRecord & { history?: ServiceHistoryEvent[] }>> {
    const result = await api.get<ApiResponse<Array<ServiceRecord & { history?: ServiceHistoryEvent[] }>>>(
        "/services/find-services-by-filters",
        { params: filters }
    );

    return result.data.data;
}

export async function deleteService(id: string): Promise<void> {
    await api.delete(`/services/delete-service/${encodeURIComponent(id)}`);
}

export async function getServiceDashboard(
    filters: ServiceDashboardFilters
): Promise<ServiceDashboardResponse> {
    const result = await api.get<ApiResponse<ServiceDashboardResponse>>(
        "/services/queries/dashboard",
        { params: filters }
    );

    return result.data.data;
}

export async function findServicesByFilters(
    filters: FindServicesByFilters
): Promise<FindServicesByAdvancedFiltersResponse> {
    const result = await api.get<ApiResponse<FindServicesByAdvancedFiltersResponse>>(
        "/services/queries/find-services-by-filters",
        { params: filters }
    );

    return result.data.data;
}

export const findServicesByAdvancedFilters = findServicesByFilters;

export async function getServiceById(
    serviceId: string
): Promise<ServiceDetailsResponse> {
    const result = await api.get<ApiResponse<ServiceDetailsResponse>>(
        `/services/queries/find-service-by-id/${encodeURIComponent(serviceId)}`
    );

    return result.data.data;
}
