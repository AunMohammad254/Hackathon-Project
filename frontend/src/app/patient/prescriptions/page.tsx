"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import api from "@/services/api";
import {
    FileText, Loader2, Download, AlertTriangle,
    ShieldAlert, ShieldCheck, Shield, Pill
} from "lucide-react";
import { Button } from "@/components/ui/button";
import PrescriptionTranslator from "@/components/patient/PrescriptionTranslator";
import { PrescriptionExplainer } from "@/components/patient/PrescriptionExplainer";

interface Medicine {
    name: string;
    dosage: string;
    duration: string;
    instructions?: string;
}

interface Prescription {
    _id: string;
    doctorId: { _id: string; name: string };
    medicines: Medicine[];
    instructions: string;
    aiInsights: string;
    riskLevel: string;
    pdfUrl: string;
    createdAt: string;
}

const riskConfig: Record<string, { color: string; bg: string; icon: typeof Shield }> = {
    Low: { color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", icon: ShieldCheck },
    Medium: { color: "text-amber-700", bg: "bg-amber-50 border-amber-200", icon: Shield },
    High: { color: "text-rose-700", bg: "bg-rose-50 border-rose-200", icon: ShieldAlert },
};

export default function PatientPrescriptions() {
    const { user } = useAuth();
    const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    useEffect(() => {
        const fetchPrescriptions = async () => {
            try {
                const res = await api.get("/prescriptions/my");
                setPrescriptions(res.data);
            } catch (error) {
                console.error("Failed to fetch prescriptions", error);
            } finally {
                setLoading(false);
            }
        };
        fetchPrescriptions();
    }, [user]);

    return (
        <>
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                    <FileText className="text-teal-500" />
                    My Prescriptions
                </h1>
                <p className="text-slate-500 mt-2 text-lg">View your prescriptions, AI insights, and download PDFs.</p>
            </header>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="animate-spin text-teal-500 w-8 h-8" />
                </div>
            ) : prescriptions.length > 0 ? (
                <div className="space-y-4">
                    {prescriptions.map((rx) => {
                        const risk = riskConfig[rx.riskLevel] || riskConfig.Low;
                        const RiskIcon = risk.icon;
                        const isExpanded = expandedId === rx._id;

                        return (
                            <div
                                key={rx._id}
                                className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden transition-all hover:shadow-md"
                            >
                                {/* Header */}
                                <button
                                    className="w-full p-6 text-left flex items-center justify-between"
                                    onClick={() => setExpandedId(isExpanded ? null : rx._id)}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                                            {rx.doctorId?.name?.charAt(0) || "D"}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-slate-800">
                                                Dr. {rx.doctorId?.name || "Unknown"}
                                            </h3>
                                            <p className="text-sm text-slate-500 mt-0.5">
                                                {new Date(rx.createdAt).toLocaleDateString(undefined, {
                                                    weekday: "short", month: "short", day: "numeric", year: "numeric"
                                                })}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        {rx.riskLevel && (
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-md border ${risk.bg} ${risk.color}`}>
                                                <RiskIcon size={12} />
                                                {rx.riskLevel} Risk
                                            </span>
                                        )}
                                        <span className="text-sm text-slate-400 flex items-center gap-1">
                                            <Pill size={14} />
                                            {rx.medicines?.length || 0} meds
                                        </span>
                                        <span className={`text-slate-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}>▾</span>
                                    </div>
                                </button>

                                {/* Expanded Details */}
                                {isExpanded && (
                                    <div className="px-6 pb-6 border-t border-slate-100 pt-4 space-y-4">
                                        {/* Medicines Table */}
                                        {rx.medicines && rx.medicines.length > 0 && (
                                            <div>
                                                <h4 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wider">Medicines</h4>
                                                <div className="bg-slate-50 rounded-lg border border-slate-100 overflow-hidden">
                                                    <table className="w-full text-sm">
                                                        <thead>
                                                            <tr className="border-b border-slate-200">
                                                                <th className="text-left p-3 text-slate-500 font-medium">Name</th>
                                                                <th className="text-left p-3 text-slate-500 font-medium">Dosage</th>
                                                                <th className="text-left p-3 text-slate-500 font-medium">Duration</th>
                                                                <th className="text-left p-3 text-slate-500 font-medium">Notes</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {rx.medicines.map((med, idx) => (
                                                                <tr key={idx} className="border-b border-slate-100 last:border-0">
                                                                    <td className="p-3 font-medium text-slate-800">{med.name}</td>
                                                                    <td className="p-3 text-slate-600">{med.dosage}</td>
                                                                    <td className="p-3 text-slate-600">{med.duration}</td>
                                                                    <td className="p-3 text-slate-500">{med.instructions || "—"}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}

                                        {/* AI Insights */}
                                        {rx.aiInsights && (
                                            <div className={`rounded-lg border p-4 ${risk.bg}`}>
                                                <h4 className={`text-sm font-semibold mb-2 flex items-center gap-2 ${risk.color}`}>
                                                    <RiskIcon size={16} />
                                                    AI Diagnosis Insights
                                                </h4>
                                                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{rx.aiInsights}</p>
                                            </div>
                                        )}

                                        {/* Doctor's Instructions */}
                                        {rx.instructions && (
                                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                                <h4 className="text-sm font-semibold text-blue-700 mb-2">Doctor&apos;s Instructions</h4>
                                                <p className="text-sm text-slate-700 leading-relaxed">{rx.instructions}</p>
                                            </div>
                                        )}

                                        {/* Download PDF */}
                                        {rx.pdfUrl && (
                                            <div className="pt-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="text-teal-600 border-teal-200 hover:bg-teal-50"
                                                    asChild
                                                >
                                                    <a href={rx.pdfUrl} target="_blank" rel="noopener noreferrer">
                                                        <Download size={14} className="mr-2" />
                                                        Download Prescription PDF
                                                    </a>
                                                </Button>
                                            </div>
                                        )}

                                        {/* Translation */}
                                        <PrescriptionTranslator prescriptionId={rx._id} />

                                        {/* AI Explanation */}
                                        <PrescriptionExplainer medicines={rx.medicines} />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-16 text-center">
                    <FileText className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                    <h3 className="text-lg font-medium text-slate-900">No prescriptions found</h3>
                    <p className="mt-1 text-slate-500 text-sm">Your prescriptions will appear here after a doctor consultation.</p>
                </div>
            )}
        </>
    );
}
