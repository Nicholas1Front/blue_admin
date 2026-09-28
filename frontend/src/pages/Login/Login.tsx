import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons";

import logo from "../../assets/images/logo/logo.png";
import { LoginForm } from "./components/LoginForm";
import "./Login.css";

export function Login() {
    const navigate = useNavigate();

    return (
        <main className="login-page">
            <title>Login | Blue admin</title>

            <section className="login-brand">
                <div className="login-brand__content">
                    <img
                        className="login-brand__logo"
                        src={logo}
                        alt="Blue admin"
                    />

                    <div>
                        <h1>Blue admin</h1>
                        <p>Entre para acessar o sistema</p>
                    </div>
                </div>
            </section>

            <section className="login-panel">
                <div className="login-panel__content">
                    <div className="login-panel__header">
                        <span className="login-panel__eyebrow">
                            Acesso
                        </span>

                        <h2>Entrar</h2>
                        <p>Informe seus dados para continuar.</p>
                    </div>

                    <LoginForm
                        onSuccess={() => navigate("/dashboard")}
                    />

                    <div className="login-panel__footer">
                        <FontAwesomeIcon icon={faArrowRight} />
                        <span>Acesso seguro ao sistema</span>
                    </div>
                </div>
            </section>
        </main>
    );
}
