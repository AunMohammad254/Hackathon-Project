"use client";

import { useState } from "react";
import api from "@/services/api";
import { ShieldAlert, ShieldCheck, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Interaction {
    drugs: string;
    severity: string;
    description: string;
}

interface InteractionResult {
    safe: boolean;
    interactions: Interaction[];
    recommendation: string;
}

interface Medicine {
    name: string;
    dosage: string;
    duration: string;
}

export default function DrugInteractionAlert({ medicines }: { medicines: Medicine[] }) {
    const [isChecking, setIsChecking] = useState(false);
    const [result, setResult] = useState<InteractionResult | null>(null);

    const checkInteractions = async () => {
        if (medicines.length < 2) {
            toast.error("Add at least 2 medicines to check interactions");
            return;
        }

        setIsChecking(true);
        setResult(null);
        try {
            const res = await api.post("/ai/check-interactions", { medicines });
            if (res.data?.success) {
                setResult(res.data.data);
                if (res.data.data.safe) {
                    toast.success("No dangerous interactions found!");
                } else {
                    toast.warning("Potential interactions detected!");
                }
            }
        } catch (error) {
            console.error("Interaction check failed", error);
        } finally {
            setIsChecking(false);
        }
    };

    const severityColor = (severity: string) => {
        const s = severity.toLowerCase();
        if (s === "severe") return "bg-rose-50 border-rose-200 text-rose-800";
        if (s === "moderate") return "bg-amber-50 border-amber-200 text-amber-800";
        return "bg-blue-50 border-blue-200 text-blue-800";
    };

    const severityBadge = (severity: string) => {
        const s = severity.toLowerCase();
        if (s === "severe") return "bg-rose-100 text-rose-700";
        if (s === "moderate") return "bg-amber-100 text-amber-700";
        return "bg-blue-100 text-blue-700";
    };

    return (
        <div className="mt-4">
            <Button
                onClick={checkInteractions}
                disabled={isChecking || medicines.length < 2}
                variant="outline"
                className="w-full border-amber-200 text-amber-700 hover:bg-amber-50"
            >
                {isChecking ? (
                    <><Loader2 className="animate-spin mr-2 h-4 w-4" /> Checking Interactions...</>
                ) : (
                    <><AlertTriangle className="mr-2 h-4 w-4" /> Check Drug Interactions</>
                )}
            </Button>

            {result && (
                <div className={`mt-3 p-4 rounded-lg border ${result.safe ? "bg-emerald-50 border-emerald-200" : "bg-rose-50 border-rose-200"}`}>
                    <div className="flex items-center gap-2 mb-2">
                        {result.safe ? (
                            <ShieldCheck className="text-emerald-600 h-5 w-5" />
                        ) : (
                            <ShieldAlert className="text-rose-600 h-5 w-5" />
                        )}
                        <span className={`font-semibold text-sm ${result.safe ? "text-emerald-700" : "text-rose-700"}`}>
                            {result.safe ? "No Interactions Found" : `${result.interactions.length} Interaction(s) Detected`}
                        </span>
                    </div>

                    {result.interactions.length > 0 && (
                        <ul className="space-y-2 mb-3">
                            {result.interactions.map((interaction, i) => (
                                <li key={i} className={`p-3 rounded-md border text-sm ${severityColor(interaction.severity)}`}>
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="font-semibold">{interaction.drugs}</span>
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${severityBadge(interaction.severity)}`}>
                                            {interaction.severity}
                                        </span>
                                    </div>
                                    <p className="text-sm opacity-90">{interaction.description}</p>
                                </li>
                            ))}
                        </ul>
                    )}

                    <p className={`text-xs mt-2 ${result.safe ? "text-emerald-600" : "text-rose-600"}`}>
                        {result.recommendation}
                    </p>
                </div>
            )}
        </div>
    );
}
