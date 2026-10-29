import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faUsers,
    faBuilding,
    faChartLine,
    faScrewdriverWrench
} from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";

import { AppHeader } from "../../components/AppHeader/AppHeader";
import { useAuth } from "../../modules/auth/useAuth";

import "./Dashboard.css";

export function Dashboard() {
    const navigate = useNavigate();
    const { user } = useAuth();

    return (
        <main className="dashboard-page">
            <title>Dashboard | Blue admin</title>
            <AppHeader />

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
                    <button
                        className="dashboard-card dashboard-card--action"
                        type="button"
                        onClick={() => navigate("/users")}
                    >
                        <div className="dashboard-card__icon">
                            <FontAwesomeIcon icon={faUsers} />
                        </div>

                        <div>
                            <span className="dashboard-card__label">
                                Administração
                            </span>

                            <strong>Usuários</strong>

                            <p>
                                Gerencie os usuários com acesso ao sistema.
                            </p>
                        </div>
                    </button>

                    <button
                        className="dashboard-card dashboard-card--action"
                        type="button"
                        onClick={() => navigate("/clients")}
                    >
                        <div className="dashboard-card__icon">
                            <FontAwesomeIcon icon={faBuilding} />
                        </div>

                        <div>
                            <span className="dashboard-card__label">
                                Gestão
                            </span>

                            <strong>Clientes e equipamentos</strong>

                            <p>
                                Consulte clientes, contatos e equipamentos em um só lugar.
                            </p>
                        </div>
                    </button>

                    <button
                        className="dashboard-card dashboard-card--action"
                        type="button"
                        onClick={() => navigate("/services")}
                    >
                        <div className="dashboard-card__icon dashboard-card__icon--services">
                            <FontAwesomeIcon icon={faScrewdriverWrench} />
                        </div>

                        <div>
                            <span className="dashboard-card__label">
                                Operação da oficina
                            </span>

                            <strong>Serviços</strong>

                            <p>
                                Acompanhe os atendimentos, os status e os resultados dos serviços.
                            </p>
                        </div>
                    </button>

                    <button
                        className="dashboard-card dashboard-card--action"
                        type="button"
                        onClick={() => navigate("/financial")}
                    >
                        <div className="dashboard-card__icon dashboard-card__icon--financial">
                            <FontAwesomeIcon icon={faChartLine} />
                        </div>

                        <div>
                            <span className="dashboard-card__label">
                                Controle e análise
                            </span>

                            <strong>Financeiro</strong>

                            <p>
                                Acompanhe receitas, despesas, saldo e indicadores da empresa.
                            </p>
                        </div>
                    </button>
                </section>
            </section>
        </main>
    );
}
