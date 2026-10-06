export interface Equipament {
    id: string;
    clientId: string;
    type: string;
    brand: string;
    model: string | null;
    mainIdentification: string | null;
    additionalIdentification: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface CreateEquipamentRequest {
    type: string;
    brand: string;
    model?: string | null;
    mainIdentification?: string | null;
    additionalIdentification?: string;
}

export interface UpdateEquipamentRequest {
    clientId?: string;
    type?: string;
    brand?: string;
    model?: string | null;
    mainIdentification?: string | null;
    additionalIdentification?: string | null;
}

export interface FindEquipamentsFilters {
    id?: string;
    clientId?: string;
    type?: string;
    brand?: string;
    model?: string | null;
    mainIdentification?: string | null;
    additionalIdentification?: string | null;
}
