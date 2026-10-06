import { useEffect, useState } from "react";

import { AppHeader } from "../../components/AppHeader/AppHeader";
import { useClients } from "../../modules/clients/useClients";
import { useEquipaments } from "../../modules/equipaments/useEquipaments";
import type { Client } from "../../modules/clients/clients.types";

import { ClientSearch } from "./components/ClientSearch/ClientSearch";
import { ClientSearchResults } from "./components/ClientSearchResults/ClientSearchResults";
import { ClientViewModal } from "./components/ClientViewModal/ClientViewModal";

import "./Clients.css";

export function Clients() {
    document.title = "Gestão | Blue Admin";

    const {
        clientSearchResults,
        isSearching,
        searchError,
        hasSearched,
        searchClients,
        clearClientSearch,
        loadContacts,
        contacts,
        isLoadingContacts,
        contactError,
        editClient,
        removeClient,
        editContact,
        removeContact,
        isUpdating,
        isDeleting,
        isUpdatingContact,
        isDeletingContact,
        updateError,
        deleteError,
        updateContactError,
        deleteContactError,
        clearUpdateError,
        clearDeleteError,
        clearUpdateContactError,
        clearDeleteContactError
    } = useClients();

    const {
        equipaments,
        isLoading: isLoadingEquipaments,
        error: equipamentError,
        loadEquipaments,
        editEquipament,
        removeEquipament,
        isUpdating: isUpdatingEquipament,
        isDeleting: isDeletingEquipament,
        updateError: updateEquipamentError,
        deleteError: deleteEquipamentError,
        clearUpdateError: clearUpdateEquipamentError,
        clearDeleteError: clearDeleteEquipamentError
    } = useEquipaments();

    const [selectedClient, setSelectedClient] = useState<Client | null>(null);

    useEffect(() => {
        if (!selectedClient) {
            return;
        }

        loadContacts(selectedClient.id);
        loadEquipaments(selectedClient.id);
    }, [selectedClient, loadContacts, loadEquipaments]);

    function handleSelectClient(client: Client) {
        setSelectedClient(client);
    }

    function handleCloseClient() {
        if (
            isUpdating ||
            isDeleting ||
            isUpdatingContact ||
            isDeletingContact ||
            isUpdatingEquipament ||
            isDeletingEquipament
        ) {
            return;
        }

        setSelectedClient(null);
    }

    async function handleUpdateClient(
        data: Parameters<typeof editClient>[1]
    ) {
        if (!selectedClient) {
            return;
        }

        const updatedClient = await editClient(selectedClient.id, data);
        setSelectedClient(updatedClient);
    }

    async function handleDeleteClient() {
        if (!selectedClient) {
            return;
        }

        await removeClient(selectedClient.id);
        setSelectedClient(null);
    }

    return (
        <main className="clients-page">
            <AppHeader />

            <section className="clients-content">
                <header className="clients-header">
                    <div>
                        <span className="clients-header__eyebrow">
                            Gestão
                        </span>

                        <h1>Clientes, contatos e equipamentos</h1>

                        <p>
                            Pesquise um cliente para consultar e gerenciar todas
                            as informações relacionadas a ele.
                        </p>
                    </div>
                </header>

                <ClientSearch
                    isSearching={isSearching}
                    hasSearched={hasSearched}
                    onSearch={searchClients}
                    onClear={clearClientSearch}
                />

                <ClientSearchResults
                    clients={clientSearchResults}
                    isSearching={isSearching}
                    hasSearched={hasSearched}
                    error={searchError}
                    onSelect={handleSelectClient}
                />
            </section>

            <ClientViewModal
                client={selectedClient}
                contacts={contacts}
                equipaments={equipaments}
                isLoadingContacts={isLoadingContacts}
                isLoadingEquipaments={isLoadingEquipaments}
                contactError={contactError}
                equipamentError={equipamentError}
                isUpdating={isUpdating}
                isDeleting={isDeleting}
                isUpdatingContact={isUpdatingContact}
                isDeletingContact={isDeletingContact}
                isUpdatingEquipament={isUpdatingEquipament}
                isDeletingEquipament={isDeletingEquipament}
                updateError={updateError}
                deleteError={deleteError}
                updateContactError={updateContactError}
                deleteContactError={deleteContactError}
                updateEquipamentError={updateEquipamentError}
                deleteEquipamentError={deleteEquipamentError}
                onClose={handleCloseClient}
                onUpdateClient={handleUpdateClient}
                onDeleteClient={handleDeleteClient}
                onUpdateContact={editContact}
                onDeleteContact={removeContact}
                onUpdateEquipament={editEquipament}
                onDeleteEquipament={removeEquipament}
                onClearUpdateError={clearUpdateError}
                onClearDeleteError={clearDeleteError}
                onClearUpdateContactError={clearUpdateContactError}
                onClearDeleteContactError={clearDeleteContactError}
                onClearUpdateEquipamentError={clearUpdateEquipamentError}
                onClearDeleteEquipamentError={clearDeleteEquipamentError}
            />
        </main>
    );
}
