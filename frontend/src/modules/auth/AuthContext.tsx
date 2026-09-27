import {
    createContext,
    useContext,
    useState,
    type ReactNode
} from "react";

import type { AuthUser } from "./auth.types";

interface AuthContextData {
    user : AuthUser | null;
    isAuthenticated : boolean;
    setUser : (user : AuthUser | null) => void;
}

export const AuthContext = createContext<AuthContextData | undefined>(
    undefined
);

interface AuthProviderProps {
    children : ReactNode;
}

export function AuthProvider({ children } : AuthProviderProps) {
    const [user, setUser] = useState<AuthUser | null>(null);

    const isAuthenticated = user !== null;

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated,
                setUser
            }}
        >
            {children}
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
