"use client";

import React, { useState, useEffect } from "react";
import { 
    Calendar, 
    ChevronLeft, 
    ChevronRight, 
    Clock, 
    User, 
    MoreHorizontal,
    Video,
    CheckCircle2,
    XCircle,
    Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import api from "@/services/api";
import { toast } from "sonner";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { TeleConsultation } from "@/components/TeleConsultation";

interface Appointment {
    _id: string;
    date: string;
    status: string;
    reason: string;
    patientId: { _id: string; name: string; age: number; contact: string; createdBy: string };
    doctorId: { _id: string; name: string };
}

export default function DoctorAppointmentsPage() {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCallOpen, setIsCallOpen] = useState(false);
    const [activeAppointment, setActiveAppointment] = useState<Appointment | null>(null);

    const fetchAppointments = async () => {
        try {
            const res = await api.get("/appointments");
            if (res.data.success) {
                setAppointments(res.data.appointments);
            }
        } catch {
            toast.error("Failed to fetch schedule");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchAppointments();
    }, []);

    const handleStartCall = (app: Appointment) => {
        setActiveAppointment(app);
        setIsCallOpen(true);
    };

    const updateStatus = async (id: string, status: string) => {
        try {
            await api.put(`/appointments/${id}/status`, { status });
            toast.success(`Appointment ${status}`);
            fetchAppointments();
        } catch {
            toast.error("Failed to update status");
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Booking Schedule</h1>
                    <p className="text-slate-500 mt-1">Manage your daily appointments and tele-consultations.</p>
                </div>
                <div className="flex items-center gap-2 bg-white border border-slate-200 p-1 rounded-lg shadow-sm">
                    <Button variant="ghost" size="icon" className="h-8 w-8"><ChevronLeft size={16} /></Button>
                    <span className="text-sm font-bold px-4">May 2024</span>
                    <Button variant="ghost" size="icon" className="h-8 w-8"><ChevronRight size={16} /></Button>
                </div>
            </div>

            {/* Content */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                
                {/* Calendar View Placeholder */}
                <div className="xl:col-span-1">
                    <Card className="border-none shadow-xl shadow-slate-200/50 bg-white">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Calendar className="text-indigo-500" size={18} />
                                Mini Calendar
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="aspect-square bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center text-slate-300">
                                Interactive Calendar Coming Soon
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Appointment List */}
                <div className="xl:col-span-3 space-y-6">
                    {loading ? (
                        <div className="h-64 flex flex-col items-center justify-center gap-4 text-slate-400">
                            <Loader2 className="animate-spin h-8 w-8 text-indigo-500" />
                            <p>Loading your schedule...</p>
                        </div>
                    ) : appointments.length > 0 ? (
                        <div className="space-y-4">
                            {appointments.map((app) => (
                                <Card key={app._id} className={`group border-l-4 transition-all hover:shadow-lg ${
                                    app.status === 'confirmed' ? 'border-l-indigo-500' :
                                    app.status === 'completed' ? 'border-l-emerald-500' :
                                    app.status === 'cancelled' ? 'border-l-rose-500' : 'border-l-amber-500'
                                }`}>
                                    <CardContent className="p-6">
                                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                                            <div className="flex items-start gap-4">
                                                <div className="h-12 w-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                                    <User size={24} />
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-bold text-slate-900">{app.patientId?.name}</h3>
                                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500 mt-1">
                                                        <span className="flex items-center gap-1.5">
                                                            <Clock size={14} className="text-indigo-400" />
                                                            {new Date(app.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                        <span className="flex items-center gap-1.5 uppercase tracking-wider font-bold text-[10px]">
                                                            {app.status}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-slate-400 mt-2 line-clamp-1">Reason: {app.reason || 'General Checkup'}</p>
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-3">
                                                {app.status === 'pending' && (
                                                    <>
                                                        <Button 
                                                            variant="outline" 
                                                            size="sm" 
                                                            className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                                                            onClick={() => updateStatus(app._id, 'confirmed')}
                                                        >
                                                            <CheckCircle2 size={16} className="mr-2" />
                                                            Confirm
                                                        </Button>
                                                        <Button 
                                                            variant="outline" 
                                                            size="sm" 
                                                            className="text-rose-600 border-rose-200 hover:bg-rose-50"
                                                            onClick={() => updateStatus(app._id, 'cancelled')}
                                                        >
                                                            <XCircle size={16} className="mr-2" />
                                                            Cancel
                                                        </Button>
                                                    </>
                                                )}
                                                
                                                {app.status === 'confirmed' && (
                                                    <Button 
                                                        className="bg-indigo-600 hover:bg-indigo-700 text-white"
                                                        onClick={() => handleStartCall(app)}
                                                    >
                                                        <Video size={16} className="mr-2" />
                                                        Start Tele-consult
                                                    </Button>
                                                )}

                                                <Button variant="ghost" size="icon" className="text-slate-300 hover:text-slate-600">
                                                    <MoreHorizontal size={20} />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="h-96 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center text-slate-400 p-8 text-center bg-white shadow-sm">
                            <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                                <Calendar size={40} className="text-slate-200" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-600 mb-2">No appointments scheduled</h3>
                            <p className="max-w-xs text-sm leading-relaxed">
                                You have a clear schedule! New bookings will appear here automatically.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Tele-consultation Modal */}
            {activeAppointment && (
                <TeleConsultation 
                    open={isCallOpen}
                    onOpenChange={setIsCallOpen}
                    targetUserId={activeAppointment.patientId?.createdBy}
                />
            )}
        </div>
    );
}
