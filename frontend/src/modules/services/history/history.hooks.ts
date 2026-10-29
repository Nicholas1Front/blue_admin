import { useQuery } from "@tanstack/react-query";

import { servicesQueryKeys } from "../services.queryKeys";
import { getServiceHistory } from "./history.api";

export function useServiceHistory(serviceId: string | undefined) {
    return useQuery({
        queryKey: servicesQueryKeys.history.byService(serviceId),
        queryFn: () => getServiceHistory(serviceId!),
        enabled: Boolean(serviceId)
    });
}
