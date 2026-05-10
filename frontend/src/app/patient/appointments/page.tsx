"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import api from "@/services/api";
import {
    CalendarCheck, Clock, Loader2, CheckCircle, AlertCircle, XCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { BookAppointmentModal } from "@/components/patient/BookAppointmentModal";
import { getSocket } from "@/services/socket";
import { Socket } from "socket.io-client";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Appointment {
    _id: string;
    date: string;
    status: string;
    doctorId: { _id: string; name: string; email: string };
    patientId: { _id: string; name: string };
    symptoms?: string;
    aiPreDiagnosis?: {
        possibleConditions: string[];
        riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
        urgency: string;
        advice: string;
    };
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
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

    const fetchAppointments = async () => {
        try {
            const res = await api.get("/appointments");
            setAppointments(res.data.success ? res.data.appointments : res.data);
        } catch (error) {
            console.error("Failed to fetch appointments", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAppointments();

        const socket: Socket | null = getSocket();
        if (socket) {
            socket.on('appointment-updated', (data: { appointment: Appointment, message: string }) => {
                toast.info(data.message);
                setAppointments(prev => prev.map(a => a._id === data.appointment._id ? data.appointment : a));
            });

            socket.on('appointment-created', (data: { appointment: Appointment }) => {
                setAppointments(prev => [data.appointment, ...prev]);
            });
        }

        return () => {
            if (socket) {
                socket.off('appointment-updated');
                socket.off('appointment-created');
            }
        };
    }, [user]);

    const cancelAppointment = async (id: string) => {
        if (!confirm("Are you sure you want to cancel this appointment?")) return;
        try {
            await api.put(`/appointments/${id}/status`, { status: "cancelled" });
            toast.success("Appointment cancelled");
            setAppointments((prev: Appointment[]) => prev.map((a: Appointment) => a._id === id ? { ...a, status: "cancelled" } : a));
        } catch (error) {
            console.error("Failed to cancel", error);
        }
    };

    const filtered = filter === "all"
        ? appointments
        : appointments.filter((a: Appointment) => a.status === filter);

    const counts = {
        all: appointments.length,
        pending: appointments.filter((a: Appointment) => a.status === "pending").length,
        confirmed: appointments.filter((a: Appointment) => a.status === "confirmed").length,
        completed: appointments.filter((a: Appointment) => a.status === "completed").length,
    };

    return (
        <>
            <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                        <CalendarCheck className="text-teal-500" />
                        My Appointments
                    </h1>
                    <p className="text-slate-500 mt-2 text-lg">View all your scheduled and past appointments.</p>
                </div>
                <Button 
                    className="bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-600/20 px-6 py-6 text-lg rounded-xl transition-all hover:scale-105 active:scale-95"
                    onClick={() => setIsBookingModalOpen(true)}
                >
                    <CalendarCheck className="mr-2 h-5 w-5" />
                    Book New Visit
                </Button>
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
                                <TableHead className="font-semibold text-slate-500 uppercase tracking-wider text-xs">Date & Time</TableHead>
                                <TableHead className="font-semibold text-slate-500 uppercase tracking-wider text-xs">Status</TableHead>
                                <TableHead className="font-semibold text-slate-500 uppercase tracking-wider text-xs">AI Insights</TableHead>
                                <TableHead className="font-semibold text-slate-500 uppercase tracking-wider text-xs text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filtered.map((apt: Appointment) => {
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
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="text-slate-900 font-medium">
                                                    {new Date(apt.date).toLocaleDateString(undefined, {
                                                        month: "short", day: "numeric", year: "numeric"
                                                    })}
                                                </span>
                                                <span className="text-slate-500 text-xs flex items-center gap-1 mt-0.5">
                                                    <Clock size={10} />
                                                    {new Date(apt.date).toLocaleTimeString(undefined, {
                                                        hour: "2-digit", minute: "2-digit"
                                                    })}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-md ${cfg.color}`}>
                                                <StatusIcon size={12} />
                                                {apt.status.charAt(0).toUpperCase() + apt.status.slice(1)}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            {apt.aiPreDiagnosis ? (
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <div className="cursor-help flex items-center gap-1.5">
                                                                <Badge variant="outline" className={`
                                                                    ${apt.aiPreDiagnosis.riskLevel === 'Low' ? 'border-emerald-200 text-emerald-700 bg-emerald-50' :
                                                                    apt.aiPreDiagnosis.riskLevel === 'Medium' ? 'border-amber-200 text-amber-700 bg-amber-50' :
                                                                    'border-rose-200 text-rose-700 bg-rose-50'}
                                                                `}>
                                                                    {apt.aiPreDiagnosis.riskLevel} Risk
                                                                </Badge>
                                                                <span className="text-xs text-slate-400 font-medium truncate max-w-[120px]">
                                                                    {apt.aiPreDiagnosis.possibleConditions[0]}
                                                                </span>
                                                            </div>
                                                        </TooltipTrigger>
                                                        <TooltipContent className="max-w-[300px] p-4 space-y-3">
                                                            <div>
                                                                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Likely Conditions</p>
                                                                <div className="flex flex-wrap gap-1">
                                                                    {apt.aiPreDiagnosis.possibleConditions.map((c, i) => (
                                                                        <Badge key={i} variant="secondary" className="text-[10px]">{c}</Badge>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Urgency</p>
                                                                <p className="text-xs text-slate-700">{apt.aiPreDiagnosis.urgency}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">AI Advice</p>
                                                                <p className="text-xs text-slate-700 leading-relaxed italic">&quot;{apt.aiPreDiagnosis.advice}&quot;</p>
                                                            </div>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            ) : (
                                                <span className="text-xs text-slate-300 italic font-normal">None</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {(apt.status === "pending" || apt.status === "confirmed") && (
                                                <Button variant="ghost" size="sm" className="text-rose-600 hover:bg-rose-50 hover:text-rose-700 h-8 px-2" onClick={() => cancelAppointment(apt._id)}>
                                                    <XCircle size={14} className="mr-1" /> Cancel
                                                </Button>
                                            )}
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
                        {filter === "all" && (
                            <Button variant="outline" className="mt-6 border-teal-200 text-teal-600 hover:bg-teal-50" onClick={() => setIsBookingModalOpen(true)}>
                                Schedule your first visit
                            </Button>
                        )}
                    </div>
                )}
            </div>

            <BookAppointmentModal 
                open={isBookingModalOpen} 
                onOpenChange={setIsBookingModalOpen}
                onSuccess={fetchAppointments}
            />
        </>
    );
}
