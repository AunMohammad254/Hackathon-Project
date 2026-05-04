"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import api from "@/services/api";
import { initSocket, disconnectSocket } from "@/services/socket";

interface User {
    _id: string;
    name: string;
    email: string;
    role: string;
    token: string;
    subscriptionPlan?: string;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (userData: User) => void;
    logout: () => void;
    updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// SEC-05 FIX: Only store the JWT token in localStorage, not the full user object.
// User profile is hydrated from the API on app init.
const TOKEN_KEY = "clinicToken";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const hydrateUser = async () => {
            try {
                const token = localStorage.getItem(TOKEN_KEY);
                if (!token) return;

                // Fetch user profile from API using stored token
                const res = await api.get("/auth/profile", {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (res.data) {
                    setUser({ ...res.data, token });
                    initSocket(token);
                } else {
                    // Token is invalid or expired, clean up
                    localStorage.removeItem(TOKEN_KEY);
                }
            } catch {
                // Token expired or invalid — clear it
                localStorage.removeItem(TOKEN_KEY);
            } finally {
                setLoading(false);
            }
        };

        hydrateUser();
    }, []);

    const login = (userData: User) => {
        setUser(userData);
        // SEC-05 FIX: Only persist the token, not the full user object
        localStorage.setItem(TOKEN_KEY, userData.token);
        initSocket(userData.token);
        const routePrefix = userData.role === 'Super Admin' ? 'admin' : userData.role.toLowerCase();
        router.push(`/${routePrefix}/dashboard`);
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem(TOKEN_KEY);
        disconnectSocket();
        router.push("/login");
    };

    const updateUser = (updates: Partial<User>) => {
        setUser((prev) => {
            if (!prev) return null;
            return { ...prev, ...updates };
            // Note: no longer persisting to localStorage — profile comes from API
        });
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};

