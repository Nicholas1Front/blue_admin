import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faArrowLeft,
    faBuilding,
    faBox,
    faEnvelope,
    faPenToSquare,
    faPhone,
    faTrash
} from "@fortawesome/free-solid-svg-icons";

import type {
    Client,
    ClientContact,
    FindContactsFilters
} from "../../../../modules/clients/clients.types";
import type {
    Equipament,
    FindEquipamentsFilters
} from "../../../../modules/equipaments/equipaments.types";
import { ContactSearch } from "../ContactSearch/ContactSearch";
import { EquipamentSearch } from "../EquipamentSearch/EquipamentSearch";

import "./ClientDetails.css";

interface ClientDetailsProps {
    client: Client;
    contacts: ClientContact[];
    contactSearchResults: ClientContact[];
    equipaments: Equipament[];
    equipamentSearchResults: Equipament[];
    isLoadingContacts: boolean;
    isSearchingContacts: boolean;
    isLoadingEquipaments: boolean;
    isSearchingEquipaments: boolean;
    contactError: string | null;
    contactSearchError: string | null;
    equipamentError: string | null;
    equipamentSearchError: string | null;
    hasSearchedContacts: boolean;
    hasSearchedEquipaments: boolean;
    onBack: () => void;
    onEditClient: () => void;
    onDeleteClient: () => void;
    onAddContact: () => void;
    onEditContact: (contact: ClientContact) => void;
    onDeleteContact: (contact: ClientContact) => void;
    onAddEquipament: () => void;
    onEditEquipament: (equipament: Equipament) => void;
    onDeleteEquipament: (equipament: Equipament) => void;
    onSearchContacts: (filters: FindContactsFilters) => Promise<void>;
    onClearContactSearch: () => void;
    onSearchEquipaments: (filters: FindEquipamentsFilters) => Promise<void>;
    onClearEquipamentSearch: () => void;
}

function getEquipamentTitle(equipament: Equipament) {
    return [
        equipament.type,
        equipament.brand,
        equipament.model,
        equipament.mainIdentification,
        equipament.additionalIdentification
    ]
        .filter((value): value is string => Boolean(value))
        .join(" ");
}

