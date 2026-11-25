import { api } from "../../api/axios";
import type { ApiResponse } from "../../api/api.types";
import type { CursorPage, CreateEmployeeRequest, EmployeeListItem, EmployeeMutationResponse, EmployeeRecord, FindEmployeesFilters, UpdateEmployeeRequest } from "./employees.types";
export async function createEmployee(data: CreateEmployeeRequest): Promise<EmployeeMutationResponse> {
    const response = await api.post<ApiResponse<EmployeeMutationResponse>>("/employees/create-employee", data);
    return response.data.data;
}
export async function updateEmployee(id: string, data: UpdateEmployeeRequest): Promise<EmployeeMutationResponse> {
    const response = await api.put<ApiResponse<EmployeeMutationResponse>>(`/employees/update-employee/${encodeURIComponent(id)}`, data);
    return response.data.data;
}
export async function findEmployees(filters: FindEmployeesFilters): Promise<CursorPage<EmployeeListItem>> {
    const response = await api.get<ApiResponse<CursorPage<EmployeeListItem>>>("/employees/find-employees-by-filters", { params: filters });
    return response.data.data;
}
export async function getEmployeeById(id: string): Promise<EmployeeRecord> {
    const response = await api.get<ApiResponse<EmployeeRecord>>(`/employees/find-employee-by-id/${encodeURIComponent(id)}`);
    return response.data.data;
}
