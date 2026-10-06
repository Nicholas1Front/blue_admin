import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass, faRotateLeft } from "@fortawesome/free-solid-svg-icons";

import type { FindClientsFilters } from "../../../../modules/clients/clients.types";

import "./ClientSearch.css";

interface ClientSearchProps {
    isSearching: boolean;
    hasSearched: boolean;
    onSearch: (filters: FindClientsFilters) => Promise<void>;
    onClear: () => void;
}

export function ClientSearch({
    isSearching,
    hasSearched,
    onSearch,
    onClear
}: ClientSearchProps) {
    const [id, setId] = useState("");
    const [name, setName] = useState("");
    const [document, setDocument] = useState("");
    const [address, setAddress] = useState("");

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const filters: FindClientsFilters = {};

        if (id.trim()) filters.id = id.trim();
        if (name.trim()) filters.name = name.trim();
        if (document.trim()) filters.document = document.trim();
        if (address.trim()) filters.address = address.trim();

        if (Object.keys(filters).length === 0) {
            return;
        }

        await onSearch(filters);
    }

    function handleClear() {
        setId("");
        setName("");
        setDocument("");
        setAddress("");
        onClear();
    }

    return (
        <section className="client-search">
            <div className="client-search__header">
                <span className="client-search__eyebrow">Pesquisa</span>
                <h2>Encontrar cliente</h2>
                <p>
                    Use um ou mais filtros para localizar rapidamente um cliente.
                </p>
            </div>

            <form className="client-search__form" onSubmit={handleSubmit}>
                <label>
                    <span>ID</span>
                    <input value={id} onChange={(event) => setId(event.target.value)} placeholder="ID do cliente" />
                </label>

                <label>
                    <span>Nome</span>
                    <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Nome do cliente" />
                </label>

                <label>
                    <span>CPF / CNPJ</span>
                    <input value={document} onChange={(event) => setDocument(event.target.value)} placeholder="CPF ou CNPJ" />
                </label>

                <label>
                    <span>Endereço</span>
                    <input value={address} onChange={(event) => setAddress(event.target.value)} placeholder="Endereço" />
                </label>

                <div className="client-search__actions">
                    <button className="client-search__button client-search__button--primary" type="submit" disabled={isSearching}>
                        <FontAwesomeIcon icon={faMagnifyingGlass} />
                        {isSearching ? "Pesquisando..." : "Pesquisar"}
                    </button>

                    {hasSearched && (
                        <button className="client-search__button client-search__button--secondary" type="button" onClick={handleClear} disabled={isSearching}>
                            <FontAwesomeIcon icon={faRotateLeft} />
                            Limpar
                        </button>
                    )}
                </div>
            </form>
        </section>
    );
}
