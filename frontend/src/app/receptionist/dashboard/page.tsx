"use client";

import { useState, useEffect } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import api from "@/services/api";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { PlusCircle, Search, Users, Calendar, LayoutDashboard } from "lucide-react";

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

export default function ReceptionistDashboard() {
    const { user, logout } = useAuth();
    const [patients, setPatients] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // Initialize form
    const form = useForm<PatientFormValues>({
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
            const res = await api.get("/patients");
            setPatients(res.data);
        } catch (error) {
            console.error("Failed to fetch patients", error);
        }
    };

    useEffect(() => {
        fetchPatients();
    }, []);

    const onSubmit = async (data: PatientFormValues) => {
        try {
            await api.post("/patients", data);
            toast.success("Patient registered successfully!");
            setIsDialogOpen(false);
            form.reset();
            fetchPatients();
        } catch (error) {
            // API error handled by global Axios interceptor with Sonner toast
            console.error(error);
        }
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
                        <a href="#" className="flex items-center gap-3 py-3 px-4 rounded-lg bg-indigo-800 text-white font-medium transition duration-200">
                            <Users size={18} />
                            Patients
                        </a>
                        <a href="#" className="flex items-center gap-3 py-3 px-4 rounded-lg hover:bg-indigo-800 transition duration-200 text-slate-300">
                            <Calendar size={18} />
                            Appointments
                        </a>
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
                                        Enter patient details below. Click save when you're done.
                                    </DialogDescription>
                                </DialogHeader>

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
                                                <Button variant="outline" size="sm" className="text-indigo-600 border-indigo-200 hover:bg-indigo-50">
                                                    Book Appt
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-48 text-center text-slate-500">
                                            No patients found. Click "Register Patient" to add one.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </main>
            </div>
        </ProtectedRoute>
    );
}
