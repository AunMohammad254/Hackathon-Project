"use client";

import React, { useState, useEffect } from "react";
import { 
    Users, 
    Search, 
    UserPlus, 
    MoreHorizontal, 
    Mail, 
    Phone,
    ArrowUpRight,
    Loader2,
    History,
    MessageSquare,
    Stethoscope,
    Activity,
    AlertCircle
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { DoctorConsultationModal } from "@/components/doctor/DoctorConsultationModal";
import { PatientHistoryModal } from "@/components/doctor/PatientHistoryModal";
import { SmartDiagnosisModal } from "@/components/doctor/SmartDiagnosisModal";
import { getSocket } from "@/services/socket";

interface Patient {
    _id: string;
    name: string;
    age: number;
    gender: string;
    contact: string;
    lastVisit?: string;
    status?: string;
}

export default function DoctorPatientsPage() {
    const [patients, setPatients] = useState<Patient[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

    // Modal States
    const [isConsultModalOpen, setIsConsultModalOpen] = useState(false);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [isAiModalOpen, setIsAiModalOpen] = useState(false);
    const [activeAppointment, setActiveAppointment] = useState<any>(null);

    const fetchPatients = async () => {
        setLoading(true);
        try {
            const res = await api.get("/doctor/patients");
            if (res.data.success) {
                setPatients(res.data.patients);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to fetch patient directory");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPatients();

        // Real-time socket integration
        const socket = getSocket();
        if (socket) {
            socket.on("emergency-alert", (data: any) => {
                toast.error(`EMERGENCY: ${data.message}`, {
                    duration: 10000,
                    icon: <AlertCircle className="text-rose-600" />
                });
            });
        }

        return () => {
            if (socket) socket.off("emergency-alert");
        };
    }, []);

    const handleConsult = async (patient: Patient) => {
        try {
            // Find the latest appointment for this patient to use in the modal
            const res = await api.get("/appointments");
            const appointments = res.data.success ? res.data.appointments : res.data;
            const latestApt = appointments.find((a: any) => 
                a.patientId?._id === patient._id && a.status !== "completed"
            );

            if (latestApt) {
                setActiveAppointment(latestApt);
                setIsConsultModalOpen(true);
            } else {
                // If no active appointment, we could potentially create a "walk-in" one 
                // but for this UI, we'll just alert or use a mock
                toast.info("No active appointment found for this patient. Please schedule one first.");
                // For demo purposes, we'll allow a mock appointment if needed, but let's be strict.
            }
        } catch (error) {
            toast.error("Error preparing consultation");
        }
    };

    const handleMessage = (patient: Patient) => {
        toast.info(`Chat with ${patient.name} is coming soon in the next update!`);
    };

    const filteredPatients = patients.filter((p: Patient) => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.contact.includes(searchQuery)
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                <div className="space-y-1">
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Patient Directory</h1>
                    <p className="text-slate-500 font-medium">Manage records, analyze symptoms with AI, and track patient health.</p>
                </div>
                <div className="flex gap-3">
                    <Button 
                        onClick={() => setIsAiModalOpen(true)}
                        variant="outline" 
                        className="border-indigo-200 text-indigo-600 hover:bg-indigo-50 h-12 px-6 rounded-xl font-bold"
                    >
                        <Activity size={18} className="mr-2" />
                        AI Smart Diagnosis
                    </Button>
                    <Button className="bg-indigo-600 hover:bg-indigo-700 h-12 px-6 rounded-xl font-bold shadow-lg shadow-indigo-200">
                        <UserPlus size={18} className="mr-2" />
                        Add New Patient
                    </Button>
                </div>
            </div>

            {/* Stats & Search */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="md:col-span-1 bg-gradient-to-br from-indigo-600 to-violet-700 border-none shadow-xl shadow-indigo-100">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-black text-indigo-100 uppercase tracking-[0.2em]">Active Records</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-5xl font-black text-white">{patients.length}</div>
                        <p className="text-indigo-200 text-xs mt-2 font-medium">Synced across clinic network</p>
                    </CardContent>
                </Card>

                <div className="md:col-span-3 flex items-center">
                    <div className="relative w-full group">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-all duration-300" size={22} />
                        <Input 
                            placeholder="Search by name, contact, or medical ID..." 
                            className="pl-16 h-20 text-xl bg-white border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 rounded-3xl shadow-sm transition-all duration-300"
                            value={searchQuery}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Patient Table */}
            <Card className="border-slate-100 shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden border-none">
                <CardContent className="p-0">
                    {loading ? (
                        <div className="h-96 flex flex-col items-center justify-center gap-4 text-slate-400 bg-white">
                            <div className="relative">
                                <Loader2 className="animate-spin h-12 w-12 text-indigo-500" />
                                <Activity className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-5 w-5 text-indigo-500" />
                            </div>
                            <p className="font-bold tracking-wide animate-pulse">Initializing Secure Directory...</p>
                        </div>
                    ) : filteredPatients.length > 0 ? (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-slate-50/50">
                                    <TableRow className="hover:bg-transparent border-slate-100">
                                        <TableHead className="w-[300px] py-6 pl-8 font-bold text-slate-500 uppercase text-[10px] tracking-widest">Patient Name</TableHead>
                                        <TableHead className="py-6 font-bold text-slate-500 uppercase text-[10px] tracking-widest text-center">Age / Gender</TableHead>
                                        <TableHead className="py-6 font-bold text-slate-500 uppercase text-[10px] tracking-widest">Contact Info</TableHead>
                                        <TableHead className="py-6 font-bold text-slate-500 uppercase text-[10px] tracking-widest">Status</TableHead>
                                        <TableHead className="py-6 pr-8 text-right font-bold text-slate-500 uppercase text-[10px] tracking-widest">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody className="bg-white">
                                    {filteredPatients.map((patient: Patient) => (
                                        <TableRow key={patient._id} className="group hover:bg-indigo-50/30 border-slate-50 transition-colors cursor-default">
                                            <TableCell className="py-6 pl-8">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-600 font-bold group-hover:bg-white group-hover:text-indigo-600 group-hover:shadow-md transition-all duration-300">
                                                        {patient.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">{patient.name}</div>
                                                        <div className="text-[10px] font-medium text-slate-400 uppercase tracking-tighter">ID: {patient._id.slice(-8)}</div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-6 text-center">
                                                <Badge variant="secondary" className="bg-slate-100 text-slate-700 rounded-lg px-3 py-1 font-bold">
                                                    {patient.age}Y • {patient.gender}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="py-6">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                                                        <Mail size={14} className="text-slate-300" />
                                                        {patient.contact}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-6">
                                                <Badge className="bg-emerald-50 text-emerald-600 hover:bg-emerald-50 border-none font-bold px-3">
                                                    Active
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="py-6 pr-8 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button 
                                                        onClick={() => {
                                                            setSelectedPatient(patient);
                                                            setIsHistoryModalOpen(true);
                                                        }}
                                                        variant="ghost" 
                                                        size="sm" 
                                                        className="h-10 w-10 p-0 rounded-xl hover:bg-white hover:shadow-md text-slate-400 hover:text-indigo-600"
                                                    >
                                                        <History size={18} />
                                                    </Button>
                                                    <Button 
                                                        onClick={() => handleMessage(patient)}
                                                        variant="ghost" 
                                                        size="sm" 
                                                        className="h-10 w-10 p-0 rounded-xl hover:bg-white hover:shadow-md text-slate-400 hover:text-indigo-600"
                                                    >
                                                        <MessageSquare size={18} />
                                                    </Button>
                                                    
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="sm" className="h-10 w-10 p-0 rounded-xl hover:bg-white hover:shadow-md text-slate-400">
                                                                <MoreHorizontal size={18} />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl shadow-2xl border-slate-100">
                                                            <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-slate-400 px-3 py-2">Clinical Actions</DropdownMenuLabel>
                                                            <DropdownMenuItem 
                                                                onClick={() => handleConsult(patient)}
                                                                className="rounded-xl py-3 px-3 cursor-pointer focus:bg-indigo-50 focus:text-indigo-700"
                                                            >
                                                                <Stethoscope className="mr-3 h-5 w-5" />
                                                                <span className="font-bold">Start Consultation</span>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem 
                                                                onClick={() => {
                                                                    setSelectedPatient(patient);
                                                                    setIsHistoryModalOpen(true);
                                                                }}
                                                                className="rounded-xl py-3 px-3 cursor-pointer focus:bg-indigo-50 focus:text-indigo-700"
                                                            >
                                                                <History className="mr-3 h-5 w-5" />
                                                                <span className="font-bold">View Medical Records</span>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator className="my-2" />
                                                            <DropdownMenuItem 
                                                                onClick={() => handleMessage(patient)}
                                                                className="rounded-xl py-3 px-3 cursor-pointer focus:bg-indigo-50 focus:text-indigo-700"
                                                            >
                                                                <MessageSquare className="mr-3 h-5 w-5" />
                                                                <span className="font-bold">Secure Messaging</span>
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>

                                                    <Button 
                                                        onClick={() => handleConsult(patient)}
                                                        className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-none h-10 px-4 rounded-xl font-bold ml-2 transition-all duration-300"
                                                    >
                                                        Consult
                                                        <ArrowUpRight size={16} className="ml-1" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <div className="h-[500px] flex flex-col items-center justify-center text-slate-400 p-8 text-center bg-white">
                            <div className="h-24 w-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                                <Users size={48} className="text-slate-200" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-700 mb-2 tracking-tight">No patients in directory</h3>
                            <p className="max-w-xs text-sm font-medium leading-relaxed text-slate-400">
                                Your assigned patients will appear here once they schedule an appointment or are registered in the system.
                            </p>
                            <Button className="mt-8 bg-indigo-600 hover:bg-indigo-700 h-12 px-8 rounded-xl font-bold shadow-lg shadow-indigo-100">
                                Register First Patient
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Modals */}
            <DoctorConsultationModal 
                open={isConsultModalOpen} 
                onOpenChange={setIsConsultModalOpen} 
                appointment={activeAppointment}
                onSuccess={fetchPatients}
            />

            <PatientHistoryModal 
                open={isHistoryModalOpen}
                onOpenChange={setIsHistoryModalOpen}
                patient={selectedPatient}
            />

            <SmartDiagnosisModal 
                open={isAiModalOpen}
                onOpenChange={setIsAiModalOpen}
            />
        </div>
    );
}
