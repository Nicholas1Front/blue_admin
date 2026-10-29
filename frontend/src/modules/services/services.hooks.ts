import { useMutation, useQueryClient } from "@tanstack/react-query";

import { servicesQueryKeys } from "./services.queryKeys";
import {
    createService,
    deleteService,
    updateService,
    updateServiceStatus
} from "./services.api";
import type {
    CreateServiceRequest,
    UpdateServiceRequest,
    UpdateServiceStatusRequest
} from "./services.types";

export function useCreateService() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateServiceRequest) => createService(data),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: servicesQueryKeys.all });
        }
    });
}

export function useUpdateService() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateServiceRequest }) =>
            updateService(id, data),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: servicesQueryKeys.all });
        }
    });
}

export function useUpdateServiceStatus() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateServiceStatusRequest }) =>
            updateServiceStatus(id, data),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: servicesQueryKeys.all });
        }
    });
}

export function useDeleteService() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteService,
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: servicesQueryKeys.all });
        }
    });
}
