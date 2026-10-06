import { useState, type FormEvent } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass, faRotateLeft } from "@fortawesome/free-solid-svg-icons";

import type { FindContactsFilters } from "../../../../modules/clients/clients.types";

import "./ContactSearch.css";

interface ContactSearchProps {
    clientId: string;
    isSearching: boolean;
    onSearch: (filters: FindContactsFilters) => Promise<void>;
    onClear: () => void;
}

export function ContactSearch({
    clientId,
    isSearching,
    onSearch,
    onClear
}: ContactSearchProps) {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        await onSearch({
            clientId,
            name: name.trim() || undefined,
            email: email.trim() || undefined,
            phoneNumber: phoneNumber.trim() || undefined
        });
    }

    function handleClear() {
        setName("");
        setEmail("");
        setPhoneNumber("");
        onClear();
    }

    return (
        <form className="contact-search" onSubmit={handleSubmit}>
            <div className="contact-search__field">
                <label htmlFor="contact-search-name">Nome</label>
                <input
                    id="contact-search-name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Nome do contato"
                    disabled={isSearching}
                />
            </div>

            <div className="contact-search__field">
                <label htmlFor="contact-search-email">E-mail</label>
                <input
                    id="contact-search-email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="E-mail"
                    disabled={isSearching}
                />
            </div>

            <div className="contact-search__field">
                <label htmlFor="contact-search-phone">Telefone</label>
                <input
                    id="contact-search-phone"
                    value={phoneNumber}
                    onChange={(event) => setPhoneNumber(event.target.value)}
                    placeholder="Telefone"
                    disabled={isSearching}
                />
            </div>

            <div className="contact-search__actions">
                <button type="button" onClick={handleClear} disabled={isSearching}>
                    <FontAwesomeIcon icon={faRotateLeft} />
                    Limpar
                </button>
                <button type="submit" disabled={isSearching}>
                    <FontAwesomeIcon icon={faMagnifyingGlass} />
                    {isSearching ? "Pesquisando..." : "Pesquisar"}
                </button>
            </div>
        </form>
    );
}
