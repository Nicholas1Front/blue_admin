import { useCallback, useState } from "react";

import {
    createClient,
    createContact,
    deleteClient,
    deleteContact,
    findClients,
    findContacts,
    getClients,
    updateClient,
    updateContact
} from "./clients.api";

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

interface UseClientsReturn {
    clients: Client[];
    clientSearchResults: Client[];
    contacts: ClientContact[];
    contactSearchResults: ClientContact[];

    isLoading: boolean;
    isCreating: boolean;
    isUpdating: boolean;
    isDeleting: boolean;
    isSearching: boolean;

    isLoadingContacts: boolean;
    isCreatingContact: boolean;
    isUpdatingContact: boolean;
    isDeletingContact: boolean;
    isSearchingContacts: boolean;

    error: string | null;
    createError: string | null;
    updateError: string | null;
    deleteError: string | null;
    searchError: string | null;

    contactError: string | null;
    createContactError: string | null;
    updateContactError: string | null;
    deleteContactError: string | null;
    searchContactError: string | null;

    hasSearched: boolean;
    hasSearchedContacts: boolean;

    loadClients: () => Promise<void>;
    searchClients: (filters: FindClientsFilters) => Promise<void>;
    clearClientSearch: () => void;

    loadContacts: (clientId: string) => Promise<void>;
    searchContacts: (filters: FindContactsFilters) => Promise<void>;
    clearContactSearch: () => void;

    clearCreateError: () => void;
    clearUpdateError: () => void;
    clearDeleteError: () => void;

    clearCreateContactError: () => void;
    clearUpdateContactError: () => void;
    clearDeleteContactError: () => void;

    addClient: (data: CreateClientRequest) => Promise<Client>;
    editClient: (
        id: string,
        data: UpdateClientRequest
    ) => Promise<Client>;
    removeClient: (id: string) => Promise<void>;

    addContact: (
        clientId: string,
        data: CreateContactRequest
    ) => Promise<ClientContact>;
    editContact: (
        id: string,
        data: UpdateContactRequest
    ) => Promise<ClientContact>;
    removeContact: (id: string) => Promise<void>;
}

