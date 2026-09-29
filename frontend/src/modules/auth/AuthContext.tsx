import {
    createContext,
    useContext,
    useEffect,
    useState,
    type ReactNode
} from "react";

import { authService } from "./auth.service";
import type { AuthUser } from "./auth.types";

interface AuthContextData {
    user : AuthUser | null;
    isAuthenticated : boolean;
    setUser : (user : AuthUser | null) => void;
    updateAuthenticatedUser : (user : AuthUser) => void;
    logout : () => void;
}

export const AuthContext = createContext<AuthContextData | undefined>(
    undefined
);

interface AuthProviderProps {
    children : ReactNode;
}

export function AuthProvider({ children } : AuthProviderProps) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const authenticated = authService.isAuthenticated();

        if (authenticated) {
            setUser(authService.getUser());
        }

        setIsLoading(false);
    }, []);

    function updateAuthenticatedUser(updatedUser : AuthUser) {
        const token = authService.getToken();

        if (!token) {
            return;
        }

        authService.saveSession(token, updatedUser);
        setUser(updatedUser);
    }

    function logout() {
        authService.logout();
        setUser(null);
    }

    const isAuthenticated = user !== null;

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated,
                setUser,
                updateAuthenticatedUser,
                logout
            }}
        >
            {isLoading ? null : children}
        </AuthContext.Provider>
    );
}

export function useAuthContext() : AuthContextData {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error(
            "useAuthContext must be used within an AuthProvider"
        );
    }

    return context;
}
