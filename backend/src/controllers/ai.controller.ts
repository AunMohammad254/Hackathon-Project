import { Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AuthRequest } from '../middleware/authMiddleware';
import { queueGeminiRequest, getQueueStatus, getCooldownRemaining } from '../services/geminiQueue';
import { sanitizePromptInput, sanitizePromptArray } from '../utils/sanitize';
import DiagnosisLog from '../models/DiagnosisLog';
import Prescription from '../models/Prescription';
import Appointment from '../models/Appointment';
import User from '../models/User';

// Helper: detect rate-limit errors from the queue and return 429 with countdown
const handleAIError = (error: unknown, res: Response, context: string) => {
    const msg = (error as Error).message || '';
    console.error(`[${context}]`, msg);

    if (msg.includes('Rate limited') || msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('quota')) {
        const match = msg.match(/(\d+\.?\d*)\s*s/i);
        const retryAfter = match ? Math.ceil(parseFloat(match[1])) : getCooldownRemaining() || 30;
        return res.status(429).json({
            success: false,
            message: `AI is currently rate-limited. Please retry in ${retryAfter} seconds.`,
            retryAfterSeconds: retryAfter,
        });
    }

    res.status(500).json({ success: false, message: `Failed to process AI request.` });
};

// BUG-01: Lazy-initialize Gemini client (only used for multimodal/lab report)
let genAI: GoogleGenerativeAI | null = null;

const getGenAI = (): GoogleGenerativeAI => {
    if (!genAI) {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error('GEMINI_API_KEY is not configured');
        genAI = new GoogleGenerativeAI(apiKey);
    }
    return genAI;
};

// ── Queue Status Endpoint ──
export const aiQueueStatus = async (_req: AuthRequest, res: Response) => {
    const status = await getQueueStatus();
    res.status(200).json({ success: true, ...status });
};

// ── Symptom Checker (Smart Diagnosis) ──
export const symptomChecker = async (req: AuthRequest, res: Response) => {
    try {
        if (req.user?.subscriptionPlan === 'Free') {
            return res.status(403).json({ success: false, message: 'Upgrade to Pro to unlock AI features.' });
        }

        const { patientId, symptoms, age, gender, medicalHistory } = req.body;

        if (!symptoms || !Array.isArray(symptoms) || symptoms.length === 0) {
            return res.status(400).json({ success: false, message: 'A valid array of symptoms is required' });
        }

        const safeSymptoms = sanitizePromptArray(symptoms);
        const safeAge = age ? sanitizePromptInput(String(age), 10) : '';
        const safeGender = gender ? sanitizePromptInput(String(gender), 20) : '';
        const safeHistory = medicalHistory ? sanitizePromptInput(String(medicalHistory), 500) : '';

        const patientContext = [
            `Symptoms: ${safeSymptoms.join(', ')}`,
            safeAge ? `Age: ${safeAge}` : '',
            safeGender ? `Gender: ${safeGender}` : '',
            safeHistory ? `Medical History: ${safeHistory}` : '',
        ].filter(Boolean).join('\n      ');

        const prompt = `
      You are an expert medical assistant AI.
      A patient has presented with the following information:
      ${patientContext}
      
      Analyze these symptoms and provide a highly professional diagnosis assessment.
      
      Format your response strictly as a RAW JSON object matching this exact structure:
      {
        "possibleConditions": ["Condition 1", "Condition 2"],
        "riskLevel": "Low" | "Medium" | "High" | "Critical",
        "suggestedTests": ["Test 1", "Test 2"]
      }
      
      DO NOT include markdown formatting like \`\`\`json. Output ONLY the raw JSON object.
    `;

        try {
            const responseText = await queueGeminiRequest(prompt);
            const cleanedText = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
            const parsedData = JSON.parse(cleanedText);

            // Persist to DiagnosisLog
            // DiagnosisLog imported statically at top
            await DiagnosisLog.create({
                patientId: patientId || undefined,
                symptoms,
                aiResponse: parsedData,
                riskLevel: parsedData.riskLevel === 'Critical' ? 'High' : parsedData.riskLevel, // Mongoose enum fallback
                doctorId: req.user!._id,
                age: age || undefined,
                gender: gender || undefined,
            });

            return res.status(200).json(parsedData);
        } catch (aiError) {
            console.error('[AI Symptom Checker Error]', (aiError as Error).message);
            // Graceful Fallback
            return res.status(200).json({
                error: true,
                message: "AI service temporarily unavailable. Please proceed with manual diagnosis.",
                possibleConditions: [],
                riskLevel: "Medium",
                suggestedTests: []
            });
        }
    } catch (error: unknown) {
        console.error('[Symptom Checker Fatal Error]', (error as Error).message);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// ── Lab Report Analysis (multimodal — cannot use queue) ──
export const analyzeLabReport = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No report file uploaded' });
        }

        const client = getGenAI();
        const model = client.getGenerativeModel({ model: 'gemini-2.5-flash' });

        const prompt = `
      You are an expert AI medical assistant participating in a specialized diagnosis workflow.
      Analyze the attached medical lab report (image or PDF).
      
      Extract the key metrics, flag any abnormalities, and provide a professional "Second Opinion" summary.
      
      Format your response strictly as a JSON object, like this:
      {
        "summary": "Brief overview of the findings...",
        "metrics": [
            { "name": "Hemoglobin", "value": "12.5 g/dL", "status": "Normal | Abnormal" }
        ],
        "abnormalities": ["List any flagged or abnormal results here"],
        "secondOpinion": "Your professional assessment of what these results indicate."
      }
      
      Ensure your output is ONLY valid JSON.
    `;

        const filePart = {
            inlineData: {
                data: req.file.buffer.toString('base64'),
                mimeType: req.file.mimetype,
            },
        };

        const result = await model.generateContent([prompt, filePart]);
        const responseText = result.response.text();
        const cleanedText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

        try {
            const parsedData = JSON.parse(cleanedText);
            res.status(200).json({ success: true, data: parsedData });
        } catch (parseError) {
            console.error('[AI Parse Error] Failed to parse Gemini JSON output', cleanedText);
            res.status(500).json({ success: false, message: 'AI generated invalid formatting. Try again.' });
        }
    } catch (error: unknown) {
        handleAIError(error, res, 'AI Report Analysis Error');
    }
};

