import { useMutation, useQueryClient } from "@tanstack/react-query";

import { financialQueryKeys } from "../shared/financial.queryKeys";
import {
    activateMonthlyExpense,
    createMonthlyExpense,
    deactivateMonthlyExpense,
    deleteMonthlyExpense,
    updateMonthlyExpense
} from "./monthlyExpenses.api";
import type {
    CreateMonthlyExpenseRequest,
    UpdateMonthlyExpenseRequest
} from "./monthlyExpenses.types";

export function useMonthlyExpenseMutations() {
    const queryClient = useQueryClient();

    const invalidateExpenses = async () => {
        await queryClient.invalidateQueries({
            queryKey: financialQueryKeys.monthlyExpenses.all
        });
    };

    const create = useMutation({
        mutationFn: (data: CreateMonthlyExpenseRequest) => createMonthlyExpense(data),
        onSuccess: invalidateExpenses
    });

    const update = useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateMonthlyExpenseRequest }) =>
            updateMonthlyExpense(id, data),
        onSuccess: invalidateExpenses
    });

    const activate = useMutation({
        mutationFn: (id: string) => activateMonthlyExpense(id),
        onSuccess: invalidateExpenses
    });

    const deactivate = useMutation({
        mutationFn: (id: string) => deactivateMonthlyExpense(id),
        onSuccess: invalidateExpenses
    });

    const remove = useMutation({
        mutationFn: (id: string) => deleteMonthlyExpense(id),
        onSuccess: invalidateExpenses
    });

    return { create, update, activate, deactivate, remove };
}
