"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import api from "@/services/api";
import { toast } from "sonner";
import {
    Users, CalendarCheck, FileText, Activity,
    ActivitySquare, Loader2, DollarSign, Stethoscope, Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
    PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

interface DashboardStats {
    totalPatients: number;
    totalAppointments: number;
    totalPrescriptions: number;
    totalDoctors: number;
    simulatedRevenue: number;
    breakdown: {
        pending: number;
        confirmed: number;
        completed: number;
    };
}

const PIE_COLORS = ["#f59e0b", "#3b82f6", "#10b981"];

interface Trend { _id: string; count: number; }
interface DiagnosisRisk { _id: string; count: number; }
interface AppointmentActivity {
    _id: string;
    patientId?: { name: string };
    doctorId?: { name: string };
    date: string;
    status: string;
}

export default function AdminDashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [recentActivity, setRecentActivity] = useState<AppointmentActivity[]>([]);
    const [monthlyTrends, setMonthlyTrends] = useState<Trend[]>([]);
    const [topDiagnoses, setTopDiagnoses] = useState<DiagnosisRisk[]>([]);
    const [loading, setLoading] = useState(true);
    const [isUpgrading, setIsUpgrading] = useState(false);

    useEffect(() => {
        const fetchAdminData = async () => {
            try {
                const res = await api.get("/admin/analytics"); // Renamed route to meet prompt spec
                if (res.data?.success) {
                    setStats(res.data.stats);
                    setRecentActivity(res.data.recentActivity);
                    setMonthlyTrends(res.data.monthlyTrends || []);
                    setTopDiagnoses(res.data.topDiagnoses || []);
                }
            } catch (error) {
                console.error("Failed to fetch admin stats:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchAdminData();
    }, []);

    const pieData = stats ? [
        { name: "Pending", value: stats.breakdown.pending },
        { name: "Confirmed", value: stats.breakdown.confirmed },
        { name: "Completed", value: stats.breakdown.completed },
    ] : [];

    const barData = monthlyTrends.map((m: Trend) => ({
        month: m._id,
        appointments: m.count,
    }));

    const handleUpgradePlan = async () => {
        if (!user) return;
        setIsUpgrading(true);
        const newPlan = user.subscriptionPlan === 'Pro' ? 'Free' : 'Pro';
        try {
            await api.put("/admin/subscription", { userId: user._id, plan: newPlan });
            toast.success(`Successfully updated plan to ${newPlan}! Refresh to see changes.`);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to update plan";
            const axiosErr = err as { response?: { data?: { message?: string } } };
            toast.error(axiosErr.response?.data?.message || message);
        } finally {
            setIsUpgrading(false);
        }
    };

    return (
        <>
            <header className="mb-10 flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Platform Dashboard</h1>
                    <p className="text-slate-500 mt-2 text-lg">Real-time overview of clinic metrics and operations.</p>
                </div>
                <Button
                    onClick={handleUpgradePlan}
                    disabled={isUpgrading}
                    variant={user?.subscriptionPlan === 'Pro' ? 'outline' : 'default'}
                    className={user?.subscriptionPlan === 'Pro' ? 'border-amber-400 text-amber-600' : 'bg-amber-500 hover:bg-amber-600 text-white shadow-md'}
                >
                    {isUpgrading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Star className="w-4 h-4 mr-2" />}
                    {user?.subscriptionPlan === 'Pro' ? 'Downgrade to Free' : 'Upgrade to Pro'}
                </Button>
            </header>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="animate-spin text-teal-500 w-10 h-10" />
                </div>
            ) : (
                <>
                    {/* KPI Cards — top row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5 mb-8">
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-start justify-between">
                            <div>
                                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Patients</p>
                                <h3 className="text-3xl font-bold text-slate-800">{stats?.totalPatients || 0}</h3>
                            </div>
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><Users size={22} /></div>
                        </div>
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-start justify-between">
                            <div>
                                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Appointments</p>
                                <h3 className="text-3xl font-bold text-slate-800">{stats?.totalAppointments || 0}</h3>
                            </div>
                            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg"><CalendarCheck size={22} /></div>
                        </div>
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-start justify-between">
                            <div>
                                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Prescriptions</p>
                                <h3 className="text-3xl font-bold text-slate-800">{stats?.totalPrescriptions || 0}</h3>
                            </div>
                            <div className="p-3 bg-teal-50 text-teal-600 rounded-lg"><FileText size={22} /></div>
                        </div>
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-start justify-between">
                            <div>
                                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Revenue</p>
                                <h3 className="text-3xl font-bold text-emerald-700">₹{(stats?.simulatedRevenue || 0).toLocaleString()}</h3>
                                <p className="text-xs text-slate-400 mt-1">Simulated</p>
                            </div>
                            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg"><DollarSign size={22} /></div>
                        </div>
                        <div className="bg-slate-900 rounded-xl shadow-md p-6 flex flex-col justify-between relative overflow-hidden">
                            <div className="z-10">
                                <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-1">Doctors</p>
                                <h3 className="text-3xl font-bold text-white">{stats?.totalDoctors || 0}</h3>
                            </div>
                            <Button variant="secondary" size="sm" className="mt-3 w-full bg-slate-800 text-white hover:bg-slate-700 z-10" asChild>
                                <a href="/admin/staff">Manage Roster</a>
                            </Button>
                            <Activity className="absolute -right-4 -bottom-4 text-slate-800 w-24 h-24 opacity-50 z-0" />
                        </div>
                    </div>

                    {/* Charts Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                        {/* Pie Chart – Appointment Status */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                            <h2 className="text-lg font-bold text-slate-800 mb-4">Appointment Status Breakdown</h2>
                            {pieData.some(d => d.value > 0) ? (
                                <ResponsiveContainer width="100%" height={260}>
                                    <PieChart>
                                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value" label={(props: { name?: string; percent?: number }) => `${props.name || ''} ${((props.percent ?? 0) * 100).toFixed(0)}%`}>
                                            {pieData.map((_, i) => (
                                                <Cell key={i} fill={PIE_COLORS[i]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <p className="text-center text-slate-400 py-20">No appointment data yet</p>
                            )}
                        </div>

                        {/* Bar Chart – Monthly Trends */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                            <h2 className="text-lg font-bold text-slate-800 mb-4">Monthly Appointment Trends</h2>
                            {barData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={260}>
                                    <BarChart data={barData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                                        <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                                        <Tooltip />
                                        <Bar dataKey="appointments" fill="#6366f1" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <p className="text-center text-slate-400 py-20">No monthly data available</p>
                            )}
                        </div>
                    </div>

                    {/* Top Diagnoses + Recent Feed */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Top Diagnoses Card */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
                                <Stethoscope className="text-indigo-500" size={20} />
                                Diagnosis Risk Levels
                            </h2>
                            {topDiagnoses.length > 0 ? (
                                <ul className="space-y-3">
                                    {topDiagnoses.map((d, i) => (
                                        <li key={i} className="flex items-center justify-between">
                                            <span className={`text-sm font-medium px-2.5 py-1 rounded-md ${d._id === "High" ? "bg-rose-100 text-rose-700" :
                                                d._id === "Medium" ? "bg-amber-100 text-amber-700" :
                                                    "bg-emerald-100 text-emerald-700"
                                                }`}>{d._id} Risk</span>
                                            <span className="text-sm font-bold text-slate-800">{d.count} cases</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-slate-400 text-center py-8">No diagnoses logged yet</p>
                            )}
                        </div>

                        {/* Recent Activity Table */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden lg:col-span-2">
                            <div className="p-6 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
                                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                    <ActivitySquare className="text-slate-400" />
                                    Global Appointment Feed
                                </h2>
                                <span className="text-sm text-slate-500">5 most recent</span>
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
                                                <TableCell className="font-medium text-slate-900">{activity.patientId?.name || "Unknown"}</TableCell>
                                                <TableCell className="text-slate-600">Dr. {activity.doctorId?.name || "Unassigned"}</TableCell>
                                                <TableCell className="text-slate-500">
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
                                            <TableCell colSpan={4} className="h-32 text-center text-slate-500">No recent system activity.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </>
            )}
        </>
    );
}
