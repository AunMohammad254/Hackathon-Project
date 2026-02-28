"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import api from "@/services/api";
import {
    CalendarCheck, Clock, Loader2, CheckCircle, AlertCircle, XCircle
} from "lucide-react";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

interface Appointment {
    _id: string;
    date: string;
    status: string;
    doctorId: { _id: string; name: string; email: string };
    patientId: { _id: string; name: string };
}

const statusConfig: Record<string, { color: string; icon: typeof CheckCircle }> = {
    completed: { color: "bg-emerald-100 text-emerald-700", icon: CheckCircle },
    confirmed: { color: "bg-blue-100 text-blue-700", icon: CalendarCheck },
    pending: { color: "bg-amber-100 text-amber-700", icon: Clock },
    cancelled: { color: "bg-rose-100 text-rose-700", icon: XCircle },
};

export default function PatientAppointments() {
    const { user } = useAuth();
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all");

    useEffect(() => {
        const fetchAppointments = async () => {
            try {
                const res = await api.get("/appointments");
                setAppointments(res.data);
            } catch (error) {
                console.error("Failed to fetch appointments", error);
            } finally {
                setLoading(false);
            }
        };
        fetchAppointments();
    }, [user]);

    const filtered = filter === "all"
        ? appointments
        : appointments.filter((a) => a.status === filter);

    const counts = {
        all: appointments.length,
        pending: appointments.filter((a) => a.status === "pending").length,
        confirmed: appointments.filter((a) => a.status === "confirmed").length,
        completed: appointments.filter((a) => a.status === "completed").length,
    };

    return (
        <>
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                    <CalendarCheck className="text-teal-500" />
                    My Appointments
                </h1>
                <p className="text-slate-500 mt-2 text-lg">View all your scheduled and past appointments.</p>
            </header>

            {/* Filter Tabs */}
            <div className="flex gap-2 mb-6 flex-wrap">
                {(["all", "pending", "confirmed", "completed"] as const).map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === f
                                ? "bg-teal-500 text-white shadow-sm"
                                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                            }`}
                    >
                        {f.charAt(0).toUpperCase() + f.slice(1)} ({counts[f as keyof typeof counts]})
                    </button>
                ))}
            </div>

            {/* Appointments Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <Loader2 className="animate-spin text-teal-500 w-8 h-8" />
                    </div>
                ) : filtered.length > 0 ? (
                    <Table>
                        <TableHeader className="bg-slate-50">
                            <TableRow>
                                <TableHead className="font-semibold text-slate-500 uppercase tracking-wider text-xs">Doctor</TableHead>
                                <TableHead className="font-semibold text-slate-500 uppercase tracking-wider text-xs">Date</TableHead>
                                <TableHead className="font-semibold text-slate-500 uppercase tracking-wider text-xs">Time</TableHead>
                                <TableHead className="font-semibold text-slate-500 uppercase tracking-wider text-xs text-right">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filtered.map((apt) => {
                                const cfg = statusConfig[apt.status] || statusConfig.pending;
                                const StatusIcon = cfg.icon;
                                return (
                                    <TableRow key={apt._id} className="hover:bg-slate-50/80 transition-colors">
                                        <TableCell className="font-medium text-slate-900">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                                                    {apt.doctorId?.name?.charAt(0) || "D"}
                                                </div>
                                                Dr. {apt.doctorId?.name || "Unknown"}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-slate-600">
                                            {new Date(apt.date).toLocaleDateString(undefined, {
                                                weekday: "short", month: "short", day: "numeric", year: "numeric"
                                            })}
                                        </TableCell>
                                        <TableCell className="text-slate-500">
                                            {new Date(apt.date).toLocaleTimeString(undefined, {
                                                hour: "2-digit", minute: "2-digit"
                                            })}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-md ${cfg.color}`}>
                                                <StatusIcon size={12} />
                                                {apt.status.charAt(0).toUpperCase() + apt.status.slice(1)}
                                            </span>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                ) : (
                    <div className="text-center py-16 px-4">
                        <AlertCircle className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                        <h3 className="text-lg font-medium text-slate-900">No appointments found</h3>
                        <p className="mt-1 text-slate-500 text-sm">
                            {filter !== "all" ? `No ${filter} appointments.` : "You don't have any appointments yet."}
                        </p>
                    </div>
                )}
            </div>
        </>
    );
}
