import {
    BrowserRouter,
    Navigate,
    Route,
    Routes
} from "react-router-dom";

import { AuthProvider } from "./modules/auth/AuthContext";
import { ProtectedRoute } from "./modules/auth/ProtectedRoute";
import { Login } from "./pages/Login/Login";
import { Dashboard } from "./pages/Dashboard/Dashboard";
import { Users } from "./pages/Users/Users";
import { Clients } from "./pages/Clients/Clients";
import { Financial } from "./pages/Financial/Financial";
import { Services } from "./pages/Services/Services";
import { ServiceDetails } from "./pages/ServiceDetails/ServiceDetails";
import { FinancialTransactions } from "./pages/FinancialTransactions/FinancialTransactions";
import { MonthlyExpenses } from "./pages/MonthlyExpenses/MonthlyExpenses";
import { CategoryPanel } from "./pages/CategoryPanel/CategoryPanel";
import { FinancialAnalytics } from "./pages/FinancialAnalytics/FinancialAnalytics";

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route
                        path="/"
                        element={<Navigate to="/login" replace />}
                    />

                    <Route
                        path="/login"
                        element={<Login />}
                    />

                    <Route
                        path="/dashboard"
                        element={
                            <ProtectedRoute>
                                <Dashboard />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/users"
                        element={
                            <ProtectedRoute>
                                <Users />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/clients"
                        element={
                            <ProtectedRoute>
                                <Clients />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/financial"
                        element={
                            <ProtectedRoute>
                                <Financial />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/services"
                        element={
                            <ProtectedRoute>
                                <Services />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/services/:serviceId"
                        element={
                            <ProtectedRoute>
                                <ServiceDetails />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/financial/analytics"
                        element={
                            <ProtectedRoute>
                                <FinancialAnalytics />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/financial/transactions"
                        element={
                            <ProtectedRoute>
                                <FinancialTransactions />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/monthly-expenses"
                        element={
                            <ProtectedRoute>
                                <MonthlyExpenses />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/financial/categories"
                        element={
                            <ProtectedRoute>
                                <CategoryPanel />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="*"
                        element={<Navigate to="/login" replace />}
                    />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;
