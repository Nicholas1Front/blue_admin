import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { budgetsQueryKeys } from "../budgets.queryKeys";
import { createBudgetPrice, deleteBudgetPrice, findBudgetPrices, getBudgetPriceById, updateBudgetPrice } from "./prices.api";
import type { CreateBudgetPriceRequest, FindBudgetPricesFilters, UpdateBudgetPriceRequest } from "./prices.types";

export function useBudgetPricesByFilters(filters: FindBudgetPricesFilters, enabled = true) {
    return useQuery({
        queryKey: budgetsQueryKeys.prices.filtered(filters),
        queryFn: () => findBudgetPrices(filters),
        enabled
    });
}
export function useBudgetPriceById(id: string | undefined) {
    return useQuery({
        queryKey: budgetsQueryKeys.prices.byId(id),
        queryFn: () => getBudgetPriceById(id!),
        enabled: Boolean(id)
    });
}
export function useBudgetPriceMutations() {
    const queryClient = useQueryClient();
    const invalidate = () => queryClient.invalidateQueries({ queryKey: budgetsQueryKeys.prices.all });
    const create = useMutation({ mutationFn: (data: CreateBudgetPriceRequest) => createBudgetPrice(data), onSuccess: invalidate });
    const update = useMutation({ mutationFn: ({ id, data }: { id: string; data: UpdateBudgetPriceRequest }) => updateBudgetPrice(id, data), onSuccess: invalidate });
    const remove = useMutation({ mutationFn: deleteBudgetPrice, onSuccess: invalidate });
    return { create, update, remove };
}
