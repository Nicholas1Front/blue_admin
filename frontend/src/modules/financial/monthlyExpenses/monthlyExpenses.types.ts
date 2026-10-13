import type { FinancialNumericValue } from "../shared/financial.types";

export interface MonthlyExpense {
    id: string;
    name: string;
    description: string | null;
    expectedValue: FinancialNumericValue;
    dueDate: string | null;
    notes: string | null;
    active: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CreateMonthlyExpenseRequest {
    name: string;
    description?: string | null;
    expectedValue: number;
    dueDate?: string | null;
    notes?: string | null;
}

export interface UpdateMonthlyExpenseRequest {
    name?: string;
    description?: string | null;
    expectedValue?: number;
    dueDate?: string | null;
    notes?: string | null;
}

export interface FindMonthlyExpensesFilters {
    id?: string;
    name?: string;
    description?: string | null;
    expectedValue?: number;
    dueDate?: string | null;
    notes?: string | null;
    active?: boolean;
}

export interface MonthlyExpensesGroup {
    number: number;
    sum: number;
    expensesDetails: MonthlyExpense[];
    dayCosts?: number;
    hourCosts?: number;
}

export interface MonthlyExpensesOverview {
    numberExpenses: number;
    totalSum: number;
    activeExpenses: MonthlyExpensesGroup & {
        dayCosts: number;
        hourCosts: number;
    };
    deactiveExpenses: MonthlyExpensesGroup;
}
