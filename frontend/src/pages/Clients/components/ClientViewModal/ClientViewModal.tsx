import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faBuilding,
    faBox,
    faEnvelope,
    faPenToSquare,
    faPhone,
    faTrash
} from "@fortawesome/free-solid-svg-icons";

import { Modal } from "../../../../components/Modal/Modal";
import type { Client, ClientContact } from "../../../../modules/clients/clients.types";

import "./ClientViewModal.css";

interface ClientViewModalProps {
    client: Client | null;
    contacts: ClientContact[];
    isLoadingContacts: boolean;
    contactError: string | null;
    onClose: () => void;
}

export function ClientViewModal({
    client,
    contacts,
    isLoadingContacts,
    contactError,
    onClose
}: ClientViewModalProps) {
    if (!client) {
        return null;
    }

    return (
        <Modal
            isOpen={client !== null}
            title="Detalhes do cliente"
            onClose={onClose}
        >
            <div className="client-view">
                <section className="client-view__section">
                    <div className="client-view__section-header">
                        <div className="client-view__section-title">
                            <FontAwesomeIcon icon={faBuilding} />
                            <h3>Cliente</h3>
                        </div>

                        <div className="client-view__actions">
                            <button
                                className="client-view__action"
                                type="button"
                                disabled
                                title="Edição será adicionada nesta etapa"
                            >
                                <FontAwesomeIcon icon={faPenToSquare} />
                                Editar
                            </button>

                            <button
                                className="client-view__action client-view__action--delete"
                                type="button"
                                disabled
                                title="Exclusão será adicionada nesta etapa"
                            >
                                <FontAwesomeIcon icon={faTrash} />
                                Excluir
                            </button>
                        </div>
                    </div>

                    <div className="client-view__grid">
                        <div className="client-view__item">
                            <span className="client-view__label">Nome</span>
                            <span className="client-view__value">
                                {client.name}
                            </span>
                        </div>

                        <div className="client-view__item">
                            <span className="client-view__label">
                                CPF/CNPJ
                            </span>
                            <span className="client-view__value">
                                {client.document || "Não informado"}
                            </span>
                        </div>

                        <div className="client-view__item client-view__item--full">
                            <span className="client-view__label">
                                Endereço
                            </span>
                            <span className="client-view__value">
                                {client.address || "Não informado"}
                            </span>
                        </div>
                    </div>
                </section>

                <section className="client-view__section">
                    <div className="client-view__section-header">
                        <div className="client-view__section-title">
                            <FontAwesomeIcon icon={faPhone} />
                            <h3>Contatos</h3>
                        </div>

                        <button
                            className="client-view__section-action"
                            type="button"
                            disabled
                            title="Adição de contatos será adicionada nesta etapa"
                        >
                            Adicionar
                        </button>
                    </div>

                    {isLoadingContacts && (
                        <p className="client-view__feedback">
                            Carregando contatos...
                        </p>
                    )}

                    {!isLoadingContacts && contactError && (
                        <p className="client-view__feedback client-view__feedback--error">
                            {contactError}
                        </p>
                    )}

                    {!isLoadingContacts && !contactError && contacts.length === 0 && (
                        <p className="client-view__feedback">
                            Este cliente ainda não possui contatos cadastrados.
                        </p>
                    )}

                    {!isLoadingContacts && !contactError && contacts.length > 0 && (
                        <div className="client-view__list">
                            {contacts.map((contact) => (
                                <article
                                    className="client-view__list-item"
                                    key={contact.id}
                                >
                                    <div className="client-view__list-content">
                                        <strong>{contact.name}</strong>

                                        <span>
                                            <FontAwesomeIcon icon={faEnvelope} />
                                            {contact.email}
                                        </span>

                                        <span>
                                            <FontAwesomeIcon icon={faPhone} />
                                            {contact.phoneNumber}
                                        </span>
                                    </div>

                                    <div className="client-view__list-actions">
                                        <button
                                            type="button"
                                            disabled
                                            title="Editar contato"
                                            aria-label={"Editar contato " + contact.name}
                                        >
                                            <FontAwesomeIcon icon={faPenToSquare} />
                                        </button>

                                        <button
                                            className="client-view__list-action--delete"
                                            type="button"
                                            disabled
                                            title="Excluir contato"
                                            aria-label={"Excluir contato " + contact.name}
                                        >
                                            <FontAwesomeIcon icon={faTrash} />
                                        </button>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </section>

                <section className="client-view__section">
                    <div className="client-view__section-header">
                        <div className="client-view__section-title">
                            <FontAwesomeIcon icon={faBox} />
                            <h3>Equipamentos</h3>
                        </div>

                        <button
                            className="client-view__section-action"
                            type="button"
                            disabled
                            title="Adição de equipamentos será adicionada nesta etapa"
                        >
                            Adicionar
                        </button>
                    </div>

                    <p className="client-view__feedback">
                        Os equipamentos deste cliente serão carregados e
                        gerenciados nesta seção.
                    </p>
                </section>
            </div>
        </Modal>
    );
}
