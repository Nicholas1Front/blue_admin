import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { servicesQueryKeys } from "../services.queryKeys";
import {
    getServiceTransactions,
    linkTitheTransaction,
    linkTransactionToService,
    unlinkTitheTransaction,
    unlinkTransactionFromService
} from "./transactions.api";
import type { LinkServiceTransactionRequest } from "./transactions.types";

export function useServiceTransactions(serviceId: string | undefined) {
    return useQuery({
        queryKey: servicesQueryKeys.transactions.byService(serviceId),
        queryFn: () => getServiceTransactions(serviceId!),
        enabled: Boolean(serviceId)
    });
}

export function useLinkTransactionToService() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ serviceId, data }: { serviceId: string; data: LinkServiceTransactionRequest }) =>
            linkTransactionToService(serviceId, data),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: servicesQueryKeys.all });
        }
    });
}

export function useUnlinkTransactionFromService() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ transactionId }: { transactionId: string }) =>
            unlinkTransactionFromService(transactionId),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: servicesQueryKeys.all });
        }
    });
}

export function useLinkTitheTransaction() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ transactionId, serviceId }: { transactionId: string; serviceId: string }) =>
            linkTitheTransaction(transactionId, serviceId),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: servicesQueryKeys.all });
        }
    });
}

export function useUnlinkTitheTransaction() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ transactionId, serviceId }: { transactionId: string; serviceId: string }) =>
            unlinkTitheTransaction(transactionId, serviceId),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: servicesQueryKeys.all });
        }
    });
}
