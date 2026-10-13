import { api } from "../../../api/axios";
import type { ApiResponse } from "../../../api/api.types";
import type {
    CreateMonthlyExpenseRequest,
    FindMonthlyExpensesFilters,
    MonthlyExpense,
    MonthlyExpensesOverview,
    UpdateMonthlyExpenseRequest
} from "./monthlyExpenses.types";

export async function getMonthlyExpensesOverview(): Promise<MonthlyExpensesOverview> {
    const result = await api.get<ApiResponse<MonthlyExpensesOverview>>(
        "/financial/monthly-expenses/find-all-expenses"
    );

    return result.data.data;
}

export async function findMonthlyExpenses(
    filters: FindMonthlyExpensesFilters
): Promise<MonthlyExpense[]> {
    const result = await api.get<ApiResponse<MonthlyExpense[]>>(
        "/financial/monthly-expenses/find-expenses-by-filters",
        { params: filters }
    );

    return result.data.data;
}

export async function createMonthlyExpense(
    data: CreateMonthlyExpenseRequest
): Promise<MonthlyExpense> {
    const result = await api.post<ApiResponse<MonthlyExpense>>(
        "/financial/monthly-expenses/create-expense",
        data
    );

    return result.data.data;
}

export async function updateMonthlyExpense(
    id: string,
    data: UpdateMonthlyExpenseRequest
): Promise<MonthlyExpense> {
    const result = await api.put<ApiResponse<MonthlyExpense>>(
        `/financial/monthly-expenses/update-expense/${id}`,
        data
    );

    return result.data.data;
}

export async function activateMonthlyExpense(id: string): Promise<MonthlyExpense> {
    const result = await api.patch<ApiResponse<MonthlyExpense>>(
        `/financial/monthly-expenses/activate-expense/${id}`
    );

    return result.data.data;
}

export async function deactivateMonthlyExpense(id: string): Promise<MonthlyExpense> {
    const result = await api.patch<ApiResponse<MonthlyExpense>>(
        `/financial/monthly-expenses/deactivate-expense/${id}`
    );

    return result.data.data;
}

export async function deleteMonthlyExpense(id: string): Promise<void> {
    await api.delete(
        `/financial/monthly-expenses/delete-expense/${id}`
    );
}
