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
        // Wait for client-side hydration to check localStorage/user
        const checkAuth = () => {
            const storedUser = localStorage.getItem("userInfo");
            const currentUser = user || (storedUser ? JSON.parse(storedUser) : null);

            if (!currentUser) {
                // Not logged in
                router.push("/login");
            } else if (!allowedRoles.includes(currentUser.role)) {
                // Logged in but wrong role
                router.push("/unauthorized");
            } else {
                // Authorized
                setIsAuthorized(true);
            }
        };

        checkAuth();
    }, [user, router, allowedRoles, pathname]);

    if (!isAuthorized) {
        return <div className="flex h-screen items-center justify-center">Loading...</div>; // Or a spinner
    }

    return <>{children}</>;
}