// ── Prescription Translation ──
export const translatePrescription = async (req: AuthRequest, res: Response) => {
    try {
        const { prescriptionId, targetLanguage } = req.body;

        if (!prescriptionId || !targetLanguage) {
            return res.status(400).json({ success: false, message: 'prescriptionId and targetLanguage are required' });
        }

        // Prescription imported statically at top
        const prescription = await Prescription.findById(prescriptionId).lean();
        if (!prescription) return res.status(404).json({ success: false, message: 'Prescription not found' });

        const prompt = `
      You are a professional medical translator.
      Translate the following prescription information into ${sanitizePromptInput(targetLanguage, 50)}.
      
      CRITICAL RULES:
      - Keep ALL medicine/drug names in English exactly as they are
      - Translate ONLY the dosage instructions, duration descriptions, and general instructions
      - Maintain medical accuracy
      
      Prescription Data:
      Medicines: ${JSON.stringify((prescription as any).medicines)}
      Instructions: ${(prescription as any).instructions || 'None'}
      
      Format your response strictly as a JSON object:
      {
        "translatedMedicines": [
            { "name": "Original English Drug Name", "dosage": "translated dosage", "duration": "translated duration" }
        ],
        "translatedInstructions": "translated instructions string"
      }
      
      Ensure your output is ONLY valid JSON.
    `;

        const responseText = await queueGeminiRequest(prompt);
        const cleanedText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

        try {
            const parsedData = JSON.parse(cleanedText);
            res.status(200).json({ success: true, data: parsedData, language: targetLanguage });
        } catch {
            res.status(500).json({ success: false, message: 'AI generated invalid formatting. Try again.' });
        }
    } catch (error: unknown) {
        handleAIError(error, res, 'AI Translation Error');
    }
};

