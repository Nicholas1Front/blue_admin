import { api } from "../../../api/axios";
import type { ApiResponse } from "../../../api/api.types";
import type { CursorPage } from "../employees.types";
import type { AnalyzeObligationsFilters, CreateObligationRequest, CreateObligationsBatchRequest, DeleteObligationWithMovementsRequest, DeleteObligationWithMovementsResponse, EmployeeObligation, FindObligationsFilters, ObligationListItem, OpenObligation, ObligationAnalysis, UpdateObligationRequest } from "./obligations.types";
export async function createObligation(engagementId: string, data: CreateObligationRequest): Promise<EmployeeObligation> {
    const response = await api.post<ApiResponse<EmployeeObligation>>(`/employees/create-obligation/${encodeURIComponent(engagementId)}`, data);
    return response.data.data;
}
export async function createObligationsBatch(engagementId: string, data: CreateObligationsBatchRequest): Promise<EmployeeObligation[]> {
    const response = await api.post<ApiResponse<EmployeeObligation[]>>(`/employees/create-obligations-batch/${encodeURIComponent(engagementId)}`, data);
    return response.data.data;
}
export async function updateObligation(engagementId: string, obligationId: string, data: UpdateObligationRequest): Promise<EmployeeObligation> {
    const response = await api.put<ApiResponse<EmployeeObligation>>(`/employees/update-obligation/${encodeURIComponent(engagementId)}/${encodeURIComponent(obligationId)}`, data);
    return response.data.data;
}
export async function deleteObligation(engagementId: string, obligationId: string): Promise<void> {
    await api.delete(`/employees/delete-obligation/${encodeURIComponent(engagementId)}/${encodeURIComponent(obligationId)}`);
}
export async function findObligationsByFilters(filters: FindObligationsFilters): Promise<CursorPage<ObligationListItem>> {
    const response = await api.get<ApiResponse<CursorPage<ObligationListItem>>>("/employees/find-obligations-by-filters", { params: filters });
    return response.data.data;
}
export async function findOpenObligations(engagementId: string): Promise<OpenObligation[]> {
    const response = await api.get<ApiResponse<OpenObligation[]>>(`/employees/find-open-obligations/${encodeURIComponent(engagementId)}`);
    return response.data.data;
}
export async function findObligationsByEngagement(engagementId: string, filters: { cursor?: string; limit?: number } = {}): Promise<CursorPage<ObligationListItem>> {
    const response = await api.get<ApiResponse<CursorPage<ObligationListItem>>>(`/employees/find-obligations-by-engagement/${encodeURIComponent(engagementId)}`, { params: filters });
    return response.data.data;
}
export async function analyzeObligations(engagementId: string, filters: AnalyzeObligationsFilters): Promise<ObligationAnalysis> {
    const response = await api.get<ApiResponse<ObligationAnalysis>>(`/employees/analyze-obligations/${encodeURIComponent(engagementId)}`, { params: filters });
    return response.data.data;
}

export async function deleteObligationWithMovements(engagementId: string, obligationId: string, data: DeleteObligationWithMovementsRequest): Promise<DeleteObligationWithMovementsResponse> {
    const response = await api.post<ApiResponse<DeleteObligationWithMovementsResponse>>(
        `/employees/delete-obligation-with-movements/${encodeURIComponent(engagementId)}/${encodeURIComponent(obligationId)}`,
        data
    );
    return response.data.data;
}
