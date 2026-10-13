import { api } from "../../../api/axios";
import type { ApiResponse } from "../../../api/api.types";
import type {
    MonthlyFinancialSummary,
    MonthlySummaryFilters,
    PeriodFinancialSummary,
    PeriodSummaryFilters,
    YearlyFinancialSummary,
    YearlySummaryFilters
} from "./queries.types";

export async function getMonthlyFinancialSummary(
    filters: MonthlySummaryFilters
): Promise<MonthlyFinancialSummary> {
    const result = await api.get<ApiResponse<MonthlyFinancialSummary>>(
        "/financial/queries/monthly-summary",
        { params: filters }
    );

    return result.data.data;
}

export async function getYearlyFinancialSummary(
    filters: YearlySummaryFilters
): Promise<YearlyFinancialSummary> {
    const result = await api.get<ApiResponse<YearlyFinancialSummary>>(
        "/financial/queries/yearly-summary",
        { params: filters }
    );

    return result.data.data;
}

export async function getPeriodFinancialSummary(
    filters: PeriodSummaryFilters
): Promise<PeriodFinancialSummary> {
    const result = await api.get<ApiResponse<PeriodFinancialSummary>>(
        "/financial/queries/period-summary",
        { params: filters }
    );

    return result.data.data;
}
