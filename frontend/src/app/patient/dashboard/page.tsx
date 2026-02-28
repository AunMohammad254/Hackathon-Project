"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import api from "@/services/api";
import {
    CalendarCheck, Clock, FileText, HeartPulse,
    Loader2, TrendingUp
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface Appointment {
    _id: string;
    date: string;
    status: string;
    doctorId: { _id: string; name: string };
}

export default function PatientDashboard() {
    const { user } = useAuth();
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await api.get("/appointments");
                setAppointments(res.data);
            } catch (error) {
                console.error("Failed to fetch appointments", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user]);

    const upcoming = appointments.filter(
        (a) => a.status === "pending" || a.status === "confirmed"
    );
    const completed = appointments.filter((a) => a.status === "completed");

    return (
        <>
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                    Welcome back, {user?.name?.split(" ")[0]} 👋
                </h1>
                <p className="text-slate-500 mt-2 text-lg">
                    Here&apos;s a quick summary of your health profile.
                </p>
            </header>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="animate-spin text-teal-500 w-10 h-10" />
                </div>
            ) : (
                <>
                    {/* Quick Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-start justify-between">
                            <div>
                                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Visits</p>
                                <h3 className="text-4xl font-bold text-slate-800">{appointments.length}</h3>
                                <p className="text-slate-400 text-sm mt-2">All-time appointments</p>
                            </div>
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                                <CalendarCheck size={24} />
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-start justify-between">
                            <div>
                                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Upcoming</p>
                                <h3 className="text-4xl font-bold text-slate-800">{upcoming.length}</h3>
                                <p className="text-emerald-600 text-sm mt-2 font-medium flex items-center gap-1">
                                    <TrendingUp size={14} /> Pending / Confirmed
                                </p>
                            </div>
                            <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
                                <Clock size={24} />
                            </div>
                        </div>

                        <div className="bg-slate-900 rounded-xl shadow-md p-6 flex flex-col justify-between relative overflow-hidden">
                            <div className="z-10">
                                <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-1">Completed Visits</p>
                                <h3 className="text-4xl font-bold text-white">{completed.length}</h3>
                            </div>
                            <div className="mt-4 z-10">
                                <Button variant="secondary" size="sm" className="bg-slate-800 text-white hover:bg-slate-700 border-0" asChild>
                                    <Link href="/patient/prescriptions">View Prescriptions</Link>
                                </Button>
                            </div>
                            <HeartPulse className="absolute -right-4 -bottom-4 text-slate-800 w-28 h-28 opacity-50 z-0" />
                        </div>
                    </div>

                    {/* Recent Appointments Timeline */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                                <Clock className="text-teal-500" />
                                Recent Activity
                            </h2>
                            <Link href="/patient/appointments" className="text-sm text-teal-600 hover:text-teal-500 font-medium">
                                View all →
                            </Link>
                        </div>

                        {appointments.length > 0 ? (
                            <div className="relative border-l-2 border-slate-100 ml-3 space-y-6 pb-2">
                                {appointments.slice(0, 5).map((apt) => (
                                    <div key={apt._id} className="relative pl-8">
                                        <span className={`absolute -left-[9px] top-1.5 h-4 w-4 rounded-full bg-white border-4 ring-4 ring-white ${apt.status === "completed" ? "border-emerald-500" :
                                                apt.status === "confirmed" ? "border-blue-500" :
                                                    "border-amber-500"
                                            }`}></span>

                                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-5 hover:shadow-md transition duration-200">
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="font-semibold text-slate-800">
                                                    Dr. {apt.doctorId?.name || "Unknown"}
                                                </h3>
                                                <span className={`px-3 py-1 text-xs font-bold rounded-md ${apt.status === "completed" ? "bg-emerald-100 text-emerald-700" :
                                                        apt.status === "confirmed" ? "bg-blue-100 text-blue-700" :
                                                            "bg-amber-100 text-amber-700"
                                                    }`}>
                                                    {apt.status.charAt(0).toUpperCase() + apt.status.slice(1)}
                                                </span>
                                            </div>
                                            <p className="text-sm text-slate-500 flex items-center gap-1.5">
                                                <CalendarCheck size={14} />
                                                {new Date(apt.date).toLocaleDateString(undefined, {
                                                    weekday: "short", month: "short", day: "numeric"
                                                })} at {new Date(apt.date).toLocaleTimeString(undefined, {
                                                    hour: "2-digit", minute: "2-digit"
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 px-4 rounded-xl border border-dashed border-slate-200 bg-slate-50">
                                <CalendarCheck className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                                <h3 className="text-lg font-medium text-slate-900">No appointments yet</h3>
                                <p className="mt-1 text-slate-500 text-sm">Visit the clinic to get started with your health journey.</p>
                            </div>
                        )}
                    </div>
                </>
            )}
        </>
    );
}
