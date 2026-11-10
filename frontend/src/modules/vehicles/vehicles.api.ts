import { api } from "../../api/axios";
import type { ApiResponse } from "../../api/api.types";
import type {
    CreateVehicleHistoryRequest,
    CreateVehicleRequest,
    FindVehicleHistoryByPeriodFilters,
    FindVehiclesByFilters,
    FindVehiclesByFiltersResponse,
    VehicleDashboardFilters,
    VehicleDashboardResponse,
    VehicleHistoryEvent,
    VehicleRecord,
    VehicleWithHistoryByPeriod,
    UpdateVehicleHistoryRequest,
    UpdateVehicleOdometerRequest,
    UpdateVehicleRequest
} from "./vehicles.types";

export async function createVehicle(data: CreateVehicleRequest): Promise<VehicleRecord> {
    const result = await api.post<ApiResponse<VehicleRecord>>("/vehicles/create-vehicle", data);
    return result.data.data;
}

export async function updateVehicle(
    id: string,
    data: UpdateVehicleRequest
): Promise<VehicleRecord> {
    const result = await api.put<ApiResponse<VehicleRecord>>(
        `/vehicles/update-vehicle/${encodeURIComponent(id)}`,
        data
    );
    return result.data.data;
}

export async function updateVehicleOdometer(
    id: string,
    data: UpdateVehicleOdometerRequest
): Promise<VehicleRecord> {
    const result = await api.patch<ApiResponse<VehicleRecord>>(
        `/vehicles/update-odometer/${encodeURIComponent(id)}`,
        data
    );
    return result.data.data;
}

export async function deleteVehicle(id: string): Promise<void> {
    await api.delete(`/vehicles/delete-vehicle/${encodeURIComponent(id)}`);
}

export async function createVehicleHistory(
    vehicleId: string,
    data: CreateVehicleHistoryRequest
): Promise<VehicleHistoryEvent> {
    const result = await api.post<ApiResponse<VehicleHistoryEvent>>(
        `/vehicles/history/${encodeURIComponent(vehicleId)}`,
        data
    );
    return result.data.data;
}

export async function updateVehicleHistory(
    historyId: string,
    data: UpdateVehicleHistoryRequest
): Promise<VehicleHistoryEvent> {
    const result = await api.put<ApiResponse<VehicleHistoryEvent>>(
        `/vehicles/history/${encodeURIComponent(historyId)}`,
        data
    );
    return result.data.data;
}

export async function deleteVehicleHistory(historyId: string): Promise<void> {
    await api.delete(`/vehicles/history/${encodeURIComponent(historyId)}`);
}

export async function getVehicleDashboard(
    filters: VehicleDashboardFilters = {}
): Promise<VehicleDashboardResponse> {
    const result = await api.get<ApiResponse<VehicleDashboardResponse>>(
        "/vehicles/queries/dashboard",
        { params: filters }
    );
    return result.data.data;
}

export async function findVehiclesByFilters(
    filters: FindVehiclesByFilters
): Promise<FindVehiclesByFiltersResponse> {
    const result = await api.get<ApiResponse<FindVehiclesByFiltersResponse>>(
        "/vehicles/queries/find-vehicles-by-filters",
        { params: filters }
    );
    return result.data.data;
}

export async function getVehicleWithHistoryByPeriod(
    vehicleId: string,
    filters: FindVehicleHistoryByPeriodFilters
): Promise<VehicleWithHistoryByPeriod> {
    const result = await api.get<ApiResponse<VehicleWithHistoryByPeriod>>(
        `/vehicles/queries/find-vehicle-with-history/${encodeURIComponent(vehicleId)}`,
        { params: filters }
    );
    return result.data.data;
}
