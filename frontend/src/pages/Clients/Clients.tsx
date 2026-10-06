import { useState } from "react";

import { AppHeader } from "../../components/AppHeader/AppHeader";
import { useClients } from "../../modules/clients/useClients";
import { useEquipaments } from "../../modules/equipaments/useEquipaments";
import type {
    Client,
    ClientContact,
    CreateClientRequest,
    CreateContactRequest,
    UpdateClientRequest,
    UpdateContactRequest
} from "../../modules/clients/clients.types";
import type {
    CreateEquipamentRequest,
    Equipament,
    UpdateEquipamentRequest
} from "../../modules/equipaments/equipaments.types";
import { ClientSearch } from "./components/ClientSearch/ClientSearch";
import { ClientSearchResults } from "./components/ClientSearchResults/ClientSearchResults";
import { ClientDetails } from "./components/ClientDetails/ClientDetails";
import { ClientCreateModal } from "./components/ClientCreateModal/ClientCreateModal";
import { ClientEditModal } from "./components/ClientEditModal/ClientEditModal";
import { ClientDeleteModal } from "./components/ClientDeleteModal/ClientDeleteModal";
import { ClientSelectModal } from "./components/ClientSelectModal/ClientSelectModal";
import { ContactCreateModal } from "./components/ContactCreateModal/ContactCreateModal";
import { ContactEditModal } from "./components/ContactEditModal/ContactEditModal";
import { ContactDeleteModal } from "./components/ContactDeleteModal/ContactDeleteModal";
import { EquipamentCreateModal } from "./components/EquipamentCreateModal/EquipamentCreateModal";
import { EquipamentEditModal } from "./components/EquipamentEditModal/EquipamentEditModal";
import { EquipamentDeleteModal } from "./components/EquipamentDeleteModal/EquipamentDeleteModal";

import "./Clients.css";

