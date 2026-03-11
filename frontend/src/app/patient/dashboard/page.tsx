"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import api from "@/services/api";
import {
    CalendarCheck, Clock, HeartPulse,
    TrendingUp, ShieldCheck, PlusCircle,
    FileImage, Activity, FileText, MessageSquarePlus
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { BookAppointmentModal } from "@/components/patient/BookAppointmentModal";

interface DoctorInfo {
    _id: string;
    name: string;
}

interface Appointment {
    _id: string;
    date: string;
    status: string;
    doctorId: DoctorInfo | null;
}

interface Prescription {
    _id: string;
    createdAt: string;
    doctorId: DoctorInfo | null;
}

interface Diagnosis {
    _id: string;
    createdAt: string;
    riskLevel: string;
    doctorId: DoctorInfo | null;
}

// Unified Timeline Item for Medical History
interface TimelineItem {
    id: string;
    type: "appointment" | "diagnosis" | "prescription";
    date: string;
    title: string;
    status: string;
    doctorName?: string;
}

export default function PatientDashboard() {
    const { user, updateUser } = useAuth();
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
    const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
    const [loading, setLoading] = useState(true);
    const [plan, setPlan] = useState(user?.subscriptionPlan || "Free");
    const [isBookingOpen, setIsBookingOpen] = useState(false);

    const fetchTimelineData = async () => {
        try {
            const [aptRes, preRes, diagRes] = await Promise.all([
                api.get("/appointments?limit=50"),
                api.get("/prescriptions/my"),
                api.get("/patients/my-diagnoses")
            ]);
            setAppointments(aptRes.data);
            setPrescriptions(preRes.data?.data || []);
            setDiagnoses(diagRes.data?.data || []);
        } catch (error) {
            console.error("Failed to fetch timeline data", error);
            toast.error("Failed to load timeline. Please refresh the page.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTimelineData();
    }, [user]);

    // Analytics grouping
    const upcoming = appointments.filter(
        (a) => a.status === "pending" || a.status === "confirmed"
    );
    const completed = appointments.filter((a) => a.status === "completed");

    // Unified Timeline Mapping
    const timelineItems: TimelineItem[] = [
        ...appointments.map((apt): TimelineItem => ({
            id: apt._id,
            type: "appointment",
            date: apt.date,
            title: "Appointment",
            status: apt.status,
            doctorName: apt.doctorId?.name || "Unknown Doctor"
        })),
        ...prescriptions.map((pre): TimelineItem => ({
            id: pre._id,
            type: "prescription",
            date: pre.createdAt,
            title: "Prescription",
            status: "issued",
            doctorName: pre.doctorId?.name || "Unknown Doctor"
        })),
        ...diagnoses.map((diag): TimelineItem => ({
            id: diag._id,
            type: "diagnosis",
            date: diag.createdAt,
            title: "Diagnosis Review",
            status: diag.riskLevel,
            doctorName: diag.doctorId?.name || "Unknown Doctor"
        }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const togglePlan = async () => {
        try {
            const res = await api.post("/ai/upgrade-plan");
            if (res.data?.success) {
                setPlan(res.data.plan);
                updateUser({ subscriptionPlan: res.data.plan });
                toast.success(res.data.message);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to update plan. Please try again later.");
        }
    };

    return (
        <>
            <header className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                        Welcome back, {user?.name?.split(" ")[0]} 👋
                    </h1>
                    <p className="text-slate-500 mt-2 text-lg">
                        Here&apos;s a quick summary of your health profile.
                    </p>
                </div>
            </header>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <button
                    onClick={() => setIsBookingOpen(true)}
                    className="bg-teal-50 hover:bg-teal-100 border border-teal-100 p-4 rounded-xl flex items-center gap-3 transition-colors group text-left"
                >
                    <div className="bg-teal-500 text-white p-2.5 rounded-lg group-hover:scale-110 transition-transform">
                        <PlusCircle size={20} />
                    </div>
                    <span className="font-semibold text-teal-900 text-sm">Book Visit</span>
                </button>

                <Link href="/patient/prescriptions" className="bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 p-4 rounded-xl flex items-center gap-3 transition-colors group">
                    <div className="bg-indigo-500 text-white p-2.5 rounded-lg group-hover:scale-110 transition-transform">
                        <Activity size={20} />
                    </div>
                    <span className="font-semibold text-indigo-900 text-sm">Request Refill</span>
                </Link>

                <div className="bg-blue-50 hover:bg-blue-100 border border-blue-100 p-4 rounded-xl flex items-center gap-3 transition-colors group cursor-pointer" onClick={() => toast.info("Medical Records feature is coming soon!")}>
                    <div className="bg-blue-500 text-white p-2.5 rounded-lg group-hover:scale-110 transition-transform">
                        <FileText size={20} />
                    </div>
                    <span className="font-semibold text-blue-900 text-sm">Upload Records</span>
                </div>

                <div className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 p-4 rounded-xl flex items-center gap-3 transition-colors group cursor-pointer" onClick={() => {
                    const evt = new CustomEvent("open-health-chat");
                    window.dispatchEvent(evt);
                    toast.info("Opening Health Assistant...");
                }}>
                    <div className="bg-emerald-500 text-white p-2.5 rounded-lg group-hover:scale-110 transition-transform">
                        <MessageSquarePlus size={20} />
                    </div>
                    <span className="font-semibold text-emerald-900 text-sm">Message Clinic</span>
                </div>
            </div>

            {loading ? (
                // Modern Skeleton Loader
                <div className="space-y-8 animate-pulse">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[...Array(4)].map((_, i) => (
                            <Skeleton key={i} className="h-40 w-full rounded-xl" />
                        ))}
                    </div>
                    <div className="space-y-4">
                        <Skeleton className="h-8 w-48 rounded-md" />
                        {[...Array(3)].map((_, i) => (
                            <Skeleton key={i} className="h-24 w-full rounded-xl" />
                        ))}
                    </div>
                </div>
            ) : (
                <>
                    {/* Quick Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        {/* Static Health Vitals summary */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Latest Vitals</p>
                                    <h3 className="text-2xl font-bold text-slate-800 tracking-tight">--/-- <span className="text-sm font-normal text-slate-500">mmHg</span></h3>
                                </div>
                                <div className="p-3 bg-slate-50 text-slate-400 rounded-lg">
                                    <HeartPulse size={24} />
                                </div>
                            </div>
                            <div className="flex justify-between items-center border-t border-slate-100 mt-3 pt-3">
                                <p className="text-slate-500 text-xs">Heart Rate: <span className="font-medium text-slate-700">-- bpm</span></p>
                                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">No Data</span>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Upcoming</p>
                                    <h3 className="text-4xl font-bold text-slate-800">{upcoming.length}</h3>
                                </div>
                                <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
                                    <Clock size={24} />
                                </div>
                            </div>
                            <p className="text-emerald-600 text-sm mt-3 font-medium flex items-center gap-1 border-t border-slate-100 pt-3">
                                <TrendingUp size={14} /> Pending / Confirmed
                            </p>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between group">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Completed</p>
                                    <h3 className="text-4xl font-bold text-slate-800">{completed.length}</h3>
                                </div>
                                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                                    <Activity size={24} />
                                </div>
                            </div>
                            <div className="mt-4 border-t border-slate-100 pt-3">
                                <Link
                                    href="/patient/prescriptions"
                                    className="text-sm text-teal-600 font-medium hover:text-teal-700 flex items-center gap-1"
                                >
                                    <FileImage size={14} /> View Past Prescriptions →
                                </Link>
                            </div>
                        </div>

                        {/* Your Plan Card */}
                        <div className={`rounded-xl shadow-sm border p-6 flex flex-col justify-between ${plan === 'Pro' ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-0' : 'bg-white border-slate-200'}`}>
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className={`text-sm font-semibold uppercase tracking-wider mb-1 ${plan === 'Pro' ? 'text-indigo-200' : 'text-slate-500'}`}>Your Plan</p>
                                    <h3 className={`text-3xl font-bold ${plan === 'Pro' ? 'text-white' : 'text-slate-800'} flex items-center gap-2`}>
                                        <ShieldCheck size={28} />
                                        {plan}
                                    </h3>
                                </div>
                            </div>
                            <div className={`mt-3 border-t pt-3 flex items-center justify-between ${plan === 'Pro' ? 'border-indigo-400/30' : 'border-slate-100'}`}>
                                <p className={`text-xs ${plan === 'Pro' ? 'text-indigo-100' : 'text-slate-500'} max-w-[120px]`}>
                                    {plan === 'Pro' ? 'All AI features unlocked' : 'Upgrade to unlock AI'}
                                </p>
                                <Button
                                    size="sm"
                                    onClick={togglePlan}
                                    className={plan === 'Pro' ? 'bg-white/20 hover:bg-white/30 text-white h-8 text-xs' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 shadow-none h-8 text-xs'}
                                >
                                    {plan === 'Pro' ? 'Downgrade' : 'Upgrade'}
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Recent Appointments Timeline */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                                <CalendarCheck className="text-teal-500" />
                                Recent Activity
                            </h2>
                            {appointments.length > 0 && (
                                <Link href="/patient/appointments" className="text-sm font-medium text-teal-600 hover:text-teal-700 bg-teal-50 px-3 py-1.5 rounded-full transition-colors">
                                    View all activity →
                                </Link>
                            )}
                        </div>

                        {timelineItems.length > 0 ? (
                            <div className="relative border-l-2 border-slate-100 ml-3 space-y-6 pb-2">
                                {timelineItems
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
                                    onClick={() => setIsBookingOpen(true)}
                                    className="bg-teal-600 hover:bg-teal-700 text-white px-8 py-6 rounded-xl font-medium shadow-md transition-all hover:shadow-lg flex items-center gap-2"
                                >
                                    <PlusCircle size={20} />
                                    Book Your First Appointment
                                </Button>
                            </div>
                        )}
                    </div>
                </>
            )}

            <BookAppointmentModal
                open={isBookingOpen}
                onOpenChange={setIsBookingOpen}
                onSuccess={fetchTimelineData}
            />
        </>
    );
}
