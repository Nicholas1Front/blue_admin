import { useQuery } from "@tanstack/react-query";
import { employeesQueryKeys } from "../employees.queryKeys";
import { analyzeEmployeeConsistency, findEmployeeEngagementSummaries, findEmployeeHistory, findMonthlyPayments, getEmployeeDashboard, getEmployeeOverview, getEngagementFinancialSummary } from "./queries.api";
import type { EmployeeDashboardFilters, EmployeeHistoryFilters, EmployeeOverviewFilters, EmployeeSummaryFilters, MonthlyPaymentsFilters } from "./queries.types";
export function useEmployeeDashboard(filters: EmployeeDashboardFilters = {}) {
    return useQuery({ queryKey: employeesQueryKeys.queries.dashboard(filters), queryFn: () => getEmployeeDashboard(filters) });
}
export function useEmployeeEngagementSummaries(filters: EmployeeSummaryFilters, enabled = true) {
    return useQuery({ queryKey: employeesQueryKeys.queries.summaries(filters), queryFn: () => findEmployeeEngagementSummaries(filters), enabled });
}
export function useEngagementFinancialSummary(engagementId: string | undefined) {
    return useQuery({ queryKey: employeesQueryKeys.queries.financialSummary(engagementId), queryFn: () => getEngagementFinancialSummary(engagementId!), enabled: Boolean(engagementId) });
}
export function useMonthlyEmployeePayments(filters: MonthlyPaymentsFilters, enabled = true) {
    return useQuery({ queryKey: employeesQueryKeys.queries.monthlyPayments(filters), queryFn: () => findMonthlyPayments(filters), enabled });
}
export function useEmployeeHistory(employeeId: string | undefined, filters: EmployeeHistoryFilters = {}, enabled = true) {
    return useQuery({ queryKey: employeesQueryKeys.queries.history(employeeId, filters), queryFn: () => findEmployeeHistory(employeeId!, filters), enabled: Boolean(employeeId && enabled) });
}
export function useEmployeeOverview(employeeId: string | undefined, filters: EmployeeOverviewFilters = {}) {
    return useQuery({ queryKey: employeesQueryKeys.queries.overview(employeeId, filters), queryFn: () => getEmployeeOverview(employeeId!, filters), enabled: Boolean(employeeId) });
}
export function useEmployeeConsistencyAnalysis(employeeId: string | undefined, enabled = false) {
    return useQuery({ queryKey: employeesQueryKeys.queries.consistency(employeeId), queryFn: () => analyzeEmployeeConsistency(employeeId!), enabled: Boolean(employeeId && enabled) });
}
