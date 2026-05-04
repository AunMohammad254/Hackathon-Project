"use client";

import React from "react";
import { CalendarCheck, Clock, PlusCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface TimelineItem {
    id: string;
    type: "appointment" | "diagnosis" | "prescription";
    date: string;
    title: string;
    status: string;
    doctorName?: string;
}

interface PatientTimelineProps {
    items: TimelineItem[];
    onBookVisit: () => void;
}

export function PatientTimeline({ items, onBookVisit }: PatientTimelineProps) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 transition-all hover:shadow-md">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                    <CalendarCheck className="text-teal-500" />
                    Recent Activity
                </h2>
                {items.length > 0 && (
                    <Link href="/patient/appointments" className="text-sm font-medium text-teal-600 hover:text-teal-700 bg-teal-50 px-3 py-1.5 rounded-full transition-colors">
                        View all activity →
                    </Link>
                )}
            </div>

            {items.length > 0 ? (
                <div className="relative border-l-2 border-slate-100 ml-3 space-y-6 pb-2">
                    {items
                        .slice(0, 5)
                        .map((item) => (
                            <div key={item.id} className="relative pl-8 group">
                                {/* Timeline Dot */}
                                <span className={`absolute -left-[9px] top-1.5 h-4 w-4 rounded-full bg-white border-4 ring-4 ring-white shadow-sm transition-transform group-hover:scale-125 ${item.type === "appointment"
                                        ? (item.status === "completed" ? "border-emerald-500" :
                                            item.status === "confirmed" ? "border-blue-500" :
                                                item.status === "cancelled" ? "border-red-500" :
                                                    "border-amber-500")
                                        : item.type === "prescription" ? "border-indigo-500"
                                            : "border-purple-500" // diagnosis
                                    }`}></span>

                                <div className="bg-slate-50 border border-slate-100 rounded-xl p-5 hover:shadow-md hover:bg-white transition duration-200">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                                            {item.type === "appointment" && `Dr. ${item.doctorName}`}
                                            {item.type === "prescription" && `Prescription from Dr. ${item.doctorName}`}
                                            {item.type === "diagnosis" && `Diagnosis Review`}
                                        </h3>
                                        <span className={`px-3 py-1 text-xs font-bold rounded-md uppercase tracking-wider ${item.type === "appointment"
                                                ? (item.status === "completed" ? "bg-emerald-100 text-emerald-700" :
                                                    item.status === "confirmed" ? "bg-blue-100 text-blue-700" :
                                                        item.status === "cancelled" ? "bg-red-100 text-red-700" :
                                                            "bg-amber-100 text-amber-700")
                                                : item.type === "prescription" ? "bg-indigo-100 text-indigo-700"
                                                    : "bg-purple-100 text-purple-700"
                                            }`}>
                                            {item.type === "appointment" ? item.status : item.type}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-500 flex items-center gap-2 font-medium">
                                        <Clock size={16} className="text-slate-400" />
                                        {new Date(item.date).toLocaleDateString(undefined, {
                                            weekday: "long", year: "numeric", month: "short", day: "numeric"
                                        })}
                                        <span className="text-slate-300">•</span>
                                        {new Date(item.date).toLocaleTimeString(undefined, {
                                            hour: "2-digit", minute: "2-digit"
                                        })}
                                    </p>
                                </div>
                            </div>
                        ))}
                </div>
            ) : (
                <div className="text-center py-16 px-4 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50">
                    <div className="bg-white p-4 rounded-full inline-flex shadow-sm mb-4">
                        <CalendarCheck className="h-10 w-10 text-teal-500" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-800 mb-2">No appointments yet</h3>
                    <p className="text-slate-500 mb-6 max-w-md mx-auto">
                        You haven&apos;t scheduled any visits. Book your first appointment to start managing your health journey with us.
                    </p>
                    <Button
                        onClick={onBookVisit}
                        className="bg-teal-600 hover:bg-teal-700 text-white px-8 py-6 rounded-xl font-medium shadow-md transition-all hover:shadow-lg flex items-center gap-2"
                    >
                        <PlusCircle size={20} />
                        Book Your First Appointment
                    </Button>
                </div>
            )}
        </div>
    );
}
