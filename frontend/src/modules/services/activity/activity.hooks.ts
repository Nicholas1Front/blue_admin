import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { servicesQueryKeys } from "../services.queryKeys";
import {
    addServiceActivity,
    deleteServiceActivity,
    findServiceActivitiesByFilters,
    getServiceActivities,
    updateServiceActivity
} from "./activity.api";
import type {
    CreateServiceActivityRequest,
    FindServiceActivitiesFilters,
    UpdateServiceActivityRequest
} from "./activity.types";

export function useServiceActivities(serviceId: string | undefined) {
    return useQuery({
        queryKey: servicesQueryKeys.activity.byService(serviceId),
        queryFn: () => getServiceActivities(serviceId!),
        enabled: Boolean(serviceId)
    });
}

export function useServiceActivitiesByFilters(filters: FindServiceActivitiesFilters) {
    return useQuery({
        queryKey: servicesQueryKeys.activity.filtered(filters),
        queryFn: () => findServiceActivitiesByFilters(filters)
    });
}

export function useAddServiceActivity() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ serviceId, data }: { serviceId: string; data: CreateServiceActivityRequest }) =>
            addServiceActivity(serviceId, data),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: servicesQueryKeys.all });
        }
    });
}

export function useUpdateServiceActivity() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ activityId, data }: { activityId: string; data: UpdateServiceActivityRequest }) =>
            updateServiceActivity(activityId, data),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: servicesQueryKeys.all });
        }
    });
}

export function useDeleteServiceActivity() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteServiceActivity,
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: servicesQueryKeys.all });
        }
    });
}
