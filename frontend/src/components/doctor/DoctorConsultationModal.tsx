"use client";

import React, { useState, useEffect } from "react";
import { Activity, FileText, FileOutput, Loader2 } from "lucide-react";
import api from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import DrugInteractionAlert from "./DrugInteractionAlert";

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

interface DoctorConsultationModalProps {
    appointment: Appointment | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function DoctorConsultationModal({ appointment, open, onOpenChange, onSuccess }: DoctorConsultationModalProps) {
    // Consultation State
    const [symptomInput, setSymptomInput] = useState("");
    const [symptoms, setSymptoms] = useState<string[]>([]);
    const [patientAge, setPatientAge] = useState("");
    const [patientGender, setPatientGender] = useState("");
    const [patientHistory, setPatientHistory] = useState("");

    // AI State
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [aiInsights, setAiInsights] = useState("");
    const [riskLevel, setRiskLevel] = useState("");
    const [suggestedTests, setSuggestedTests] = useState<string[]>([]);

    // Prescription State
    const [medicines, setMedicines] = useState<Medicine[]>([]);
    const [medName, setMedName] = useState("");
    const [medDosage, setMedDosage] = useState("");
    const [medDuration, setMedDuration] = useState("");
    const [instructions, setInstructions] = useState("");

    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (open && appointment) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setSymptomInput("");
            setSymptoms([]);
            setPatientAge(appointment.patientId?.age?.toString() || "");
            setPatientGender("");
            setPatientHistory("");
            setAiInsights("");
            setRiskLevel("");
            setSuggestedTests([]);
            setMedicines([]);
            setInstructions("");
        }
    }, [open, appointment]);

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
            const res = await api.post("/ai/symptom-checker", {
                patientId: appointment?.patientId?._id,
                symptoms,
                age: patientAge || undefined,
                gender: patientGender || undefined,
                medicalHistory: patientHistory || undefined,
            });
            if (res.data?.success) {
                const aiData = res.data.data;
                // Note: The original code used /ai/diagnose which returned { insights, riskLevel, suggestedTests }
                // /ai/symptom-checker returns { possibleConditions, riskLevel, suggestedTests }
                // We'll adapt to possibleConditions since that's what the current standardized API returns.
                setAiInsights(`Possible Conditions: ${aiData.possibleConditions.join(", ")}`);
                setRiskLevel(aiData.riskLevel);
                setSuggestedTests(aiData.suggestedTests || []);
                toast.success("AI Analysis Complete");
            }
        } catch (error) {
            console.error(error);
            toast.error("AI Analysis failed");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const finalizeConsultation = async () => {
        if (!appointment) return;
        if (medicines.length === 0) {
            toast.error("Please prescribe at least one medicine.");
            return;
        }

        setIsSubmitting(true);
        try {
            // 1. Generate Prescription (PDF & DB save)
            const payload = {
                patientId: appointment.patientId._id,
                medicines,
                instructions,
                aiInsights,
                riskLevel
            };

            const presRes = await api.post("/prescriptions", payload);

            // 2. Mark appointment as completed
            await api.put(`/appointments/${appointment._id}/status`, { status: "completed" });

            toast.success("Consultation finalized & PDF Generated!");
            
            // Handle both legacy and new standardized response structure
            const pdfUrl = presRes.data.success ? presRes.data.prescription.pdfUrl : presRes.data.pdfUrl;
            if (pdfUrl) {
                window.open(pdfUrl, "_blank");
            }

            onOpenChange(false);
            onSuccess();
        } catch (error) {
            console.error(error);
            toast.error("Failed to finalize consultation");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader className="border-b pb-4">
                    <DialogTitle className="text-2xl flex justify-between items-center text-slate-800">
                        <span>Consultation: {appointment?.patientId?.name}</span>
                        <span className="text-sm bg-slate-100 px-3 py-1 rounded-full font-medium text-slate-600">
                            Age: {appointment?.patientId?.age}
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

                            {/* Patient Context Fields */}
                            <div className="grid grid-cols-2 gap-2 mb-3">
                                <Input placeholder="Age" type="number" value={patientAge} onChange={(e) => setPatientAge(e.target.value)} className="bg-white" />
                                <select value={patientGender} onChange={(e) => setPatientGender(e.target.value)} className="text-sm border border-slate-200 rounded-md px-3 py-2 bg-white text-slate-700">
                                    <option value="">Gender</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <Input placeholder="Medical history (e.g., diabetes, hypertension)" value={patientHistory} onChange={(e) => setPatientHistory(e.target.value)} className="bg-white mb-3" />

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
                                    {suggestedTests.length > 0 && (
                                        <div className="mt-3 pt-3 border-t border-indigo-100">
                                            <h5 className="text-xs font-semibold text-indigo-600 uppercase mb-1">Suggested Tests</h5>
                                            <ul className="text-sm text-slate-600 list-disc list-inside">
                                                {suggestedTests.map((t, i) => <li key={i}>{t}</li>)}
                                            </ul>
                                        </div>
                                    )}
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

                            {medicines.length >= 2 && (
                                <DrugInteractionAlert medicines={medicines} />
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
    );
}