export function useClients(): UseClientsReturn {
    const [clients, setClients] = useState<Client[]>([]);
    const [clientSearchResults, setClientSearchResults] = useState<Client[]>([]);
    const [contacts, setContacts] = useState<ClientContact[]>([]);
    const [contactSearchResults, setContactSearchResults] = useState<ClientContact[]>([]);

    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isSearching, setIsSearching] = useState(false);

    const [isLoadingContacts, setIsLoadingContacts] = useState(false);
    const [isCreatingContact, setIsCreatingContact] = useState(false);
    const [isUpdatingContact, setIsUpdatingContact] = useState(false);
    const [isDeletingContact, setIsDeletingContact] = useState(false);
    const [isSearchingContacts, setIsSearchingContacts] = useState(false);

    const [error, setError] = useState<string | null>(null);
    const [createError, setCreateError] = useState<string | null>(null);
    const [updateError, setUpdateError] = useState<string | null>(null);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const [searchError, setSearchError] = useState<string | null>(null);

    const [contactError, setContactError] = useState<string | null>(null);
    const [createContactError, setCreateContactError] = useState<string | null>(null);
    const [updateContactError, setUpdateContactError] = useState<string | null>(null);
    const [deleteContactError, setDeleteContactError] = useState<string | null>(null);
    const [searchContactError, setSearchContactError] = useState<string | null>(null);

    const [hasSearched, setHasSearched] = useState(false);
    const [hasSearchedContacts, setHasSearchedContacts] = useState(false);

    const loadClients = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const data = await getClients();
            setClients(data);
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : "Não foi possível carregar os clientes.";

            setError(message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const searchClients = useCallback(
        async (filters: FindClientsFilters) => {
            setIsSearching(true);
            setSearchError(null);
            setHasSearched(true);

            try {
                const data = await findClients(filters);
                setClientSearchResults(data);
            } catch (error) {
                const message =
                    error instanceof Error
                        ? error.message
                        : "Não foi possível pesquisar os clientes.";

                setSearchError(message);
                setClientSearchResults([]);
            } finally {
                setIsSearching(false);
            }
        },
        []
    );

    const clearClientSearch = useCallback(() => {
        setClientSearchResults([]);
        setSearchError(null);
        setHasSearched(false);
    }, []);

    const addClient = useCallback(
        async (data: CreateClientRequest) => {
            setIsCreating(true);
            setCreateError(null);

            try {
                const newClient = await createClient(data);
                setClients((currentClients) => [...currentClients, newClient]);
                return newClient;
            } catch (error) {
                const message =
                    error instanceof Error
                        ? error.message
                        : "Não foi possível criar o cliente.";

                setCreateError(message);
                throw error;
            } finally {
                setIsCreating(false);
            }
        },
        []
    );

    const editClient = useCallback(
        async (id: string, data: UpdateClientRequest) => {
            setIsUpdating(true);
            setUpdateError(null);

            try {
                const updatedClient = await updateClient(id, data);

                setClients((currentClients) =>
                    currentClients.map((client) =>
                        client.id === updatedClient.id
                            ? updatedClient
                            : client
                    )
                );

                setClientSearchResults((currentResults) =>
                    currentResults.map((client) =>
                        client.id === updatedClient.id
                            ? updatedClient
                            : client
                    )
                );

                return updatedClient;
            } catch (error) {
                const message =
                    error instanceof Error
                        ? error.message
                        : "Não foi possível atualizar o cliente.";

                setUpdateError(message);
                throw error;
            } finally {
                setIsUpdating(false);
            }
        },
        []
    );

    const removeClient = useCallback(
        async (id: string) => {
            setIsDeleting(true);
            setDeleteError(null);

            try {
                await deleteClient(id);

                setClients((currentClients) =>
                    currentClients.filter((client) => client.id !== id)
                );

                setClientSearchResults((currentResults) =>
                    currentResults.filter((client) => client.id !== id)
                );

                setContacts((currentContacts) =>
                    currentContacts.filter((contact) => contact.clientId !== id)
                );

                setContactSearchResults((currentResults) =>
                    currentResults.filter((contact) => contact.clientId !== id)
                );
            } catch (error) {
                const message =
                    error instanceof Error
                        ? error.message
                        : "Não foi possível excluir o cliente.";

                setDeleteError(message);
                throw error;
            } finally {
                setIsDeleting(false);
            }
        },
        []
    );

    const loadContacts = useCallback(
        async (clientId: string) => {
            setIsLoadingContacts(true);
            setContactError(null);

            try {
                const data = await findContacts({ clientId });

                setContacts(data);
            } catch (error) {
                const message =
                    error instanceof Error
                        ? error.message
                        : "Não foi possível carregar os contatos.";

                setContactError(message);
            } finally {
                setIsLoadingContacts(false);
            }
        },
        []
    );

    const searchContacts = useCallback(
        async (filters: FindContactsFilters) => {
            setIsSearchingContacts(true);
            setSearchContactError(null);
            setHasSearchedContacts(true);

            try {
                const data = await findContacts(filters);
                setContactSearchResults(data);
            } catch (error) {
                const message =
                    error instanceof Error
                        ? error.message
                        : "Não foi possível pesquisar os contatos.";

                setSearchContactError(message);
                setContactSearchResults([]);
            } finally {
                setIsSearchingContacts(false);
            }
        },
        []
    );

    const clearContactSearch = useCallback(() => {
        setContactSearchResults([]);
        setSearchContactError(null);
        setHasSearchedContacts(false);
    }, []);

    const addContact = useCallback(
        async (clientId: string, data: CreateContactRequest) => {
            setIsCreatingContact(true);
            setCreateContactError(null);

            try {
                const newContact = await createContact(clientId, data);
                setContacts((currentContacts) => [...currentContacts, newContact]);
                return newContact;
            } catch (error) {
                const message =
                    error instanceof Error
                        ? error.message
                        : "Não foi possível criar o contato.";

                setCreateContactError(message);
                throw error;
            } finally {
                setIsCreatingContact(false);
            }
        },
        []
    );

    const editContact = useCallback(
        async (id: string, data: UpdateContactRequest) => {
            setIsUpdatingContact(true);
            setUpdateContactError(null);

            try {
                const updatedContact = await updateContact(id, data);

                setContacts((currentContacts) =>
                    currentContacts.map((contact) =>
                        contact.id === updatedContact.id
                            ? updatedContact
                            : contact
                    )
                );

                setContactSearchResults((currentResults) =>
                    currentResults.map((contact) =>
                        contact.id === updatedContact.id
                            ? updatedContact
                            : contact
                    )
                );

                return updatedContact;
            } catch (error) {
                const message =
                    error instanceof Error
                        ? error.message
                        : "Não foi possível atualizar o contato.";

                setUpdateContactError(message);
                throw error;
            } finally {
                setIsUpdatingContact(false);
            }
        },
        []
    );

    const removeContact = useCallback(
        async (id: string) => {
            setIsDeletingContact(true);
            setDeleteContactError(null);

            try {
                await deleteContact(id);

                setContacts((currentContacts) =>
                    currentContacts.filter((contact) => contact.id !== id)
                );

                setContactSearchResults((currentResults) =>
                    currentResults.filter((contact) => contact.id !== id)
                );
            } catch (error) {
                const message =
                    error instanceof Error
                        ? error.message
                        : "Não foi possível excluir o contato.";

                setDeleteContactError(message);
                throw error;
            } finally {
                setIsDeletingContact(false);
            }
        },
        []
    );

    const clearCreateError = useCallback(() => {
        setCreateError(null);
    }, []);

    const clearUpdateError = useCallback(() => {
        setUpdateError(null);
    }, []);

    const clearDeleteError = useCallback(() => {
        setDeleteError(null);
    }, []);

    const clearCreateContactError = useCallback(() => {
        setCreateContactError(null);
    }, []);

    const clearUpdateContactError = useCallback(() => {
        setUpdateContactError(null);
    }, []);

    const clearDeleteContactError = useCallback(() => {
        setDeleteContactError(null);
    }, []);

    return {
        clients,
        clientSearchResults,
        contacts,
        contactSearchResults,

        isLoading,
        isCreating,
        isUpdating,
        isDeleting,
        isSearching,

        isLoadingContacts,
        isCreatingContact,
        isUpdatingContact,
        isDeletingContact,
        isSearchingContacts,

        error,
        createError,
        updateError,
        deleteError,
        searchError,

        contactError,
        createContactError,
        updateContactError,
        deleteContactError,
        searchContactError,

        hasSearched,
        hasSearchedContacts,

        loadClients,
        searchClients,
        clearClientSearch,

        loadContacts,
        searchContacts,
        clearContactSearch,

        clearCreateError,
        clearUpdateError,
        clearDeleteError,

        clearCreateContactError,
        clearUpdateContactError,
        clearDeleteContactError,

        addClient,
        editClient,
        removeClient,

        addContact,
        editContact,
        removeContact
    };
}
