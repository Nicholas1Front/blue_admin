import { useNavigate } from "react-router-dom";

import logo from "../../assets/images/logo/logo.png";
import { useAuth } from "../../modules/auth/useAuth";

import "./AppLogo.css";

export function AppLogo() {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();

    function handleClick() {
        navigate(isAuthenticated ? "/dashboard" : "/login");
    }

    return (
        <button
            className="app-logo"
            type="button"
            onClick={handleClick}
            aria-label={
                isAuthenticated
                    ? "Ir para o dashboard"
                    : "Ir para o login"
            }
        >
            <img
                className="app-logo__image"
                src={logo}
                alt="Blue admin"
            />
        </button>
    );
}
