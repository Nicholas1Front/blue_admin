import { useQuery } from "@tanstack/react-query";

import { financialQueryKeys } from "../shared/financial.queryKeys";
import {
    getMonthlyFinancialSummary,
    getPeriodFinancialSummary,
    getYearlyFinancialSummary
} from "./queries.api";
import type {
    MonthlySummaryFilters,
    PeriodSummaryFilters,
    YearlySummaryFilters
} from "./queries.types";

export function useMonthlyFinancialSummary(filters: MonthlySummaryFilters) {
    return useQuery({
        queryKey: financialQueryKeys.queries.monthly(filters),
        queryFn: () => getMonthlyFinancialSummary(filters)
    });
}

export function useYearlyFinancialSummary(filters: YearlySummaryFilters) {
    return useQuery({
        queryKey: financialQueryKeys.queries.yearly(filters),
        queryFn: () => getYearlyFinancialSummary(filters)
    });
}

export function usePeriodFinancialSummary(filters: PeriodSummaryFilters) {
    return useQuery({
        queryKey: financialQueryKeys.queries.period(filters),
        queryFn: () => getPeriodFinancialSummary(filters)
    });
}
