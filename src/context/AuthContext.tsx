/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
import type { AuthUser } from "../types/index";

interface AuthContextType {
    user: AuthUser | null;
    login: (user: AuthUser, token: string, remember: boolean) => void;
    logout: () => void;
    isAdmin: () => boolean;
    isCustomer: () => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<AuthUser | null>(() => {
        // Check both storages on load
        const saved = localStorage.getItem("user") || sessionStorage.getItem("user");
        return saved ? JSON.parse(saved) : null;
    });

    const login = (user: AuthUser, token: string, remember: boolean) => {
        setUser(user);
        if (remember) {
            // Remember Me checked → persists after browser close
            localStorage.setItem("user", JSON.stringify(user));
            localStorage.setItem("token", token);
        } else {
            // Remember Me unchecked → clears when tab closes
            sessionStorage.setItem("user", JSON.stringify(user));
            sessionStorage.setItem("token", token);
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        sessionStorage.removeItem("user");
        sessionStorage.removeItem("token");
    };

    const isAdmin = () => user?.role === "admin";
    const isCustomer = () => user?.role === "customer";

    return (
        <AuthContext.Provider value={{ user, login, logout, isAdmin, isCustomer }}>
            {children}
        </AuthContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used inside AuthProvider");
    return context;
};