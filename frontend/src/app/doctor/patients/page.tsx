"use client";

import React, { useState, useEffect } from "react";
import { 
    Users, 
    Search, 
    UserPlus, 
    MoreVertical, 
    Mail, 
    Phone,
    ArrowUpRight,
    Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import api from "@/services/api";
import { toast } from "sonner";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

interface Patient {
    _id: string;
    name: string;
    age: number;
    gender: string;
    contact: string;
}

export default function DoctorPatientsPage() {
    const [patients, setPatients] = useState<Patient[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    const fetchPatients = async () => {
        try {
            const res = await api.get("/patients");
            if (res.data.success) {
                setPatients(res.data.patients);
            }
        } catch {
            toast.error("Failed to fetch patients");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchPatients();
    }, []);

    const filteredPatients = patients.filter((p: Patient) => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.contact.includes(searchQuery)
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Patient Directory</h1>
                    <p className="text-slate-500 mt-1">Manage and view records for all your assigned patients.</p>
                </div>
                <div className="flex gap-3">
                    <Button className="bg-indigo-600 hover:bg-indigo-700">
                        <UserPlus size={18} className="mr-2" />
                        Add New Patient
                    </Button>
                </div>
            </div>

            {/* Stats & Search */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="md:col-span-1 bg-indigo-50 border-indigo-100">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold text-indigo-400 uppercase tracking-wider">Total Patients</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-black text-indigo-900">{patients.length}</div>
                    </CardContent>
                </Card>

                <div className="md:col-span-3 flex items-end">
                    <div className="relative w-full group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
                        <Input 
                            placeholder="Search by name, contact, or ID..." 
                            className="pl-12 h-14 text-lg bg-white border-slate-200 focus:border-indigo-500 shadow-sm"
                            value={searchQuery}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Patient Grid */}
            {loading ? (
                <div className="h-64 flex flex-col items-center justify-center gap-4 text-slate-400">
                    <Loader2 className="animate-spin h-8 w-8 text-indigo-500" />
                    <p>Loading patient directory...</p>
                </div>
            ) : filteredPatients.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredPatients.map((patient: Patient) => (
                        <Card key={patient._id} className="group hover:shadow-xl transition-all duration-300 border-slate-200 hover:border-indigo-200 overflow-hidden bg-white">
                            <div className="h-2 bg-slate-100 group-hover:bg-indigo-500 transition-colors" />
                            <CardHeader className="pb-4">
                                <div className="flex justify-between items-start">
                                    <div className="h-14 w-14 bg-slate-50 rounded-2xl flex items-center justify-center text-indigo-600 font-bold text-xl border border-slate-100 group-hover:bg-indigo-50 transition-colors">
                                        {patient.name.charAt(0)}
                                    </div>
                                    <Button variant="ghost" size="icon" className="text-slate-400">
                                        <MoreVertical size={20} />
                                    </Button>
                                </div>
                                <CardTitle className="text-xl font-bold mt-4 text-slate-900 group-hover:text-indigo-600 transition-colors">
                                    {patient.name}
                                </CardTitle>
                                <div className="flex gap-2 items-center text-sm text-slate-500">
                                    <span>{patient.age} years</span>
                                    <span>•</span>
                                    <span>{patient.gender}</span>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3 text-sm text-slate-600">
                                        <Mail size={16} className="text-slate-400" />
                                        <span className="truncate">{patient.contact}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-slate-600">
                                        <Phone size={16} className="text-slate-400" />
                                        <span>+1 234 567 890</span>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-slate-100 flex gap-2">
                                    <Button variant="outline" className="flex-1 text-xs h-9 font-bold uppercase tracking-wider">
                                        View History
                                    </Button>
                                    <Button className="flex-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-none text-xs h-9 font-bold uppercase tracking-wider">
                                        Consult
                                        <ArrowUpRight size={14} className="ml-1" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="h-96 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center text-slate-400 p-8 text-center bg-white shadow-sm">
                    <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                        <Users size={40} className="text-slate-200" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-600 mb-2">No patients found</h3>
                    <p className="max-w-xs text-sm leading-relaxed">
                        Try adjusting your search query or add a new patient to the directory.
                    </p>
                </div>
            )}
        </div>
    );
}
