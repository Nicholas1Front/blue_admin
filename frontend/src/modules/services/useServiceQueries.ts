import { useQuery } from "@tanstack/react-query";

import { servicesQueryKeys } from "./services.queryKeys";
import {
    findServicesByFilters,
    getServiceById,
    getServiceDashboard
} from "./services.api";
import type {
    FindServicesByFilters,
    ServiceDashboardFilters
} from "./services.types";

export function useServiceDashboard(filters: ServiceDashboardFilters) {
    return useQuery({
        queryKey: servicesQueryKeys.queries.dashboard(filters),
        queryFn: () => getServiceDashboard(filters)
    });
}

export function useServicesByFilters(filters: FindServicesByFilters) {
    return useQuery({
        queryKey: servicesQueryKeys.queries.filtered(filters),
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
