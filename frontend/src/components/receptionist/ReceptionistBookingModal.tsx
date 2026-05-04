"use client";

import React from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface Doctor { _id: string; name: string; email: string; }

interface ReceptionistBookingModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    patientName: string;
    doctors: Doctor[];
    doctorId: string;
    onDoctorIdChange: (id: string) => void;
    date: string;
    onDateChange: (date: string) => void;
    isBooking: boolean;
    onConfirm: () => void;
}

export function ReceptionistBookingModal({
    open,
    onOpenChange,
    patientName,
    doctors,
    doctorId,
    onDoctorIdChange,
    date,
    onDateChange,
    isBooking,
    onConfirm
}: ReceptionistBookingModalProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader className="border-b pb-4">
                    <DialogTitle className="text-xl font-bold text-slate-900 tracking-tight">Book Appointment</DialogTitle>
                    <DialogDescription className="font-medium">
                        Scheduling for <span className="text-indigo-600 font-bold">{patientName}</span>
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-5 pt-4">
                    <div className="space-y-1.5">
                        <label className="text-sm font-bold text-slate-700 uppercase tracking-wide">Assign Doctor</label>
                        <select
                            value={doctorId}
                            onChange={(e) => onDoctorIdChange(e.target.value)}
                            className="flex h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                        >
                            <option value="">Select a physician...</option>
                            {doctors.map((doc) => (
                                <option key={doc._id} value={doc._id}>Dr. {doc.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-bold text-slate-700 uppercase tracking-wide">Date & Time</label>
                        <Input
                            type="datetime-local"
                            value={date}
                            onChange={(e) => onDateChange(e.target.value)}
                            className="h-11 rounded-lg border-slate-200 font-medium"
                        />
                    </div>
                    <Button
                        className="w-full bg-indigo-600 hover:bg-indigo-700 h-12 text-base font-bold shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
                        onClick={onConfirm}
                        disabled={isBooking || !doctorId || !date}
                    >
                        {isBooking ? <><Loader2 className="animate-spin mr-2 h-5 w-5" /> Booking...</> : "Confirm Appointment"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
