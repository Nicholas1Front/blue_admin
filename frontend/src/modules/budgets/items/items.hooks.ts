import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { budgetsQueryKeys } from "../budgets.queryKeys";
import { createBudgetItem, deleteBudgetItem, findBudgetItems, getBudgetItems, updateBudgetItem } from "./items.api";
import type { CreateBudgetItemRequest, FindBudgetItemsFilters, UpdateBudgetItemRequest } from "./items.types";

export function useBudgetItems(budgetId: string | undefined) {
    return useQuery({
        queryKey: budgetsQueryKeys.items.byBudget(budgetId),
        queryFn: () => getBudgetItems(budgetId!),
        enabled: Boolean(budgetId)
    });
}
export function useBudgetItemsByFilters(filters: FindBudgetItemsFilters, enabled = true) {
    return useQuery({
        queryKey: budgetsQueryKeys.items.filtered(filters),
        queryFn: () => findBudgetItems(filters),
        enabled
    });
}
export function useBudgetItemMutations() {
    const queryClient = useQueryClient();
    const invalidate = () => queryClient.invalidateQueries({ queryKey: budgetsQueryKeys.all });
    const create = useMutation({
        mutationFn: ({ budgetId, data }: { budgetId: string; data: CreateBudgetItemRequest }) => createBudgetItem(budgetId, data),
        onSuccess: invalidate
    });
    const update = useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateBudgetItemRequest }) => updateBudgetItem(id, data),
        onSuccess: invalidate
    });
    const remove = useMutation({ mutationFn: deleteBudgetItem, onSuccess: invalidate });
    return { create, update, remove };
}
