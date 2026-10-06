import { useState, type FormEvent } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faMagnifyingGlass,
    faRotateLeft
} from "@fortawesome/free-solid-svg-icons";

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
    const [name, setName] = useState("");
    const [document, setDocument] = useState("");
    const [address, setAddress] = useState("");
    const [validationError, setValidationError] = useState<string | null>(null);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const filters: FindClientsFilters = {
            name: name.trim() || undefined,
            document: document.trim() || undefined,
            address: address.trim() || undefined
        };

        if (!filters.name && !filters.document && !filters.address) {
            setValidationError("Informe pelo menos um filtro para pesquisar.");
            return;
        }

        setValidationError(null);
        await onSearch(filters);
    }

    function handleClear() {
        setName("");
        setDocument("");
        setAddress("");
        setValidationError(null);
        onClear();
    }

    return (
        <section
            className={
                "client-search" +
                (hasSearched ? " client-search--has-results" : "")
            }
        >
            <div className="client-search__header">
                <span className="client-search__eyebrow">
                    Consulta
                </span>

                <h2>Pesquisar clientes</h2>

                <p>
                    Encontre um cliente pelo nome, CPF/CNPJ ou endereço.
                </p>
            </div>

            <form className="client-search__form" onSubmit={handleSubmit}>
                <div className="client-search__field client-search__field--name">
                    <label htmlFor="client-search-name">Nome</label>

                    <input
                        id="client-search-name"
                        type="text"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        placeholder="Nome do cliente"
                        disabled={isSearching}
                    />
                </div>

                <div className="client-search__field">
                    <label htmlFor="client-search-document">
                        CPF/CNPJ
                    </label>

                    <input
                        id="client-search-document"
                        type="text"
                        value={document}
                        onChange={(event) => setDocument(event.target.value)}
                        placeholder="CPF ou CNPJ"
                        maxLength={14}
                        disabled={isSearching}
                    />
                </div>

                <div className="client-search__field">
                    <label htmlFor="client-search-address">Endereço</label>

                    <input
                        id="client-search-address"
                        type="text"
                        value={address}
                        onChange={(event) => setAddress(event.target.value)}
                        placeholder="Endereço"
                        disabled={isSearching}
                    />
                </div>

                <div className="client-search__actions">
                    <button
                        className="client-search__clear"
                        type="button"
                        onClick={handleClear}
                        disabled={isSearching}
                    >
                        <FontAwesomeIcon icon={faRotateLeft} />
                        Limpar
                    </button>

                    <button
                        className="client-search__submit"
                        type="submit"
                        disabled={isSearching}
                    >
                        <FontAwesomeIcon icon={faMagnifyingGlass} />
                        {isSearching ? "Pesquisando..." : "Pesquisar"}
                    </button>
                </div>
            </form>

            {validationError && (
                <p className="client-search__validation-error" role="alert">
                    {validationError}
                </p>
            )}
        </section>
    );
}
