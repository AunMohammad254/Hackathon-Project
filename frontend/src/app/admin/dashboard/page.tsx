"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import api from "@/services/api";
import { toast } from "sonner";
import { Loader2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminKpiCards } from "@/components/admin/AdminKpiCards";
import { AdminCharts } from "@/components/admin/AdminCharts";
import { AdminRecentActivity } from "@/components/admin/AdminRecentActivity";
import { AdminAiAnalytics } from "@/components/admin/AdminAiAnalytics";

interface AIAnalytics {
    topConditions: string[];
    patientLoadForecast: string;
    doctorPerformanceTrends: string;
    trendInsight: string;
    recommendation: string;
}

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
    const [aiData, setAiData] = useState<AIAnalytics | null>(null);
    const [aiLoading, setAiLoading] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isUpgrading, setIsUpgrading] = useState(false);

    useEffect(() => {
        const fetchAdminData = async () => {
            try {
                const res = await api.get("/admin/analytics");
                if (res.data?.success) {
                    setStats(res.data.stats);
                    setRecentActivity(res.data.recentActivity);
                    setMonthlyTrends(res.data.monthlyTrends || []);
                    setTopDiagnoses(res.data.topDiagnoses || []);
                }
            } catch (error) {
                console.error("Failed to fetch admin stats:", error);
                toast.error("Failed to load dashboard data");
            } finally {
                setLoading(false);
            }
        };

        fetchAdminData();
    }, []);

    const handleGenerateAI = async () => {
        setAiLoading(true);
        try {
            const res = await api.post("/ai/predictive-analytics");
            if (res.data?.success) {
                setAiData(res.data.data);
                toast.success("AI Predictive Analytics generated successfully!");
            }
        } catch (error: unknown) {
            console.error("Failed to generate AI predictive analytics", error);
            const axiosErr = error as { response?: { data?: { message?: string } } };
            const msg = axiosErr.response?.data?.message || "Failed to generate analytics";
            toast.error(msg);
        } finally {
            setAiLoading(false);
        }
    };

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

    const pieData = stats ? [
        { name: "Pending", value: stats.breakdown.pending },
        { name: "Confirmed", value: stats.breakdown.confirmed },
        { name: "Completed", value: stats.breakdown.completed },
    ] : [];

    const barData = monthlyTrends.map((m: Trend) => ({
        month: m._id,
        appointments: m.count,
    }));

    return (
        <div className="animate-in fade-in duration-700">
            <header className="mb-10 flex flex-col sm:flex-row justify-between items-start gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Platform Dashboard</h1>
                    <p className="text-slate-500 mt-2 text-lg">Real-time overview of clinic metrics and operations.</p>
                </div>
                <Button
                    onClick={handleUpgradePlan}
                    disabled={isUpgrading}
                    variant={user?.subscriptionPlan === 'Pro' ? 'outline' : 'default'}
                    className={user?.subscriptionPlan === 'Pro' 
                        ? 'border-amber-400 text-amber-600 hover:bg-amber-50' 
                        : 'bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20 transition-all active:scale-95'}
                >
                    {isUpgrading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Star className="w-4 h-4 mr-2" />}
                    {user?.subscriptionPlan === 'Pro' ? 'Downgrade to Free' : 'Upgrade to Pro'}
                </Button>
            </header>

            {loading ? (
                <div className="flex flex-col justify-center items-center h-96 space-y-4">
                    <Loader2 className="animate-spin text-indigo-500 w-12 h-12" />
                    <p className="text-slate-400 font-medium animate-pulse">Loading system metrics...</p>
                </div>
            ) : (
                <>
                    {/* KPI Cards */}
                    <AdminKpiCards stats={stats} />

                    {/* Charts Row */}
                    <AdminCharts pieData={pieData} barData={barData} />

                    {/* Top Diagnoses + Recent Feed */}
                    <AdminRecentActivity topDiagnoses={topDiagnoses} recentActivity={recentActivity} />

                    {/* AI Predictive Analytics Section */}
                    <AdminAiAnalytics aiData={aiData} aiLoading={aiLoading} onGenerate={handleGenerateAI} />
                </>
            )}
        </div>
    );
}
