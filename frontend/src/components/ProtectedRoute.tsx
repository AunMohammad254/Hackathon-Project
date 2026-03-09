"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles: string[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
    const { user } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        const checkAuth = () => {
            // SEC-05 FIX: Check for token existence (user is hydrated from API by AuthContext)
            const hasToken = typeof window !== 'undefined' && localStorage.getItem("clinicToken");

            if (!user && !hasToken) {
                // Not logged in at all
                router.push("/login");
            } else if (!user && hasToken) {
                // Token exists but user not yet hydrated — wait for AuthContext
                return;
            } else if (user && !allowedRoles.includes(user.role)) {
                // Logged in but wrong role
                router.push("/unauthorized");
            } else if (user) {
                // Authorized
                setIsAuthorized(true);
            }
        };

        checkAuth();
    }, [user, router, allowedRoles, pathname]);

    if (!isAuthorized) {
        return <div className="flex h-screen items-center justify-center">Loading...</div>;
    }

    return <>{children}</>;
}

