import { useEffect, useMemo, useState } from "react";
import { Modal } from "../../../../components/Modal/Modal";
import type { ClientContact } from "../../../../modules/clients/clients.types";
import "./ContactSelectModal.css";

interface ContactSelectModalProps {
    isOpen: boolean;
    title: string;
    contacts: ClientContact[];
    isLoading: boolean;
    error: string | null;
    onClose: () => void;
    onSelect: (contact: ClientContact) => void;
}

export function ContactSelectModal({
    isOpen, title, contacts, isLoading, error, onClose, onSelect
}: ContactSelectModalProps) {
    const [search, setSearch] = useState("");

    useEffect(() => {
        if (isOpen) setSearch("");
    }, [isOpen]);

    const filteredContacts = useMemo(() => {
        const normalizedSearch = search.trim().toLocaleLowerCase();
        if (!normalizedSearch) return contacts;
        return contacts.filter((contact) =>
            contact.name.toLocaleLowerCase().includes(normalizedSearch)
        );
    }, [contacts, search]);

    return (
        <Modal isOpen={isOpen} title={title} onClose={onClose}>
            <div className="contact-select">
                <div className="contact-select__field">
                    <label htmlFor="contact-select-search">Pesquisar contato</label>
                    <input
                        id="contact-select-search"
                        type="search"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Digite o nome do contato"
                        disabled={isLoading}
                        autoFocus
                    />
                </div>
                {isLoading && <div className="contact-select__feedback"><p>Carregando contatos...</p></div>}
                {!isLoading && error && <div className="contact-select__feedback" role="alert"><p>{error}</p></div>}
                {!isLoading && !error && filteredContacts.length === 0 && (
                    <div className="contact-select__feedback">
                        <p>{contacts.length === 0 ? "Nenhum contato cadastrado para este cliente." : "Nenhum contato encontrado."}</p>
                    </div>
                )}
                {!isLoading && !error && filteredContacts.length > 0 && (
                    <div className="contact-select__list">
                        {filteredContacts.map((contact) => (
                            <button
                                className="contact-select__item"
                                key={contact.id}
                                type="button"
                                onClick={() => onSelect(contact)}
                            >
                                <strong>{contact.name}</strong>
                                <span>{contact.phoneNumber}{contact.email ? " • " + contact.email : ""}</span>
                            </button>
                        ))}
                    </div>
                )}
                <div className="contact-select__actions">
                    <button className="contact-select__cancel" type="button" onClick={onClose} disabled={isLoading}>
                        Cancelar
                    </button>
                </div>
            </div>
        </Modal>
    );
}
