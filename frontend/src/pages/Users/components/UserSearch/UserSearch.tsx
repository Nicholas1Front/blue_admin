import { useState, type FormEvent } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faMagnifyingGlass,
    faRotateLeft
} from "@fortawesome/free-solid-svg-icons";

import type { FindUserFilters } from "../../../../modules/users/users.types";

import "./UserSearch.css";

interface UserSearchProps {
    isSearching: boolean;
    hasSearched: boolean;
    onSearch: (filters: FindUserFilters) => Promise<void>;
    onClear: () => void;
}

export function UserSearch({
    isSearching,
    hasSearched,
    onSearch,
    onClear
}: UserSearchProps) {
    const [id, setId] = useState("");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        await onSearch({
            id: id.trim() || undefined,
            name: name.trim() || undefined,
            email: email.trim() || undefined
        });
    }

    function handleClear() {
        setId("");
        setName("");
        setEmail("");
        onClear();
    }

    return (
        <section className="user-search">
            <div className="user-search__header">
                <span className="user-search__eyebrow">
                    Consulta
                </span>

                <h2>Pesquisar usuários</h2>

                <p>
                    Use um ou mais filtros para encontrar usuários cadastrados.
                </p>
            </div>

            <form className="user-search__form" onSubmit={handleSubmit}>
                <div className="user-search__field">
                    <label htmlFor="user-search-name">Nome</label>

                    <input
                        id="user-search-name"
                        type="text"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        placeholder="Nome do usuário"
                        disabled={isSearching}
                    />
                </div>

                <div className="user-search__field">
                    <label htmlFor="user-search-email">E-mail</label>

                    <input
                        id="user-search-email"
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="E-mail do usuário"
                        disabled={isSearching}
                    />
                </div>

                <div className="user-search__field user-search__field--id">
                    <label htmlFor="user-search-id">ID</label>

                    <input
                        id="user-search-id"
                        type="text"
                        value={id}
                        onChange={(event) => setId(event.target.value)}
                        placeholder="ID do usuário"
                        disabled={isSearching}
                    />
                </div>

                <div className="user-search__actions">
                    <button
                        className="user-search__clear"
                        type="button"
                        onClick={handleClear}
                        disabled={isSearching}
                    >
                        <FontAwesomeIcon icon={faRotateLeft} />
                        Limpar
                    </button>

                    <button
                        className="user-search__submit"
                        type="submit"
                        disabled={isSearching}
                    >
                        <FontAwesomeIcon icon={faMagnifyingGlass} />
                        {isSearching ? "Pesquisando..." : "Pesquisar"}
                    </button>
                </div>
            </form>
        </section>
    );
}
