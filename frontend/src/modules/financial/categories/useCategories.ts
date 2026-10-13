import { useQuery } from "@tanstack/react-query";

import { financialQueryKeys } from "../shared/financial.queryKeys";
import {
    findCategories,
    getCategories
} from "./categories.api";
import type { FindCategoryFilters } from "./categories.types";

export function useCategories(filters?: FindCategoryFilters) {
    const hasFilters = Boolean(filters && Object.keys(filters).length > 0);
    const queryFilters = hasFilters ? filters : undefined;

    return useQuery({
        queryKey: financialQueryKeys.categories.list(queryFilters),
        queryFn: () => queryFilters
            ? findCategories(queryFilters)
            : getCategories()
    });
}
