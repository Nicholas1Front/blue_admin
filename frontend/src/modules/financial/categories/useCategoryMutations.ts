import { useMutation, useQueryClient } from "@tanstack/react-query";

import { financialQueryKeys } from "../shared/financial.queryKeys";
import {
    activateCategory,
    createCategory,
    deactivateCategory,
    updateCategory
} from "./categories.api";
import type {
    CreateCategoryRequest,
    UpdateCategoryRequest
} from "./categories.types";

export function useCategoryMutations() {
    const queryClient = useQueryClient();

    const invalidateRelatedData = async () => {
        await Promise.all([
            queryClient.invalidateQueries({ queryKey: financialQueryKeys.categories.all }),
            queryClient.invalidateQueries({ queryKey: financialQueryKeys.transactions.all }),
            queryClient.invalidateQueries({ queryKey: financialQueryKeys.queries.all })
        ]);
    };

    const create = useMutation({
        mutationFn: (data: CreateCategoryRequest) => createCategory(data),
        onSuccess: invalidateRelatedData
    });

    const update = useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateCategoryRequest }) =>
            updateCategory(id, data),
        onSuccess: invalidateRelatedData
    });

    const activate = useMutation({
        mutationFn: (id: string) => activateCategory(id),
        onSuccess: invalidateRelatedData
    });

    const deactivate = useMutation({
        mutationFn: (id: string) => deactivateCategory(id),
        onSuccess: invalidateRelatedData
    });

    return { create, update, activate, deactivate };
}
