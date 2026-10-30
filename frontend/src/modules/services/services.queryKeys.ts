import type {
    FindServicesByAdvancedFilters,
    FindServicesByLegacyFilters,
    ServiceDashboardFilters,
    ServiceMetricsFilters,
    ServiceCalendarFilters
} from "./services.types";

export const servicesQueryKeys = {
    all: ["services"] as const,
    queries: {
        all: ["services", "queries"] as const,
        dashboard: (filters: ServiceDashboardFilters) =>
            ["services", "queries", "dashboard", filters] as const,
        metrics: (filters: ServiceMetricsFilters) =>
            ["services", "queries", "metrics", filters] as const,
        calendar: (filters: ServiceCalendarFilters) =>
            ["services", "queries", "calendar", filters] as const,
        legacyList: (filters: FindServicesByLegacyFilters) =>
            ["services", "legacy-list", filters] as const,
        filtered: (filters: FindServicesByAdvancedFilters) =>
            ["services", "queries", "filtered", filters] as const,
        details: (serviceId: string | undefined) =>
            ["services", "queries", "details", serviceId ?? null] as const
    },
    activity: {
        all: ["services", "activity"] as const,
        byService: (serviceId: string | undefined) =>
            ["services", "activity", "by-service", serviceId ?? null] as const,
        filtered: (filters: object) =>
            ["services", "activity", "filtered", filters] as const
    },
    transactions: {
        all: ["services", "transactions"] as const,
        byService: (serviceId: string | undefined) =>
            ["services", "transactions", "by-service", serviceId ?? null] as const,
        available: (filters: object) => ["services", "transactions", "available", filters] as const
    },
    history: {
        byService: (serviceId: string | undefined) =>
            ["services", "history", "by-service", serviceId ?? null] as const
    }
} as const;
