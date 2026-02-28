"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
    LayoutDashboard, ActivitySquare, Users, LogOut, Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import ProtectedRoute from "@/components/ProtectedRoute";

const sidebarLinks = [
    { href: "/admin/dashboard", label: "Platform Analytics", icon: ActivitySquare },
    { href: "/admin/staff", label: "Manage Staff", icon: Users },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { user, logout } = useAuth();
    const pathname = usePathname();

    return (
        <ProtectedRoute allowedRoles={["Admin"]}>
            <div className="flex h-screen bg-slate-50">
                {/* Sidebar */}
                <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col shadow-2xl z-10 flex-shrink-0">
                    <div className="p-6 text-2xl font-bold border-b border-slate-800 flex items-center gap-2">
                        <LayoutDashboard className="text-teal-400" />
                        AI Clinic
                        <span className="text-xs bg-teal-500/20 text-teal-400 px-2 py-0.5 rounded ml-2">Admin</span>
                    </div>
                    <nav className="flex-1 p-4 space-y-1.5 mt-4">
                        {sidebarLinks.map((link) => {
                            const isActive = pathname === link.href;
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`flex items-center gap-3 py-3 px-4 rounded-lg transition duration-200 font-medium ${isActive
                                            ? "bg-slate-800/50 text-white border border-slate-700/50"
                                            : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                                        }`}
                                >
                                    <link.icon size={18} className={isActive ? "text-teal-400" : ""} />
                                    {link.label}
                                </Link>
                            );
                        })}
                    </nav>
                    <div className="p-4 border-t border-slate-800">
                        <div className="mb-4 text-sm text-slate-400 px-2">
                            Admin Profile
                            <span className="font-semibold text-white block mt-1">{user?.name}</span>
                        </div>
                        <Button
                            variant="ghost"
                            className="w-full justify-start text-rose-400 hover:text-rose-300 hover:bg-slate-800"
                            onClick={logout}
                        >
                            <LogOut size={16} className="mr-2" />
                            Log Out
                        </Button>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 overflow-y-auto p-10">
                    {children}
                </main>
            </div>
        </ProtectedRoute>
    );
}
