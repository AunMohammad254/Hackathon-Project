"use client";

import React from "react";
import { Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

interface Appointment {
    _id: string;
    date: string;
    status: string;
    patientId: { _id: string; name: string; age: number; contact: string };
}

interface DoctorWaitlistProps {
    appointments: Appointment[];
    onStartConsult: (apt: Appointment) => void;
}

export function DoctorWaitlist({ appointments, onStartConsult }: DoctorWaitlistProps) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <Table>
                <TableHeader className="bg-slate-50">
                    <TableRow>
                        <TableHead className="font-semibold text-slate-700 pt-4 pb-4">Patient Information</TableHead>
                        <TableHead className="font-semibold text-slate-700">Time</TableHead>
                        <TableHead className="font-semibold text-slate-700">Status</TableHead>
                        <TableHead className="font-semibold text-slate-700 text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {appointments.length > 0 ? (
                        appointments.map((apt) => (
                            <TableRow key={apt._id} className="hover:bg-slate-50 transition-colors">
                                <TableCell className="py-4">
                                    <div className="font-medium text-slate-900 text-base">{apt.patientId?.name || "Unknown"}</div>
                                    <div className="text-sm text-slate-500 mt-1">Age: {apt.patientId?.age} • Phone: {apt.patientId?.contact}</div>
                                </TableCell>
                                <TableCell className="text-slate-600">
                                    {new Date(apt.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </TableCell>
                                <TableCell>
                                    <span className={`px-3 py-1.5 text-xs font-semibold rounded-full ${apt.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                                        apt.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                                            'bg-amber-100 text-amber-700'
                                        }`}>
                                        {apt.status.toUpperCase()}
                                    </span>
                                </TableCell>
                                <TableCell className="text-right">
                                    {apt.status === 'confirmed' ? (
                                        <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-white shadow-sm flex items-center gap-2" onClick={() => onStartConsult(apt)}>
                                            <Stethoscope size={16} />
                                            Start Consult
                                        </Button>
                                    ) : apt.status === 'completed' ? (
                                        <Button variant="ghost" disabled className="text-slate-400 font-medium">Consulted</Button>
                                    ) : (
                                        <Button variant="outline" disabled className="text-amber-500 border-amber-200 bg-amber-50 font-medium">Pending Arrival</Button>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={4} className="h-32 text-center text-slate-500 font-medium">
                                Queue is completely clear.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
