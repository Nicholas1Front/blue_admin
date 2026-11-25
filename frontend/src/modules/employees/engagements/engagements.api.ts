import { api } from "../../../api/axios";
import type { ApiResponse } from "../../../api/api.types";
import type { CursorPage } from "../employees.types";
import type { CreateEngagementRequest, EngagementListItem, EngagementMutationResponse, EmployeeEngagement, FindEngagementsFilters, UpdateEngagementRequest } from "./engagements.types";
export async function createEngagement(employeeId: string, data: CreateEngagementRequest): Promise<EngagementMutationResponse> {
    const response = await api.post<ApiResponse<EngagementMutationResponse>>(`/employees/create-engagement/${encodeURIComponent(employeeId)}`, data);
    return response.data.data;
}
export async function updateEngagement(employeeId: string, engagementId: string, data: UpdateEngagementRequest): Promise<EngagementMutationResponse> {
    const response = await api.put<ApiResponse<EngagementMutationResponse>>(`/employees/update-engagement/${encodeURIComponent(employeeId)}/${encodeURIComponent(engagementId)}`, data);
    return response.data.data;
}
export async function findEngagementsByFilters(filters: FindEngagementsFilters): Promise<CursorPage<EngagementListItem>> {
    const response = await api.get<ApiResponse<CursorPage<EngagementListItem>>>("/employees/find-engagements-by-filters", { params: filters });
    return response.data.data;
}
export async function findEngagementsByEmployee(employeeId: string): Promise<EmployeeEngagement[]> {
    const response = await api.get<ApiResponse<EmployeeEngagement[]>>(`/employees/find-engagements-by-employee/${encodeURIComponent(employeeId)}`);
    return response.data.data;
}
