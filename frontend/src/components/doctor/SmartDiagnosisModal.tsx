import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Loader2, Activity, AlertTriangle, CheckCircle2, FlaskConical } from "lucide-react";
import api from "@/services/api";
import { toast } from "sonner";

const diagnosisSchema = z.object({
    patientId: z.string().min(1, "Please select a patient"),
    symptoms: z.string().min(3, "Please describe the symptoms (comma separated or paragraph)"),
    age: z.coerce.number().min(0, "Invalid age").optional(),
    gender: z.enum(["Male", "Female", "Other"]).optional(),
    medicalHistory: z.string().optional(),
});

type DiagnosisFormValues = z.infer<typeof diagnosisSchema>;

interface Patient {
    _id: string;
    name: string;
    age?: number;
    gender?: string;
}

interface AIResponse {
    possibleConditions: string[];
    riskLevel: string;
    suggestedTests: string[];
    error?: boolean;
    message?: string;
}

interface SmartDiagnosisModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function SmartDiagnosisModal({ open, onOpenChange }: SmartDiagnosisModalProps) {
    const [patients, setPatients] = useState<Patient[]>([]);
    const [loadingPatients, setLoadingPatients] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [result, setResult] = useState<AIResponse | null>(null);

    const form = useForm<DiagnosisFormValues>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(diagnosisSchema) as any,
        defaultValues: {
            patientId: "",
            symptoms: "",
            age: 0,
            gender: undefined,
            medicalHistory: "",
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any,
    });

    useEffect(() => {
        if (open) {
            setResult(null);
            fetchPatients();
        }
    }, [open]);

    const fetchPatients = async () => {
        setLoadingPatients(true);
        try {
            // Using the existing active waitlist or appointments to get recent patients
            const res = await api.get("/appointments");
            const uniquePatients: Record<string, Patient> = {};
            res.data.forEach((apt: { patientId?: Patient & { _id: string } }) => {
                if (apt.patientId && !uniquePatients[apt.patientId._id]) {
                    uniquePatients[apt.patientId._id] = apt.patientId;
                }
            });
            setPatients(Object.values(uniquePatients));
        } catch (error) {
            console.error(error);
            toast.error("Failed to load patients");
        } finally {
            setLoadingPatients(false);
        }
    };

    const onSubmit = async (values: DiagnosisFormValues) => {
        setIsAnalyzing(true);
        setResult(null);

        try {
            // Convert comma-separated or newline string into an array of symptoms
            const symptomsArray = values.symptoms.split(/,|\n/).map(s => s.trim()).filter(s => s.length > 0);

            const res = await api.post("/ai/symptom-checker", {
                patientId: values.patientId,
                symptoms: symptomsArray,
                age: values.age,
                gender: values.gender,
                medicalHistory: values.medicalHistory,
            });

            if (res.data) {
                setResult(res.data);
                if (res.data.error) {
                    toast.warning("AI encountered an issue, returning safe fallback.");
                } else {
                    toast.success("AI Analysis Complete");
                }
            }
        } catch (error: unknown) {
            console.error(error);
            const axiosErr = error as { response?: { data?: { message?: string } } };
            toast.error(axiosErr.response?.data?.message || "Failed to analyze symptoms");
        } finally {
            setIsAnalyzing(false);
        }
    };

    // Auto-fill age/gender when patient changes
    const selectedPatientId = form.watch("patientId");
    useEffect(() => {
        const p = patients.find(p => p._id === selectedPatientId);
        if (p) {
            if (p.age) form.setValue("age", p.age);
            if (p.gender) form.setValue("gender", p.gender as "Male" | "Female" | "Other");
        }
    }, [selectedPatientId, patients, form]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader className="border-b pb-4 mb-4">
                    <DialogTitle className="text-2xl font-bold flex items-center gap-2 text-indigo-900">
                        <Activity className="w-6 h-6 text-indigo-600" />
                        AI Smart Diagnosis
                    </DialogTitle>
                    <DialogDescription>
                        Use Gemini 1.5 Flash to rapidly analyze patient symptoms, suggest likely conditions, and recommend tests.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Input Form Column */}
                    <div>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="patientId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Select Patient</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="bg-white">
                                                        <SelectValue placeholder={loadingPatients ? "Loading..." : "Select a patient"} />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {patients.map((p) => (
                                                        <SelectItem key={p._id} value={p._id}>
                                                            {p.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="symptoms"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Symptoms</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Enter symptoms, separated by commas (e.g., severe headache, nausea, blurry vision)"
                                                    className="bg-white resize-none"
                                                    rows={3}
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="age"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Age</FormLabel>
                                                <FormControl>
                                                    <Input type="number" placeholder="Years" className="bg-white" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="gender"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Gender</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger className="bg-white">
                                                            <SelectValue placeholder="Gender" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="Male">Male</SelectItem>
                                                        <SelectItem value="Female">Female</SelectItem>
                                                        <SelectItem value="Other">Other</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="medicalHistory"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Medical History (Optional)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g., diabetes, hypertension" className="bg-white" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <Button
                                    type="submit"
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-md p-6 text-base mt-4"
                                    disabled={isAnalyzing || !form.formState.isValid}
                                >
                                    {isAnalyzing ? (
                                        <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Analyzing via Gemini...</>
                                    ) : (
                                        <><Activity className="w-5 h-5 mr-2" /> Generate AI Diagnosis</>
                                    )}
                                </Button>
                            </form>
                        </Form>
                    </div>

                    {/* Output Results Column */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 h-full min-h-[400px]">
                        {!result && !isAnalyzing && (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400 text-center p-6">
                                <Activity className="w-16 h-16 opacity-20 mb-4" />
                                <p>Fill out the form and click generate to see AI insights instantly.</p>
                            </div>
                        )}

                        {isAnalyzing && (
                            <div className="flex flex-col items-center justify-center h-full text-indigo-500 space-y-4">
                                <Loader2 className="w-12 h-12 animate-spin" />
                                <p className="font-medium animate-pulse">Consulting Gemini...</p>
                            </div>
                        )}

                        {result && !isAnalyzing && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {result.error && (
                                    <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-lg text-sm flex items-start gap-2">
                                        <AlertTriangle className="w-5 h-5 shrink-0" />
                                        {result.message}
                                    </div>
                                )}

                                {/* Risk Level Badge */}
                                <div className="flex items-center justify-between">
                                    <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                                        Assessment
                                    </h3>
                                    <span className={`px-3 py-1 text-sm font-bold uppercase rounded-full border shadow-sm flex items-center gap-1 ${result.riskLevel === 'Critical' || result.riskLevel === 'High' ? 'bg-rose-100 text-rose-700 border-rose-200' :
                                        result.riskLevel === 'Medium' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                                            'bg-emerald-100 text-emerald-700 border-emerald-200'
                                        }`}>
                                        {result.riskLevel === 'Critical' || result.riskLevel === 'High' ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                                        {result.riskLevel} Risk
                                    </span>
                                </div>

                                {/* Possible Conditions */}
                                {result.possibleConditions && result.possibleConditions.length > 0 && (
                                    <div className="bg-white border text-indigo-900 border-indigo-100 rounded-lg p-4 shadow-sm">
                                        <h4 className="font-semibold mb-2 flex items-center gap-2 text-indigo-700 text-sm uppercase tracking-wide">
                                            <Activity className="w-4 h-4" />
                                            Possible Conditions
                                        </h4>
                                        <ul className="space-y-2">
                                            {result.possibleConditions.map((condition, idx) => (
                                                <li key={idx} className="flex gap-2 text-sm text-slate-700">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                                                    {condition}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Suggested Tests */}
                                {result.suggestedTests && result.suggestedTests.length > 0 && (
                                    <div className="bg-white border text-sky-900 border-sky-100 rounded-lg p-4 shadow-sm">
                                        <h4 className="font-semibold mb-2 flex items-center gap-2 text-sky-700 text-sm uppercase tracking-wide">
                                            <FlaskConical className="w-4 h-4" />
                                            Suggested Tests
                                        </h4>
                                        <div className="flex flex-wrap gap-2">
                                            {result.suggestedTests.map((test, idx) => (
                                                <span key={idx} className="bg-sky-50 text-sky-700 border border-sky-200 px-2.5 py-1 rounded-md text-xs font-medium">
                                                    {test}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
