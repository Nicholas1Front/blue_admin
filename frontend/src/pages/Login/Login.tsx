import { useNavigate } from "react-router-dom";

import { LoginForm } from "./components/LoginForm";

export function Login() {
    const navigate = useNavigate();

    return (
        <main>
            <section>
                <h1>Blue admin</h1>
                <p>Entre para acessar o sistema</p>
            </section>

            <section>
                <h2>Entrar</h2>

                <LoginForm
                    onSuccess={() => navigate("/dashboard")}
                />
            </section>
        </main>
    );
}