export function Clients() {
    document.title = "Gestão | Blue Admin";

    const {
        clientSearchResults,
        contacts,
        contactSearchResults,
        isSearching,
        isCreating,
        isUpdating,
        isDeleting,
        createError,
        updateError,
        deleteError,
        isLoadingContacts,
        isCreatingContact,
        isUpdatingContact,
        isDeletingContact,
        createContactError,
        updateContactError,
        deleteContactError,
        isSearchingContacts,
        searchError,
        contactError,
        searchContactError,
        hasSearched,
        hasSearchedContacts,
        loadClients,
        searchClients,
        clearClientSearch,
        clearCreateError,
        clearUpdateError,
        clearDeleteError,
        addClient,
        editClient,
        removeClient,
        loadContacts,
        searchContacts,
        clearContactSearch,
        clearCreateContactError,
        clearUpdateContactError,
        clearDeleteContactError,
        addContact,
        editContact,
        removeContact
    } = useClients();

    const {
        equipaments,
        searchResults: equipamentSearchResults,
        isLoading: isLoadingEquipaments,
        isCreating: isCreatingEquipament,
        isUpdating: isUpdatingEquipament,
        isDeleting: isDeletingEquipament,
        isSearching: isSearchingEquipaments,
        error: equipamentError,
        createError: equipamentCreateError,
        updateError: equipamentUpdateError,
        deleteError: equipamentDeleteError,
        searchError: equipamentSearchError,
        hasSearched: hasSearchedEquipaments,
        loadEquipaments,
        searchEquipaments,
        clearSearch: clearEquipamentSearch,
        clearCreateError: clearEquipamentCreateError,
        clearUpdateError: clearEquipamentUpdateError,
        clearDeleteError: clearEquipamentDeleteError,
        addEquipament,
        editEquipament,
        removeEquipament
    } = useEquipaments();

    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [isCreateClientModalOpen, setIsCreateClientModalOpen] = useState(false);
    const [editingClient, setEditingClient] = useState<Client | null>(null);
    const [deletingClient, setDeletingClient] = useState<Client | null>(null);
    const [clientSelectionMode, setClientSelectionMode] = useState<"edit" | "delete" | null>(null);
    const [isCreateContactModalOpen, setIsCreateContactModalOpen] = useState(false);
    const [editingContact, setEditingContact] = useState<ClientContact | null>(null);
    const [deletingContact, setDeletingContact] = useState<ClientContact | null>(null);
    const [isCreateEquipamentModalOpen, setIsCreateEquipamentModalOpen] = useState(false);
    const [editingEquipament, setEditingEquipament] = useState<Equipament | null>(null);
    const [deletingEquipament, setDeletingEquipament] = useState<Equipament | null>(null);

    async function handleViewClient(client: Client) {
        setSelectedClient(client);
        clearContactSearch();
        clearEquipamentSearch();

        await Promise.all([
            loadContacts(client.id),
            loadEquipaments(client.id)
        ]);
    }

    async function handleCreateClient(data: CreateClientRequest) {
        const newClient = await addClient(data);

        setIsCreateClientModalOpen(false);
        clearClientSearch();
        clearContactSearch();
        clearEquipamentSearch();
        setSelectedClient(newClient);

        await Promise.all([
            loadContacts(newClient.id),
            loadEquipaments(newClient.id)
        ]);
    }

    async function handleUpdateClient(data: UpdateClientRequest) {
        if (!editingClient) return;

        const updatedClient = await editClient(editingClient.id, data);
        setSelectedClient(updatedClient);
        setEditingClient(null);
    }

    async function handleDeleteClient() {
        if (!deletingClient) return;

        await removeClient(deletingClient.id);
        setDeletingClient(null);

        if (selectedClient?.id === deletingClient.id) {
            setSelectedClient(null);
            clearContactSearch();
            clearEquipamentSearch();
        }
    }

    async function handleCreateContact(data: CreateContactRequest) {
        if (!selectedClient) return;

        await addContact(selectedClient.id, data);
        clearContactSearch();
        setIsCreateContactModalOpen(false);
    }

    async function handleUpdateContact(data: UpdateContactRequest) {
        if (!editingContact) return;

        await editContact(editingContact.id, data);
        setEditingContact(null);
    }

    async function handleDeleteContact() {
        if (!deletingContact) return;

        await removeContact(deletingContact.id);
        setDeletingContact(null);
    }

    async function handleCreateEquipament(data: CreateEquipamentRequest) {
        if (!selectedClient) return;

        await addEquipament(selectedClient.id, data);
        clearEquipamentSearch();
        setIsCreateEquipamentModalOpen(false);
    }

    async function handleUpdateEquipament(data: UpdateEquipamentRequest) {
        if (!editingEquipament) return;

        await editEquipament(editingEquipament.id, data);
        setEditingEquipament(null);
    }

    async function handleDeleteEquipament() {
        if (!deletingEquipament) return;

        await removeEquipament(deletingEquipament.id);
        setDeletingEquipament(null);
    }

    function handleBackToSearch() {
        setSelectedClient(null);
        clearContactSearch();
        clearEquipamentSearch();
    }

    return (
        <main className="clients-page">
            <AppHeader />

            <section className="clients-content">
                {!selectedClient ? (
                    <>
                        <header className="clients-header">
                            <div>
                                <span className="clients-header__eyebrow">Gestão</span>
                                <h1>Clientes e equipamentos</h1>
                                <p>Consulte clientes, contatos e equipamentos em um só lugar.</p>
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
                            onView={handleViewClient}
                        />

                        <section className="clients-section">
                            <header className="clients-section__header">
                                <span className="clients-section__eyebrow">Clientes</span>
                                <h2>Gerenciar clientes</h2>
                                <p>Adicione, edite ou exclua clientes cadastrados.</p>
                            </header>

                            <div className="clients-section__actions">
                                <button
                                    className="clients-section__button clients-section__button--add"
                                    type="button"
                                    onClick={() => {
                                        clearCreateError();
                                        setIsCreateClientModalOpen(true);
                                    }}
                                >
                                    Adicionar cliente
                                </button>

                                <button
                                    className="clients-section__button"
                                    type="button"
                                    onClick={async () => {
                                        setClientSelectionMode("edit");
                                        await loadClients();
                                    }}
                                >
                                    Editar cliente
                                </button>

                                <button
                                    className="clients-section__button clients-section__button--delete"
                                    type="button"
                                    onClick={async () => {
                                        setClientSelectionMode("delete");
                                        await loadClients();
                                    }}
                                >
                                    Excluir cliente
                                </button>
                            </div>
                        </section>
                    </>
                ) : (
                    <ClientDetails
                        client={selectedClient}
                        contacts={contacts}
                        contactSearchResults={contactSearchResults}
                        equipaments={equipaments}
                        equipamentSearchResults={equipamentSearchResults}
                        isLoadingContacts={isLoadingContacts}
                        isSearchingContacts={isSearchingContacts}
                        isLoadingEquipaments={isLoadingEquipaments}
                        isSearchingEquipaments={isSearchingEquipaments}
                        contactError={contactError}
                        contactSearchError={searchContactError}
                        equipamentError={equipamentError}
                        equipamentSearchError={equipamentSearchError}
                        hasSearchedContacts={hasSearchedContacts}
                        hasSearchedEquipaments={hasSearchedEquipaments}
                        onBack={handleBackToSearch}
                        onEditClient={() => {
                            clearUpdateError();
                            setEditingClient(selectedClient);
                        }}
                        onDeleteClient={() => {
                            clearDeleteError();
                            setDeletingClient(selectedClient);
                        }}
                        onAddContact={() => {
                            clearCreateContactError();
                            setIsCreateContactModalOpen(true);
                        }}
                        onEditContact={(contact) => {
                            clearUpdateContactError();
                            setEditingContact(contact);
                        }}
                        onDeleteContact={(contact) => {
                            clearDeleteContactError();
                            setDeletingContact(contact);
                        }}
                        onAddEquipament={() => {
                            clearEquipamentCreateError();
                            setIsCreateEquipamentModalOpen(true);
                        }}
                        onEditEquipament={(equipament) => {
                            clearEquipamentUpdateError();
                            setEditingEquipament(equipament);
                        }}
                        onDeleteEquipament={(equipament) => {
                            clearEquipamentDeleteError();
                            setDeletingEquipament(equipament);
                        }}
                        onSearchContacts={searchContacts}
                        onClearContactSearch={clearContactSearch}
                        onSearchEquipaments={searchEquipaments}
                        onClearEquipamentSearch={clearEquipamentSearch}
                    />
                )}
            </section>

            <ClientSelectModal
                isOpen={clientSelectionMode !== null}
                title={clientSelectionMode === "edit" ? "Selecionar cliente para editar" : "Selecionar cliente para excluir"}
                clients={clients}
                isLoading={isLoading}
                error={error}
                onClose={() => setClientSelectionMode(null)}
                onSelect={(client) => {
                    setClientSelectionMode(null);

                    if (clientSelectionMode === "edit") {
                        clearUpdateError();
                        setEditingClient(client);
                        return;
                    }

                    clearDeleteError();
                    setDeletingClient(client);
                }}
            />

            <ClientCreateModal
                isOpen={isCreateClientModalOpen}
                isSubmitting={isCreating}
                error={createError}
                onClose={() => !isCreating && setIsCreateClientModalOpen(false)}
                onSubmit={handleCreateClient}
            />

            <ClientEditModal
                client={editingClient}
                isSubmitting={isUpdating}
                error={updateError}
                onClose={() => !isUpdating && setEditingClient(null)}
                onSubmit={handleUpdateClient}
            />

            <ClientDeleteModal
                client={deletingClient}
                isSubmitting={isDeleting}
                error={deleteError}
                onClose={() => !isDeleting && setDeletingClient(null)}
                onConfirm={handleDeleteClient}
            />

            <ContactCreateModal
                isOpen={isCreateContactModalOpen}
                isSubmitting={isCreatingContact}
                error={createContactError}
                onClose={() => !isCreatingContact && setIsCreateContactModalOpen(false)}
                onSubmit={handleCreateContact}
            />

            <ContactEditModal
                contact={editingContact}
                isSubmitting={isUpdatingContact}
                error={updateContactError}
                onClose={() => !isUpdatingContact && setEditingContact(null)}
                onSubmit={handleUpdateContact}
            />

            <ContactDeleteModal
                contact={deletingContact}
                isSubmitting={isDeletingContact}
                error={deleteContactError}
                onClose={() => !isDeletingContact && setDeletingContact(null)}
                onConfirm={handleDeleteContact}
            />

            <EquipamentCreateModal
                clientId={selectedClient?.id ?? ""}
                isOpen={isCreateEquipamentModalOpen}
                isSubmitting={isCreatingEquipament}
                error={equipamentCreateError}
                onClose={() => !isCreatingEquipament && setIsCreateEquipamentModalOpen(false)}
                onSubmit={handleCreateEquipament}
            />

            <EquipamentEditModal
                equipament={editingEquipament}
                isSubmitting={isUpdatingEquipament}
                error={equipamentUpdateError}
                onClose={() => !isUpdatingEquipament && setEditingEquipament(null)}
                onSubmit={handleUpdateEquipament}
            />

            <EquipamentDeleteModal
                equipament={deletingEquipament}
                isSubmitting={isDeletingEquipament}
                error={equipamentDeleteError}
                onClose={() => !isDeletingEquipament && setDeletingEquipament(null)}
                onConfirm={handleDeleteEquipament}
            />
        </main>
    );
}
