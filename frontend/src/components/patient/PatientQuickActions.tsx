"use client";

import React from "react";
import Link from "next/link";
import { PlusCircle, Activity, FileText, MessageSquarePlus } from "lucide-react";
import { toast } from "sonner";

interface PatientQuickActionsProps {
    onBookVisit: () => void;
}

export function PatientQuickActions({ onBookVisit }: PatientQuickActionsProps) {
    const handleOpenChat = () => {
        const evt = new CustomEvent("open-health-chat");
        window.dispatchEvent(evt);
        toast.info("Opening Health Assistant...");
    };

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <button
                onClick={onBookVisit}
                className="bg-teal-50 hover:bg-teal-100 border border-teal-100 p-4 rounded-xl flex items-center gap-3 transition-all group text-left active:scale-95 shadow-sm"
            >
                <div className="bg-teal-500 text-white p-2.5 rounded-lg group-hover:scale-110 transition-transform">
                    <PlusCircle size={20} />
                </div>
                <span className="font-semibold text-teal-900 text-sm">Book Visit</span>
            </button>

            <Link href="/patient/prescriptions" className="bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 p-4 rounded-xl flex items-center gap-3 transition-all group active:scale-95 shadow-sm">
                <div className="bg-indigo-500 text-white p-2.5 rounded-lg group-hover:scale-110 transition-transform">
                    <Activity size={20} />
                </div>
                <span className="font-semibold text-indigo-900 text-sm">Request Refill</span>
            </Link>

            <div 
                className="bg-blue-50 hover:bg-blue-100 border border-blue-100 p-4 rounded-xl flex items-center gap-3 transition-all group cursor-pointer active:scale-95 shadow-sm" 
                onClick={() => toast.info("Medical Records feature is coming soon!")}
            >
                <div className="bg-blue-500 text-white p-2.5 rounded-lg group-hover:scale-110 transition-transform">
                    <FileText size={20} />
                </div>
                <span className="font-semibold text-blue-900 text-sm">Upload Records</span>
            </div>

            <div 
                className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 p-4 rounded-xl flex items-center gap-3 transition-all group cursor-pointer active:scale-95 shadow-sm" 
                onClick={handleOpenChat}
            >
                <div className="bg-emerald-500 text-white p-2.5 rounded-lg group-hover:scale-110 transition-transform">
                    <MessageSquarePlus size={20} />
                </div>
                <span className="font-semibold text-emerald-900 text-sm">Message Clinic</span>
            </div>
        </div>
    );
}
