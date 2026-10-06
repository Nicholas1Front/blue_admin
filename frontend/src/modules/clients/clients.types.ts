export interface Client {
    id: string;
    name: string;
    document: string | null;
    address: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface ClientContact {
    id: string;
    clientId: string;
    name: string;
    email: string | null;
    phoneNumber: string;
}

export interface CreateClientRequest {
    name: string;
    document?: string | null;
    address?: string | null;
}

export interface UpdateClientRequest {
    name?: string;
    document?: string | null;
    address?: string | null;
}

export interface FindClientsFilters {
    id?: string;
    name?: string;
    document?: string;
    address?: string;
}

export interface CreateContactRequest {
    name: string;
    email: string | null;
    phoneNumber: string;
}

export interface UpdateContactRequest {
    clientId?: string;
    name?: string;
    email?: string | null;
    phoneNumber?: string;
}

export interface FindContactsFilters {
    id?: string;
    clientId?: string;
    name?: string;
    email?: string;
    phoneNumber?: string;
}