export function ClientDetails({
    client,
    contacts,
    contactSearchResults,
    equipaments,
    equipamentSearchResults,
    isLoadingContacts,
    isSearchingContacts,
    isLoadingEquipaments,
    isSearchingEquipaments,
    contactError,
    contactSearchError,
    equipamentError,
    equipamentSearchError,
    hasSearchedContacts,
    hasSearchedEquipaments,
    onBack,
    onEditClient,
    onDeleteClient,
    onAddContact,
    onEditContact,
    onDeleteContact,
    onAddEquipament,
    onEditEquipament,
    onDeleteEquipament,
    onSearchContacts,
    onClearContactSearch,
    onSearchEquipaments,
    onClearEquipamentSearch
}: ClientDetailsProps) {
    const visibleContacts = hasSearchedContacts
        ? contactSearchResults
        : contacts;

    const visibleEquipaments = hasSearchedEquipaments
        ? equipamentSearchResults
        : equipaments;

    return (
        <section className="client-details">
            <button className="client-details__back" type="button" onClick={onBack}>
                <FontAwesomeIcon icon={faArrowLeft} />
                Voltar para pesquisa
            </button>

            <header className="client-details__header">
                <div className="client-details__identity">
                    <div className="client-details__icon">
                        <FontAwesomeIcon icon={faBuilding} />
                    </div>

                    <div>
                        <span className="client-details__eyebrow">Cliente</span>
                        <h1>{client.name}</h1>
                    </div>
                </div>

                <div className="client-details__actions">
                    <button type="button" className="client-details__button">
                        <FontAwesomeIcon icon={faPenToSquare} />
                        Editar
                    </button>

                    <button
                        type="button"
                        className="client-details__button client-details__button--delete"
                    >
                        <FontAwesomeIcon icon={faTrash} />
                        Excluir
                    </button>
                </div>
            </header>

            <section className="client-details__client-card">
                <div>
                    <span>CPF/CNPJ</span>
                    <strong>{client.document || "Não informado"}</strong>
                </div>

                <div>
                    <span>Endereço</span>
                    <strong>{client.address || "Não informado"}</strong>
                </div>
            </section>

            <section className="client-details__section">
                <header className="client-details__section-header">
                    <div>
                        <div className="client-details__section-title">
                            <FontAwesomeIcon icon={faPhone} />
                            <h2>Contatos</h2>
                        </div>
                        <p>Pesquise e gerencie os contatos deste cliente.</p>
                    </div>

                    <button
                        type="button"
                        className="client-details__add-button"
                    >
                        Adicionar contato
                    </button>
                </header>

                <ContactSearch
                    clientId={client.id}
                    isSearching={isSearchingContacts}
                    onSearch={onSearchContacts}
                    onClear={onClearContactSearch}
                />

                {isLoadingContacts || isSearchingContacts ? (
                    <p className="client-details__feedback">Carregando contatos...</p>
                ) : contactError || contactSearchError ? (
                    <p className="client-details__feedback client-details__feedback--error">
                        {contactError || contactSearchError}
                    </p>
                ) : visibleContacts.length === 0 ? (
                    <p className="client-details__feedback">
                        Nenhum contato encontrado para este cliente.
                    </p>
                ) : (
                    <div className="client-details__contact-list">
                        {visibleContacts.map((contact) => (
                            <article className="client-details__contact" key={contact.id}>
                                <div>
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

                                <div className="client-details__item-actions">
                                    <button type="button" aria-label={"Editar contato " + contact.name}
                                        onClick={() => onEditContact(contact)}>
                                        <FontAwesomeIcon icon={faPenToSquare} />
                                    </button>
                                    <button
                                        type="button"
                                        className="client-details__item-delete"
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

            <section className="client-details__section">
                <header className="client-details__section-header">
                    <div>
                        <div className="client-details__section-title">
                            <FontAwesomeIcon icon={faBox} />
                            <h2>Equipamentos</h2>
                        </div>
                        <p>Pesquise e gerencie os equipamentos deste cliente.</p>
                    </div>

                    <button
                        type="button"
                        className="client-details__add-button"
                    >
                        Adicionar equipamento
                    </button>
                </header>

                <EquipamentSearch
                    clientId={client.id}
                    isSearching={isSearchingEquipaments}
                    onSearch={onSearchEquipaments}
                    onClear={onClearEquipamentSearch}
                />

                {isLoadingEquipaments || isSearchingEquipaments ? (
                    <p className="client-details__feedback">Carregando equipamentos...</p>
                ) : equipamentError || equipamentSearchError ? (
                    <p className="client-details__feedback client-details__feedback--error">
                        {equipamentError || equipamentSearchError}
                    </p>
                ) : visibleEquipaments.length === 0 ? (
                    <p className="client-details__feedback">
                        Nenhum equipamento encontrado para este cliente.
                    </p>
                ) : (
                    <div className="client-details__equipment-list">
                        {visibleEquipaments.map((equipament) => (
                            <article className="client-details__equipment" key={equipament.id}>
                                <div className="client-details__equipment-content">
                                    <strong>{getEquipamentTitle(equipament)}</strong>

                                    <div className="client-details__equipment-data">
                                        <span>Tipo: {equipament.type || "Não informado"}</span>
                                        <span>Marca: {equipament.brand || "Não informado"}</span>
                                        <span>Modelo: {equipament.model || "Não informado"}</span>
                                        <span>
                                            Identificação:{" "}
                                            {equipament.mainIdentification || "Não informada"}
                                        </span>
                                        <span>
                                            Identificação adicional:{" "}
                                            {equipament.additionalIdentification || "Não informada"}
                                        </span>
                                    </div>
                                </div>

                                <div className="client-details__item-actions">
                                    <button
                                        type="button"
                                        aria-label={"Editar equipamento " + getEquipamentTitle(equipament)}
                                    >
                                        <FontAwesomeIcon icon={faPenToSquare} />
                                    </button>
                                    <button
                                        type="button"
                                        className="client-details__item-delete"
                                        aria-label={"Excluir equipamento " + getEquipamentTitle(equipament)}
                                    >
                                        <FontAwesomeIcon icon={faTrash} />
                                    </button>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </section>
        </section>
    );
}
