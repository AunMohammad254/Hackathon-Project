import React, { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, BrainCircuit, AlertTriangle, ShieldCheck, Dumbbell, Coffee } from "lucide-react";
import api from "@/services/api";
import { toast } from "sonner";

interface Medicine {
    name: string;
    dosage: string;
    duration: string;
}

interface AIExplanation {
    explanation: string;
    lifestyleAdvice: string[];
    preventiveAdvice: string[];
    error?: boolean;
    message?: string;
}

interface PrescriptionExplainerProps {
    medicines: Medicine[];
}

export function PrescriptionExplainer({ medicines }: PrescriptionExplainerProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [explanation, setExplanation] = useState<AIExplanation | null>(null);

    const handleExplain = async () => {
        setOpen(true);
        if (explanation) return; // Already fetched

        setLoading(true);
        try {
            const res = await api.post("/ai/explain-prescription", {
                medicines
            });
            if (res.data?.success) {
                setExplanation(res.data.data);
                if (res.data.error) {
                    toast.warning("AI encountered an issue, showing safe fallback.");
                }
            }
        } catch (error: unknown) {
            console.error(error);
            const axiosErr = error as { response?: { data?: { message?: string } } };
            toast.error(axiosErr.response?.data?.message || "Failed to fetch AI explanation.");
            setOpen(false); // Close modal if completely failed
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Button
                variant="secondary"
                size="sm"
                onClick={handleExplain}
                className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 shadow-sm font-medium w-full flex justify-center gap-2 mt-3"
            >
                <BrainCircuit className="w-4 h-4" />
                Explain with AI
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader className="border-b border-indigo-100 pb-4 mb-2">
                        <DialogTitle className="text-2xl font-bold flex items-center gap-2 text-indigo-900">
                            <BrainCircuit className="w-6 h-6 text-indigo-600" />
                            AI Prescription Breakdown
                        </DialogTitle>
                        <DialogDescription className="text-slate-500">
                            Gemini 1.5 Flash analysis in easy-to-understand plain English.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-2">
                        {loading && (
                            <div className="flex flex-col items-center justify-center p-8 space-y-4 text-indigo-600">
                                <Loader2 className="w-10 h-10 animate-spin" />
                                <p className="font-medium animate-pulse">Consulting medical AI...</p>
                            </div>
                        )}

                        {explanation && !loading && (
                            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                                {explanation.error && (
                                    <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-lg text-sm flex items-start gap-2">
                                        <AlertTriangle className="w-5 h-5 shrink-0" />
                                        {explanation.message}
                                    </div>
                                )}

                                {/* Explanation block */}
                                <div className="bg-white border text-slate-800 border-indigo-100 rounded-xl p-5 shadow-sm">
                                    <h4 className="font-semibold mb-2 flex items-center gap-2 text-indigo-700 text-sm uppercase tracking-wide">
                                        <ShieldCheck className="w-4 h-4" />
                                        What these medicines do
                                    </h4>
                                    <p className="text-slate-600 leading-relaxed text-sm">
                                        {explanation.explanation}
                                    </p>
                                </div>

                                {/* Lifestyle Advice */}
                                {explanation.lifestyleAdvice && explanation.lifestyleAdvice.length > 0 && (
                                    <div className="bg-orange-50/50 border border-orange-100 rounded-xl p-5 shadow-sm">
                                        <h4 className="font-semibold mb-3 flex items-center gap-2 text-orange-700 text-sm uppercase tracking-wide">
                                            <Dumbbell className="w-4 h-4" />
                                            Lifestyle Advice
                                        </h4>
                                        <ul className="space-y-2">
                                            {explanation.lifestyleAdvice.map((advice, i) => (
                                                <li key={i} className="flex gap-2 text-sm text-slate-700 items-start">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-2 shrink-0" />
                                                    <span className="leading-relaxed">{advice}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Preventive Advice */}
                                {explanation.preventiveAdvice && explanation.preventiveAdvice.length > 0 && (
                                    <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-5 shadow-sm">
                                        <h4 className="font-semibold mb-3 flex items-center gap-2 text-emerald-700 text-sm uppercase tracking-wide">
                                            <Coffee className="w-4 h-4" />
                                            Preventive Care
                                        </h4>
                                        <ul className="space-y-2">
                                            {explanation.preventiveAdvice.map((advice, i) => (
                                                <li key={i} className="flex gap-2 text-sm text-slate-700 items-start">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 shrink-0" />
                                                    <span className="leading-relaxed">{advice}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
