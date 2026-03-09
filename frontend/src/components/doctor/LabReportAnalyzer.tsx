"use client";

import { useState } from "react";
import api from "@/services/api";
import { UploadCloud, FileImage, Loader2, AlertTriangle, Activity, FileText, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

interface LabMetric {
    name: string;
    value: string;
    status: string;
}

interface AnalysisResult {
    summary: string;
    metrics: LabMetric[];
    abnormalities: string[];
    secondOpinion: string;
}

export default function LabReportAnalyzer() {
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [result, setResult] = useState<AnalysisResult | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);

            // Create preview if image
            if (selectedFile.type.startsWith("image/")) {
                setPreviewUrl(URL.createObjectURL(selectedFile));
            } else {
                setPreviewUrl(null); // PDF or other
            }

            setResult(null); // Clear previous results
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const droppedFile = e.dataTransfer.files[0];
            setFile(droppedFile);

            if (droppedFile.type.startsWith("image/")) {
                setPreviewUrl(URL.createObjectURL(droppedFile));
            } else {
                setPreviewUrl(null);
            }
            setResult(null);
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };

    const analyzeReport = async () => {
        if (!file) return;

        setIsAnalyzing(true);
        const formData = new FormData();
        formData.append("report", file);

        try {
            const res = await api.post("/ai/analyze-report", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            if (res.data?.success) {
                setResult(res.data.data);
                toast.success("Lab report analyzed successfully!");
            }
        } catch (error) {
            console.error("Analysis failed", error);
            // Error is handled by api interceptor
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mt-8">
            <div className="mb-6">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <Activity className="text-teal-500" />
                    Multimodal Lab Report Analysis
                </h2>
                <p className="text-slate-500 text-sm mt-1">
                    Upload a physical lab report (Image or PDF) to instantly extract metrics and generate an AI Second Opinion using Gemini 1.5 Pro.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Upload Section */}
                <div>
                    {!file ? (
                        <div
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:bg-slate-50 transition-colors cursor-pointer"
                            onClick={() => document.getElementById('report-upload')?.click()}
                        >
                            <input
                                type="file"
                                id="report-upload"
                                className="hidden"
                                accept="image/jpeg,image/png,image/webp,application/pdf"
                                onChange={handleFileChange}
                            />
                            <div className="bg-teal-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                                <UploadCloud className="text-teal-600 h-6 w-6" />
                            </div>
                            <p className="font-medium text-slate-700 mb-1">Click to upload or drag and drop</p>
                            <p className="text-sm text-slate-500">PNG, JPG, or PDF (max. 10MB)</p>
                        </div>
                    ) : (
                        <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 relative">
                            <button
                                onClick={() => { setFile(null); setPreviewUrl(null); setResult(null); }}
                                className="absolute top-2 right-2 text-slate-400 hover:text-rose-500 text-xl font-bold"
                            >
                                &times;
                            </button>

                            {previewUrl ? (
                                <img src={previewUrl} alt="Report Preview" className="w-full h-48 object-cover rounded-lg mb-4 border border-slate-200" />
                            ) : (
                                <div className="w-full h-48 flex flex-col items-center justify-center bg-white rounded-lg mb-4 border border-slate-200">
                                    <FileText className="h-12 w-12 text-slate-400 mb-2" />
                                    <span className="text-slate-600 font-medium">{file.name}</span>
                                </div>
                            )}

                            <Button
                                onClick={analyzeReport}
                                disabled={isAnalyzing}
                                className="w-full bg-teal-600 hover:bg-teal-700 text-white h-12"
                            >
                                {isAnalyzing ? (
                                    <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Analyzing 10K+ Parameters...</>
                                ) : (
                                    <><Activity className="mr-2 h-5 w-5" /> Run AI Analysis</>
                                )}
                            </Button>
                        </div>
                    )}
                </div>

                {/* Results Section */}
                <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 min-h-[300px]">
                    {isAnalyzing ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-4 py-12">
                            <div className="relative">
                                <div className="absolute inset-0 bg-teal-200 rounded-full blur-xl opacity-50 animate-pulse"></div>
                                <Activity className="h-10 w-10 text-teal-600 animate-bounce relative z-10" />
                            </div>
                            <p className="font-medium animate-pulse">Gemini 1.5 Pro is reading the document...</p>
                        </div>
                    ) : result ? (
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">AI Summary</h3>
                                <p className="text-slate-800 bg-white p-3 rounded-lg border border-slate-200 leading-relaxed text-sm">
                                    {result.summary}
                                </p>
                            </div>

                            {result.abnormalities && result.abnormalities.length > 0 && (
                                <div>
                                    <h3 className="text-xs font-semibold text-rose-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                                        <AlertTriangle size={14} />
                                        Flagged Abnormalities
                                    </h3>
                                    <ul className="space-y-1">
                                        {result.abnormalities.map((item, i) => (
                                            <li key={i} className="text-sm text-rose-700 bg-rose-50 px-3 py-2 rounded-md border border-rose-100 flex items-start gap-2">
                                                <span className="mt-0.5">•</span>
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            <div>
                                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Extracted Metrics</h3>
                                <div className="bg-white border border-slate-200 rounded-lg overflow-hidden max-h-[250px] overflow-y-auto">
                                    <Table>
                                        <TableHeader className="bg-slate-50 sticky top-0">
                                            <TableRow>
                                                <TableHead>Biomarker</TableHead>
                                                <TableHead>Value</TableHead>
                                                <TableHead>Status</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {result.metrics?.map((metric, i) => (
                                                <TableRow key={i}>
                                                    <TableCell className="font-medium text-slate-700 py-2">{metric.name}</TableCell>
                                                    <TableCell className="py-2 text-sm">{metric.value}</TableCell>
                                                    <TableCell className="py-2">
                                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${metric.status.toLowerCase().includes('abnormal') || metric.status.toLowerCase().includes('high') || metric.status.toLowerCase().includes('low')
                                                            ? 'bg-rose-100 text-rose-700'
                                                            : 'bg-emerald-100 text-emerald-700'
                                                            }`}>
                                                            {metric.status}
                                                        </span>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            {(!result.metrics || result.metrics.length === 0) && (
                                                <TableRow>
                                                    <TableCell colSpan={3} className="text-center py-4 text-slate-500">No metrics automatically identified.</TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-xs font-semibold text-indigo-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                                    <Stethoscope size={14} />
                                    Second Opinion
                                </h3>
                                <p className="text-indigo-900 bg-indigo-50 p-4 rounded-lg border border-indigo-100 leading-relaxed text-sm">
                                    {result.secondOpinion}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400 py-12">
                            <FileImage className="h-12 w-12 mb-3 opacity-20" />
                            <p>Upload a report to see AI extraction</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
