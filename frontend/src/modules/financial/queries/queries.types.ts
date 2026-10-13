import type { FinancialCategorySummary } from "../shared/financial.types";
import type { FinancialTransactionListItem } from "../transactions/transactions.types";

export interface MonthlySummaryFilters {
    year: number;
    month: number;
    limit?: number;
}

export interface YearlySummaryFilters {
    year: number;
}

export interface PeriodSummaryFilters {
    start: string;
    end: string;
    limit?: number;
}

export interface FinancialSummaryTotals {
    incomesValue: number;
    expensesValue: number;
    balanceValue: number;
}

export interface MonthlyFinancialSummary extends FinancialSummaryTotals {
    year: number;
    month: number;
    categories: FinancialCategorySummary[];
    lastTransactions: {
        numberTransactions: number;
        transactions: FinancialTransactionListItem[];
    };
}

export interface YearlyMonthSummary extends FinancialSummaryTotals {
    month: number;
    categories: FinancialCategorySummary[];
}

export interface YearlyFinancialSummary extends FinancialSummaryTotals {
    year: number;
    categories: FinancialCategorySummary[];
    monthsDetails: YearlyMonthSummary[];
}

export interface PeriodFinancialSummary extends FinancialSummaryTotals {
    start: string;
    end: string;
    categories: FinancialCategorySummary[];
    transactions: FinancialTransactionListItem[];
}
