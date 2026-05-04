"use client";

import React from "react";
import { Clock, Calendar } from "lucide-react";

interface Appointment {
    _id: string;
    date: string;
    status: string;
    patientId: { _id: string; name: string } | null;
    doctorId: { _id: string; name: string } | null;
}

interface ReceptionistScheduleProps {
    appointments: Appointment[];
}

const statusColor: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700 border-amber-200",
    confirmed: "bg-blue-100 text-blue-700 border-blue-200",
    completed: "bg-emerald-100 text-emerald-700 border-emerald-200",
    cancelled: "bg-rose-100 text-rose-700 border-rose-200",
};

export function ReceptionistSchedule({ appointments }: ReceptionistScheduleProps) {
    return (
        <div className="animate-in slide-in-from-bottom-4 duration-500">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
                    <Calendar className="text-indigo-500" />
                    Today&apos;s Schedule
                </h1>
                <p className="text-slate-500 mt-1 font-medium">All appointments scheduled for today.</p>
            </header>

            {appointments.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {appointments.map((apt) => (
                        <div key={apt._id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col justify-between hover:shadow-md transition-all hover:-translate-y-1">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-inner">
                                    {apt.patientId?.name?.charAt(0) || "P"}
                                </div>
                                <div className="overflow-hidden">
                                    <h3 className="font-bold text-slate-900 truncate">{apt.patientId?.name || "Unknown Patient"}</h3>
                                    <p className="text-sm text-slate-500 font-medium truncate">
                                        Dr. {apt.doctorId?.name || "Unassigned"}
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                                <div className="flex items-center text-slate-600 text-sm font-semibold">
                                    <Clock size={14} className="mr-1.5 text-indigo-500" />
                                    {new Date(apt.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                </div>
                                <span className={`px-3 py-1 text-xs font-bold rounded-full border ${statusColor[apt.status] || "bg-slate-100 text-slate-600 border-slate-200"} uppercase tracking-wider`}>
                                    {apt.status}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-20 text-center flex flex-col items-center justify-center">
                    <div className="p-4 bg-slate-50 rounded-full mb-4">
                        <Calendar className="h-12 w-12 text-slate-300" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">No appointments today</h3>
                    <p className="mt-2 text-slate-500 max-w-xs mx-auto">
                        There are no visits on the books for today. You can schedule new ones from the Patients tab.
                    </p>
                </div>
            )}
        </div>
    );
}
