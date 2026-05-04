"use client";

import { useState } from "react";
import api from "@/services/api";
import Link from "next/link";
import { Activity, ArrowLeft, Loader2, Mail, Lock, User, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function StaffRegister() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("Doctor");
    const [error, setError] = useState("");
    const [successMsg, setSuccessMsg] = useState("");
    const [loading, setLoading] = useState(false);

    // Frontend Rate Limiting: Max 3 requests per hour
    const checkRateLimit = () => {
        const attemptsStr = localStorage.getItem("staffRegAttempts");
        if (!attemptsStr) return true;

        const attempts = JSON.parse(attemptsStr);
        const oneHourAgo = Date.now() - 60 * 60 * 1000;

        // Filter out old attempts
        const recentAttempts = attempts.filter((time: number) => time > oneHourAgo);

        if (recentAttempts.length >= 3) {
            setError("Rate limit exceeded. Try again in an hour.");
            return false;
        }
        return true;
    };

    const recordAttempt = () => {
        const attemptsStr = localStorage.getItem("staffRegAttempts");
        let attempts = attemptsStr ? JSON.parse(attemptsStr) : [];
        const oneHourAgo = Date.now() - 60 * 60 * 1000;
        attempts = attempts.filter((time: number) => time > oneHourAgo);
        attempts.push(Date.now());
        localStorage.setItem("staffRegAttempts", JSON.stringify(attempts));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccessMsg("");

        if (!checkRateLimit()) return;

        setLoading(true);
        try {
            recordAttempt();
            const res = await api.post("/auth/register", { name, email, password, role });
            // For staff, standard login is blocked until approved
            if (res.data.isPending) {
                setSuccessMsg(res.data.message);
                setName("");
                setEmail("");
                setPassword("");
            }
        } catch (err: unknown) {
            const axiosErr = err as { response?: { data?: { message?: string } } };
            setError(axiosErr.response?.data?.message || "Unable to connect to server. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900">
            {/* Left Panel - Branding */}
            <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-20 right-20 w-72 h-72 bg-blue-400 rounded-full blur-[120px]"></div>
                    <div className="absolute bottom-20 left-20 w-96 h-96 bg-indigo-500 rounded-full blur-[150px]"></div>
                </div>

                <div className="relative z-10">
                    <Link href="/" className="flex items-center gap-2 text-2xl font-bold text-white">
                        <Activity className="text-indigo-400" />
                        AI Clinic Team
                    </Link>
                </div>

                <div className="relative z-10 space-y-6">
                    <h1 className="text-5xl font-extrabold text-white leading-tight">
                        Join the <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-400">
                            medical staff.
                        </span>
                    </h1>
                    <p className="text-xl text-slate-400 max-w-md leading-relaxed">
                        Register for a staff account. All Doctor, Receptionist, and Admin accounts require Super Admin approval before access is granted.
                    </p>
                </div>

                <p className="relative z-10 text-sm text-slate-500">
                    © 2026 AI Clinic. For internal staff use only.
                </p>
            </div>

            {/* Right Panel - Register Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
                <div className="w-full max-w-md space-y-8">
                    <div>
                        <Link href="/" className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-indigo-400 transition-colors mb-6">
                            <ArrowLeft size={14} />
                            Back to home
                        </Link>
                        <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                            Staff Registration <ShieldCheck className="text-indigo-400" />
                        </h2>
                        <p className="text-slate-400 mt-2">
                            Submit your details for approval.
                        </p>
                    </div>

                    <form className="space-y-5" onSubmit={handleSubmit}>
                        {error && (
                            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-rose-500 flex-shrink-0"></div>
                                {error}
                            </div>
                        )}

                        {successMsg && (
                            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-3 rounded-lg text-sm flex flex-col gap-2">
                                <div className="flex items-center gap-2 font-medium">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0"></div>
                                    Application Submitted
                                </div>
                                <p className="opacity-90">{successMsg}</p>
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
                                            className="w-full bg-white/5 border border-white/10 text-white placeholder-slate-500 rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
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
                                            required
                                            suppressHydrationWarning
                                            className="w-full bg-white/5 border border-white/10 text-white placeholder-slate-500 rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                                            placeholder="staff@clinic.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* Role Selection */}
                                <div>
                                    <label htmlFor="role" className="block text-sm font-medium text-slate-300 mb-2">
                                        Staff Role
                                    </label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {['Doctor', 'Receptionist', 'Admin'].map((r) => (
                                            <label key={r} className={`flex justify-center items-center py-2.5 rounded-xl border cursor-pointer transition-all text-sm ${role === r ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}>
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
                                            required
                                            suppressHydrationWarning
                                            minLength={6}
                                            className="w-full bg-white/5 border border-white/10 text-white placeholder-slate-500 rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
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
                            disabled={loading || successMsg !== ""}
                            className="w-full bg-indigo-500 hover:bg-indigo-600 text-white h-12 rounded-xl text-base font-medium shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-50"
                        >
                            {loading ? (
                                <><Loader2 className="animate-spin mr-2 h-5 w-5" /> Submitting...</>
                            ) : (
                                "Submit Application"
                            )}
                        </Button>
                    </form>

                    <p className="text-center text-sm text-slate-500">
                        Patient registration?{" "}
                        <Link href="/register" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
                            Click here
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
