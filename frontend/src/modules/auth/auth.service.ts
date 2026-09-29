import type { AuthUser } from "./auth.types";

const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

function getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
}

function getUser(): AuthUser | null {
    const user = localStorage.getItem(USER_KEY);

    if (!user) {
        return null;
    }

    try {
        return JSON.parse(user) as AuthUser;
    } catch {
        return null;
    }
}

function isTokenExpired(token: string): boolean {
    try {
        const parts = token.split(".");

        if (parts.length !== 3) {
            return true;
        }

        const payload = JSON.parse(
            atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")),
        ) as { exp?: number };

        if (!payload.exp) {
            return true;
        }

        return payload.exp * 1000 <= Date.now();
    } catch {
        return true;
    }
}

function isAuthenticated(): boolean {
    const token = getToken();

    if (!token) {
        return false;
    }

    if (isTokenExpired(token)) {
        logout();
        return false;
    }

    return true;
}

function saveSession(token: string, user: AuthUser): void {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));

}

function logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
}

export const authService = {
    getToken,
    getUser,
    isAuthenticated,
    saveSession,
    logout,
};
