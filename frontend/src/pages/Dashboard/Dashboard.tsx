import { useNavigate } from "react-router-dom";

import { useAuth } from "../../modules/auth/useAuth";

export function Dashboard() {
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    function handleLogout() {
        logout();
        navigate("/login");
    }

    return (
        <main>
            <h1>Dashboard</h1>

            <p>
                Olá, {user?.name}!
            </p>

            <p>
                Email: {user?.email}
            </p>

            <button type="button" onClick={handleLogout}>
                Sair
            </button>
        </main>
    );
}
