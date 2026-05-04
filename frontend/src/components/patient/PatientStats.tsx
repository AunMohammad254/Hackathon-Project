"use client";

import React from "react";
import { HeartPulse, Clock, TrendingUp, Activity, FileImage, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface PatientStatsProps {
    upcomingCount: number;
    completedCount: number;
    plan: string;
    onTogglePlan: () => void;
}

export function PatientStats({ upcomingCount, completedCount, plan, onTogglePlan }: PatientStatsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Latest Vitals summary */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between transition-all hover:shadow-md">
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

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between transition-all hover:shadow-md">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Upcoming</p>
                        <h3 className="text-4xl font-bold text-slate-800">{upcomingCount}</h3>
                    </div>
                    <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
                        <Clock size={24} />
                    </div>
                </div>
                <p className="text-emerald-600 text-sm mt-3 font-medium flex items-center gap-1 border-t border-slate-100 pt-3">
                    <TrendingUp size={14} /> Pending / Confirmed
                </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between group transition-all hover:shadow-md">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Completed</p>
                        <h3 className="text-4xl font-bold text-slate-800">{completedCount}</h3>
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
            <div className={`rounded-xl shadow-sm border p-6 flex flex-col justify-between transition-all hover:shadow-lg ${plan === 'Pro' ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-0' : 'bg-white border-slate-200'}`}>
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
                        onClick={onTogglePlan}
                        className={plan === 'Pro' ? 'bg-white/20 hover:bg-white/30 text-white h-8 text-xs' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 shadow-none h-8 text-xs'}
                    >
                        {plan === 'Pro' ? 'Downgrade' : 'Upgrade'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
