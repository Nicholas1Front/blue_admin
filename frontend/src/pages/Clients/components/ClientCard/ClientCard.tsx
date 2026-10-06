import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBuilding, faChevronRight, faLocationDot, faIdCard } from "@fortawesome/free-solid-svg-icons";

import type { Client } from "../../../../modules/clients/clients.types";

import "./ClientCard.css";

interface ClientCardProps {
    client: Client;
    onClick: () => void;
}

export function ClientCard({ client, onClick }: ClientCardProps) {
    return (
        <button className="client-card" type="button" onClick={onClick}>
            <div className="client-card__top">
                <span className="client-card__icon">
                    <FontAwesomeIcon icon={faBuilding} />
                </span>
                <FontAwesomeIcon className="client-card__arrow" icon={faChevronRight} />
            </div>

            <strong className="client-card__name">{client.name}</strong>

            <div className="client-card__info">
                <span>
                    <FontAwesomeIcon icon={faIdCard} />
                    {client.document || "Documento não informado"}
                </span>

                <span>
                    <FontAwesomeIcon icon={faLocationDot} />
                    {client.address || "Endereço não informado"}
                </span>
            </div>
        </button>
    );
}
