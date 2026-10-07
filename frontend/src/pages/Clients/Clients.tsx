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
import { ContactSelectModal } from "./components/ContactSelectModal/ContactSelectModal";
import { EquipamentCreateModal } from "./components/EquipamentCreateModal/EquipamentCreateModal";
import { EquipamentEditModal } from "./components/EquipamentEditModal/EquipamentEditModal";
import { EquipamentDeleteModal } from "./components/EquipamentDeleteModal/EquipamentDeleteModal";
import { EquipamentSelectModal } from "./components/EquipamentSelectModal/EquipamentSelectModal";
import { AllClientsSection } from "./components/AllClientsSection/AllClientsSection";

import "./Clients.css";

export function Clients() {
    document.title = "Gestão | Blue Admin";

    const {
        clients,
        clientSearchResults,
        isLoading,
        error,
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
    const [contactClientForAction, setContactClientForAction] = useState<Client | null>(null);
    const [contactClientSelectionMode, setContactClientSelectionMode] = useState<"create" | "edit" | "delete" | null>(null);
    const [contactSelectionMode, setContactSelectionMode] = useState<"edit" | "delete" | null>(null);
    const [editingContact, setEditingContact] = useState<ClientContact | null>(null);
    const [deletingContact, setDeletingContact] = useState<ClientContact | null>(null);
    const [isCreateEquipamentModalOpen, setIsCreateEquipamentModalOpen] = useState(false);
    const [equipamentClientForAction, setEquipamentClientForAction] = useState<Client | null>(null);
    const [equipamentClientSelectionMode, setEquipamentClientSelectionMode] = useState<"create" | "edit" | "delete" | null>(null);
    const [equipamentSelectionMode, setEquipamentSelectionMode] = useState<"edit" | "delete" | null>(null);
    const [editingEquipament, setEditingEquipament] = useState<Equipament | null>(null);
    const [deletingEquipament, setDeletingEquipament] = useState<Equipament | null>(null);
    const [isAllClientsExpanded, setIsAllClientsExpanded] = useState(false);

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
        const client = selectedClient ?? contactClientForAction;
        if (!client) return;

        await addContact(client.id, data);
        clearContactSearch();
        setIsCreateContactModalOpen(false);
        setContactClientForAction(null);
    }

    async function handleUpdateContact(data: UpdateContactRequest) {
        if (!editingContact) return;

        await editContact(editingContact.id, data);
        setEditingContact(null);
        setContactClientForAction(null);
    }

    async function handleDeleteContact() {
        if (!deletingContact) return;

        await removeContact(deletingContact.id);
        setDeletingContact(null);
        setContactClientForAction(null);
    }

    async function handleCreateEquipament(data: CreateEquipamentRequest) {
        const client = selectedClient ?? equipamentClientForAction;
        if (!client) return;

        await addEquipament(client.id, data);
        clearEquipamentSearch();
        setIsCreateEquipamentModalOpen(false);
        setEquipamentClientForAction(null);
    }

    async function handleUpdateEquipament(data: UpdateEquipamentRequest) {
        if (!editingEquipament) return;

        await editEquipament(editingEquipament.id, data);
        setEditingEquipament(null);
        setEquipamentClientForAction(null);
    }

    async function handleDeleteEquipament() {
        if (!deletingEquipament) return;

        await removeEquipament(deletingEquipament.id);
        setDeletingEquipament(null);
        setEquipamentClientForAction(null);
    }

    async function handleToggleAllClients() {
        if (isAllClientsExpanded) {
            setIsAllClientsExpanded(false);
            return;
        }

        setIsAllClientsExpanded(true);
        await loadClients();
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

                        <section className="contacts-section">
                            <header className="contacts-section__header">
                                <span className="contacts-section__eyebrow">Contatos</span>
                                <h2>Gerenciar contatos</h2>
                                <p>Adicione, edite ou exclua contatos vinculados aos clientes.</p>
                            </header>

                            <div className="contacts-section__actions">
                                <button
                                    className="clients-section__button clients-section__button--add"
                                    type="button"
                                    onClick={async () => {
                                        clearCreateContactError();
                                        setContactClientSelectionMode("create");
                                        await loadClients();
                                    }}
                                >
                                    Adicionar contato
                                </button>

                                <button
                                    className="clients-section__button"
                                    type="button"
                                    onClick={async () => {
                                        clearUpdateContactError();
                                        setContactClientSelectionMode("edit");
                                        await loadClients();
                                    }}
                                >
                                    Editar contato
                                </button>

                                <button
                                    className="clients-section__button clients-section__button--delete"
                                    type="button"
                                    onClick={async () => {
                                        clearDeleteContactError();
                                        setContactClientSelectionMode("delete");
                                        await loadClients();
                                    }}
                                >
                                    Excluir contato
                                </button>
                            </div>
                        </section>

                        <section className="equipaments-section">
                            <header className="equipaments-section__header">
                                <span className="equipaments-section__eyebrow">Equipamentos</span>
                                <h2>Gerenciar equipamentos</h2>
                                <p>Adicione, edite ou exclua equipamentos vinculados aos clientes.</p>
                            </header>

                            <div className="equipaments-section__actions">
                                <button
                                    className="clients-section__button clients-section__button--add"
                                    type="button"
                                    onClick={async () => {
                                        clearEquipamentCreateError();
                                        setEquipamentClientSelectionMode("create");
                                        await loadClients();
                                    }}
                                >
                                    Adicionar equipamento
                                </button>

                                <button
                                    className="clients-section__button"
                                    type="button"
                                    onClick={async () => {
                                        clearEquipamentUpdateError();
                                        setEquipamentClientSelectionMode("edit");
                                        await loadClients();
                                    }}
                                >
                                    Editar equipamento
                                </button>

                                <button
                                    className="clients-section__button clients-section__button--delete"
                                    type="button"
                                    onClick={async () => {
                                        clearEquipamentDeleteError();
                                        setEquipamentClientSelectionMode("delete");
                                        await loadClients();
                                    }}
                                >
                                    Excluir equipamento
                                </button>
                            </div>
                        </section>

                        <AllClientsSection
                            clients={clients}
                            isLoading={isLoading}
                            error={error}
                            isExpanded={isAllClientsExpanded}
                            onToggle={handleToggleAllClients}
                            onView={handleViewClient}
                        />
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

            <ClientSelectModal
                isOpen={contactClientSelectionMode !== null}
                title={
                    contactClientSelectionMode === "create"
                        ? "Selecionar cliente para adicionar contato"
                        : contactClientSelectionMode === "edit"
                            ? "Selecionar cliente para editar contato"
                            : "Selecionar cliente para excluir contato"
                }
                clients={clients}
                isLoading={isLoading}
                error={error}
                onClose={() => setContactClientSelectionMode(null)}
                onSelect={(client) => {
                    const mode = contactClientSelectionMode;
                    setContactClientSelectionMode(null);
                    setContactClientForAction(client);

                    if (mode === "create") {
                        clearCreateContactError();
                        setIsCreateContactModalOpen(true);
                        return;
                    }

                    if (mode === "edit") {
                        clearUpdateContactError();
                        setContactSelectionMode("edit");
                        void loadContacts(client.id);
                        return;
                    }

                    clearDeleteContactError();
                    setContactSelectionMode("delete");
                    void loadContacts(client.id);
                }}
            />

            <ContactSelectModal
                isOpen={contactSelectionMode !== null}
                title={contactSelectionMode === "edit" ? "Selecionar contato para editar" : "Selecionar contato para excluir"}
                contacts={contacts}
                isLoading={isLoadingContacts}
                error={contactError}
                onClose={() => {
                    setContactSelectionMode(null);
                    setContactClientForAction(null);
                }}
                onSelect={(contact) => {
                    setContactSelectionMode(null);

                    if (contactSelectionMode === "edit") {
                        clearUpdateContactError();
                        setEditingContact(contact);
                        return;
                    }

                    clearDeleteContactError();
                    setDeletingContact(contact);
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
                onClose={() => {
                    if (!isCreatingContact) {
                        setIsCreateContactModalOpen(false);
                        setContactClientForAction(null);
                    }
                }}
                onSubmit={handleCreateContact}
            />

            <ContactEditModal
                contact={editingContact}
                isSubmitting={isUpdatingContact}
                error={updateContactError}
                onClose={() => {
                    if (!isUpdatingContact) {
                        setEditingContact(null);
                        setContactClientForAction(null);
                    }
                }}
                onSubmit={handleUpdateContact}
            />

            <ContactDeleteModal
                contact={deletingContact}
                isSubmitting={isDeletingContact}
                error={deleteContactError}
                onClose={() => {
                    if (!isDeletingContact) {
                        setDeletingContact(null);
                        setContactClientForAction(null);
                    }
                }}
                onConfirm={handleDeleteContact}
            />

            <ClientSelectModal
                isOpen={equipamentClientSelectionMode !== null}
                title={
                    equipamentClientSelectionMode === "create"
                        ? "Selecionar cliente para adicionar equipamento"
                        : equipamentClientSelectionMode === "edit"
                            ? "Selecionar cliente para editar equipamento"
                            : "Selecionar cliente para excluir equipamento"
                }
                clients={clients}
                isLoading={isLoading}
                error={error}
                onClose={() => setEquipamentClientSelectionMode(null)}
                onSelect={(client) => {
                    const mode = equipamentClientSelectionMode;
                    setEquipamentClientSelectionMode(null);
                    setEquipamentClientForAction(client);

                    if (mode === "create") {
                        clearEquipamentCreateError();
                        setIsCreateEquipamentModalOpen(true);
                        return;
                    }

                    if (mode === "edit") {
                        clearEquipamentUpdateError();
                        setEquipamentSelectionMode("edit");
                        void loadEquipaments(client.id);
                        return;
                    }

                    clearEquipamentDeleteError();
                    setEquipamentSelectionMode("delete");
                    void loadEquipaments(client.id);
                }}
            />

            <EquipamentSelectModal
                isOpen={equipamentSelectionMode !== null}
                title={equipamentSelectionMode === "edit" ? "Selecionar equipamento para editar" : "Selecionar equipamento para excluir"}
                equipaments={equipaments}
                isLoading={isLoadingEquipaments}
                error={equipamentError}
                onClose={() => {
                    setEquipamentSelectionMode(null);
                    setEquipamentClientForAction(null);
                }}
                onSelect={(equipament) => {
                    setEquipamentSelectionMode(null);

                    if (equipamentSelectionMode === "edit") {
                        clearEquipamentUpdateError();
                        setEditingEquipament(equipament);
                        return;
                    }

                    clearEquipamentDeleteError();
                    setDeletingEquipament(equipament);
                }}
            />

            <EquipamentCreateModal
                clientId={equipamentClientForAction?.id ?? selectedClient?.id ?? ""}
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
                onClose={() => {
                    if (!isUpdatingEquipament) {
                        setEditingEquipament(null);
                        setEquipamentClientForAction(null);
                    }
                }}
                onSubmit={handleUpdateEquipament}
            />

            <EquipamentDeleteModal
                equipament={deletingEquipament}
                isSubmitting={isDeletingEquipament}
                error={equipamentDeleteError}
                onClose={() => {
                    if (!isDeletingEquipament) {
                        setDeletingEquipament(null);
                        setEquipamentClientForAction(null);
                    }
                }}
                onConfirm={handleDeleteEquipament}
            />
        </main>
    );
}
