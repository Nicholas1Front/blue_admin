import { api } from "../../../api/axios";
import type { ApiResponse } from "../../../api/api.types";
import type { CursorPage } from "../employees.types";
import type { CreateMovementRequest, CreatePaymentRequest, EmployeeMovement, FindEngagementMovementsFilters, FindMovementsFilters, MovementListItem, UpdateMovementRequest, UpdatePaymentRequest } from "./movements.types";
export async function createMovement(engagementId: string, data: CreateMovementRequest): Promise<EmployeeMovement> {
    const response = await api.post<ApiResponse<EmployeeMovement>>(`/employees/create-movement/${encodeURIComponent(engagementId)}`, data);
    return response.data.data;
}
export async function createPayment(engagementId: string, data: CreatePaymentRequest): Promise<EmployeeMovement> {
    const response = await api.post<ApiResponse<EmployeeMovement>>(`/employees/create-payment/${encodeURIComponent(engagementId)}`, data);
    return response.data.data;
}
export async function updateMovement(engagementId: string, movementId: string, data: UpdateMovementRequest): Promise<EmployeeMovement> {
    const response = await api.put<ApiResponse<EmployeeMovement>>(`/employees/update-movement/${encodeURIComponent(engagementId)}/${encodeURIComponent(movementId)}`, data);
    return response.data.data;
}
export async function updatePayment(engagementId: string, movementId: string, data: UpdatePaymentRequest): Promise<EmployeeMovement> {
    const response = await api.put<ApiResponse<EmployeeMovement>>(`/employees/update-payment/${encodeURIComponent(engagementId)}/${encodeURIComponent(movementId)}`, data);
    return response.data.data;
}
export async function deleteMovement(engagementId: string, movementId: string): Promise<void> {
    await api.delete(`/employees/delete-movement/${encodeURIComponent(engagementId)}/${encodeURIComponent(movementId)}`);
}
export async function findMovementsByFilters(filters: FindMovementsFilters): Promise<CursorPage<MovementListItem>> {
    const response = await api.get<ApiResponse<CursorPage<MovementListItem>>>("/employees/find-movements-by-filters", { params: filters });
    return response.data.data;
}
export async function findMovementsByEngagement(engagementId: string, filters: FindEngagementMovementsFilters = {}): Promise<EmployeeMovement[]> {
    const response = await api.get<ApiResponse<EmployeeMovement[]>>(`/employees/find-movements-by-engagement/${encodeURIComponent(engagementId)}`, { params: filters });
    return response.data.data;
}
export async function getMovementById(engagementId: string, movementId: string): Promise<EmployeeMovement> {
    const response = await api.get<ApiResponse<EmployeeMovement>>(`/employees/find-movement-by-id/${encodeURIComponent(engagementId)}/${encodeURIComponent(movementId)}`);
    return response.data.data;
}
