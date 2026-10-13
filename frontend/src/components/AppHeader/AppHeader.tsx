import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faArrowRightFromBracket, faGear } from "@fortawesome/free-solid-svg-icons";
import { Link, useNavigate } from "react-router-dom";

import { AppLogo } from "../AppLogo/AppLogo";
import { useAuth } from "../../modules/auth/useAuth";

import "./AppHeader.css";

export function AppHeader({ showBackLink = false }: { showBackLink?: boolean }) {
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    function handleLogout() {
        logout();
        navigate("/login");
    }

    return (
        <div className="app-header-container">
            <header
                className={`app-header${showBackLink ? " app-header--with-back-link" : ""}`}
            >
                <AppLogo />

                <div className="app-header__actions">
                    <span className="app-header__user">
                        <span className="app-header__user-name">
                            {user?.name}
                        </span>

                        <span className="app-header__user-email">
                            {user?.email}
                        </span>
                    </span>

                    <button
                        className="app-header__action"
                        type="button"
                        aria-label="Configurações"
                        title="Configurações"
                    >
                        <FontAwesomeIcon icon={faGear} />
                    </button>

                    <button
                        className="app-header__action app-header__action--logout"
                        type="button"
                        onClick={handleLogout}
                        aria-label="Sair"
                        title="Sair"
                    >
                        <FontAwesomeIcon icon={faArrowRightFromBracket} />
                    </button>
                </div>
            </header>

            {showBackLink && (
                <nav className="app-header__back-row" aria-label="Navegação da página">
                    <Link
                        className="app-back-link"
                        to="/dashboard"
                        aria-label="Voltar ao painel principal"
                        title="Voltar ao painel principal"
                    >
                        <FontAwesomeIcon icon={faArrowLeft} aria-hidden="true" />
                        <span className="app-back-link__label">Voltar ao painel principal</span>
                    </Link>
                </nav>
            )}
        </div>
    );
}
