"use client";

import React from "react";

interface Stats {
    dailyAppointments?: number;
    totalAppointments?: number;
    totalPrescriptions?: number;
}

interface DoctorStatsProps {
    stats?: Stats;
    confirmedCount: number;
}

export function DoctorStats({ stats, confirmedCount }: DoctorStatsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col items-center justify-center transition-all hover:shadow-md">
                <p className="text-sm font-medium text-slate-500 mb-2">Daily Appointments</p>
                <h3 className="text-3xl font-bold text-slate-800">{stats?.dailyAppointments || 0}</h3>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col items-center justify-center transition-all hover:shadow-md">
                <p className="text-sm font-medium text-slate-500 mb-2">Total Historic</p>
                <h3 className="text-3xl font-bold text-slate-800">{stats?.totalAppointments || 0}</h3>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-blue-200 bg-blue-50/50 p-6 flex flex-col items-center justify-center transition-all hover:shadow-md">
                <p className="text-sm font-medium text-blue-600 mb-2">Pending Walk-ins</p>
                <h3 className="text-3xl font-bold text-blue-700">
                    {confirmedCount}
                </h3>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-emerald-200 bg-emerald-50/50 p-6 flex flex-col items-center justify-center transition-all hover:shadow-md">
                <p className="text-sm font-medium text-emerald-600 mb-2">Prescriptions Authored</p>
                <h3 className="text-3xl font-bold text-emerald-700">
                    {stats?.totalPrescriptions || 0}
                </h3>
            </div>
        </div>
    );
}
