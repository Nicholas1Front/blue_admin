import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { employeesQueryKeys } from "../employees.queryKeys";
import { createMovement, createPayment, deleteMovement, findMovementsByEngagement, findMovementsByFilters, getMovementById, updateMovement, updatePayment } from "./movements.api";
import type { CreateMovementRequest, CreatePaymentRequest, FindEngagementMovementsFilters, FindMovementsFilters, UpdateMovementRequest, UpdatePaymentRequest } from "./movements.types";
export function useMovementsByFilters(filters: FindMovementsFilters, enabled = true) {
    return useQuery({ queryKey: employeesQueryKeys.movements.filtered(filters), queryFn: () => findMovementsByFilters(filters), enabled });
}
export function useMovementsByEngagement(engagementId: string | undefined, filters: FindEngagementMovementsFilters = {}) {
    return useQuery({ queryKey: employeesQueryKeys.movements.byEngagement(engagementId, filters), queryFn: () => findMovementsByEngagement(engagementId!, filters), enabled: Boolean(engagementId) });
}
export function useMovementById(engagementId: string | undefined, movementId: string | undefined) {
    return useQuery({ queryKey: employeesQueryKeys.movements.details(engagementId, movementId), queryFn: () => getMovementById(engagementId!, movementId!), enabled: Boolean(engagementId && movementId) });
}
export function useMovementMutations() {
    const queryClient = useQueryClient();
    const invalidate = () => queryClient.invalidateQueries({ queryKey: employeesQueryKeys.all });
    const create = useMutation({ mutationFn: ({ engagementId, data }: { engagementId: string; data: CreateMovementRequest }) => createMovement(engagementId, data), onSuccess: invalidate });
    const createPaymentMutation = useMutation({ mutationFn: ({ engagementId, data }: { engagementId: string; data: CreatePaymentRequest }) => createPayment(engagementId, data), onSuccess: invalidate });
    const update = useMutation({ mutationFn: ({ engagementId, movementId, data }: { engagementId: string; movementId: string; data: UpdateMovementRequest }) => updateMovement(engagementId, movementId, data), onSuccess: invalidate });
    const updatePaymentMutation = useMutation({ mutationFn: ({ engagementId, movementId, data }: { engagementId: string; movementId: string; data: UpdatePaymentRequest }) => updatePayment(engagementId, movementId, data), onSuccess: invalidate });
    const remove = useMutation({ mutationFn: ({ engagementId, movementId }: { engagementId: string; movementId: string }) => deleteMovement(engagementId, movementId), onSuccess: invalidate });
    return { create, createPayment: createPaymentMutation, update, updatePayment: updatePaymentMutation, remove };
}
