import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faArrowRightFromBracket,
    faGear
} from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";

import { AppLogo } from "../AppLogo/AppLogo";
import { useAuth } from "../../modules/auth/useAuth";

import "./AppHeader.css";

export function AppHeader() {
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    function handleLogout() {
        logout();
        navigate("/login");
    }

    return (
        <header className="app-header">
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
    );
}
