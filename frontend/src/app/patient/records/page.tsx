"use client";

import React, { useState } from "react";
import { 
    FileUp, 
    FileText, 
    ShieldCheck, 
    Loader2, 
    AlertCircle,
    Download,
    Eye,
    History,
    Trash2,
    Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import api from "@/services/api";
import { toast } from "sonner";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

interface UploadResult {
    patientName?: string;
    date?: string;
    findings: string[];
    nextSteps: string[];
    rawText: string;
    metrics?: {
        name: string;
        value: string;
        unit: string;
        referenceRange: string;
        status: string;
    }[];
}

export default function MedicalRecordsPage() {
    const [isUploading, setIsUploading] = useState(false);
    const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [records, setRecords] = useState<any[]>([]);
    const [isLoadingRecords, setIsLoadingRecords] = useState(true);

    const fetchRecords = async () => {
        setIsLoadingRecords(true);
        try {
            const res = await api.get("/patients/my-records");
            if (res.data.success) {
                setRecords(res.data.data);
            }
        } catch (error) {
            console.error("Failed to fetch records:", error);
            toast.error("Failed to load your medical records.");
        } finally {
            setIsLoadingRecords(false);
        }
    };

    React.useEffect(() => {
        fetchRecords();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleDeleteRecord = async (id: string) => {
        if (!confirm("Are you sure you want to delete this record?")) return;
        try {
            const res = await api.delete(`/patients/records/${id}`);
            if (res.data.success) {
                toast.success("Medical record deleted");
                setRecords((prev) => prev.filter((r) => r._id !== id));
                // Clear the top preview if the deleted record was being viewed
                setUploadResult(null);
            }
        } catch (error) {
            console.error("Failed to delete record:", error);
            toast.error("Failed to delete medical record");
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const allowedTypes = ["application/pdf", "image/png", "image/jpeg", "image/jpg"];
            
            if (!allowedTypes.includes(file.type)) {
                toast.error("Your uploaded a wrong format. Please upload supported Format");
                e.target.value = ""; // Clear the input
                setSelectedFile(null);
                return;
            }
            
            setSelectedFile(file);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            toast.error("Please select a file to upload");
            return;
        }

        // Secondary format check
        const allowedTypes = ["application/pdf", "image/png", "image/jpeg", "image/jpg"];
        if (!allowedTypes.includes(selectedFile.type)) {
            toast.error("Your uploaded a wrong format. Please upload supported Format");
            setSelectedFile(null);
            return;
        }

        setIsUploading(true);
        setUploadResult(null);

        const formData = new FormData();
        formData.append("record", selectedFile);

        try {
            const res = await api.post("/ai/upload-record", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            if (res.data.success) {
                setUploadResult(res.data.data);
                toast.success("Medical record analyzed successfully!");
                setSelectedFile(null);
                fetchRecords(); // Refresh the table
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to analyze medical record");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Medical Records</h1>
                    <p className="text-slate-500 mt-1 text-lg">Securely store and analyze your health documents using AI OCR.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Upload Section */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className="border-dashed border-2 bg-slate-50/50">
                        <CardHeader>
                            <CardTitle className="text-xl flex items-center gap-2">
                                <FileUp className="text-teal-500" size={20} />
                                Upload New Record
                            </CardTitle>
                            <CardDescription>
                                Upload a PDF or Image of your lab report, prescription, or clinical note.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="border-2 border-dashed border-slate-200 rounded-lg p-8 flex flex-col items-center justify-center bg-white">
                                <Input 
                                    type="file" 
                                    accept=".pdf,.png,.jpg,.jpeg" 
                                    className="hidden" 
                                    id="record-upload"
                                    onChange={handleFileChange}
                                />
                                <label 
                                    htmlFor="record-upload" 
                                    className="cursor-pointer flex flex-col items-center"
                                >
                                    <div className="h-12 w-12 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center mb-3">
                                        <FileUp size={24} />
                                    </div>
                                    <span className="text-sm font-medium text-slate-700">
                                        {selectedFile ? selectedFile.name : "Click to browse files"}
                                    </span>
                                    <span className="text-xs text-slate-400 mt-1">
                                        PDF, PNG, or JPG (Max 10MB)
                                    </span>
                                </label>
                            </div>

                            <Button 
                                className="w-full bg-teal-600 hover:bg-teal-700 h-11"
                                disabled={!selectedFile || isUploading}
                                onClick={handleUpload}
                            >
                                {isUploading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        AI Analyzing...
                                    </>
                                ) : (
                                    "Analyze with AI OCR"
                                )}
                            </Button>

                            <div className="flex items-center gap-2 text-xs text-slate-500 bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                                <ShieldCheck className="text-emerald-500 flex-shrink-0" size={14} />
                                Your data is encrypted and processed securely using HIPAA-compliant AI models.
                            </div>
                        </CardContent>
                    </Card>

                    {/* Quick Tips */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-400">Tips for Best Results</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm text-slate-600 space-y-3">
                            <li className="list-none flex gap-2">
                                <AlertCircle size={14} className="text-teal-500 mt-1 shrink-0" />
                                Ensure the image is well-lit and the text is clearly legible.
                            </li>
                            <li className="list-none flex gap-2">
                                <AlertCircle size={14} className="text-teal-500 mt-1 shrink-0" />
                                For PDFs, ensure they are not password protected.
                            </li>
                            <li className="list-none flex gap-2">
                                <AlertCircle size={14} className="text-teal-500 mt-1 shrink-0" />
                                Handwritten notes may have varying accuracy.
                            </li>
                        </CardContent>
                    </Card>
                </div>

                {/* Analysis Results / History Section */}
                <div className="lg:col-span-2 space-y-6">
                    {uploadResult ? (
                        <Card className="border-teal-100 shadow-lg shadow-teal-900/5 animate-in slide-in-from-bottom-4 duration-500">
                            <CardHeader className="bg-teal-50/50 border-b border-teal-100">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="text-2xl text-slate-900">AI Analysis Report</CardTitle>
                                        <CardDescription className="text-teal-700 font-medium">
                                            Extracted on {new Date().toLocaleDateString()}
                                        </CardDescription>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" className="bg-white">
                                            <Download size={16} className="mr-2" />
                                            Export
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-8 space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1">
                                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Patient Name</span>
                                        <p className="text-lg font-semibold text-slate-800">{uploadResult.patientName || "Not found"}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Document Date</span>
                                        <p className="text-lg font-semibold text-slate-800">{uploadResult.date || "Not found"}</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                        <History className="text-teal-500" size={18} />
                                        Primary Findings
                                    </h3>
                                    <ul className="grid grid-cols-1 gap-3">
                                        {uploadResult.findings.map((f: string, i: number) => (
                                            <li key={i} className="p-3 bg-white border border-slate-100 rounded-lg text-slate-700 flex gap-3">
                                                <div className="h-5 w-5 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                                                    {i + 1}
                                                </div>
                                                {f}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                        <AlertCircle className="text-amber-500" size={18} />
                                        Next Steps & Recommendations
                                    </h3>
                                    <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl space-y-3">
                                        {uploadResult.nextSteps.map((s: string, i: number) => (
                                            <p key={i} className="text-amber-900 text-sm flex gap-2">
                                                <span className="text-amber-400">•</span>
                                                {s}
                                            </p>
                                        ))}
                                    </div>
                                </div>

                                {uploadResult.metrics && uploadResult.metrics.length > 0 && (
                                    <div className="space-y-4 pt-6 border-t border-slate-100">
                                        <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                            <Activity className="text-indigo-500" size={18} />
                                            Extracted Lab Metrics
                                        </h3>
                                        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-sm text-left">
                                                    <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
                                                        <tr>
                                                            <th className="px-4 py-3 border-b border-slate-200">Test Name</th>
                                                            <th className="px-4 py-3 border-b border-slate-200">Result</th>
                                                            <th className="px-4 py-3 border-b border-slate-200">Ref Range</th>
                                                            <th className="px-4 py-3 border-b border-slate-200 text-center">Status</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100">
                                                        {uploadResult.metrics.map((m: any, i: number) => (
                                                            <tr key={i} className="hover:bg-slate-50 transition-colors">
                                                                <td className="px-4 py-3 font-medium text-slate-800">{m.name}</td>
                                                                <td className="px-4 py-3 text-slate-700">
                                                                    <span className="font-semibold">{m.value}</span> <span className="text-xs text-slate-400 ml-1">{m.unit}</span>
                                                                </td>
                                                                <td className="px-4 py-3 text-slate-500 text-xs">{m.referenceRange}</td>
                                                                <td className="px-4 py-3 text-center">
                                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                                                                        m.status === 'Abnormal' 
                                                                        ? 'bg-red-50 text-red-700 border-red-200' 
                                                                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                                    }`}>
                                                                        {m.status}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-4 pt-6 border-t border-slate-100">
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Raw Text Summary</h3>
                                    <p className="text-sm text-slate-500 leading-relaxed italic bg-slate-50 p-4 rounded-lg border border-slate-100">
                                        &quot;{uploadResult.rawText}&quot;
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="h-[600px] border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center text-slate-400 p-8 text-center bg-white shadow-sm">
                            <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                                <FileText size={40} className="text-slate-200" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-600 mb-2">No active analysis</h3>
                            <p className="max-w-xs text-sm leading-relaxed">
                                Upload a document to see AI-powered extraction of findings and recommendations.
                            </p>
                        </div>
                    )}

                    {/* Recent Uploads Table */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Recent Uploads</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-slate-100 text-slate-400 text-left">
                                            <th className="pb-3 font-semibold">Document</th>
                                            <th className="pb-3 font-semibold">Type</th>
                                            <th className="pb-3 font-semibold">Date</th>
                                            <th className="pb-3 font-semibold text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {isLoadingRecords ? (
                                            <tr>
                                                <td colSpan={4} className="py-8 text-center text-slate-400">
                                                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                                                    Loading records...
                                                </td>
                                            </tr>
                                        ) : records.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="py-8 text-center text-slate-400">
                                                    No medical records found.
                                                </td>
                                            </tr>
                                        ) : (
                                            records.map((record) => (
                                                <tr key={record._id} className="group hover:bg-slate-50/50 transition-colors">
                                                    <td className="py-4 flex items-center gap-3 font-medium text-slate-700">
                                                        <FileText size={18} className="text-slate-300 group-hover:text-teal-500 transition-colors" />
                                                        {record.fileName}
                                                    </td>
                                                    <td className="py-4 text-slate-500">
                                                        {record.aiAnalysis?.findings?.length > 0 ? "Analyzed Document" : record.fileType || "Document"}
                                                    </td>
                                                    <td className="py-4 text-slate-500">
                                                        {new Date(record.createdAt).toLocaleDateString()}
                                                    </td>
                                                    <td className="py-4 text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <Button 
                                                                variant="ghost" 
                                                                size="icon" 
                                                                className="h-8 w-8 text-slate-400 hover:text-teal-600"
                                                                onClick={() => setUploadResult(record.aiAnalysis)}
                                                                title="View Analysis"
                                                            >
                                                                <Eye size={16} />
                                                            </Button>
                                                            {record.fileUrl && (
                                                                <Button 
                                                                    variant="ghost" 
                                                                    size="icon" 
                                                                    className="h-8 w-8 text-slate-400 hover:text-teal-600"
                                                                    onClick={() => window.open(record.fileUrl, '_blank')}
                                                                    title="Download Document"
                                                                >
                                                                    <Download size={16} />
                                                                </Button>
                                                            )}
                                                            <Button 
                                                                variant="ghost" 
                                                                size="icon" 
                                                                className="h-8 w-8 text-slate-400 hover:text-red-500"
                                                                onClick={() => handleDeleteRecord(record._id)}
                                                                title="Delete Record"
                                                            >
                                                                <Trash2 size={16} />
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
