import { useMutation, useQueryClient } from "@tanstack/react-query";
import { budgetsQueryKeys } from "./budgets.queryKeys";
import { createBudget, createBudgetFromService, deleteBudget, updateBudget } from "./budgets.api";
import type { CreateBudgetFromServiceRequest, CreateBudgetRequest, UpdateBudgetRequest } from "./budgets.types";

export function useBudgetMutations() {
    const queryClient = useQueryClient();
    const invalidate = () => queryClient.invalidateQueries({ queryKey: budgetsQueryKeys.all });

    const create = useMutation({
        mutationFn: (data: CreateBudgetRequest) => createBudget(data),
        onSuccess: invalidate
    });
    const createFromService = useMutation({
        mutationFn: (data: CreateBudgetFromServiceRequest) => createBudgetFromService(data),
        onSuccess: invalidate
    });
    const update = useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateBudgetRequest }) => updateBudget(id, data),
        onSuccess: invalidate
    });
    const remove = useMutation({
        mutationFn: (id: string) => deleteBudget(id),
        onSuccess: invalidate
    });

    return { create, createFromService, update, remove };
}
