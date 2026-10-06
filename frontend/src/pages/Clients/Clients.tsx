import { useState } from "react";

import { AppHeader } from "../../components/AppHeader/AppHeader";
import { useClients } from "../../modules/clients/useClients";
import { useEquipaments } from "../../modules/equipaments/useEquipaments";
import type { Client } from "../../modules/clients/clients.types";
import { ClientSearch } from "./components/ClientSearch/ClientSearch";
import { ClientSearchResults } from "./components/ClientSearchResults/ClientSearchResults";
import { ClientDetails } from "./components/ClientDetails/ClientDetails";

import "./Clients.css";

export function Clients() {
    document.title = "Gestão | Blue Admin";

    const {
        clientSearchResults,
        contacts,
        contactSearchResults,
        isSearching,
        isUpdating,
        isDeleting,
        updateError,
        deleteError,
        isLoadingContacts,
        isSearchingContacts,
        searchError,
        contactError,
        searchContactError,
        hasSearched,
        hasSearchedContacts,
        searchClients,
        clearClientSearch,
        loadContacts,
        searchContacts,
        clearContactSearch
    } = useClients();

    const {
        equipaments,
        searchResults: equipamentSearchResults,
        isLoading: isLoadingEquipaments,
        isSearching: isSearchingEquipaments,
        error: equipamentError,
        searchError: equipamentSearchError,
        hasSearched: hasSearchedEquipaments,
        loadEquipaments,
        searchEquipaments,
        clearSearch: clearEquipamentSearch
    } = useEquipaments();

    const [selectedClient, setSelectedClient] = useState<Client | null>(null);

    async function handleViewClient(client: Client) {
        setSelectedClient(client);

        clearContactSearch();
        clearEquipamentSearch();

        await Promise.all([
            loadContacts(client.id),
            loadEquipaments(client.id)
        ]);
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
                                <span className="clients-header__eyebrow">
                                    Gestão
                                </span>

                                <h1>Clientes e equipamentos</h1>

                                <p>
                                    Consulte clientes, contatos e equipamentos
                                    em um só lugar.
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
                        onSearchContacts={searchContacts}
                        onClearContactSearch={clearContactSearch}
                        onSearchEquipaments={searchEquipaments}
                        onClearEquipamentSearch={clearEquipamentSearch}
                    />
                )}
            </section>
        </main>
    );
}
