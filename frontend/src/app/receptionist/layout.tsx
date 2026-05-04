"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

import {
    Activity, CalendarCheck, Users, LogOut, LayoutDashboard, User, Menu, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import ProtectedRoute from "@/components/ProtectedRoute";

const sidebarLinks = [
    { href: "/receptionist/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/receptionist/patients", label: "Patient Directory", icon: Users },
    { href: "/receptionist/appointments", label: "Booking Schedule", icon: CalendarCheck },
    { href: "/receptionist/profile", label: "My Profile", icon: User },
];

export default function ReceptionistLayout({ children }: { children: React.ReactNode }) {
    const { user, logout } = useAuth();
    const pathname = usePathname();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <ProtectedRoute allowedRoles={["Receptionist"]}>
            <div className="flex h-screen bg-slate-50 overflow-hidden relative">

                {/* Mobile Header */}
                <div className="md:hidden absolute top-0 left-0 right-0 h-16 bg-slate-900 flex items-center justify-between px-4 z-20 shadow-md">
                    <div className="text-xl font-bold flex items-center gap-2 text-white">
                        <Activity className="text-blue-400" size={24} />
                        AI Clinic
                    </div>
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="text-slate-300 hover:text-white focus:outline-none"
                    >
                        {isSidebarOpen ? <X size={28} /> : <Menu size={28} />}
                    </button>
                </div>

                {/* Sidebar */}
                <aside
                    className={`
                        fixed md:static inset-y-0 left-0 z-30 w-64 bg-slate-900 text-slate-100 flex flex-col shadow-2xl 
                        transform transition-transform duration-300 ease-in-out
                        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
                    `}
                >
                    <div className="h-16 md:h-auto p-6 text-2xl font-bold border-b border-slate-800 flex items-center gap-2">
                        <Activity className="text-blue-400 hidden md:block" />
                        <span className="hidden md:block">AI Clinic</span>
                        <span className="md:ml-2 text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded">Staff</span>
                    </div>

                    <nav className="flex-1 p-4 space-y-1.5 mt-2 md:mt-4 overflow-y-auto">
                        {sidebarLinks.map((link) => {
                            const isActive = pathname === link.href;
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    onClick={() => setIsSidebarOpen(false)}
                                    className={`flex items-center gap-3 py-3 px-4 rounded-lg transition duration-200 font-medium ${isActive
                                        ? "bg-slate-800/50 text-white border border-slate-700/50 shadow-inner"
                                        : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                                        }`}
                                >
                                    <link.icon size={18} className={isActive ? "text-blue-400" : ""} />
                                    {link.label}
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="p-4 border-t border-slate-800 bg-slate-900 shrink-0">
                        <div className="mb-4 text-sm text-slate-400 px-2">
                            Reception Portal
                            <span className="font-semibold text-white block mt-1 truncate">{user?.name}</span>
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
                <main className="flex-1 overflow-y-auto w-full pt-16 md:pt-0 p-4 sm:p-6 md:p-10 relative z-0">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </ProtectedRoute>
    );
}
