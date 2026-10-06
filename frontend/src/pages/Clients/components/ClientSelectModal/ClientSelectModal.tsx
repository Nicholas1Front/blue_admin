import { useEffect, useMemo, useState } from "react";

import { Modal } from "../../../../components/Modal/Modal";
import type { Client } from "../../../../modules/clients/clients.types";

import "./ClientSelectModal.css";

interface ClientSelectModalProps {
    isOpen: boolean;
    title: string;
    clients: Client[];
    isLoading: boolean;
    error: string | null;
    onClose: () => void;
    onSelect: (client: Client) => void;
}

export function ClientSelectModal({
    isOpen,
    title,
    clients,
    isLoading,
    error,
    onClose,
    onSelect
}: ClientSelectModalProps) {
    const [search, setSearch] = useState("");

    useEffect(() => {
        if (isOpen) {
            setSearch("");
        }
    }, [isOpen]);

    const filteredClients = useMemo(() => {
        const normalizedSearch = search.trim().toLocaleLowerCase();

        if (!normalizedSearch) {
            return clients;
        }

        return clients.filter((client) =>
            client.name.toLocaleLowerCase().includes(normalizedSearch)
        );
    }, [clients, search]);

    return (
        <Modal isOpen={isOpen} title={title} onClose={onClose}>
            <div className="client-select">
                <div className="client-select__field">
                    <label htmlFor="client-select-search">
                        Pesquisar cliente
                    </label>

                    <input
                        id="client-select-search"
                        type="search"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Digite o nome do cliente"
                        disabled={isLoading}
                        autoFocus
                    />
                </div>

                {isLoading && (
                    <div className="client-select__feedback">
                        <p>Carregando clientes...</p>
                    </div>
                )}

                {!isLoading && error && (
                    <div className="client-select__feedback" role="alert">
                        <p>{error}</p>
                    </div>
                )}

                {!isLoading && !error && filteredClients.length === 0 && (
                    <div className="client-select__feedback">
                        <p>
                            {clients.length === 0
                                ? "Nenhum cliente cadastrado."
                                : "Nenhum cliente encontrado."}
                        </p>
                    </div>
                )}

                {!isLoading && !error && filteredClients.length > 0 && (
                    <div className="client-select__list">
                        {filteredClients.map((client) => (
                            <button
                                className="client-select__item"
                                key={client.id}
                                type="button"
                                onClick={() => onSelect(client)}
                            >
                                <strong>{client.name}</strong>

                                <span>
                                    {client.document || "Documento não informado"}
                                </span>
                            </button>
                        ))}
                    </div>
                )}

                <div className="client-select__actions">
                    <button
                        className="client-select__cancel"
                        type="button"
                        onClick={onClose}
                        disabled={isLoading}
                    >
                        Cancelar
                    </button>
                </div>
            </div>
        </Modal>
    );
}
