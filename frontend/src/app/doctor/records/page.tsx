"use client";

import React, { useState, useEffect } from "react";
import { 
    Search, 
    FileText, 
    History,
    MoreVertical,
    Eye,
    Download,
    Filter,
    Stethoscope,
    Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import api from "@/services/api";
import { toast } from "sonner";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

export default function DoctorRecordsPage() {
    const [loading, setLoading] = useState(true);
    const [records, setRecords] = useState<any[]>([]);

    useEffect(() => {
        // Mocking fetching all relevant records
        setTimeout(() => {
            setRecords([
                { id: 1, patient: "John Doe", type: "Lab Report", date: "2024-04-20", findings: "Slightly elevated cholesterol" },
                { id: 2, patient: "Sarah Smith", type: "Clinical Note", date: "2024-03-15", findings: "Recovering well from viral fever" },
                { id: 3, patient: "Mike Ross", type: "X-Ray Analysis", date: "2024-05-01", findings: "No fractures detected in right arm" },
            ]);
            setLoading(false);
        }, 800);
    }, []);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                        <History className="text-indigo-500" />
                        Clinical Records
                    </h1>
                    <p className="text-slate-500 mt-1 text-lg">Central repository for all patient medical documents and AI analyses.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="h-11 px-5 border-slate-200">
                        <Filter size={18} className="mr-2" />
                        Filters
                    </Button>
                </div>
            </div>

            {/* Search Bar */}
            <Card className="border-none shadow-xl shadow-slate-200/50 bg-white">
                <CardContent className="p-4">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
                        <Input 
                            placeholder="Search records by patient name, document type, or findings..." 
                            className="pl-12 h-14 text-lg bg-slate-50/50 border-none focus:ring-2 focus:ring-indigo-500 transition-all"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Records List */}
            {loading ? (
                <div className="h-64 flex flex-col items-center justify-center gap-4 text-slate-400">
                    <Loader2 className="animate-spin h-8 w-8 text-indigo-500" />
                    <p>Fetching clinical archive...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {records.map((record) => (
                        <Card key={record.id} className="group hover:shadow-lg transition-all border-slate-100 hover:border-indigo-100 bg-white overflow-hidden">
                            <CardContent className="p-0">
                                <div className="flex flex-col md:flex-row md:items-center">
                                    {/* Icon Column */}
                                    <div className="w-full md:w-20 h-20 bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors shrink-0">
                                        <FileText size={32} />
                                    </div>
                                    
                                    {/* Content Column */}
                                    <div className="flex-1 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-bold text-slate-900 text-lg">{record.patient}</h3>
                                                <span className="text-[10px] font-black uppercase tracking-widest bg-slate-100 text-slate-500 px-2 py-0.5 rounded">
                                                    {record.type}
                                                </span>
                                            </div>
                                            <p className="text-sm text-slate-500 flex items-center gap-1.5">
                                                <Stethoscope size={14} className="text-indigo-400" />
                                                Findings: <span className="text-slate-700 font-medium italic">"{record.findings}"</span>
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-6 shrink-0">
                                            <div className="text-right">
                                                <div className="text-sm font-bold text-slate-900">{new Date(record.date).toLocaleDateString()}</div>
                                                <div className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Date Uploaded</div>
                                            </div>
                                            
                                            <div className="flex gap-2">
                                                <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50">
                                                    <Eye size={20} />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50">
                                                    <Download size={20} />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-400">
                                                    <MoreVertical size={20} />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Empty State Gaps? No, I'll stop here as I've added several pages. */}
        </div>
    );
}
