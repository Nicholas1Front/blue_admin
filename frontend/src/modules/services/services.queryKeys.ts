import type {
    FindServicesByFilters,
    ServiceDashboardFilters
} from "./services.types";

export const servicesQueryKeys = {
    all: ["services"] as const,
    queries: {
        all: ["services", "queries"] as const,
        dashboard: (filters: ServiceDashboardFilters) =>
            ["services", "queries", "dashboard", filters] as const,
        filtered: (filters: FindServicesByFilters) =>
            ["services", "queries", "filtered", filters] as const,
        details: (serviceId: string | undefined) =>
            ["services", "queries", "details", serviceId ?? null] as const
    }
} as const;
