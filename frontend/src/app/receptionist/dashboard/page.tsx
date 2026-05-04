"use client";

import { useState, useEffect } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import api from "@/services/api";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { PlusCircle, Users, Calendar, LayoutDashboard } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { ReceptionistPatientTable } from "@/components/receptionist/ReceptionistPatientTable";
import { ReceptionistSchedule } from "@/components/receptionist/ReceptionistSchedule";
import { ReceptionistBookingModal } from "@/components/receptionist/ReceptionistBookingModal";

// Zod schema for patient registration
const patientSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    age: z.coerce.number().min(0, "Age must be valid").max(120),
    gender: z.enum(["Male", "Female", "Other"]),
    contact: z.string().min(10, "Contact must be valid"),
});

type PatientFormValues = z.infer<typeof patientSchema>;

interface Doctor { _id: string; name: string; email: string; }

interface Patient {
    _id: string;
    name: string;
    age: number;
    gender: string;
    contact: string;
    createdBy?: { _id: string; name: string };
}

interface Appointment {
    _id: string;
    date: string;
    status: string;
    patientId: { _id: string; name: string } | null;
    doctorId: { _id: string; name: string } | null;
}

export default function ReceptionistDashboard() {
    const { user, logout } = useAuth();
    const [patients, setPatients] = useState<Patient[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<"patients" | "schedule">("patients");

    // Booking state
    const [isBookingOpen, setIsBookingOpen] = useState(false);
    const [bookingPatientId, setBookingPatientId] = useState("");
    const [bookingPatientName, setBookingPatientName] = useState("");
    const [bookingDoctorId, setBookingDoctorId] = useState("");
    const [bookingDate, setBookingDate] = useState("");
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [isBooking, setIsBooking] = useState(false);

    // Today's schedule
    const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);

    // Initialize form
    const form = useForm<PatientFormValues>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(patientSchema) as any,
        defaultValues: {
            name: "",
            age: 0,
            gender: "Male",
            contact: "",
        },
    });

    const fetchPatients = async () => {
        try {
            const res = await api.get("/patients?limit=100");
            setPatients(res.data.success ? res.data.patients : res.data);
        } catch (error) {
            console.error("Failed to fetch patients", error);
        }
    };

    const fetchDoctors = async () => {
        try {
            const res = await api.get("/users/doctors");
            setDoctors(res.data.success ? res.data.doctors : res.data);
        } catch (error) {
            console.error("Failed to fetch doctors", error);
        }
    };

    const fetchTodaySchedule = async () => {
        try {
            const res = await api.get("/appointments?limit=100");
            const data = res.data.success ? res.data.appointments : res.data;
            const today = new Date().toISOString().split("T")[0];
            const todayAppts = data.filter((a: Appointment) =>
                new Date(a.date).toISOString().split("T")[0] === today
            );
            setTodayAppointments(todayAppts);
        } catch (error) {
            console.error("Failed to fetch schedule", error);
        }
    };

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchPatients();
        fetchDoctors();
        fetchTodaySchedule();
    }, []);

    const onSubmit = async (data: PatientFormValues) => {
        try {
            await api.post("/patients", data);
            toast.success("Patient registered successfully!");
            setIsDialogOpen(false);
            form.reset();
            fetchPatients();
        } catch (error) {
            console.error(error);
            toast.error("Failed to register patient");
        }
    };

    const openBooking = (patient: Patient) => {
        setBookingPatientId(patient._id);
        setBookingPatientName(patient.name);
        setBookingDoctorId("");
        setBookingDate("");
        setIsBookingOpen(true);
    };

    const submitBooking = async () => {
        setIsBooking(true);
        try {
            await api.post("/appointments", {
                patientId: bookingPatientId,
                doctorId: bookingDoctorId,
                date: bookingDate,
            });
            toast.success("Appointment booked successfully!");
            setIsBookingOpen(false);
            fetchTodaySchedule();
        } catch (error) {
            console.error(error);
            toast.error("Failed to book appointment");
        } finally {
            setIsBooking(false);
        }
    };

    return (
        <ProtectedRoute allowedRoles={["Receptionist", "Admin"]}>
            <div className="flex h-screen bg-slate-50 overflow-hidden">
                <aside className="w-64 bg-indigo-950 text-slate-100 flex flex-col shadow-2xl z-20">
                    <div className="p-6 text-2xl font-bold border-b border-indigo-900 flex items-center gap-2">
                        <LayoutDashboard className="text-indigo-400" />
                        Front Desk
                    </div>
                    <nav className="flex-1 p-4 space-y-2 mt-4">
                        <button
                            onClick={() => setActiveTab("patients")}
                            className={`w-full flex items-center gap-3 py-3.5 px-4 rounded-xl font-bold transition-all duration-200 ${activeTab === "patients" ? "bg-indigo-700 text-white shadow-lg" : "text-slate-400 hover:bg-indigo-900 hover:text-white"}`}
                        >
                            <Users size={18} />
                            Patients
                        </button>
                        <button
                            onClick={() => setActiveTab("schedule")}
                            className={`w-full flex items-center gap-3 py-3.5 px-4 rounded-xl font-bold transition-all duration-200 ${activeTab === "schedule" ? "bg-indigo-700 text-white shadow-lg" : "text-slate-400 hover:bg-indigo-900 hover:text-white"}`}
                        >
                            <Calendar size={18} />
                            Daily Schedule
                        </button>
                    </nav>
                    <div className="p-4 border-t border-indigo-900 bg-indigo-900/50">
                        <div className="mb-4 text-xs font-bold text-indigo-400 uppercase tracking-widest px-2">
                            Session: <span className="text-white block mt-1 text-sm normal-case">{user?.name}</span>
                        </div>
                        <Button variant="ghost" className="w-full justify-start text-rose-300 hover:text-rose-400 hover:bg-rose-500/10 font-bold" onClick={logout}>
                            Sign Out
                        </Button>
                    </div>
                </aside>

                <main className="flex-1 overflow-y-auto p-10 animate-in fade-in duration-500">
                    {activeTab === "patients" ? (
                        <div className="space-y-8">
                            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                                <div>
                                    <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Patient Management</h1>
                                    <p className="text-slate-500 mt-1 font-medium italic">Comprehensive registry of all clinic patients.</p>
                                </div>

                                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 gap-2 h-11 px-6 font-bold transition-all active:scale-95">
                                            <PlusCircle size={18} />
                                            Register Patient
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-[425px]">
                                        <DialogHeader className="border-b pb-4">
                                            <DialogTitle className="text-xl font-bold text-slate-900">Add New Record</DialogTitle>
                                            <DialogDescription className="font-medium">
                                                Create a permanent medical profile for a new patient.
                                            </DialogDescription>
                                        </DialogHeader>

                                        {/* eslint-disable @typescript-eslint/no-explicit-any */}
                                        <Form {...form}>
                                            <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-5 pt-4">
                                                <FormField
                                                    control={form.control as any}
                                                    name="name"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="font-bold text-slate-700">Full Legal Name</FormLabel>
                                                            <FormControl>
                                                                <Input placeholder="John Doe" {...field} className="h-11 border-slate-200" />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <div className="flex gap-4">
                                                    <FormField
                                                        control={form.control as any}
                                                        name="age"
                                                        render={({ field }) => (
                                                            <FormItem className="flex-1">
                                                                <FormLabel className="font-bold text-slate-700">Age</FormLabel>
                                                                <FormControl>
                                                                    <Input type="number" {...field} className="h-11 border-slate-200" />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name="gender"
                                                        render={({ field }) => (
                                                            <FormItem className="flex-1">
                                                                <FormLabel className="font-bold text-slate-700">Gender</FormLabel>
                                                                <FormControl>
                                                                    <select
                                                                        className="flex h-11 w-full items-center justify-between rounded-md border border-slate-200 bg-background px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                                                        {...field}
                                                                    >
                                                                        <option value="Male">Male</option>
                                                                        <option value="Female">Female</option>
                                                                        <option value="Other">Other</option>
                                                                    </select>
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>
                                                <FormField
                                                    control={form.control}
                                                    name="contact"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="font-bold text-slate-700">Primary Contact (Phone)</FormLabel>
                                                            <FormControl>
                                                                <Input placeholder="+1 234 567 890" {...field} className="h-11 border-slate-200" />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 h-12 text-base font-bold shadow-lg shadow-indigo-500/20 transition-all active:scale-95">Save Medical Profile</Button>
                                            </form>
                                        </Form>
                                        {/* eslint-enable @typescript-eslint/no-explicit-any */}
                                    </DialogContent>
                                </Dialog>
                            </header>

                            <ReceptionistPatientTable 
                                patients={patients} 
                                searchQuery={searchQuery} 
                                onSearchChange={setSearchQuery} 
                                onBookAppt={openBooking} 
                            />
                        </div>
                    ) : (
                        <ReceptionistSchedule appointments={todayAppointments} />
                    )}
                </main>

                {/* Booking Dialog extracted */}
                <ReceptionistBookingModal 
                    open={isBookingOpen}
                    onOpenChange={setIsBookingOpen}
                    patientName={bookingPatientName}
                    doctors={doctors}
                    doctorId={bookingDoctorId}
                    onDoctorIdChange={setBookingDoctorId}
                    date={bookingDate}
                    onDateChange={setBookingDate}
                    isBooking={isBooking}
                    onConfirm={submitBooking}
                />
            </div>
        </ProtectedRoute>
    );
}
