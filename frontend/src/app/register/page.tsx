"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import api from "@/services/api";
import Link from "next/link";
import { Activity, ArrowLeft, Loader2, Mail, Lock, User } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Register() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("Patient");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const res = await api.post("/auth/register", { name, email, password, role });
            login(res.data);
        } catch {
            setError("Unable to connect to server. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900">
            {/* Left Panel - Branding */}
            <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-20 left-20 w-72 h-72 bg-indigo-400 rounded-full blur-[120px]"></div>
                    <div className="absolute bottom-20 right-20 w-96 h-96 bg-teal-500 rounded-full blur-[150px]"></div>
                </div>

                <div className="relative z-10">
                    <Link href="/" className="flex items-center gap-2 text-2xl font-bold text-white">
                        <Activity className="text-teal-400" />
                        AI Clinic
                        <span className="text-xs bg-teal-500/20 text-teal-400 px-2 py-0.5 rounded ml-1">SaaS</span>
                    </Link>
                </div>

                <div className="relative z-10 space-y-6">
                    <h1 className="text-5xl font-extrabold text-white leading-tight">
                        Join the<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400">
                            future.
                        </span>
                    </h1>
                    <p className="text-xl text-slate-400 max-w-md leading-relaxed">
                        Create your account and start managing your clinic with the power of AI diagnostics.
                    </p>
                    <div className="flex gap-4 pt-4">
                        <div className="flex items-center gap-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg px-4 py-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                            <span className="text-sm text-slate-300">Instant Setup</span>
                        </div>
                        <div className="flex items-center gap-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg px-4 py-2">
                            <div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></div>
                            <span className="text-sm text-slate-300">Role-Based Access</span>
                        </div>
                    </div>
                </div>

                <p className="relative z-10 text-sm text-slate-500">
                    © 2026 AI Clinic. Built for the Advanced MERN Hackathon.
                </p>
            </div>

            {/* Right Panel - Register Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
                <div className="w-full max-w-md space-y-8">

                    {/* Mobile Logo */}
                    <div className="lg:hidden flex items-center gap-2 text-2xl font-bold text-white mb-4">
                        <Activity className="text-teal-400" />
                        AI Clinic
                    </div>

                    <div>
                        <Link href="/" className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-teal-400 transition-colors mb-6">
                            <ArrowLeft size={14} />
                            Back to home
                        </Link>
                        <h2 className="text-3xl font-bold text-white">
                            Create an account
                        </h2>
                        <p className="text-slate-400 mt-2">
                            Fill in your details to get started.
                        </p>
                    </div>

                    <form className="space-y-5" onSubmit={handleSubmit}>
                        {error && (
                            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-rose-500 flex-shrink-0"></div>
                                {error}
                            </div>
                        )}

                        <div className="space-y-4">
                            <div className="space-y-4">
                                {/* Name */}
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-2">
                                        Full Name
                                    </label>
                                    <div className="relative">
                                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                        <input
                                            id="name"
                                            type="text"
                                            required
                                            suppressHydrationWarning
                                            className="w-full bg-white/5 border border-white/10 text-white placeholder-slate-500 rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all"
                                            placeholder="Dr. Jane Smith"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* Email */}
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                                        Email Address
                                    </label>
                                    <div className="relative">
                                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                        <input
                                            id="email"
                                            type="email"
                                            autoComplete="email"
                                            required
                                            suppressHydrationWarning
                                            className="w-full bg-white/5 border border-white/10 text-white placeholder-slate-500 rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all"
                                            placeholder="doctor@clinic.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* Role Selection */}
                                <div>
                                    <label htmlFor="role" className="block text-sm font-medium text-slate-300 mb-2">
                                        I am a...
                                    </label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {['Patient', 'Doctor', 'Receptionist', 'Admin'].map((r) => (
                                            <label key={r} className={`flex justify-center items-center py-2.5 rounded-xl border cursor-pointer transition-all text-sm ${role === r ? 'bg-teal-500/20 border-teal-500/50 text-teal-300' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}>
                                                <input type="radio" className="hidden" name="role" value={r} checked={role === r} onChange={(e) => setRole(e.target.value)} />
                                                {r}
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Password */}
                                <div>
                                    <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
                                        Password
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                        <input
                                            id="password"
                                            type="password"
                                            autoComplete="new-password"
                                            required
                                            suppressHydrationWarning
                                            minLength={6}
                                            className="w-full bg-white/5 border border-white/10 text-white placeholder-slate-500 rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all"
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-teal-500 hover:bg-teal-600 text-white h-12 rounded-xl text-base font-medium shadow-lg shadow-teal-500/25 transition-all disabled:opacity-50"
                        >
                            {loading ? (
                                <><Loader2 className="animate-spin mr-2 h-5 w-5" /> Creating account...</>
                            ) : (
                                "Create Account"
                            )}
                        </Button>
                    </form>

                    <p className="text-center text-sm text-slate-500">
                        Already have an account?{" "}
                        <Link href="/login" className="text-teal-400 hover:text-teal-300 font-medium transition-colors">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
