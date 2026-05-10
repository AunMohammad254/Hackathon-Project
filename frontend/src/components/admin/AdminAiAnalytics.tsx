"use client";

import React from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AIAnalytics {
    topConditions: string[];
    patientLoadForecast: string;
    doctorPerformanceTrends: string;
    revenueForecast: string;
    resourceAdvice: string;
    strategicGrowth: string;
}

interface AdminAiAnalyticsProps {
    aiData: AIAnalytics | null;
    aiLoading: boolean;
    onGenerate: () => void;
}

export function AdminAiAnalytics({ aiData, aiLoading, onGenerate }: AdminAiAnalyticsProps) {
    return (
        <div className="mt-8 bg-gradient-to-br from-indigo-900 to-slate-900 rounded-xl shadow-lg border border-indigo-500/30 overflow-hidden relative transition-all hover:shadow-indigo-500/10">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                <Sparkles className="w-48 h-48 text-indigo-400 animate-pulse" />
            </div>
            <div className="p-8 relative z-10">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-indigo-500/30 pb-4">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                        <Sparkles className="text-indigo-400" />
                        AI Advanced Clinic Insights
                    </h2>
                    <Button 
                        onClick={onGenerate} 
                        disabled={aiLoading}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white border border-indigo-500 shadow-md transition-all active:scale-95"
                    >
                        {aiLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                        Generate Advanced Insights
                    </Button>
                </div>
                {aiLoading ? (
                    <div className="flex flex-col items-center justify-center py-12 space-y-4 text-indigo-200">
                        <Loader2 className="animate-spin w-10 h-10" />
                        <p className="font-medium animate-pulse">Running advanced diagnostic analysis with Gemini 2.5 Flash...</p>
                    </div>
                ) : aiData ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl p-5 hover:bg-white/15 transition-colors">
                            <h3 className="text-sm font-semibold text-indigo-300 uppercase tracking-wider mb-2">Top Conditions</h3>
                            <ul className="list-disc list-inside text-slate-100 space-y-1">
                                {aiData.topConditions.map((cond, idx) => (
                                    <li key={idx} className="text-sm">{cond}</li>
                                ))}
                            </ul>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl p-5 hover:bg-white/15 transition-colors">
                            <h3 className="text-sm font-semibold text-indigo-300 uppercase tracking-wider mb-2">Revenue Forecast</h3>
                            <p className="text-slate-100 text-sm leading-relaxed">{aiData.revenueForecast}</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl p-5 hover:bg-white/15 transition-colors">
                            <h3 className="text-sm font-semibold text-indigo-300 uppercase tracking-wider mb-2">Patient Load</h3>
                            <p className="text-slate-100 text-sm leading-relaxed">{aiData.patientLoadForecast}</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl p-5 hover:bg-white/15 transition-colors">
                            <h3 className="text-sm font-semibold text-indigo-300 uppercase tracking-wider mb-2">Doctor Performance</h3>
                            <p className="text-slate-100 text-sm leading-relaxed">{aiData.doctorPerformanceTrends}</p>
                        </div>
                        <div className="bg-amber-500/10 backdrop-blur-sm border border-amber-500/20 rounded-xl p-5 hover:bg-amber-500/15 transition-colors">
                            <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wider mb-2">Resource Allocation</h3>
                            <p className="text-slate-100 text-sm leading-relaxed">{aiData.resourceAdvice}</p>
                        </div>
                        <div className="bg-emerald-500/10 backdrop-blur-sm border border-emerald-500/20 rounded-xl p-5 hover:bg-emerald-500/15 transition-colors">
                            <h3 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider mb-2">Strategic Growth</h3>
                            <p className="text-emerald-100 text-sm font-medium leading-relaxed bg-emerald-500/20 p-3 rounded-lg border border-emerald-500/30">
                                {aiData.strategicGrowth}
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <Sparkles className="w-12 h-12 text-indigo-500/50 mx-auto mb-4" />
                        <p className="text-indigo-200 text-lg mb-2 font-medium">Ready for deep clinic insights?</p>
                        <p className="text-indigo-400/80 max-w-md mx-auto text-sm">
                            Click &quot;Generate Advanced Insights&quot; to leverage Gemini 2.5 Flash for deep financial forecasting, staffing optimization, and strategic growth mapping.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
