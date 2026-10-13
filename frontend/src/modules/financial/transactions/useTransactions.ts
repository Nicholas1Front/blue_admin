import { useQuery } from "@tanstack/react-query";

import { financialQueryKeys } from "../shared/financial.queryKeys";
import {
    findTransactionsByFilters,
    findTransactionsPaginated
} from "./transactions.api";
import type {
    FindTransactionsByFilters,
    PaginatedTransactionsFilters
} from "./transactions.types";

export function useTransactions(filters: PaginatedTransactionsFilters) {
    return useQuery({
        queryKey: financialQueryKeys.transactions.paginated(filters),
        queryFn: () => findTransactionsPaginated(filters)
    });
}

export function useTransactionsByFilters(filters: FindTransactionsByFilters) {
    const hasFilters = Object.keys(filters).length > 0;

    return useQuery({
        queryKey: financialQueryKeys.transactions.filtered(filters),
        queryFn: () => findTransactionsByFilters(filters),
        enabled: hasFilters
    });
}
