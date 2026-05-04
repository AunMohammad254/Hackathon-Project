"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import api from "@/services/api";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { BookAppointmentModal } from "@/components/patient/BookAppointmentModal";
import { PatientQuickActions } from "@/components/patient/PatientQuickActions";
import { PatientStats } from "@/components/patient/PatientStats";
import { PatientTimeline } from "@/components/patient/PatientTimeline";

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
            // Standardized API might return { success: true, appointments: [...] }
            setAppointments(aptRes.data.success ? aptRes.data.appointments : aptRes.data);
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
        <div className="animate-in fade-in duration-700">
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                    Welcome back, {user?.name?.split(" ")[0]} 👋
                </h1>
                <p className="text-slate-500 mt-2 text-lg">
                    Here&apos;s a quick summary of your health profile.
                </p>
            </header>

            {/* Quick Actions Grid */}
            <PatientQuickActions onBookVisit={() => setIsBookingOpen(true)} />

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
                    <PatientStats 
                        upcomingCount={upcoming.length}
                        completedCount={completed.length}
                        plan={plan}
                        onTogglePlan={togglePlan}
                    />

                    {/* Recent Appointments Timeline */}
                    <PatientTimeline 
                        items={timelineItems} 
                        onBookVisit={() => setIsBookingOpen(true)} 
                    />
                </>
            )}

            <BookAppointmentModal
                open={isBookingOpen}
                onOpenChange={setIsBookingOpen}
                onSuccess={fetchTimelineData}
            />
        </div>
    );
}
