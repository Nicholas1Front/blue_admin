import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
    createVehicle,
    deleteVehicle,
    updateVehicle,
    updateVehicleOdometer,
    createVehicleHistory,
    deleteVehicleHistory,
    updateVehicleHistory,
    findVehiclesByFilters,
    getVehicleDashboard,
    getVehicleWithHistoryByPeriod
} from "./vehicles.api";
import { vehiclesQueryKeys } from "./vehicles.queryKeys";
import type {
    CreateVehicleHistoryRequest,
    CreateVehicleRequest,
    FindVehicleHistoryByPeriodFilters,
    FindVehiclesByFilters,
    UpdateVehicleHistoryRequest,
    UpdateVehicleOdometerRequest,
    UpdateVehicleRequest,
    VehicleDashboardFilters
} from "./vehicles.types";

export function useVehicleDashboard(filters: VehicleDashboardFilters = {}) {
    return useQuery({
        queryKey: vehiclesQueryKeys.queries.dashboard(filters),
        queryFn: () => getVehicleDashboard(filters)
    });
}

export function useVehiclesByFilters(
    filters: FindVehiclesByFilters,
    enabled = true
) {
    const hasSearchFilters = Object.keys(filters).some(
        key => key !== "page" && key !== "limit"
    );

    return useQuery({
        queryKey: vehiclesQueryKeys.queries.filtered(filters),
        queryFn: () => findVehiclesByFilters(filters),
        enabled: enabled && hasSearchFilters
    });
}

export function useVehicleWithHistoryByPeriod(
    vehicleId: string | undefined,
    filters: FindVehicleHistoryByPeriodFilters | undefined
) {
    return useQuery({
        queryKey: vehiclesQueryKeys.queries.historyByPeriod(vehicleId, filters),
        queryFn: () => getVehicleWithHistoryByPeriod(vehicleId!, filters!),
        enabled: Boolean(vehicleId && filters?.startDate && filters?.endDate)
    });
}

export function useVehicleMutations() {
    const queryClient = useQueryClient();
    const invalidate = () => queryClient.invalidateQueries({ queryKey: vehiclesQueryKeys.all });

    const create = useMutation({
        mutationFn: (data: CreateVehicleRequest) => createVehicle(data),
        onSuccess: invalidate
    });

    const update = useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateVehicleRequest }) =>
            updateVehicle(id, data),
        onSuccess: invalidate
    });

    const updateOdometer = useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateVehicleOdometerRequest }) =>
            updateVehicleOdometer(id, data),
        onSuccess: invalidate
    });

    const remove = useMutation({
        mutationFn: deleteVehicle,
        onSuccess: invalidate
    });

    return { create, update, updateOdometer, remove };
}

export function useVehicleHistoryMutations() {
    const queryClient = useQueryClient();
    const invalidate = () => queryClient.invalidateQueries({ queryKey: vehiclesQueryKeys.all });

    const create = useMutation({
        mutationFn: ({ vehicleId, data }: {
            vehicleId: string;
            data: CreateVehicleHistoryRequest;
        }) => createVehicleHistory(vehicleId, data),
        onSuccess: invalidate
    });

    const update = useMutation({
        mutationFn: ({ historyId, data }: {
            historyId: string;
            data: UpdateVehicleHistoryRequest;
        }) => updateVehicleHistory(historyId, data),
        onSuccess: invalidate
    });

    const remove = useMutation({
        mutationFn: deleteVehicleHistory,
        onSuccess: invalidate
    });

    return { create, update, remove };
}
