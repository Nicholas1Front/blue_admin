import type {
    FindVehicleHistoryByPeriodFilters,
    FindVehiclesByFilters,
    VehicleDashboardFilters
} from "./vehicles.types";

export const vehiclesQueryKeys = {
    all: ["vehicles"] as const,
    queries: {
        all: ["vehicles", "queries"] as const,
        dashboard: (filters: VehicleDashboardFilters) =>
            ["vehicles", "queries", "dashboard", filters] as const,
        filtered: (filters: FindVehiclesByFilters) =>
            ["vehicles", "queries", "filtered", filters] as const,
        historyByPeriod: (
            vehicleId: string | undefined,
            filters: FindVehicleHistoryByPeriodFilters | undefined
        ) => ["vehicles", "queries", "history-by-period", vehicleId ?? null, filters ?? null] as const
    }
} as const;
