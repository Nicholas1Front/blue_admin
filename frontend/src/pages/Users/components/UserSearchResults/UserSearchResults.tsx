import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faEye,
    faPenToSquare,
    faTrash
} from "@fortawesome/free-solid-svg-icons";

import type { User } from "../../../../modules/users/users.types";

import "./UserSearchResults.css";

interface UserSearchResultsProps {
    users: User[];
    isSearching: boolean;
    hasSearched: boolean;
    error: string | null;
    onView: (user: User) => void;
    onEdit: (user: User) => void;
    onDelete: (user: User) => void;
}

function formatDate(value: string): string {
    return new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "medium"
    }).format(new Date(value));
}

export function UserSearchResults({
    users,
    isSearching,
    hasSearched,
    error,
    onView,
    onEdit,
    onDelete
}: UserSearchResultsProps) {
    if (!hasSearched) {
        return null;
    }

    return (
        <section className="user-search-results">
            <header className="user-search-results__header">
                <div>
                    <span className="user-search-results__eyebrow">
                        Resultado da pesquisa
                    </span>

                    <h2>Usuários encontrados</h2>
                </div>

                {!isSearching && !error && (
                    <span className="user-search-results__count">
                        {users.length} {users.length === 1 ? "resultado" : "resultados"}
                    </span>
                )}
            </header>

            {isSearching && (
                <div className="user-search-results__feedback">
                    <p>Pesquisando usuários...</p>
                </div>
            )}

            {!isSearching && error && (
                <div className="user-search-results__feedback" role="alert">
                    <p>{error}</p>
                </div>
            )}

            {!isSearching && !error && users.length === 0 && (
                <div className="user-search-results__empty">
                    <p>Nenhum usuário encontrado com os filtros informados.</p>
                </div>
            )}

            {!isSearching && !error && users.length > 0 && (
                <div className="user-search-results__items">
                    {users.map((user) => (
                        <article
                            className="user-search-results__card"
                            key={user.id}
                        >
                            <div className="user-search-results__main">
                                <div className="user-search-results__identity">
                                    <span className="user-search-results__name">
                                        {user.name}
                                    </span>

                                    <span className="user-search-results__email">
                                        {user.email}
                                    </span>
                                </div>

                                <div className="user-search-results__metadata">
                                    <span>
                                        <strong>ID</strong>
                                        {user.id}
                                    </span>

                                    <span>
                                        <strong>Cadastrado</strong>
                                        {formatDate(user.createdAt)}
                                    </span>
                                </div>
                            </div>

                            <div className="user-search-results__actions">
                                <button
                                    className="user-search-results__action"
                                    type="button"
                                    onClick={() => onView(user)}
                                    title="Visualizar usuário"
                                    aria-label={"Visualizar usuário " + user.name}
                                >
                                    <FontAwesomeIcon icon={faEye} />
                                </button>

                                <button
                                    className="user-search-results__action"
                                    type="button"
                                    onClick={() => onEdit(user)}
                                    title="Editar usuário"
                                    aria-label={"Editar usuário " + user.name}
                                >
                                    <FontAwesomeIcon icon={faPenToSquare} />
                                </button>

                                <button
                                    className="user-search-results__action user-search-results__action--delete"
                                    type="button"
                                    onClick={() => onDelete(user)}
                                    title="Excluir usuário"
                                    aria-label={"Excluir usuário " + user.name}
                                >
                                    <FontAwesomeIcon icon={faTrash} />
                                </button>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </section>
    );
}
