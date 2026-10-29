import { api } from "../../api/axios";
import type { ApiResponse } from "../../api/api.types";
import type {
    FindServicesByFilters,
    FindServicesByFiltersResponse,
    ServiceDashboardFilters,
    ServiceDashboardResponse,
    ServiceDetailsResponse
} from "./services.types";

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
): Promise<FindServicesByFiltersResponse> {
    const result = await api.get<ApiResponse<FindServicesByFiltersResponse>>(
        "/services/queries/find-services-by-filters",
        { params: filters }
    );

    return result.data.data;
}

export async function getServiceById(
    serviceId: string
): Promise<ServiceDetailsResponse> {
    const result = await api.get<ApiResponse<ServiceDetailsResponse>>(
        `/services/queries/find-service-by-id/${encodeURIComponent(serviceId)}`
    );

    return result.data.data;
}
