import {
    BrowserRouter,
    Navigate,
    Route,
    Routes
} from "react-router-dom";

import { AuthProvider } from "./modules/auth/AuthContext";
import { ProtectedRoute } from "./modules/auth/ProtectedRoute";
import { login } from "./modules/auth/auth.api";

function Login() {
    async function handleTest() {
        try {
            const result = await login({
                email : "admin@gmail.com",
                password : "1234567"
            });

            console.log("Login realizado", result);
        } catch (err) {
            console.error("Login falhou", err);
        }
    }

    return (
        <main>
            <h1>Login</h1>

            <button onClick = {handleTest}>
                Testar login
            </button>
        </main>
    );
}

function Dashboard() {
    return (
        <main>
            <h1>Dashboard</h1>
            <p>Área protegida da aplicação.</p>
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
