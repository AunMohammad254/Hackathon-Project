"use client";

import React from "react";
import { Stethoscope, ActivitySquare } from "lucide-react";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

interface DiagnosisRisk { _id: string; count: number; }
interface AppointmentActivity {
    _id: string;
    patientId?: { name: string };
    doctorId?: { name: string };
    date: string;
    status: string;
}

interface AdminRecentActivityProps {
    topDiagnoses: DiagnosisRisk[];
    recentActivity: AppointmentActivity[];
}

export function AdminRecentActivity({ topDiagnoses, recentActivity }: AdminRecentActivityProps) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Top Diagnoses Card */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 transition-all hover:shadow-md">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
                    <Stethoscope className="text-indigo-500" size={20} />
                    Diagnosis Risk Levels
                </h2>
                {topDiagnoses.length > 0 ? (
                    <ul className="space-y-3">
                        {topDiagnoses.map((d, i) => (
                            <li key={i} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors">
                                <span className={`text-sm font-semibold px-2.5 py-1 rounded-md ${d._id === "High" ? "bg-rose-100 text-rose-700" :
                                    d._id === "Medium" ? "bg-amber-100 text-amber-700" :
                                        "bg-emerald-100 text-emerald-700"
                                    }`}>{d._id} Risk</span>
                                <span className="text-sm font-bold text-slate-800">{d.count} cases</span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="flex items-center justify-center h-32 text-slate-400 text-sm">
                        <p>No diagnoses logged yet</p>
                    </div>
                )}
            </div>

            {/* Recent Activity Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden lg:col-span-2 transition-all hover:shadow-md">
                <div className="p-6 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <ActivitySquare className="text-slate-400" />
                        Global Appointment Feed
                    </h2>
                    <span className="text-sm text-slate-500 font-medium">5 most recent</span>
                </div>
                <Table>
                    <TableHeader className="bg-white">
                        <TableRow>
                            <TableHead className="font-semibold text-slate-500 uppercase tracking-wider text-xs">Patient</TableHead>
                            <TableHead className="font-semibold text-slate-500 uppercase tracking-wider text-xs">Doctor</TableHead>
                            <TableHead className="font-semibold text-slate-500 uppercase tracking-wider text-xs">Date</TableHead>
                            <TableHead className="font-semibold text-slate-500 uppercase tracking-wider text-xs text-right">Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {recentActivity && recentActivity.length > 0 ? (
                            recentActivity.map((activity) => (
                                <TableRow key={activity._id} className="hover:bg-slate-50 transition-colors">
                                    <TableCell className="font-semibold text-slate-900">{activity.patientId?.name || "Unknown"}</TableCell>
                                    <TableCell className="text-slate-600 font-medium">Dr. {activity.doctorId?.name || "Unassigned"}</TableCell>
                                    <TableCell className="text-slate-500 text-sm">
                                        {new Date(activity.date).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <span className={`px-2.5 py-1 text-xs font-bold rounded-md ${activity.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                                            activity.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                                                'bg-amber-100 text-amber-700'
                                            }`}>
                                            {activity.status?.toUpperCase()}
                                        </span>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={4} className="h-32 text-center text-slate-500 font-medium">No recent system activity.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
