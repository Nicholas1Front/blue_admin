import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { employeesQueryKeys } from "../employees.queryKeys";
import { analyzeObligations, createObligation, createObligationsBatch, deleteObligation, deleteObligationWithMovements, findObligationsByEngagement, findObligationsByFilters, findOpenObligations, updateObligation } from "./obligations.api";
import type { AnalyzeObligationsFilters, CreateObligationRequest, CreateObligationsBatchRequest, DeleteObligationWithMovementsRequest, FindObligationsFilters, UpdateObligationRequest } from "./obligations.types";
export function useObligationsByFilters(filters: FindObligationsFilters, enabled = true) {
    return useQuery({ queryKey: employeesQueryKeys.obligations.filtered(filters), queryFn: () => findObligationsByFilters(filters), enabled });
}
export function useObligationsByEngagement(engagementId: string | undefined, filters: { cursor?: string; limit?: number } = {}) {
    return useQuery({ queryKey: employeesQueryKeys.obligations.byEngagement(engagementId, filters), queryFn: () => findObligationsByEngagement(engagementId!, filters), enabled: Boolean(engagementId) });
}
export function useOpenObligations(engagementId: string | undefined) {
    return useQuery({ queryKey: employeesQueryKeys.obligations.open(engagementId), queryFn: () => findOpenObligations(engagementId!), enabled: Boolean(engagementId) });
}
export function useAnalyzeObligations(engagementId: string | undefined, filters: AnalyzeObligationsFilters | undefined, enabled = false) {
    return useQuery({ queryKey: employeesQueryKeys.obligations.analysis(engagementId, filters), queryFn: () => analyzeObligations(engagementId!, filters!), enabled: Boolean(engagementId && filters && enabled) });
}
export function useObligationMutations() {
    const queryClient = useQueryClient();
    const invalidate = () => queryClient.invalidateQueries({ queryKey: employeesQueryKeys.all });
    const create = useMutation({ mutationFn: ({ engagementId, data }: { engagementId: string; data: CreateObligationRequest }) => createObligation(engagementId, data), onSuccess: invalidate });
    const createBatch = useMutation({ mutationFn: ({ engagementId, data }: { engagementId: string; data: CreateObligationsBatchRequest }) => createObligationsBatch(engagementId, data), onSuccess: invalidate });
    const update = useMutation({ mutationFn: ({ engagementId, obligationId, data }: { engagementId: string; obligationId: string; data: UpdateObligationRequest }) => updateObligation(engagementId, obligationId, data), onSuccess: invalidate });
    const remove = useMutation({ mutationFn: ({ engagementId, obligationId }: { engagementId: string; obligationId: string }) => deleteObligation(engagementId, obligationId), onSuccess: invalidate });
    const removeWithMovements = useMutation({ mutationFn: ({ engagementId, obligationId, data }: { engagementId: string; obligationId: string; data: DeleteObligationWithMovementsRequest }) => deleteObligationWithMovements(engagementId, obligationId, data), onSuccess: invalidate });
    return { create, createBatch, update, remove, removeWithMovements };
}
