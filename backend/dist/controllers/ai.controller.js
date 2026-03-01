"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.upgradePlan = exports.predictiveAnalytics = exports.healthChat = exports.checkDrugInteractions = exports.translatePrescription = exports.analyzeLabReport = exports.analyzeSymptoms = exports.aiQueueStatus = void 0;
const generative_ai_1 = require("@google/generative-ai");
const geminiQueue_1 = require("../services/geminiQueue");
// Helper: detect rate-limit errors from the queue and return 429 with countdown
const handleAIError = (error, res, context) => {
    const msg = error.message || '';
    console.error(`[${context}]`, msg);
    if (msg.includes('Rate limited') || msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('quota')) {
        const match = msg.match(/(\d+\.?\d*)\s*s/i);
        const retryAfter = match ? Math.ceil(parseFloat(match[1])) : (0, geminiQueue_1.getCooldownRemaining)() || 30;
        return res.status(429).json({
            success: false,
            message: `AI is currently rate-limited. Please retry in ${retryAfter} seconds.`,
            retryAfterSeconds: retryAfter,
        });
    }
    res.status(500).json({ message: `Failed to process AI request.` });
};
// BUG-01: Lazy-initialize Gemini client (only used for multimodal/lab report)
let genAI = null;
const getGenAI = () => {
    if (!genAI) {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey)
            throw new Error('GEMINI_API_KEY is not configured');
        genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
    }
    return genAI;
};
// ── Queue Status Endpoint ──
const aiQueueStatus = async (_req, res) => {
    res.status(200).json({ success: true, ...(0, geminiQueue_1.getQueueStatus)() });
};
exports.aiQueueStatus = aiQueueStatus;
// ── Symptom Analysis ──
const analyzeSymptoms = async (req, res) => {
    try {
        const { symptoms, age, gender, history } = req.body;
        if (!symptoms || !Array.isArray(symptoms) || symptoms.length === 0) {
            return res.status(400).json({ message: 'A valid array of symptoms is required' });
        }
        const patientContext = [
            `Symptoms: ${symptoms.join(', ')}`,
            age ? `Age: ${age}` : '',
            gender ? `Gender: ${gender}` : '',
            history ? `Medical History: ${history}` : '',
        ].filter(Boolean).join('\n      ');
        const prompt = `
      You are an expert AI medical assistant participating in a specialized diagnosis workflow.
      A patient has presented with the following information:
      ${patientContext}
      
      Please provide a highly professional, brief, yet insightful potential diagnosis.
      Also, provide a 'riskLevel' strictly chosen from: "Low", "Medium", "High".
      Include suggested tests if relevant.
      
      Format your response strictly as a JSON object, like this:
      {
        "insights": "Your professional explanation here...",
        "riskLevel": "Low | Medium | High",
        "suggestedTests": ["Test 1", "Test 2"]
      }
      
      Ensure your output is ONLY valid JSON.
    `;
        const responseText = await (0, geminiQueue_1.queueGeminiRequest)(prompt);
        const cleanedText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        try {
            const parsedData = JSON.parse(cleanedText);
            // Persist to DiagnosisLog
            const DiagnosisLog = (await Promise.resolve().then(() => __importStar(require('../models/DiagnosisLog')))).default;
            await DiagnosisLog.create({
                symptoms,
                aiResponse: parsedData.insights,
                riskLevel: parsedData.riskLevel,
                doctorId: req.user._id,
                age: age || undefined,
                gender: gender || undefined,
            });
            res.status(200).json({ success: true, data: parsedData });
        }
        catch (parseError) {
            console.error('[AI Parse Error] Failed to parse Gemini JSON output');
            res.status(500).json({ message: 'AI generated invalid formatting. Try again.' });
        }
    }
    catch (error) {
        handleAIError(error, res, 'AI Diagnosis Error');
    }
};
exports.analyzeSymptoms = analyzeSymptoms;
// ── Lab Report Analysis (multimodal — cannot use queue) ──
const analyzeLabReport = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No report file uploaded' });
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
        }
        catch (parseError) {
            console.error('[AI Parse Error] Failed to parse Gemini JSON output', cleanedText);
            res.status(500).json({ message: 'AI generated invalid formatting. Try again.' });
        }
    }
    catch (error) {
        handleAIError(error, res, 'AI Report Analysis Error');
    }
};
exports.analyzeLabReport = analyzeLabReport;
// ── Prescription Translation ──
const translatePrescription = async (req, res) => {
    try {
        const { prescriptionId, targetLanguage } = req.body;
        if (!prescriptionId || !targetLanguage) {
            return res.status(400).json({ message: 'prescriptionId and targetLanguage are required' });
        }
        const Prescription = (await Promise.resolve().then(() => __importStar(require('../models/Prescription')))).default;
        const prescription = await Prescription.findById(prescriptionId).lean();
        if (!prescription)
            return res.status(404).json({ message: 'Prescription not found' });
        const prompt = `
      You are a professional medical translator.
      Translate the following prescription information into ${targetLanguage}.
      
      CRITICAL RULES:
      - Keep ALL medicine/drug names in English exactly as they are
      - Translate ONLY the dosage instructions, duration descriptions, and general instructions
      - Maintain medical accuracy
      
      Prescription Data:
      Medicines: ${JSON.stringify(prescription.medicines)}
      Instructions: ${prescription.instructions || 'None'}
      
      Format your response strictly as a JSON object:
      {
        "translatedMedicines": [
            { "name": "Original English Drug Name", "dosage": "translated dosage", "duration": "translated duration" }
        ],
        "translatedInstructions": "translated instructions string"
      }
      
      Ensure your output is ONLY valid JSON.
    `;
        const responseText = await (0, geminiQueue_1.queueGeminiRequest)(prompt);
        const cleanedText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        try {
            const parsedData = JSON.parse(cleanedText);
            res.status(200).json({ success: true, data: parsedData, language: targetLanguage });
        }
        catch {
            res.status(500).json({ message: 'AI generated invalid formatting. Try again.' });
        }
    }
    catch (error) {
        handleAIError(error, res, 'AI Translation Error');
    }
};
exports.translatePrescription = translatePrescription;
// ── Drug Interaction Checker ──
const checkDrugInteractions = async (req, res) => {
    try {
        const { medicines } = req.body;
        if (!medicines || !Array.isArray(medicines) || medicines.length < 2) {
            return res.status(400).json({ message: 'At least 2 medicines are required to check interactions' });
        }
        const drugNames = medicines.map((m) => m.name || m).join(', ');
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
        const responseText = await (0, geminiQueue_1.queueGeminiRequest)(prompt);
        const cleanedText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        try {
            const parsedData = JSON.parse(cleanedText);
            res.status(200).json({ success: true, data: parsedData });
        }
        catch {
            res.status(500).json({ message: 'AI generated invalid formatting. Try again.' });
        }
    }
    catch (error) {
        handleAIError(error, res, 'AI Drug Interaction Error');
    }
};
exports.checkDrugInteractions = checkDrugInteractions;
// ── Health Chatbot (RAG) ──
const healthChat = async (req, res) => {
    try {
        const { message } = req.body;
        if (!message || typeof message !== 'string') {
            return res.status(400).json({ message: 'A message string is required' });
        }
        const patientId = req.user._id;
        const Prescription = (await Promise.resolve().then(() => __importStar(require('../models/Prescription')))).default;
        const Appointment = (await Promise.resolve().then(() => __importStar(require('../models/Appointment')))).default;
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
      ${prescriptions.length > 0 ? JSON.stringify(prescriptions.map((p) => ({
            doctor: p.doctorId?.name,
            date: p.createdAt,
            medicines: p.medicines,
            instructions: p.instructions,
            aiInsights: p.aiInsights,
        }))) : 'No prescriptions on record.'}
      
      PATIENT'S RECENT APPOINTMENTS:
      ${appointments.length > 0 ? JSON.stringify(appointments.map((a) => ({
            doctor: a.doctorId?.name,
            date: a.date,
            status: a.status,
        }))) : 'No appointments on record.'}

      The patient's message is: ${message}
    `;
        const reply = await (0, geminiQueue_1.queueGeminiRequest)(prompt);
        res.status(200).json({ success: true, reply });
    }
    catch (error) {
        handleAIError(error, res, 'AI Health Chat Error');
    }
};
exports.healthChat = healthChat;
// ── Predictive Analytics ──
const predictiveAnalytics = async (req, res) => {
    try {
        const DiagnosisLog = (await Promise.resolve().then(() => __importStar(require('../models/DiagnosisLog')))).default;
        const Appointment = (await Promise.resolve().then(() => __importStar(require('../models/Appointment')))).default;
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const [recentDiagnoses, recentAppointments] = await Promise.all([
            DiagnosisLog.find({ createdAt: { $gte: thirtyDaysAgo } }).lean(),
            Appointment.find({ createdAt: { $gte: thirtyDaysAgo } }).lean(),
        ]);
        const prompt = `
      You are an AI health analytics assistant. Analyze the following 30-day clinic data and provide predictions.
      
      RECENT DIAGNOSES (${recentDiagnoses.length} total):
      ${JSON.stringify(recentDiagnoses.map((d) => ({ symptoms: d.symptoms, riskLevel: d.riskLevel, date: d.createdAt })).slice(0, 20))}
      
      RECENT APPOINTMENTS (${recentAppointments.length} total):
      ${JSON.stringify(recentAppointments.map((a) => ({ status: a.status, date: a.date })).slice(0, 20))}

      Provide your analysis as JSON:
      {
        "topConditions": ["condition1", "condition2", "condition3"],
        "patientLoadForecast": "Brief forecast of patient volume for next week",
        "trendInsight": "Key trend or insight from the data",
        "recommendation": "One actionable recommendation for clinic management"
      }
      
      Output ONLY valid JSON.
    `;
        const responseText = await (0, geminiQueue_1.queueGeminiRequest)(prompt);
        const cleaned = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        try {
            const parsed = JSON.parse(cleaned);
            res.status(200).json({ success: true, data: parsed });
        }
        catch {
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
    }
    catch (error) {
        handleAIError(error, res, 'Predictive Analytics Error');
    }
};
exports.predictiveAnalytics = predictiveAnalytics;
// ── Plan Upgrade (SaaS Simulation) ──
const upgradePlan = async (req, res) => {
    try {
        const User = (await Promise.resolve().then(() => __importStar(require('../models/User')))).default;
        const user = await User.findById(req.user._id);
        if (!user)
            return res.status(404).json({ message: 'User not found' });
        user.subscriptionPlan = user.subscriptionPlan === 'Pro' ? 'Free' : 'Pro';
        await user.save();
        res.status(200).json({
            success: true,
            message: `Plan ${user.subscriptionPlan === 'Pro' ? 'upgraded to Pro' : 'downgraded to Free'}`,
            plan: user.subscriptionPlan,
        });
    }
    catch (error) {
        console.error('[Plan Upgrade Error]', error.message);
        res.status(500).json({ message: 'Failed to update plan.' });
    }
};
exports.upgradePlan = upgradePlan;
