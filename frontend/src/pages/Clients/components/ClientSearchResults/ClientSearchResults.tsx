import type { Client } from "../../../../modules/clients/clients.types";
import { ClientCard } from "../ClientCard/ClientCard";

import "./ClientSearchResults.css";

interface ClientSearchResultsProps {
    clients: Client[];
    isSearching: boolean;
    hasSearched: boolean;
    error: string | null;
    onSelect: (client: Client) => void;
}

export function ClientSearchResults({ clients, isSearching, hasSearched, error, onSelect }: ClientSearchResultsProps) {
    if (isSearching) {
        return <section className="client-results client-results--feedback"><p>Pesquisando clientes...</p></section>;
    }

    if (!hasSearched) {
        return <section className="client-results client-results--feedback"><p>Informe pelo menos um filtro para começar a pesquisa.</p></section>;
    }

    if (error) {
        return <section className="client-results client-results--feedback" role="alert"><p>{error}</p></section>;
    }

    if (clients.length === 0) {
        return <section className="client-results client-results--feedback"><p>Nenhum cliente encontrado com os filtros informados.</p></section>;
    }

    return (
        <section className="client-results">
            <div className="client-results__header">
                <span>Resultados</span>
                <strong>{clients.length} cliente(s) encontrado(s)</strong>
            </div>

            <div className="client-results__grid">
                {clients.map((client) => (
                    <ClientCard key={client.id} client={client} onClick={() => onSelect(client)} />
                ))}
            </div>
        </section>
    );
}
