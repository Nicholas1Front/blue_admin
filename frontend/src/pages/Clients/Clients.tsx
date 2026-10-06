import { useState } from "react";

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
        contacts,
        isSearching,
        isLoadingContacts,
        searchError,
        contactError,
        hasSearched,
        searchClients,
        clearClientSearch,
        loadContacts
    } = useClients();

    const {
        equipaments,
        isLoading: isLoadingEquipaments,
        error: equipamentError,
        loadEquipaments
    } = useEquipaments();

    const [selectedClient, setSelectedClient] = useState<Client | null>(null);

    async function handleViewClient(client: Client) {
        setSelectedClient(client);

        await Promise.all([
            loadContacts(client.id),
            loadEquipaments(client.id)
        ]);
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

                        <h1>Clientes e equipamentos</h1>

                        <p>
                            Consulte clientes, contatos e equipamentos em um
                            só lugar.
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
            </section>

            <ClientViewModal
                client={selectedClient}
                contacts={contacts}
                equipaments={equipaments}
                isLoadingContacts={isLoadingContacts}
                isLoadingEquipaments={isLoadingEquipaments}
                contactError={contactError}
                equipamentError={equipamentError}
                onClose={() => setSelectedClient(null)}
            />
        </main>
    );
}
