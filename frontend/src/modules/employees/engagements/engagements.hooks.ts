import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { employeesQueryKeys } from "../employees.queryKeys";
import { createEngagement, findEngagementsByEmployee, findEngagementsByFilters, updateEngagement } from "./engagements.api";
import type { CreateEngagementRequest, FindEngagementsFilters, UpdateEngagementRequest } from "./engagements.types";
export function useEngagementsByFilters(filters: FindEngagementsFilters, enabled = true) {
    return useQuery({ queryKey: employeesQueryKeys.engagements.list(filters), queryFn: () => findEngagementsByFilters(filters), enabled });
}
export function useEngagementsByEmployee(employeeId: string | undefined) {
    return useQuery({ queryKey: employeesQueryKeys.engagements.byEmployee(employeeId), queryFn: () => findEngagementsByEmployee(employeeId!), enabled: Boolean(employeeId) });
}
export function useEngagementMutations() {
    const queryClient = useQueryClient();
    const invalidate = () => queryClient.invalidateQueries({ queryKey: employeesQueryKeys.all });
    const create = useMutation({ mutationFn: ({ employeeId, data }: { employeeId: string; data: CreateEngagementRequest }) => createEngagement(employeeId, data), onSuccess: invalidate });
    const update = useMutation({ mutationFn: ({ employeeId, engagementId, data }: { employeeId: string; engagementId: string; data: UpdateEngagementRequest }) => updateEngagement(employeeId, engagementId, data), onSuccess: invalidate });
    return { create, update };
}
