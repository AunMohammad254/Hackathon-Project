"use client";

import React, { useState, useEffect } from "react";
import { 
    FileText, 
    Download, 
    ExternalLink, 
    Calendar,
    User,
    ClipboardList,
    Loader2
} from "lucide-react";
import api from "@/services/api";
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle 
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Prescription {
    _id: string;
    medicines: Array<{ name: string; dosage: string; duration: string }>;
    instructions: string;
    pdfUrl: string;
    createdAt: string;
}

interface MedicalRecord {
    _id: string;
    fileName: string;
    fileType: string;
    fileUrl: string;
    aiAnalysis: {
        findings: string[];
        nextSteps: string[];
    };
    createdAt: string;
}

interface PatientHistoryModalProps {
    patient: { _id: string; name: string } | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function PatientHistoryModal({ patient, open, onOpenChange }: PatientHistoryModalProps) {
    const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
    const [records, setRecords] = useState<MedicalRecord[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open && patient) {
            fetchHistory();
        }
    }, [open, patient]);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const [presRes, recRes] = await Promise.all([
                api.get(`/prescriptions/patient/${patient?._id}`),
                api.get(`/patients/${patient?._id}/records`)
            ]);

            // Prescriptions might return array directly or wrapped in data
            setPrescriptions(Array.isArray(presRes.data) ? presRes.data : presRes.data.data || []);
            setRecords(recRes.data.success ? recRes.data.data : []);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load patient history");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[85vh]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
                        <User className="text-indigo-600" />
                        Medical History: {patient?.name}
                    </DialogTitle>
                </DialogHeader>

                {loading ? (
                    <div className="h-64 flex flex-col items-center justify-center gap-4">
                        <Loader2 className="animate-spin h-8 w-8 text-indigo-500" />
                        <p className="text-slate-500">Retrieving medical records...</p>
                    </div>
                ) : (
                    <Tabs defaultValue="prescriptions" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-6">
                            <TabsTrigger value="prescriptions" className="flex items-center gap-2">
                                <FileText size={16} />
                                Prescriptions ({prescriptions.length})
                            </TabsTrigger>
                            <TabsTrigger value="records" className="flex items-center gap-2">
                                <ClipboardList size={16} />
                                Medical Records ({records.length})
                            </TabsTrigger>
                        </TabsList>

                        <ScrollArea className="h-[50vh] pr-4">
                            <TabsContent value="prescriptions" className="space-y-4">
                                {prescriptions.length > 0 ? prescriptions.map((p) => (
                                    <div key={p._id} className="p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                                        <div className="flex justify-between items-start gap-4 mb-3">
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                                                    <Calendar size={14} />
                                                    {new Date(p.createdAt).toLocaleDateString()}
                                                </div>
                                                <h4 className="font-bold text-slate-800 truncate">
                                                    {p.medicines.map(m => m.name).join(", ")}
                                                </h4>
                                            </div>
                                            <Button size="sm" variant="outline" className="h-8" onClick={() => window.open(p.pdfUrl, "_blank")}>
                                                <Download size={14} className="mr-2" />
                                                PDF
                                            </Button>
                                        </div>
                                        <div className="space-y-2">
                                            {p.medicines.map((m, idx) => (
                                                <div key={idx} className="text-sm bg-white p-2 rounded border border-slate-100 flex justify-between">
                                                    <span className="font-medium">{m.name}</span>
                                                    <span className="text-slate-500">{m.dosage} • {m.duration}</span>
                                                </div>
                                            ))}
                                        </div>
                                        {p.instructions && (
                                            <p className="mt-3 text-xs text-slate-500 italic">
                                                Note: {p.instructions}
                                            </p>
                                        )}
                                    </div>
                                )) : (
                                    <EmptyState message="No prescriptions found for this patient." icon={<FileText size={40} />} />
                                )}
                            </TabsContent>

                            <TabsContent value="records" className="space-y-4">
                                {records.length > 0 ? records.map((r) => (
                                    <div key={r._id} className="p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                                        <div className="flex justify-between items-start gap-4 mb-4">
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                                                    <Calendar size={14} />
                                                    {new Date(r.createdAt).toLocaleDateString()}
                                                </div>
                                                <h4 className="font-bold text-slate-800 flex items-center gap-2 min-w-0">
                                                    <span className="truncate flex-1">{r.fileName}</span>
                                                    <Badge variant="secondary" className="text-[10px] uppercase flex-shrink-0">{r.fileType}</Badge>
                                                </h4>
                                            </div>
                                            <Button size="sm" variant="outline" className="h-8" onClick={() => window.open(r.fileUrl, "_blank")}>
                                                <ExternalLink size={14} className="mr-2" />
                                                View
                                            </Button>
                                        </div>
                                        
                                        {r.aiAnalysis && (
                                            <div className="space-y-3">
                                                <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                                                    <h5 className="text-xs font-bold text-indigo-700 uppercase mb-2">AI Findings</h5>
                                                    <ul className="text-xs text-slate-600 space-y-1">
                                                        {r.aiAnalysis.findings.slice(0, 3).map((f, i) => (
                                                            <li key={i} className="flex gap-2">
                                                                <span className="text-indigo-400">•</span>
                                                                {f}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )) : (
                                    <EmptyState message="No uploaded medical records found." icon={<ClipboardList size={40} />} />
                                )}
                            </TabsContent>
                        </ScrollArea>
                    </Tabs>
                )}
            </DialogContent>
        </Dialog>
    );
}

function EmptyState({ message, icon }: { message: string; icon: React.ReactNode }) {
    return (
        <div className="h-64 flex flex-col items-center justify-center text-slate-300 gap-4 text-center">
            {icon}
            <p className="text-sm font-medium text-slate-400 max-w-[200px]">{message}</p>
        </div>
    );
}

import { Button } from "@/components/ui/button";
