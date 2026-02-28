"use client";

import { useEffect, useState } from "react";
import api from "@/services/api";
import {
    Users, CalendarCheck, FileText, Activity,
    TrendingUp, ActivitySquare, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

interface DashboardStats {
    totalPatients: number;
    totalAppointments: number;
    totalPrescriptions: number;
    totalDoctors: number;
    breakdown: {
        pending: number;
        confirmed: number;
        completed: number;
    };
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [recentActivity, setRecentActivity] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAdminData = async () => {
            try {
                const res = await api.get("/admin/stats");
                if (res.data?.success) {
                    setStats(res.data.stats);
                    setRecentActivity(res.data.recentActivity);
                }
            } catch (error) {
                console.error("Failed to fetch admin stats:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchAdminData();
    }, []);

    return (
        <>
            <header className="mb-10">
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Platform Dashboard</h1>
                <p className="text-slate-500 mt-2 text-lg">Real-time overview of clinic metrics and operations.</p>
            </header>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="animate-spin text-teal-500 w-10 h-10" />
                </div>
            ) : (
                <>
                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        {/* Total Patients */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-start justify-between">
                            <div>
                                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Patients</p>
                                <h3 className="text-4xl font-bold text-slate-800">{stats?.totalPatients || 0}</h3>
                                <div className="flex items-center gap-1 text-emerald-600 text-sm mt-2 font-medium">
                                    <TrendingUp size={16} /> Registered
                                </div>
                            </div>
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                                <Users size={24} />
                            </div>
                        </div>

                        {/* Total Appointments */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-start justify-between">
                            <div>
                                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Appointments</p>
                                <h3 className="text-4xl font-bold text-slate-800">{stats?.totalAppointments || 0}</h3>
                                <div className="flex gap-2 text-xs mt-3">
                                    <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded font-medium">{stats?.breakdown?.pending || 0} Pending</span>
                                    <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-medium">{stats?.breakdown?.confirmed || 0} Confirmed</span>
                                    <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-medium">{stats?.breakdown?.completed || 0} Done</span>
                                </div>
                            </div>
                            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
                                <CalendarCheck size={24} />
                            </div>
                        </div>

                        {/* AI Prescriptions */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-start justify-between">
                            <div>
                                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">AI Prescriptions</p>
                                <h3 className="text-4xl font-bold text-slate-800">{stats?.totalPrescriptions || 0}</h3>
                                <p className="text-slate-400 text-sm mt-2">Generated via Gemini</p>
                            </div>
                            <div className="p-3 bg-teal-50 text-teal-600 rounded-lg">
                                <FileText size={24} />
                            </div>
                        </div>

                        {/* Active Doctors */}
                        <div className="bg-slate-900 rounded-xl shadow-md border-0 p-6 flex flex-col justify-between relative overflow-hidden">
                            <div className="z-10">
                                <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-1">Active Doctors</p>
                                <h3 className="text-4xl font-bold text-white">{stats?.totalDoctors || 0}</h3>
                            </div>
                            <div className="mt-4 z-10 w-full">
                                <Button variant="secondary" size="sm" className="w-full bg-slate-800 text-white hover:bg-slate-700 border-0" asChild>
                                    <a href="/admin/staff">Manage Roster</a>
                                </Button>
                            </div>
                            <Activity className="absolute -right-6 -bottom-6 text-slate-800 w-32 h-32 opacity-50 z-0" />
                        </div>
                    </div>

                    {/* Recent Global Activity */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-6 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
                            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <ActivitySquare className="text-slate-400" />
                                Global Appointment Feed
                            </h2>
                            <span className="text-sm text-slate-500">Showing 5 most recent</span>
                        </div>

                        <Table>
                            <TableHeader className="bg-white">
                                <TableRow>
                                    <TableHead className="font-semibold text-slate-500 uppercase tracking-wider text-xs">Patient</TableHead>
                                    <TableHead className="font-semibold text-slate-500 uppercase tracking-wider text-xs">Assigned Doctor</TableHead>
                                    <TableHead className="font-semibold text-slate-500 uppercase tracking-wider text-xs">Date / Time</TableHead>
                                    <TableHead className="font-semibold text-slate-500 uppercase tracking-wider text-xs text-right">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {recentActivity && recentActivity.length > 0 ? (
                                    recentActivity.map((activity) => (
                                        <TableRow key={activity._id} className="hover:bg-slate-50 transition-colors">
                                            <TableCell className="font-medium text-slate-900">
                                                {activity.patientId?.name || "Unknown"}
                                            </TableCell>
                                            <TableCell className="text-slate-600">
                                                Dr. {activity.doctorId?.name || "Unassigned"}
                                            </TableCell>
                                            <TableCell className="text-slate-500">
                                                {new Date(activity.date).toLocaleString([], {
                                                    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                                })}
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
                                        <TableCell colSpan={4} className="h-32 text-center text-slate-500">
                                            No recent system activity.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </>
            )}
        </>
    );
}
