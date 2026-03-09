"use client";

import { useState, useEffect } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import api from "@/services/api";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { PlusCircle, Search, Users, Calendar, LayoutDashboard, Clock, Loader2 } from "lucide-react";

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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

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
            setPatients(res.data);
        } catch (error) {
            console.error("Failed to fetch patients", error);
        }
    };

    const fetchDoctors = async () => {
        try {
            // SEC-08 FIX: Use the proper doctors endpoint (not admin-only)
            const res = await api.get("/users/doctors");
            setDoctors(res.data);
        } catch (error) {
            console.error("Failed to fetch doctors", error);
        }
    };

    const fetchTodaySchedule = async () => {
        try {
            const res = await api.get("/appointments?limit=100");
            const today = new Date().toISOString().split("T")[0];
            const todayAppts = res.data.filter((a: Appointment) =>
                new Date(a.date).toISOString().split("T")[0] === today
            );
            setTodayAppointments(todayAppts);
        } catch (error) {
            console.error("Failed to fetch schedule", error);
        }
    };

    useEffect(() => {
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
        if (!bookingDoctorId || !bookingDate) {
            toast.error("Please select a doctor and date");
            return;
        }
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
        } finally {
            setIsBooking(false);
        }
    };

    const statusColor: Record<string, string> = {
        pending: "bg-amber-100 text-amber-700",
        confirmed: "bg-blue-100 text-blue-700",
        completed: "bg-emerald-100 text-emerald-700",
        cancelled: "bg-rose-100 text-rose-700",
    };

    return (
        <ProtectedRoute allowedRoles={["Receptionist", "Admin"]}>
            <div className="flex h-screen bg-slate-50">
                <aside className="w-64 bg-indigo-900 text-slate-100 flex flex-col shadow-2xl z-10">
                    <div className="p-6 text-2xl font-bold border-b border-indigo-800 flex items-center gap-2">
                        <LayoutDashboard className="text-indigo-400" />
                        Front Desk
                    </div>
                    <nav className="flex-1 p-4 space-y-2 mt-4">
                        <button
                            onClick={() => setActiveTab("patients")}
                            className={`w-full flex items-center gap-3 py-3 px-4 rounded-lg font-medium transition duration-200 ${activeTab === "patients" ? "bg-indigo-800 text-white" : "text-slate-300 hover:bg-indigo-800"}`}
                        >
                            <Users size={18} />
                            Patients
                        </button>
                        <button
                            onClick={() => setActiveTab("schedule")}
                            className={`w-full flex items-center gap-3 py-3 px-4 rounded-lg font-medium transition duration-200 ${activeTab === "schedule" ? "bg-indigo-800 text-white" : "text-slate-300 hover:bg-indigo-800"}`}
                        >
                            <Calendar size={18} />
                            Today&apos;s Schedule
                        </button>
                    </nav>
                    <div className="p-4 border-t border-indigo-800">
                        <div className="mb-4 text-sm text-indigo-300 px-2">
                            Logged in as: <span className="font-semibold text-white block mt-1">{user?.name}</span>
                        </div>
                        <Button variant="ghost" className="w-full justify-start text-rose-300 hover:text-rose-400 hover:bg-indigo-800" onClick={logout}>
                            Log Out
                        </Button>
                    </div>
                </aside>

                <main className="flex-1 overflow-y-auto p-10">
                    {activeTab === "patients" ? (
                        <>
                            <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                                <div>
                                    <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Patient Management</h1>
                                    <p className="text-slate-500 mt-1">Register new patients and manage existing records.</p>
                                </div>

                                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button className="bg-indigo-600 hover:bg-indigo-700 shadow-md gap-2">
                                            <PlusCircle size={18} />
                                            Register Patient
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-[425px]">
                                        <DialogHeader>
                                            <DialogTitle>Register New Patient</DialogTitle>
                                            <DialogDescription>
                                                Enter patient details below. Click save when you&apos;re done.
                                            </DialogDescription>
                                        </DialogHeader>

                                        {/* eslint-disable @typescript-eslint/no-explicit-any */}
                                        <Form {...form}>
                                            <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-4 pt-4">
                                                <FormField
                                                    control={form.control as any}
                                                    name="name"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Full Name</FormLabel>
                                                            <FormControl>
                                                                <Input placeholder="John Doe" {...field} />
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
                                                                <FormLabel>Age</FormLabel>
                                                                <FormControl>
                                                                    <Input type="number" {...field} />
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
                                                                <FormLabel>Gender</FormLabel>
                                                                <FormControl>
                                                                    <select
                                                                        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
                                                            <FormLabel>Contact Number</FormLabel>
                                                            <FormControl>
                                                                <Input placeholder="+1 234 567 890" {...field} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700">Save Patient</Button>
                                            </form>
                                        </Form>
                                        {/* eslint-enable @typescript-eslint/no-explicit-any */}
                                    </DialogContent>
                                </Dialog>
                            </header>

                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
                                    <div className="relative w-72">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                                        <Input placeholder="Search patients..." className="pl-9 bg-white" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                                    </div>
                                    <span className="text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                                        Total Patients: {patients.length}
                                    </span>
                                </div>

                                <Table>
                                    <TableHeader className="bg-slate-50">
                                        <TableRow>
                                            <TableHead className="font-semibold text-slate-700">Name</TableHead>
                                            <TableHead className="font-semibold text-slate-700">Age & Gender</TableHead>
                                            <TableHead className="font-semibold text-slate-700">Contact</TableHead>
                                            <TableHead className="font-semibold text-slate-700">Added By</TableHead>
                                            <TableHead className="font-semibold text-slate-700 text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {patients.filter(p =>
                                            p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                            p.contact?.toLowerCase().includes(searchQuery.toLowerCase())
                                        ).length > 0 ? (
                                            patients.filter(p =>
                                                p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                                p.contact?.toLowerCase().includes(searchQuery.toLowerCase())
                                            ).map((patient) => (
                                                <TableRow key={patient._id} className="hover:bg-slate-50">
                                                    <TableCell className="font-medium">{patient.name}</TableCell>
                                                    <TableCell>{patient.age} • {patient.gender}</TableCell>
                                                    <TableCell>{patient.contact}</TableCell>
                                                    <TableCell className="text-sm text-slate-500">{patient.createdBy?.name || "System"}</TableCell>
                                                    <TableCell className="text-right">
                                                        <Button variant="outline" size="sm" className="text-indigo-600 border-indigo-200 hover:bg-indigo-50" onClick={() => openBooking(patient)}>
                                                            Book Appt
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={5} className="h-48 text-center text-slate-500">
                                                    No patients found. Click &quot;Register Patient&quot; to add one.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </>
                    ) : (
                        /* Today's Schedule Tab */
                        <>
                            <header className="mb-8">
                                <h1 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
                                    <Calendar className="text-indigo-500" />
                                    Today&apos;s Schedule
                                </h1>
                                <p className="text-slate-500 mt-1">All appointments scheduled for today.</p>
                            </header>

                            {todayAppointments.length > 0 ? (
                                <div className="space-y-3">
                                    {todayAppointments.map((apt) => (
                                        <div key={apt._id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex items-center justify-between hover:shadow-md transition-shadow">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold">
                                                    {apt.patientId?.name?.charAt(0) || "P"}
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-slate-800">{apt.patientId?.name || "Unknown Patient"}</h3>
                                                    <p className="text-sm text-slate-500">
                                                        <Clock size={12} className="inline mr-1" />
                                                        {new Date(apt.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                                        {apt.doctorId?.name && <span className="ml-2">• Dr. {apt.doctorId.name}</span>}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className={`px-3 py-1 text-xs font-bold rounded-full capitalize ${statusColor[apt.status] || "bg-slate-100 text-slate-600"}`}>
                                                {apt.status}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-16 text-center">
                                    <Calendar className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                                    <h3 className="text-lg font-medium text-slate-900">No appointments today</h3>
                                    <p className="mt-1 text-slate-500 text-sm">Book appointments from the Patients tab.</p>
                                </div>
                            )}
                        </>
                    )}
                </main>

                {/* Booking Dialog */}
                <Dialog open={isBookingOpen} onOpenChange={setIsBookingOpen}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Book Appointment</DialogTitle>
                            <DialogDescription>
                                Booking for <span className="font-semibold text-slate-800">{bookingPatientName}</span>
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 pt-4">
                            <div>
                                <label className="text-sm font-medium text-slate-700 mb-1 block">Doctor</label>
                                <select
                                    value={bookingDoctorId}
                                    onChange={(e) => setBookingDoctorId(e.target.value)}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                >
                                    <option value="">Select a doctor...</option>
                                    {doctors.map((doc) => (
                                        <option key={doc._id} value={doc._id}>Dr. {doc.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700 mb-1 block">Date & Time</label>
                                <Input
                                    type="datetime-local"
                                    value={bookingDate}
                                    onChange={(e) => setBookingDate(e.target.value)}
                                />
                            </div>
                            <Button
                                className="w-full bg-indigo-600 hover:bg-indigo-700"
                                onClick={submitBooking}
                                disabled={isBooking}
                            >
                                {isBooking ? <><Loader2 className="animate-spin mr-2 h-4 w-4" /> Booking...</> : "Confirm Booking"}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </ProtectedRoute>
    );
}
