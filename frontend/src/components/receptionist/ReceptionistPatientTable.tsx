"use client";

import React from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
    createdBy?: { _id: string; name: string };
}

interface ReceptionistPatientTableProps {
    patients: Patient[];
    searchQuery: string;
    onSearchChange: (query: string) => void;
    onBookAppt: (patient: Patient) => void;
}

export function ReceptionistPatientTable({ patients, searchQuery, onSearchChange, onBookAppt }: ReceptionistPatientTableProps) {
    const filteredPatients = patients.filter(p =>
        p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.contact?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden transition-all hover:shadow-md">
            <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center bg-slate-50/50 gap-4">
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                    <Input 
                        placeholder="Search patients..." 
                        className="pl-9 bg-white" 
                        value={searchQuery} 
                        onChange={(e) => onSearchChange(e.target.value)} 
                    />
                </div>
                <span className="text-sm font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full whitespace-nowrap">
                    Total Patients: {patients.length}
                </span>
            </div>

            <Table>
                <TableHeader className="bg-slate-50">
                    <TableRow>
                        <TableHead className="font-bold text-slate-700">Name</TableHead>
                        <TableHead className="font-bold text-slate-700">Age & Gender</TableHead>
                        <TableHead className="font-bold text-slate-700">Contact</TableHead>
                        <TableHead className="font-bold text-slate-700">Added By</TableHead>
                        <TableHead className="font-bold text-slate-700 text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredPatients.length > 0 ? (
                        filteredPatients.map((patient) => (
                            <TableRow key={patient._id} className="hover:bg-slate-50 transition-colors">
                                <TableCell className="font-semibold text-slate-900">{patient.name}</TableCell>
                                <TableCell className="text-slate-600">{patient.age} • {patient.gender}</TableCell>
                                <TableCell className="text-slate-600">{patient.contact}</TableCell>
                                <TableCell className="text-sm text-slate-500 font-medium">{patient.createdBy?.name || "System"}</TableCell>
                                <TableCell className="text-right">
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="text-indigo-600 border-indigo-200 hover:bg-indigo-50 font-medium transition-all active:scale-95" 
                                        onClick={() => onBookAppt(patient)}
                                    >
                                        Book Appt
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={5} className="h-48 text-center text-slate-500 font-medium italic">
                                No patients found matching your search.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
