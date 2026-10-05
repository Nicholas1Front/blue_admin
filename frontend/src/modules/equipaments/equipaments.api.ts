import { api } from "../../api/axios";
import type { ApiResponse } from "../../api/api.types";
import type {
    CreateEquipamentRequest,
    Equipament,
    FindEquipamentsFilters,
    UpdateEquipamentRequest
} from "./equipaments.types";

export async function findEquipaments(
    filters: FindEquipamentsFilters
): Promise<Equipament[]> {
    const result = await api.get<ApiResponse<Equipament[]>>(
        "/equipaments/find-equipaments-by-filters",
        {
            params: filters
        }
    );

    return result.data.data;
}

export async function createEquipament(
    clientId: string,
    data: CreateEquipamentRequest
): Promise<Equipament> {
    const result = await api.post<ApiResponse<Equipament>>(
        `/equipaments/create-equipament/${clientId}`,
        data
    );

    return result.data.data;
}

export async function updateEquipament(
    id: string,
    data: UpdateEquipamentRequest
): Promise<Equipament> {
    const result = await api.put<ApiResponse<Equipament>>(
        `/equipaments/update-equipament/${id}`,
        data
    );

    return result.data.data;
}

export async function deleteEquipament(
    id: string
): Promise<void> {
    await api.delete(
        `/equipaments/delete-equipament/${id}`
    );
}
