import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBuilding, faChevronDown, faChevronUp } from "@fortawesome/free-solid-svg-icons";

import type { Client } from "../../../../modules/clients/clients.types";

import "./AllClientsSection.css";

interface AllClientsSectionProps {
    clients: Client[];
    isLoading: boolean;
    error: string | null;
    isExpanded: boolean;
    onToggle: () => void;
    onView: (client: Client) => void;
}

export function AllClientsSection({
    clients,
    isLoading,
    error,
    isExpanded,
    onToggle,
    onView
}: AllClientsSectionProps) {
    return (
        <section className="all-clients-section">
            <header className="all-clients-section__header">
                <div>
                    <span className="all-clients-section__eyebrow">
                        Clientes cadastrados
                    </span>

                    <h2>Todos os clientes</h2>
                    <p>Exiba a lista completa de clientes cadastrados no sistema.</p>
                </div>

                <button
                    className="all-clients-section__toggle"
                    type="button"
                    onClick={onToggle}
                    aria-expanded={isExpanded}
                >
                    <FontAwesomeIcon icon={isExpanded ? faChevronUp : faChevronDown} />
                    {isExpanded ? "Recolher clientes" : "Mostrar todos os clientes"}
                </button>
            </header>

            {isExpanded && (
                <>
                    {!isLoading && !error && (
                        <div className="all-clients-section__count">
                            {clients.length}{" "}
                            {clients.length === 1 ? "cliente" : "clientes"}
                        </div>
                    )}

                    {isLoading && (
                        <div className="all-clients-section__feedback">
                            <p>Carregando clientes...</p>
                        </div>
                    )}

                    {!isLoading && error && (
                        <div className="all-clients-section__feedback all-clients-section__feedback--error" role="alert">
                            <p>{error}</p>
                        </div>
                    )}

                    {!isLoading && !error && clients.length === 0 && (
                        <div className="all-clients-section__feedback">
                            <p>Nenhum cliente cadastrado.</p>
                        </div>
                    )}

                    {!isLoading && !error && clients.length > 0 && (
                        <div className="all-clients-section__items">
                            {clients.map((client) => (
                                <button
                                    className="all-clients-section__card"
                                    key={client.id}
                                    type="button"
                                    onClick={() => onView(client)}
                                >
                                    <div className="all-clients-section__icon">
                                        <FontAwesomeIcon icon={faBuilding} />
                                    </div>

                                    <div className="all-clients-section__main">
                                        <span className="all-clients-section__name">
                                            {client.name}
                                        </span>

                                        <div className="all-clients-section__metadata">
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

                                    <span className="all-clients-section__hint">
                                        Abrir
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}
                </>
            )}
        </section>
    );
}