// ── Prescription Explanation ──
export const explainPrescription = async (req: AuthRequest, res: Response) => {
    try {
        if (req.user?.subscriptionPlan === 'Free') {
            return res.status(403).json({ success: false, message: 'Upgrade to Pro to unlock AI features.' });
        }

        const { medicines } = req.body;

        if (!medicines || !Array.isArray(medicines) || medicines.length === 0) {
            return res.status(400).json({ success: false, message: 'An array of medicines is required' });
        }

        const safeMedicines = sanitizePromptArray(
            medicines.map((m: any) => typeof m === 'string' ? m : `${m.name} (${m.dosage})`)
        ).join(', ');

        const prompt = `
      You are an expert medical AI assistant.
      A patient has been prescribed the following medicines: ${safeMedicines}
      
      Provide a plain-English, easy-to-understand explanation of what these medicines are for.
      Also provide 2-3 lifestyle tips and 2-3 preventive advice tips.
      
      Format your response strictly as a RAW JSON object matching this structure:
      {
        "explanation": "...",
        "lifestyleAdvice": ["...", "..."],
        "preventiveAdvice": ["...", "..."]
      }
      
      DO NOT include markdown formatting like \`\`\`json. Output ONLY the raw JSON object.
    `;

        try {
            const responseText = await queueGeminiRequest(prompt);
            const cleanedText = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
            const parsedData = JSON.parse(cleanedText);

            return res.status(200).json(parsedData);
        } catch (aiError) {
            console.error('[AI Explain Prescription Error]', (aiError as Error).message);
            // Graceful Fallback
            return res.status(200).json({
                error: true,
                message: "AI service temporarily unavailable. Please consult your doctor for an explanation.",
                explanation: "Please consult your doctor for an explanation regarding these medications.",
                lifestyleAdvice: [],
                preventiveAdvice: []
            });
        }
    } catch (error: unknown) {
        console.error('[Explain Prescription Fatal Error]', (error as Error).message);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// ── Drug Interaction Checker ──
export const checkDrugInteractions = async (req: AuthRequest, res: Response) => {
    try {
        const { medicines } = req.body;

        if (!medicines || !Array.isArray(medicines) || medicines.length < 2) {
            return res.status(400).json({ success: false, message: 'At least 2 medicines are required to check interactions' });
        }

        // SEC-09 FIX: Sanitize drug names before embedding in prompt
        const drugNames = medicines.map((m: any) => sanitizePromptInput(String(m.name || m), 100)).join(', ');

        const prompt = `
      You are an expert pharmacologist AI assistant.
      A doctor is about to prescribe the following medicines together: ${drugNames}
      
      Analyze these drugs for potential drug-drug interactions.
      
      Format your response strictly as a JSON object:
      {
        "safe": true/false,
        "interactions": [
            {
                "drugs": "Drug A + Drug B",
                "severity": "Mild | Moderate | Severe",
                "description": "Brief explanation of the interaction and clinical significance"
            }
        ],
        "recommendation": "Overall safety recommendation for the prescribing physician"
      }
      
      If there are NO known interactions, return safe: true with an empty interactions array.
      Ensure your output is ONLY valid JSON.
    `;

        const responseText = await queueGeminiRequest(prompt);
        const cleanedText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

        try {
            const parsedData = JSON.parse(cleanedText);
            res.status(200).json({ success: true, data: parsedData });
        } catch {
            res.status(500).json({ success: false, message: 'AI generated invalid formatting. Try again.' });
        }
    } catch (error: unknown) {
        handleAIError(error, res, 'AI Drug Interaction Error');
    }
};

// ── Health Chatbot (RAG) ──
export const healthChat = async (req: AuthRequest, res: Response) => {
    try {
        const { message } = req.body;

        if (!message || typeof message !== 'string') {
            return res.status(400).json({ success: false, message: 'A message string is required' });
        }

        // SEC-09 FIX: Sanitize user chat message
        const safeMessage = sanitizePromptInput(message, 1000);

        const patientId = req.user!._id;

        // Prescription & Appointment imported statically at top

        const [prescriptions, appointments] = await Promise.all([
            Prescription.find({ patientId }).populate('doctorId', 'name').sort({ createdAt: -1 }).limit(10).lean(),
            Appointment.find({ patientId }).populate('doctorId', 'name').sort({ date: -1 }).limit(10).lean(),
        ]);

        const prompt = `
      You are a helpful, empathetic AI health assistant for a clinic management system.
      You have access to this patient's medical records. Use them to answer questions accurately.
      
      IMPORTANT RULES:
      - Be warm, professional, and reassuring
      - Answer based ONLY on the patient's actual medical data below
      - If you don't have enough data to answer, say so honestly
      - Never diagnose new conditions — only reference existing records
      - Keep responses concise (2-4 sentences max)
      - If asked about medication timing, reference the actual prescription dosage
      - If the patient asks about booking appointments, guide them to the Appointments page
      
      PATIENT'S RECENT PRESCRIPTIONS:
      ${prescriptions.length > 0 ? JSON.stringify(prescriptions.map((p: any) => ({
            doctor: p.doctorId?.name,
            date: p.createdAt,
            medicines: p.medicines,
            instructions: p.instructions,
            aiInsights: p.aiInsights,
        }))) : 'No prescriptions on record.'}
      
      PATIENT'S RECENT APPOINTMENTS:
      ${appointments.length > 0 ? JSON.stringify(appointments.map((a: any) => ({
            doctor: a.doctorId?.name,
            date: a.date,
            status: a.status,
        }))) : 'No appointments on record.'}

      The patient's message is: ${safeMessage}
    `;

        const reply = await queueGeminiRequest(prompt);
        res.status(200).json({ success: true, reply });
    } catch (error: unknown) {
        handleAIError(error, res, 'AI Health Chat Error');
    }
};

// ── Predictive Analytics ──
export const predictiveAnalytics = async (req: AuthRequest, res: Response) => {
    try {
        // DiagnosisLog & Appointment imported statically at top

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const [recentDiagnoses, recentAppointments] = await Promise.all([
            DiagnosisLog.find({ createdAt: { $gte: thirtyDaysAgo } }).lean(),
            Appointment.find({ createdAt: { $gte: thirtyDaysAgo } }).lean(),
        ]);

        const prompt = `
      You are an AI health analytics assistant. Analyze the following 30-day clinic data and provide predictions.
      
      RECENT DIAGNOSES (${recentDiagnoses.length} total):
      ${JSON.stringify(recentDiagnoses.map((d: any) => ({ symptoms: d.symptoms, riskLevel: d.riskLevel, date: d.createdAt })).slice(0, 20))}
      
      RECENT APPOINTMENTS (${recentAppointments.length} total):
      ${JSON.stringify(recentAppointments.map((a: any) => ({ status: a.status, date: a.date })).slice(0, 20))}

      Provide your analysis as JSON:
      {
        "topConditions": ["condition1", "condition2", "condition3"],
        "patientLoadForecast": "Brief forecast of patient volume for next week",
        "trendInsight": "Key trend or insight from the data",
        "recommendation": "One actionable recommendation for clinic management"
      }
      
      Output ONLY valid JSON.
    `;

        const responseText = await queueGeminiRequest(prompt);
        const cleaned = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

        try {
            const parsed = JSON.parse(cleaned);
            res.status(200).json({ success: true, data: parsed });
        } catch {
            res.status(200).json({
                success: true,
                data: {
                    topConditions: ['Insufficient data'],
                    patientLoadForecast: 'Not enough data for forecasting yet.',
                    trendInsight: 'Add more diagnoses to generate insights.',
                    recommendation: 'Continue logging patient visits for accurate predictions.',
                },
            });
        }
    } catch (error: unknown) {
        handleAIError(error, res, 'Predictive Analytics Error');
    }
};

// ── Plan Upgrade (SaaS Simulation) ──
export const upgradePlan = async (req: AuthRequest, res: Response) => {
    try {
        // User imported statically at top
        const user = await User.findById(req.user!._id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        user.subscriptionPlan = user.subscriptionPlan === 'Pro' ? 'Free' : 'Pro';
        await user.save();

        res.status(200).json({
            success: true,
            message: `Plan ${user.subscriptionPlan === 'Pro' ? 'upgraded to Pro' : 'downgraded to Free'}`,
            plan: user.subscriptionPlan,
        });
    } catch (error: unknown) {
        console.error('[Plan Upgrade Error]', (error as Error).message);
        res.status(500).json({ success: false, message: 'Failed to update plan.' });
    }
};
