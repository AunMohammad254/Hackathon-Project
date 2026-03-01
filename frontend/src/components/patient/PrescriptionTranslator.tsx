"use client";

import { useState } from "react";
import api from "@/services/api";
import { Languages, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface TranslatedMedicine {
    name: string;
    dosage: string;
    duration: string;
}

interface TranslationResult {
    translatedMedicines: TranslatedMedicine[];
    translatedInstructions: string;
}

const LANGUAGES = [
    { code: "Urdu", label: "اردو (Urdu)" },
    { code: "Hindi", label: "हिन्दी (Hindi)" },
    { code: "Arabic", label: "العربية (Arabic)" },
    { code: "Spanish", label: "Español (Spanish)" },
    { code: "French", label: "Français (French)" },
    { code: "Chinese", label: "中文 (Chinese)" },
];

export default function PrescriptionTranslator({ prescriptionId }: { prescriptionId: string }) {
    const [selectedLang, setSelectedLang] = useState("");
    const [isTranslating, setIsTranslating] = useState(false);
    const [result, setResult] = useState<TranslationResult | null>(null);
    const [activeLang, setActiveLang] = useState("");

    const handleTranslate = async () => {
        if (!selectedLang) {
            toast.error("Please select a language first");
            return;
        }

        setIsTranslating(true);
        setResult(null);
        try {
            const res = await api.post("/ai/translate-prescription", {
                prescriptionId,
                targetLanguage: selectedLang,
            });
            if (res.data?.success) {
                setResult(res.data.data);
                setActiveLang(selectedLang);
                toast.success(`Translated to ${selectedLang}`);
            }
        } catch (error) {
            console.error("Translation failed", error);
        } finally {
            setIsTranslating(false);
        }
    };

    return (
        <div className="mt-4 border-t border-slate-100 pt-4">
            <div className="flex items-center gap-2 mb-3">
                <Languages size={16} className="text-indigo-500" />
                <span className="text-sm font-semibold text-slate-700">Translate Prescription</span>
            </div>

            <div className="flex gap-2 items-center">
                <select
                    className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 flex-1 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    value={selectedLang}
                    onChange={(e) => setSelectedLang(e.target.value)}
                >
                    <option value="">Select language...</option>
                    {LANGUAGES.map((lang) => (
                        <option key={lang.code} value={lang.code}>
                            {lang.label}
                        </option>
                    ))}
                </select>
                <Button
                    size="sm"
                    onClick={handleTranslate}
                    disabled={isTranslating || !selectedLang}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                    {isTranslating ? <Loader2 className="animate-spin h-4 w-4" /> : "Translate"}
                </Button>
            </div>

            {result && (
                <div className="mt-3 p-4 bg-indigo-50 border border-indigo-100 rounded-lg" dir={["Urdu", "Arabic"].includes(activeLang) ? "rtl" : "ltr"}>
                    <p className="text-xs font-semibold text-indigo-500 uppercase tracking-wider mb-2">
                        {activeLang} Translation
                    </p>
                    <ul className="space-y-2 mb-3">
                        {result.translatedMedicines?.map((med, i) => (
                            <li key={i} className="text-sm text-slate-800 bg-white px-3 py-2 rounded-md border border-indigo-100">
                                <span className="font-semibold">{med.name}</span>
                                <span className="text-slate-500 mx-1">—</span>
                                {med.dosage}, {med.duration}
                            </li>
                        ))}
                    </ul>
                    {result.translatedInstructions && (
                        <p className="text-sm text-indigo-900 bg-white p-3 rounded-md border border-indigo-100">
                            {result.translatedInstructions}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
