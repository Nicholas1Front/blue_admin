import { api } from "../../api/axios";
import type { ApiResponse } from "../../api/api.types";
import type {
    Client,
    ClientContact,
    CreateClientRequest,
    CreateContactRequest,
    FindClientsFilters,
    FindContactsFilters,
    UpdateClientRequest,
    UpdateContactRequest
} from "./clients.types";

export async function getClients(): Promise<Client[]> {
    const result = await api.get<ApiResponse<Client[]>>(
        "/clients/find-all-clients"
    );

    return result.data.data;
}

export async function findClients(
    filters: FindClientsFilters
): Promise<Client[]> {
    const result = await api.get<ApiResponse<Client[]>>(
        "/clients/find-clients-by-filters",
        {
            params: filters
        }
    );

    return result.data.data;
}

export async function createClient(
    data: CreateClientRequest
): Promise<Client> {
    const result = await api.post<ApiResponse<Client>>(
        "/clients/create-client",
        data
    );

    return result.data.data;
}

export async function updateClient(
    id: string,
    data: UpdateClientRequest
): Promise<Client> {
    const result = await api.put<ApiResponse<Client>>(
        `/clients/update-client/${id}`,
        data
    );

    return result.data.data;
}

export async function deleteClient(
    id: string
): Promise<void> {
    await api.delete(
        `/clients/delete-client/${id}`
    );
}

export async function createContact(
    clientId: string,
    data: CreateContactRequest
): Promise<ClientContact> {
    const result = await api.post<ApiResponse<ClientContact>>(
        `/clients/create-contact/${clientId}`,
        data
    );

    return result.data.data;
}

export async function updateContact(
    id: string,
    data: UpdateContactRequest
): Promise<ClientContact> {
    const result = await api.put<ApiResponse<ClientContact>>(
        `/clients/update-contact/${id}`,
        data
    );

    return result.data.data;
}

export async function findContacts(
    filters: FindContactsFilters
): Promise<ClientContact[]> {
    const result = await api.get<ApiResponse<ClientContact[]>>(
        "/clients/find-contacts-by-filters",
        {
            params: filters
        }
    );

    return result.data.data;
}

export async function deleteContact(
    id: string
): Promise<void> {
    await api.delete(
        `/clients/delete-contact/${id}`
    );
}
