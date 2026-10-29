import { api } from "../../../api/axios";
import type { ApiResponse } from "../../../api/api.types";
import type {
    CreateServiceActivityRequest,
    FindServiceActivitiesFilters,
    ServiceActivitiesByFiltersGroup,
    ServiceActivitiesByServiceResponse,
    ServiceActivityMutationResponse,
    UpdateServiceActivityRequest
} from "./activity.types";

export async function addServiceActivity(
    serviceId: string,
    data: CreateServiceActivityRequest
): Promise<ServiceActivityMutationResponse> {
    const result = await api.post<ApiResponse<ServiceActivityMutationResponse>>(
        `/services/activity/add-activity/${encodeURIComponent(serviceId)}`,
        data
    );

    return result.data.data;
}

export async function updateServiceActivity(
    activityId: string,
    data: UpdateServiceActivityRequest
): Promise<ServiceActivityMutationResponse> {
    const result = await api.put<ApiResponse<ServiceActivityMutationResponse>>(
        `/services/activity/update-activity/${encodeURIComponent(activityId)}`,
        data
    );

    return result.data.data;
}

export async function getServiceActivities(
    serviceId: string
): Promise<ServiceActivitiesByServiceResponse> {
    const result = await api.get<ApiResponse<ServiceActivitiesByServiceResponse>>(
        `/services/activity/find-activities-by-service/${encodeURIComponent(serviceId)}`
    );

    return result.data.data;
}

export async function findServiceActivitiesByFilters(
    filters: FindServiceActivitiesFilters
): Promise<ServiceActivitiesByFiltersGroup[]> {
    const result = await api.get<ApiResponse<ServiceActivitiesByFiltersGroup[]>>(
        "/services/activity/find-activities-by-filters",
        { params: filters }
    );

    return result.data.data;
}

export async function deleteServiceActivity(activityId: string): Promise<void> {
    await api.delete(
        `/services/activity/delete-activity/${encodeURIComponent(activityId)}`
    );
}
