import { api } from "../../../api/axios";
import type { ApiResponse } from "../../../api/api.types";
import type { EmployeeDashboardFilters, EmployeeDashboardResponse, EmployeeSummaryFilters, EmployeeSummaryResponse, EngagementFinancialSummary, EmployeeHistoryFilters, EmployeeHistoryResponse, EmployeeOverviewFilters, EmployeeOverviewResponse, MonthlyPaymentsFilters, MonthlyPaymentsResponse, ConsistencyAnalysis } from "./queries.types";
export async function getEmployeeDashboard(filters: EmployeeDashboardFilters = {}): Promise<EmployeeDashboardResponse> {
    const response = await api.get<ApiResponse<EmployeeDashboardResponse>>("/employees/queries/dashboard", { params: filters });
    return response.data.data;
}
export async function findEmployeeEngagementSummaries(filters: EmployeeSummaryFilters): Promise<EmployeeSummaryResponse> {
    const response = await api.get<ApiResponse<EmployeeSummaryResponse>>("/employees/queries/find-employee-engagement-summaries", { params: filters });
    return response.data.data;
}
export async function getEngagementFinancialSummary(engagementId: string): Promise<EngagementFinancialSummary> {
    const response = await api.get<ApiResponse<EngagementFinancialSummary>>(`/employees/queries/engagement-financial-summary/${encodeURIComponent(engagementId)}`);
    return response.data.data;
}
export async function findMonthlyPayments(filters: MonthlyPaymentsFilters): Promise<MonthlyPaymentsResponse> {
    const response = await api.get<ApiResponse<MonthlyPaymentsResponse>>("/employees/queries/monthly-payments", { params: filters });
    return response.data.data;
}
export async function findEmployeeHistory(employeeId: string, filters: EmployeeHistoryFilters = {}): Promise<EmployeeHistoryResponse> {
    const response = await api.get<ApiResponse<EmployeeHistoryResponse>>(`/employees/queries/find-employee-history/${encodeURIComponent(employeeId)}`, { params: filters });
    return response.data.data;
}
export async function getEmployeeOverview(employeeId: string, filters: EmployeeOverviewFilters = {}): Promise<EmployeeOverviewResponse> {
    const response = await api.get<ApiResponse<EmployeeOverviewResponse>>(`/employees/queries/find-employee-overview/${encodeURIComponent(employeeId)}`, { params: filters });
    return response.data.data;
}
export async function analyzeEmployeeConsistency(employeeId: string): Promise<ConsistencyAnalysis> {
    const response = await api.get<ApiResponse<ConsistencyAnalysis>>(`/employees/queries/analyze-consistency/${encodeURIComponent(employeeId)}`);
    return response.data.data;
}
