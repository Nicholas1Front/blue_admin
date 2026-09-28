import {
    useState
} from "react";

import {
    BrowserRouter,
    Navigate,
    Route,
    Routes,
    useNavigate
} from "react-router-dom";

import { AuthProvider } from "./modules/auth/AuthContext";
import { ProtectedRoute } from "./modules/auth/ProtectedRoute";
import { useAuth } from "./modules/auth/useAuth";
import { login } from "./modules/auth/auth.api";

function Login() {
    const navigate = useNavigate();
    const { setUser } = useAuth();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    return (
        <main>
            <h1>Login</h1>

            <form
                onSubmit = {async (event) => {
                    event.preventDefault();
                    setError("");

                    try {
                        const response = await login({
                            email,
                            password
                        });

                        setUser({
                            id : response.id,
                            name : response.name,
                            email : response.email
                        });

                        navigate("/dashboard");
                    } catch (err) {
                        console.error("Login falhou", err);
                        setError("Email ou senha inválidos.");
                    }
                }}
            >
                <div>
                    <label htmlFor = "email">
                        Email
                    </label>

                    <input
                        id = "email"
                        type = "email"
                        value = {email}
                        onChange = {(event) => setEmail(event.target.value)}
                        required
                    />
                </div>

                <div>
                    <label htmlFor = "password">
                        Senha
                    </label>

                    <input
                        id = "password"
                        type = "password"
                        value = {password}
                        onChange = {(event) => setPassword(event.target.value)}
                        required
                    />
                </div>

                {error && (
                    <p>{error}</p>
                )}

                <button type = "submit">
                    Entrar
                </button>
            </form>
        </main>
    );
}

function Dashboard() {
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

            <button onClick = {handleLogout}>
                Sair
            </button>
        </main>
    );
}

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route
                        path = "/"
                        element = {<Navigate to = "/login" replace />}
                    />

                    <Route
                        path = "/login"
                        element = {<Login />}
                    />

                    <Route
                        path = "/dashboard"
                        element = {
                            <ProtectedRoute>
                                <Dashboard />
                            </ProtectedRoute>
                        }
                    />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;
