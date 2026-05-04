"use client";

import React, { useState, useEffect } from "react";
import { 
    Users, 
    Search, 
    UserPlus, 
    MoreVertical, 
    Mail, 
    Phone, 
    Calendar,
    ArrowUpRight,
    Loader2,
    Edit,
    Trash2,
    Eye
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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

interface Patient {
    _id: string;
    name: string;
    age: number;
    gender: string;
    contact: string;
}

export default function ReceptionistPatientsPage() {
    const [patients, setPatients] = useState<Patient[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        fetchPatients();
    }, []);

    const fetchPatients = async () => {
        try {
            const res = await api.get("/patients");
            if (res.data.success) {
                setPatients(res.data.patients);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to fetch patients");
        } finally {
            setLoading(false);
        }
    };

    const filteredPatients = patients.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.contact.includes(searchQuery)
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Patient Management</h1>
                    <p className="text-slate-500 mt-1">Register new patients and manage their clinical profiles.</p>
                </div>
                <div className="flex gap-3">
                    <Button className="bg-blue-600 hover:bg-blue-700 h-11 px-6 font-bold shadow-lg shadow-blue-200">
                        <UserPlus size={18} className="mr-2" />
                        Register New Patient
                    </Button>
                </div>
            </div>

            {/* Main Content Card */}
            <Card className="border-slate-200 shadow-xl shadow-slate-200/50 bg-white">
                <CardHeader className="p-8 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-black">
                                {patients.length}
                            </div>
                            <CardTitle className="text-xl">Active Patients</CardTitle>
                        </div>
                        <div className="relative w-full md:w-96 group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                            <Input 
                                placeholder="Search by name, contact, or ID..." 
                                className="pl-12 h-11 bg-white border-slate-200 focus:border-blue-500 shadow-sm"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="h-64 flex flex-col items-center justify-center gap-4 text-slate-400">
                            <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
                            <p>Syncing patient database...</p>
                        </div>
                    ) : filteredPatients.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                                    <TableHead className="w-[300px] font-bold py-5 pl-8 uppercase tracking-wider text-[11px] text-slate-400">Patient Details</TableHead>
                                    <TableHead className="font-bold uppercase tracking-wider text-[11px] text-slate-400">Age / Gender</TableHead>
                                    <TableHead className="font-bold uppercase tracking-wider text-[11px] text-slate-400">Contact Info</TableHead>
                                    <TableHead className="font-bold uppercase tracking-wider text-[11px] text-slate-400">Status</TableHead>
                                    <TableHead className="text-right font-bold py-5 pr-8 uppercase tracking-wider text-[11px] text-slate-400">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredPatients.map((patient) => (
                                    <TableRow key={patient._id} className="group hover:bg-blue-50/30 transition-colors">
                                        <TableCell className="py-5 pl-8">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600 font-bold group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                                                    {patient.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-900 text-base">{patient.name}</div>
                                                    <div className="text-xs text-slate-400 font-medium">ID: {patient._id.slice(-8).toUpperCase()}</div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-slate-700 font-medium">{patient.age} Yrs</div>
                                            <div className="text-xs text-slate-500">{patient.gender}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2 text-slate-600">
                                                <Mail size={14} className="text-slate-300" />
                                                <span className="text-sm">{patient.contact}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-slate-600 mt-1">
                                                <Phone size={14} className="text-slate-300" />
                                                <span className="text-sm">+1 234 567 890</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200 uppercase tracking-tight">
                                                Active
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right py-5 pr-8">
                                            <div className="flex justify-end gap-1">
                                                <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-blue-600 hover:bg-blue-50">
                                                    <Eye size={18} />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-blue-600 hover:bg-blue-50">
                                                    <Edit size={18} />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-rose-600 hover:bg-rose-50">
                                                    <Trash2 size={18} />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="h-96 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                            <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                                <Users size={40} className="text-slate-200" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-600 mb-2">No patients found</h3>
                            <p className="max-w-xs text-sm leading-relaxed">
                                No records match your current search criteria.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
