import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faArrowRightFromBracket,
    faChartLine,
    faGear
} from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";

import { AppLogo } from "../../components/AppLogo/AppLogo";
import { useAuth } from "../../modules/auth/useAuth";

import "./Dashboard.css";

export function Dashboard() {
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    function handleLogout() {
        logout();
        navigate("/login");
    }

    return (
        <main className="dashboard-page">
            <title>Dashboard | Blue admin</title>
            <header className="dashboard-header">
                <AppLogo />

                <div className="dashboard-header__actions">
                    <span className="dashboard-header__user">
                        <span className="dashboard-header__user-name">
                            {user?.name}
                        </span>

                        <span className="dashboard-header__user-email">
                            {user?.email}
                        </span>
                    </span>

                    <button
                        className="dashboard-action"
                        type="button"
                        aria-label="Configurações"
                        title="Configurações"
                    >
                        <FontAwesomeIcon icon={faGear} />
                    </button>

                    <button
                        className="dashboard-action dashboard-action--logout"
                        type="button"
                        onClick={handleLogout}
                        aria-label="Sair"
                        title="Sair"
                    >
                        <FontAwesomeIcon icon={faArrowRightFromBracket} />
                    </button>
                </div>
            </header>

            <section className="dashboard-content">
                <div className="dashboard-welcome">
                    <span className="dashboard-welcome__eyebrow">
                        Visão geral
                    </span>

                    <h1>Olá, {user?.name}.</h1>

                    <p>
                        Bem-vindo ao Blue admin. A partir daqui você poderá
                        acompanhar e gerenciar as informações da sua empresa.
                    </p>
                </div>

                <section className="dashboard-overview">
                    <article className="dashboard-card">
                        <div className="dashboard-card__icon">
                            <FontAwesomeIcon icon={faChartLine} />
                        </div>

                        <div>
                            <span className="dashboard-card__label">
                                Sistema
                            </span>

                            <strong>Em desenvolvimento</strong>

                            <p>
                                Os módulos de gestão serão adicionados
                                progressivamente.
                            </p>
                        </div>
                    </article>
                </section>
            </section>
        </main>
    );
}
