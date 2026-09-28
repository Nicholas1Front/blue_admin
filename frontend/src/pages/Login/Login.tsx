import { useNavigate } from "react-router-dom";

import { LoginForm } from "./components/LoginForm";

export function Login() {
    const navigate = useNavigate();

    return (
        <main>
            <section>
                <h1>Bem-vindo ao sistema</h1>
                <p>Gerencie as informações da sua empresa em um só lugar.</p>
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
