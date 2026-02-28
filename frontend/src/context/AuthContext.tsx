"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";

interface User {
    _id: string;
    name: string;
    email: string;
    role: string;
    token: string;
}

interface AuthContextType {
    user: User | null;
    login: (userData: User) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const router = useRouter();

    useEffect(() => {
        // UX-04: Safe JSON.parse to handle corrupted localStorage
        try {
            const storedUser = localStorage.getItem("userInfo");
            if (storedUser) {
                setUser(JSON.parse(storedUser));
            }
        } catch {
            localStorage.removeItem("userInfo");
        }
    }, []);

    const login = (userData: User) => {
        setUser(userData);
        localStorage.setItem("userInfo", JSON.stringify(userData));
        router.push(`/${userData.role.toLowerCase()}/dashboard`);
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem("userInfo");
        router.push("/login");
    };

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
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
