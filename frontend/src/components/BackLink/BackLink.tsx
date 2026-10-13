import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { Link } from "react-router-dom";

import "./BackLink.css";

type BackLinkProps = {
    to?: string;
    label?: string;
};

export function BackLink({
    to = "/dashboard",
    label = "Voltar ao painel principal"
}: BackLinkProps) {
    return (
        <Link className="app-back-link" to={to} aria-label={label} title={label}>
            <FontAwesomeIcon icon={faArrowLeft} aria-hidden="true" />
            <span className="app-back-link__label">{label}</span>
        </Link>
    );
}
