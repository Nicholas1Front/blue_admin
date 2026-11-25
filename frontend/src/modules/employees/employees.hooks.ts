import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { employeesQueryKeys } from "./employees.queryKeys";
import { createEmployee, findEmployees, getEmployeeById, updateEmployee } from "./employees.api";
import type { CreateEmployeeRequest, FindEmployeesFilters, UpdateEmployeeRequest } from "./employees.types";
export function useEmployees(filters: FindEmployeesFilters = {}, enabled = true) {
    return useQuery({ queryKey: employeesQueryKeys.list(filters), queryFn: () => findEmployees(filters), enabled });
}
export function useEmployeeById(id: string | undefined) {
    return useQuery({ queryKey: employeesQueryKeys.details(id), queryFn: () => getEmployeeById(id!), enabled: Boolean(id) });
}
export function useEmployeeMutations() {
    const queryClient = useQueryClient();
    const invalidate = () => queryClient.invalidateQueries({ queryKey: employeesQueryKeys.all });
    const create = useMutation({ mutationFn: (data: CreateEmployeeRequest) => createEmployee(data), onSuccess: invalidate });
    const update = useMutation({ mutationFn: ({ id, data }: { id: string; data: UpdateEmployeeRequest }) => updateEmployee(id, data), onSuccess: invalidate });
    return { create, update };
}
