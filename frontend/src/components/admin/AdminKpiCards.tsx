"use client";

import React from "react";
import { Users, CalendarCheck, FileText, DollarSign, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DashboardStats {
    totalPatients: number;
    totalAppointments: number;
    totalPrescriptions: number;
    totalDoctors: number;
    simulatedRevenue: number;
}

interface AdminKpiCardsProps {
    stats: DashboardStats | null;
}

export function AdminKpiCards({ stats }: AdminKpiCardsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-start justify-between transition-all hover:shadow-md">
                <div>
                    <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Patients</p>
                    <h3 className="text-3xl font-bold text-slate-800">{stats?.totalPatients || 0}</h3>
                </div>
                <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><Users size={22} /></div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-start justify-between transition-all hover:shadow-md">
                <div>
                    <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Appointments</p>
                    <h3 className="text-3xl font-bold text-slate-800">{stats?.totalAppointments || 0}</h3>
                </div>
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg"><CalendarCheck size={22} /></div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-start justify-between transition-all hover:shadow-md">
                <div>
                    <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Prescriptions</p>
                    <h3 className="text-3xl font-bold text-slate-800">{stats?.totalPrescriptions || 0}</h3>
                </div>
                <div className="p-3 bg-teal-50 text-teal-600 rounded-lg"><FileText size={22} /></div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-start justify-between transition-all hover:shadow-md">
                <div>
                    <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Revenue</p>
                    <h3 className="text-3xl font-bold text-emerald-700">₹{(stats?.simulatedRevenue || 0).toLocaleString()}</h3>
                    <p className="text-xs text-slate-400 mt-1">Simulated</p>
                </div>
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg"><DollarSign size={22} /></div>
            </div>
            <div className="bg-slate-900 rounded-xl shadow-md p-6 flex flex-col justify-between relative overflow-hidden transition-all hover:shadow-lg">
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
    );
}
