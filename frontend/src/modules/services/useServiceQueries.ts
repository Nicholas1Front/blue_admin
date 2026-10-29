import { useQuery } from "@tanstack/react-query";

import { servicesQueryKeys } from "./services.queryKeys";
import {
    findServicesByAdvancedFilters,
    findServicesByFilters,
    getServiceById,
    getServiceDashboard
} from "./services.api";
import type {
    FindServicesByAdvancedFilters,
    FindServicesByFilters,
    ServiceDashboardFilters
} from "./services.types";

export function useServiceDashboard(filters: ServiceDashboardFilters) {
    return useQuery({
        queryKey: servicesQueryKeys.queries.dashboard(filters),
        queryFn: () => getServiceDashboard(filters)
    });
}

export function useServicesByFilters(filters: FindServicesByAdvancedFilters) {
    return useQuery({
        queryKey: servicesQueryKeys.queries.filtered(filters),
        queryFn: () => findServicesByAdvancedFilters(filters)
    });
}

export function useServiceList(filters: FindServicesByFilters) {
    return useQuery({
        queryKey: servicesQueryKeys.queries.legacyList(filters),
        queryFn: () => findServicesByFilters(filters)
    });
}

export function useServiceById(serviceId: string | undefined) {
    return useQuery({
        queryKey: servicesQueryKeys.queries.details(serviceId),
        queryFn: () => getServiceById(serviceId!),
        enabled: Boolean(serviceId)
    });
}
