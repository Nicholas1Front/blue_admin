import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { budgetsQueryKeys } from "../budgets.queryKeys";
import {
    activateBudgetCategory, createBudgetCategory, deactivateBudgetCategory,
    findBudgetCategories, getBudgetCategories, updateBudgetCategory
} from "./categories.api";
import type {
    CreateBudgetCategoryRequest, FindBudgetCategoriesFilters, UpdateBudgetCategoryRequest
} from "./categories.types";

export function useBudgetCategories(filters?: FindBudgetCategoriesFilters) {
    const hasFilters = Boolean(filters && Object.keys(filters).length > 0);
    const queryFilters = hasFilters ? filters : undefined;
    return useQuery({
        queryKey: budgetsQueryKeys.categories.list(queryFilters),
        queryFn: () => queryFilters ? findBudgetCategories(queryFilters) : getBudgetCategories()
    });
}
export function useBudgetCategoryMutations() {
    const queryClient = useQueryClient();
    const invalidate = () => queryClient.invalidateQueries({ queryKey: budgetsQueryKeys.categories.all });
    const create = useMutation({ mutationFn: (data: CreateBudgetCategoryRequest) => createBudgetCategory(data), onSuccess: invalidate });
    const update = useMutation({ mutationFn: ({ id, data }: { id: string; data: UpdateBudgetCategoryRequest }) => updateBudgetCategory(id, data), onSuccess: invalidate });
    const activate = useMutation({ mutationFn: activateBudgetCategory, onSuccess: invalidate });
    const deactivate = useMutation({ mutationFn: deactivateBudgetCategory, onSuccess: invalidate });
    return { create, update, activate, deactivate };
}
