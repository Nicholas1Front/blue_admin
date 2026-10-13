import { useMutation, useQueryClient } from "@tanstack/react-query";

import { financialQueryKeys } from "../shared/financial.queryKeys";
import {
    createTransaction,
    deleteTransaction,
    updateTransaction
} from "./transactions.api";
import type {
    CreateTransactionRequest,
    UpdateTransactionRequest
} from "./transactions.types";

export function useTransactionMutations() {
    const queryClient = useQueryClient();

    const invalidateFinancialData = async () => {
        await Promise.all([
            queryClient.invalidateQueries({ queryKey: financialQueryKeys.transactions.all }),
            queryClient.invalidateQueries({ queryKey: financialQueryKeys.queries.all })
        ]);
    };

    const create = useMutation({
        mutationFn: (data: CreateTransactionRequest) => createTransaction(data),
        onSuccess: invalidateFinancialData
    });

    const update = useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateTransactionRequest }) =>
            updateTransaction(id, data),
        onSuccess: invalidateFinancialData
    });

    const remove = useMutation({
        mutationFn: (id: string) => deleteTransaction(id),
        onSuccess: invalidateFinancialData
    });

    return { create, update, remove };
}
