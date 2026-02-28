"use client";

import { useState, useEffect } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import api from "@/services/api";
import { Activity, Users, CalendarCheck, FileText, CheckCircle, Clock, Stethoscope, FileOutput, Loader2 } from "lucide-react";
import LabReportAnalyzer from "@/components/doctor/LabReportAnalyzer";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface Appointment {
    _id: string;
    date: string;
    status: string;
    patientId: { _id: string; name: string; age: number; contact: string };
}

interface Medicine {
    name: string;
    dosage: string;
    duration: string;
}

export default function DoctorDashboard() {
    const { user, logout } = useAuth();
    const [appointments, setAppointments] = useState<Appointment[]>([]);

    // Consultation State
    const [activeAppointment, setActiveAppointment] = useState<Appointment | null>(null);
    const [isConsultOpen, setIsConsultOpen] = useState(false);
    const [symptomInput, setSymptomInput] = useState("");
    const [symptoms, setSymptoms] = useState<string[]>([]);

    // AI State
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [aiInsights, setAiInsights] = useState("");
    const [riskLevel, setRiskLevel] = useState("");

    // Prescription State
    const [medicines, setMedicines] = useState<Medicine[]>([]);
    const [medName, setMedName] = useState("");
    const [medDosage, setMedDosage] = useState("");
    const [medDuration, setMedDuration] = useState("");
    const [instructions, setInstructions] = useState("");

    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchAppointments = async () => {
        try {
            const res = await api.get("/appointments");
            setAppointments(res.data);
        } catch (error) {
            console.error("Failed to fetch appointments", error);
        }
    };

    useEffect(() => {
        fetchAppointments();
    }, []);

    const openConsultation = (apt: Appointment) => {
        setActiveAppointment(apt);
        setSymptomInput("");
        setSymptoms([]);
        setAiInsights("");
        setRiskLevel("");
        setMedicines([]);
        setInstructions("");
        setIsConsultOpen(true);
    };

    const handleAddSymptom = () => {
        if (symptomInput.trim() && !symptoms.includes(symptomInput.trim())) {
            setSymptoms([...symptoms, symptomInput.trim()]);
            setSymptomInput("");
        }
    };

    const removeSymptom = (sym: string) => setSymptoms(symptoms.filter(s => s !== sym));

    const handleAddMedicine = () => {
        if (medName && medDosage && medDuration) {
            setMedicines([...medicines, { name: medName, dosage: medDosage, duration: medDuration }]);
            setMedName("");
            setMedDosage("");
            setMedDuration("");
        } else {
            toast.error("Please fill all medicine fields");
        }
    };

    const removeMedicine = (idx: number) => setMedicines(medicines.filter((_, i) => i !== idx));

    const analyzeSymptoms = async () => {
        if (symptoms.length === 0) {
            toast.error("Please add at least one symptom to analyze.");
            return;
        }

        setIsAnalyzing(true);
        try {
            const res = await api.post("/ai/diagnose", { symptoms });
            if (res.data?.success) {
                setAiInsights(res.data.data.insights);
                setRiskLevel(res.data.data.riskLevel);
                toast.success("AI Analysis Complete");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const finalizeConsultation = async () => {
        if (!activeAppointment) return;
        if (medicines.length === 0) {
            toast.error("Please prescribe at least one medicine.");
            return;
        }

        setIsSubmitting(true);
        try {
            // 1. Generate Prescription (PDF & DB save)
            const payload = {
                patientId: activeAppointment.patientId._id,
                medicines,
                instructions,
                aiInsights,
                riskLevel
            };

            const presRes = await api.post("/prescriptions", payload);

            // 2. Mark appointment as completed
            await api.put(`/appointments/${activeAppointment._id}/status`, { status: "completed" });

            toast.success("Consultation finalized & PDF Generated!");
            window.open(presRes.data.pdfUrl, "_blank"); // Open PDF in new tab

            setIsConsultOpen(false);
            fetchAppointments();
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <ProtectedRoute allowedRoles={["Doctor"]}>
            <div className="flex h-screen bg-slate-50">
                <aside className="w-64 bg-teal-900 text-slate-100 flex flex-col shadow-2xl z-10">
                    <div className="p-6 text-2xl font-bold border-b border-teal-800 flex items-center gap-2">
                        <Activity className="text-teal-400" />
                        Doctor Portal
                    </div>
                    <nav className="flex-1 p-4 space-y-2 mt-4">
                        <a href="#" className="flex items-center gap-3 py-3 px-4 rounded-lg bg-teal-800 text-white font-medium transition duration-200">
                            <CalendarCheck size={18} />
                            Waitlist
                        </a>
                        <a href="#" className="flex items-center gap-3 py-3 px-4 rounded-lg hover:bg-teal-800 transition duration-200 text-slate-300">
                            <Users size={18} />
                            Directory
                        </a>
                    </nav>
                    <div className="p-4 border-t border-teal-800">
                        <div className="mb-4 text-sm text-teal-300 px-2">
                            Dr. <br /><span className="font-semibold text-white block mt-1">{user?.name}</span>
                        </div>
                        <Button variant="ghost" className="w-full justify-start text-rose-300 hover:text-rose-400 hover:bg-teal-800" onClick={logout}>
                            Log Out
                        </Button>
                    </div>
                </aside>

                <main className="flex-1 overflow-y-auto p-10">
                    <header className="mb-8">
                        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Active Waitlist</h1>
                        <p className="text-slate-500 mt-1">Select confirmed appointments to begin physical or tele-consultation.</p>
                    </header>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col items-center justify-center">
                            <p className="text-sm font-medium text-slate-500 mb-2">Total Today</p>
                            <h3 className="text-3xl font-bold text-slate-800">{appointments.length}</h3>
                        </div>
                        <div className="bg-white rounded-xl shadow-sm border border-blue-200 bg-blue-50/50 p-6 flex flex-col items-center justify-center">
                            <p className="text-sm font-medium text-blue-600 mb-2">Ready for Consult</p>
                            <h3 className="text-3xl font-bold text-blue-700">
                                {appointments.filter(a => a.status === 'confirmed').length}
                            </h3>
                        </div>
                        <div className="bg-white rounded-xl shadow-sm border border-emerald-200 bg-emerald-50/50 p-6 flex flex-col items-center justify-center">
                            <p className="text-sm font-medium text-emerald-600 mb-2">Completed</p>
                            <h3 className="text-3xl font-bold text-emerald-700">
                                {appointments.filter(a => a.status === 'completed').length}
                            </h3>
                        </div>
                    </div>

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
                                        <TableRow key={apt._id} className="hover:bg-slate-50">
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
                                                    <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-white shadow-sm flex items-center gap-2" onClick={() => openConsultation(apt)}>
                                                        <Stethoscope size={16} />
                                                        Start Consult
                                                    </Button>
                                                ) : apt.status === 'completed' ? (
                                                    <Button variant="ghost" disabled className="text-slate-400">Consulted</Button>
                                                ) : (
                                                    <Button variant="outline" disabled className="text-amber-500 border-amber-200 bg-amber-50">Pending Arrival</Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-32 text-center text-slate-500">
                                            Queue is completely clear.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    <LabReportAnalyzer />
                </main>
            </div>

            {/* Primary Consultation Modal */}
            <Dialog open={isConsultOpen} onOpenChange={setIsConsultOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader className="border-b pb-4">
                        <DialogTitle className="text-2xl flex justify-between items-center text-slate-800">
                            <span>Consultation: {activeAppointment?.patientId?.name}</span>
                            <span className="text-sm bg-slate-100 px-3 py-1 rounded-full font-medium text-slate-600">
                                Age: {activeAppointment?.patientId?.age}
                            </span>
                        </DialogTitle>
                        <DialogDescription>
                            Record symptoms, generate AI insights, and finalize internal prescription records.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 py-4">

                        {/* Left Column: AI & Symptoms */}
                        <div className="space-y-6">
                            <div className="bg-indigo-50/50 border border-indigo-100 p-5 rounded-xl">
                                <h3 className="font-semibold text-indigo-900 mb-3 flex items-center gap-2">
                                    <Activity size={18} className="text-indigo-500" />
                                    Smart Symptom Checker
                                </h3>

                                <div className="flex gap-2 mb-3">
                                    <Input
                                        placeholder="Enter a symptom (e.g., severe headache)"
                                        value={symptomInput}
                                        onChange={(e) => setSymptomInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddSymptom()}
                                        className="bg-white"
                                    />
                                    <Button onClick={handleAddSymptom} variant="secondary">Add</Button>
                                </div>

                                <div className="flex flex-wrap gap-2 mb-4">
                                    {symptoms.map(sym => (
                                        <span key={sym} className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                                            {sym}
                                            <button onClick={() => removeSymptom(sym)} className="text-indigo-400 hover:text-indigo-800 font-bold ml-1">×</button>
                                        </span>
                                    ))}
                                    {symptoms.length === 0 && <span className="text-sm text-slate-400">No symptoms recorded yet...</span>}
                                </div>

                                <Button
                                    onClick={analyzeSymptoms}
                                    disabled={symptoms.length === 0 || isAnalyzing}
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                                >
                                    {isAnalyzing ? <><Loader2 className="animate-spin mr-2 h-4 w-4" /> Analyzing via Gemini API...</> : "Generate AI Insights"}
                                </Button>

                                {aiInsights && (
                                    <div className="mt-4 p-4 bg-white border border-indigo-100 rounded-lg shadow-sm">
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-semibold text-slate-800">Diagnostic Notes:</h4>
                                            <span className={`px-2 py-1 text-xs font-bold rounded ${riskLevel === 'High' ? 'bg-rose-100 text-rose-700' :
                                                riskLevel === 'Medium' ? 'bg-amber-100 text-amber-700' :
                                                    'bg-emerald-100 text-emerald-700'
                                                }`}>
                                                {riskLevel} Risk
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-600 leading-relaxed">{aiInsights}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right Column: Prescriptions */}
                        <div className="space-y-6">
                            <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
                                <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                                    <FileText size={18} className="text-teal-500" />
                                    Prescription Builder
                                </h3>

                                <div className="space-y-3 mb-4 p-4 bg-slate-50 rounded-lg border border-slate-100">
                                    <Input placeholder="Medicine Name" value={medName} onChange={(e) => setMedName(e.target.value)} className="bg-white" />
                                    <div className="flex gap-3">
                                        <Input placeholder="Dosage (e.g. 1-0-1)" value={medDosage} onChange={(e) => setMedDosage(e.target.value)} className="bg-white" />
                                        <Input placeholder="Duration (e.g. 5 Days)" value={medDuration} onChange={(e) => setMedDuration(e.target.value)} className="bg-white" />
                                    </div>
                                    <Button onClick={handleAddMedicine} variant="outline" className="w-full mt-2">Add Medicine</Button>
                                </div>

                                {medicines.length > 0 && (
                                    <ul className="space-y-2 mb-4 max-h-40 overflow-y-auto pr-2">
                                        {medicines.map((m, i) => (
                                            <li key={i} className="flex justify-between items-center text-sm p-3 bg-slate-50 border border-slate-100 rounded-lg">
                                                <div>
                                                    <span className="font-medium text-slate-800 block">{m.name}</span>
                                                    <span className="text-slate-500">{m.dosage} for {m.duration}</span>
                                                </div>
                                                <button onClick={() => removeMedicine(i)} className="text-rose-400 hover:text-rose-600">Remove</button>
                                            </li>
                                        ))}
                                    </ul>
                                )}

                                <div className="mt-4">
                                    <label className="text-sm font-medium text-slate-700 mb-1 block">Special Instructions</label>
                                    <Input
                                        placeholder="Dietary rules, next visit planning..."
                                        value={instructions}
                                        onChange={(e) => setInstructions(e.target.value)}
                                    />
                                </div>
                            </div>

                            <Button
                                onClick={finalizeConsultation}
                                disabled={isSubmitting || medicines.length === 0}
                                className="w-full bg-teal-600 hover:bg-teal-700 shadow-md h-12 text-base"
                            >
                                {isSubmitting ? <><Loader2 className="animate-spin mr-2 h-5 w-5" /> Generating PDF & Saving...</> : <><FileOutput className="mr-2 h-5 w-5" /> Finalize & Export PDF</>}
                            </Button>

                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </ProtectedRoute>
    );
}
