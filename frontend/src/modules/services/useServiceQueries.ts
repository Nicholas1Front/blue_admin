import { useQuery } from "@tanstack/react-query";

import { servicesQueryKeys } from "./services.queryKeys";
import {
    findServicesByAdvancedFilters,
    findServicesByLegacyFilters,
    getServiceById,
    getServiceDashboard,
    getServiceMetrics,
    getServiceCalendar
} from "./services.api";
import type {
    FindServicesByAdvancedFilters,
    FindServicesByLegacyFilters,
    ServiceDashboardFilters,
    ServiceMetricsFilters,
    ServiceCalendarFilters
} from "./services.types";

export function useServiceDashboard(filters: ServiceDashboardFilters) {
    return useQuery({
        queryKey: servicesQueryKeys.queries.dashboard(filters),
        queryFn: () => getServiceDashboard(filters)
    });
}

export function useServicesByFilters(
    filters: FindServicesByAdvancedFilters,
    enabled = true
) {
    return useQuery({
        queryKey: servicesQueryKeys.queries.filtered(filters),
        queryFn: () => findServicesByAdvancedFilters(filters),
        enabled
    });
}

export function useServiceList(filters: FindServicesByLegacyFilters) {
    return useQuery({
        queryKey: servicesQueryKeys.queries.legacyList(filters),
        queryFn: () => findServicesByLegacyFilters(filters)
    });
}

export function useServiceById(serviceId: string | undefined) {
    return useQuery({
        queryKey: servicesQueryKeys.queries.details(serviceId),
        queryFn: () => getServiceById(serviceId!),
        enabled: Boolean(serviceId)
    });
}


export function useServiceMetrics(filters: ServiceMetricsFilters, enabled = true) {
    return useQuery({
        queryKey: servicesQueryKeys.queries.metrics(filters),
        queryFn: () => getServiceMetrics(filters),
        enabled
    });
}

export function useServiceCalendar(filters: ServiceCalendarFilters, enabled = true) {
    return useQuery({
        queryKey: servicesQueryKeys.queries.calendar(filters),
        queryFn: () => getServiceCalendar(filters),
        enabled
    });
}
