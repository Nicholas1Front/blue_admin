import { useQuery } from "@tanstack/react-query";

import { financialQueryKeys } from "../shared/financial.queryKeys";
import {
    findMonthlyExpenses,
    getMonthlyExpensesOverview
} from "./monthlyExpenses.api";
import type { FindMonthlyExpensesFilters } from "./monthlyExpenses.types";

export function useMonthlyExpensesOverview() {
    return useQuery({
        queryKey: financialQueryKeys.monthlyExpenses.overview(),
        queryFn: getMonthlyExpensesOverview
    });
}

export function useMonthlyExpensesByFilters(filters: FindMonthlyExpensesFilters) {
    const hasFilters = Object.values(filters).some((value) => value !== undefined);

    return useQuery({
        queryKey: financialQueryKeys.monthlyExpenses.filtered(filters),
        queryFn: () => findMonthlyExpenses(filters),
        enabled: hasFilters
    });
}
