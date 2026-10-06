import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBuilding } from "@fortawesome/free-solid-svg-icons";

import type { Client } from "../../../../modules/clients/clients.types";

import "./ClientSearchResults.css";

interface ClientSearchResultsProps {
    clients: Client[];
    isSearching: boolean;
    hasSearched: boolean;
    error: string | null;
    onView: (client: Client) => void;
}

export function ClientSearchResults({
    clients,
    isSearching,
    hasSearched,
    error,
    onView
}: ClientSearchResultsProps) {
    if (!hasSearched) {
        return null;
    }

    return (
        <section className="client-search-results">
            <header className="client-search-results__header">
                <div>
                    <span className="client-search-results__eyebrow">
                        Resultado da pesquisa
                    </span>

                    <h2>Clientes encontrados</h2>
                </div>

                {!isSearching && !error && (
                    <span className="client-search-results__count">
                        {clients.length}{" "}
                        {clients.length === 1 ? "resultado" : "resultados"}
                    </span>
                )}
            </header>

            {isSearching && (
                <div className="client-search-results__feedback">
                    <p>Pesquisando clientes...</p>
                </div>
            )}

            {!isSearching && error && (
                <div className="client-search-results__feedback" role="alert">
                    <p>{error}</p>
                </div>
            )}

            {!isSearching && !error && clients.length === 0 && (
                <div className="client-search-results__empty">
                    <p>
                        Nenhum cliente encontrado com os filtros informados.
                    </p>
                </div>
            )}

            {!isSearching && !error && clients.length > 0 && (
                <div className="client-search-results__items">
                    {clients.map((client) => (
                        <button
                            className="client-search-results__card"
                            key={client.id}
                            type="button"
                            onClick={() => onView(client)}
                        >
                            <div className="client-search-results__icon">
                                <FontAwesomeIcon icon={faBuilding} />
                            </div>

                            <div className="client-search-results__main">
                                <span className="client-search-results__name">
                                    {client.name}
                                </span>

                                <div className="client-search-results__metadata">
                                    <span>
                                        <strong>CPF/CNPJ</strong>
                                        {client.document || "Não informado"}
                                    </span>

                                    <span>
                                        <strong>Endereço</strong>
                                        {client.address || "Não informado"}
                                    </span>
                                </div>
                            </div>

                            <span className="client-search-results__hint">
                                Abrir
                            </span>
                        </button>
                    ))}
                </div>
            )}
        </section>
    );
}
