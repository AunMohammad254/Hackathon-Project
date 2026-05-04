"use client";

import { useState, useEffect } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import api from "@/services/api";
import { Activity, Users, CalendarCheck, BrainCircuit, Activity as ActivityIcon } from "lucide-react";
import LabReportAnalyzer from "@/components/doctor/LabReportAnalyzer";
import { SmartDiagnosisModal } from "@/components/doctor/SmartDiagnosisModal";
import { DoctorStats } from "@/components/doctor/DoctorStats";
import { DoctorWaitlist } from "@/components/doctor/DoctorWaitlist";
import { DoctorConsultationModal } from "@/components/doctor/DoctorConsultationModal";

import { Button } from "@/components/ui/button";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

interface Appointment {
    _id: string;
    date: string;
    status: string;
    patientId: { _id: string; name: string; age: number; contact: string };
}

export default function DoctorDashboard() {
    const { user, logout } = useAuth();
    const [appointments, setAppointments] = useState<Appointment[]>([]);

    // Consultation Modal State
    const [activeAppointment, setActiveAppointment] = useState<Appointment | null>(null);
    const [isConsultOpen, setIsConsultOpen] = useState(false);
    
    // UI State
    const [isSmartDiagnosisOpen, setIsSmartDiagnosisOpen] = useState(false);
    const [analytics, setAnalytics] = useState<{ 
        stats?: { dailyAppointments?: number; totalAppointments?: number; totalPrescriptions?: number }; 
        monthlyStats?: { _id: string; count: number }[]; 
    } | null>(null);

    const fetchDashboardData = async () => {
        try {
            const res = await api.get("/appointments");
            // Standardized API might return { success: true, appointments: [...] }
            setAppointments(res.data.success ? res.data.appointments : res.data);
            
            const analyticsRes = await api.get("/doctor/analytics");
            if (analyticsRes.data?.success) {
                setAnalytics(analyticsRes.data);
            }
        } catch (error) {
            console.error("Failed to fetch dashboard data", error);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const handleOpenConsultation = (apt: Appointment) => {
        setActiveAppointment(apt);
        setIsConsultOpen(true);
    };

    return (
        <>
            <header className="mb-8 flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Active Waitlist</h1>
                    <p className="text-slate-500 mt-1">Select confirmed appointments to begin physical or tele-consultation.</p>
                </div>
                <Button
                    onClick={() => setIsSmartDiagnosisOpen(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2 shadow-md transition-all active:scale-95"
                >
                    <BrainCircuit size={18} />
                    Smart Symptom Checker
                </Button>
            </header>

            {/* Stats Cards extracted to component */}
            <DoctorStats 
                stats={analytics?.stats} 
                confirmedCount={appointments.filter(a => a.status === 'confirmed').length} 
            />

            {/* Chart Row */}
            <div className="mb-8 bg-white rounded-xl shadow-sm border border-slate-200 p-6 transition-all hover:shadow-md">
                 <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                     <ActivityIcon className="text-indigo-500" size={20} />
                     My Monthly Consultations
                 </h2>
                 {analytics?.monthlyStats && analytics.monthlyStats.length > 0 ? (
                     <ResponsiveContainer width="100%" height={260}>
                         <BarChart data={analytics.monthlyStats.map((m: { _id: string; count: number }) => ({ month: m._id, consults: m.count }))}>
                             <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                             <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                             <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                             <Tooltip 
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                cursor={{ fill: '#f8fafc' }} 
                             />
                             <Bar dataKey="consults" fill="#6366f1" radius={[4, 4, 0, 0]} />
                         </BarChart>
                     </ResponsiveContainer>
                 ) : (
                     <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                         <p className="text-center italic">Not enough historical data to map trends.</p>
                     </div>
                 )}
            </div>

            {/* Waitlist Table extracted to component */}
            <DoctorWaitlist 
                appointments={appointments} 
                onStartConsult={handleOpenConsultation} 
            />

            <LabReportAnalyzer />

            {/* Consultation Modal extracted to component */}
            <DoctorConsultationModal 
                appointment={activeAppointment}
                open={isConsultOpen}
                onOpenChange={setIsConsultOpen}
                onSuccess={fetchDashboardData}
            />

            <SmartDiagnosisModal open={isSmartDiagnosisOpen} onOpenChange={setIsSmartDiagnosisOpen} />
        </>
    );
}
