"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upgradePlan = exports.uploadMedicalRecord = exports.predictiveAnalytics = exports.healthChat = exports.checkDrugInteractions = exports.explainPrescription = exports.translatePrescription = exports.analyzeLabReport = exports.symptomChecker = exports.aiQueueStatus = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const generative_ai_1 = require("@google/generative-ai");
const geminiQueue_1 = require("../services/geminiQueue");
const sanitize_1 = require("../utils/sanitize");
const DiagnosisLog_1 = __importDefault(require("../models/DiagnosisLog"));
const Prescription_1 = __importDefault(require("../models/Prescription"));
const Appointment_1 = __importDefault(require("../models/Appointment"));
const User_1 = __importDefault(require("../models/User"));
const Patient_1 = __importDefault(require("../models/Patient"));
const MedicalRecord_1 = __importDefault(require("../models/MedicalRecord"));
const supabase_service_1 = require("../services/supabase.service");
// Helper: detect rate-limit errors from the queue and return 429 with countdown
const handleAIError = (error, res, context) => {
    const msg = error.message || '';
    console.error(`[${context}]`, msg);
    if (msg.includes('503') || msg.includes('high demand') || msg.includes('Service Unavailable')) {
        return res.status(503).json({
            success: false,
            message: 'AI service is currently experiencing high demand. Please try again in a few moments.',
        });
    }
    if (msg.includes('Rate limited') || msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('quota')) {
        const match = msg.match(/(\d+\.?\d*)\s*s/i);
        const retryAfter = match ? Math.ceil(parseFloat(match[1])) : (0, geminiQueue_1.getCooldownRemaining)() || 30;
        return res.status(429).json({
            success: false,
            message: `AI is currently rate-limited. Please retry in ${retryAfter} seconds.`,
            retryAfterSeconds: retryAfter,
        });
    }
    res.status(500).json({ success: false, message: `Failed to process AI request.` });
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
    const status = await (0, geminiQueue_1.getQueueStatus)();
    res.status(200).json({ success: true, ...status });
};
exports.aiQueueStatus = aiQueueStatus;
// ── Symptom Checker (Smart Diagnosis) ──
const symptomChecker = async (req, res) => {
    try {
        if (req.user?.subscriptionPlan === 'Free') {
            return res.status(403).json({ success: false, message: 'Upgrade to Pro to unlock AI features.' });
        }
        const { patientId, symptoms, age, gender, medicalHistory } = req.body;
        if (!symptoms || !Array.isArray(symptoms) || symptoms.length === 0) {
            return res.status(400).json({ success: false, message: 'A valid array of symptoms is required' });
        }
        const safeSymptoms = (0, sanitize_1.sanitizePromptArray)(symptoms);
        const safeAge = age ? (0, sanitize_1.sanitizePromptInput)(String(age), 10) : '';
        const safeGender = gender ? (0, sanitize_1.sanitizePromptInput)(String(gender), 20) : '';
        const safeHistory = medicalHistory ? (0, sanitize_1.sanitizePromptInput)(String(medicalHistory), 500) : '';
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
            const responseText = await (0, geminiQueue_1.queueGeminiRequest)(prompt);
            const cleanedText = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
            const parsedData = JSON.parse(cleanedText);
            // Persist to DiagnosisLog
            await DiagnosisLog_1.default.create({
                patientId: patientId || undefined,
                symptoms,
                aiResponse: parsedData,
                riskLevel: parsedData.riskLevel === 'Critical' ? 'High' : parsedData.riskLevel, // Mongoose enum fallback
                doctorId: req.user._id,
                age: age || undefined,
                gender: gender || undefined,
            });
            return res.status(200).json({ success: true, data: parsedData });
        }
        catch (aiError) {
            console.error('[AI Symptom Checker Error]', aiError.message);
            // Graceful Fallback
            return res.status(200).json({
                success: true,
                error: true,
                message: "AI service temporarily unavailable. Please proceed with manual diagnosis.",
                data: {
                    possibleConditions: [],
                    riskLevel: "Medium",
                    suggestedTests: []
                }
            });
        }
    }
    catch (error) {
        console.error('[Symptom Checker Fatal Error]', error.message);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
exports.symptomChecker = symptomChecker;
// ── Lab Report Analysis (multimodal — cannot use queue) ──
const analyzeLabReport = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No report file uploaded' });
        }
        const client = getGenAI();
        const model = client.getGenerativeModel({
            model: 'gemini-2.5-flash',
            generationConfig: { responseMimeType: "application/json" }
        });
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
    `;
        const filePart = {
            inlineData: {
                data: req.file.buffer.toString('base64'),
                mimeType: req.file.mimetype,
            },
        };
        const result = await model.generateContent([prompt, filePart]);
        const responseText = result.response.text();
        try {
            const parsedData = JSON.parse(responseText);
            res.status(200).json({ success: true, data: parsedData });
        }
        catch (parseError) {
            console.error('[AI Parse Error] Failed to parse Gemini JSON output', responseText);
            res.status(500).json({ success: false, message: 'AI generated invalid formatting. Try again.' });
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
            return res.status(400).json({ success: false, message: 'prescriptionId and targetLanguage are required' });
        }
        // Prescription imported statically at top
        const prescription = await Prescription_1.default.findById(prescriptionId).lean();
        if (!prescription)
            return res.status(404).json({ success: false, message: 'Prescription not found' });
        const prompt = `
      You are a professional medical translator.
      Translate the following prescription information into ${(0, sanitize_1.sanitizePromptInput)(targetLanguage, 50)}.
      
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
    `;
        // Note: queueGeminiRequest currently doesn't support generationConfig
        // We'll keep the manual cleaning for queue requests or update the service later.
        const responseText = await (0, geminiQueue_1.queueGeminiRequest)(prompt);
        const cleanedText = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
        try {
            const parsedData = JSON.parse(cleanedText);
            res.status(200).json({ success: true, data: parsedData, language: targetLanguage });
        }
        catch {
            res.status(500).json({ success: false, message: 'AI generated invalid formatting. Try again.' });
        }
    }
    catch (error) {
        handleAIError(error, res, 'AI Translation Error');
    }
};
exports.translatePrescription = translatePrescription;
// ── Prescription Explanation ──
const explainPrescription = async (req, res) => {
    try {
        if (req.user?.subscriptionPlan === 'Free') {
            return res.status(403).json({ success: false, message: 'Upgrade to Pro to unlock AI features.' });
        }
        const { medicines } = req.body;
        if (!medicines || !Array.isArray(medicines) || medicines.length === 0) {
            return res.status(400).json({ success: false, message: 'An array of medicines is required' });
        }
        const safeMedicines = (0, sanitize_1.sanitizePromptArray)(medicines.map((m) => typeof m === 'string' ? m : `${m.name} (${m.dosage})`)).join(', ');
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
    `;
        try {
            const responseText = await (0, geminiQueue_1.queueGeminiRequest)(prompt);
            const cleanedText = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
            const parsedData = JSON.parse(cleanedText);
            return res.status(200).json({ success: true, data: parsedData });
        }
        catch (aiError) {
            console.error('[AI Explain Prescription Error]', aiError.message);
            // Graceful Fallback
            return res.status(200).json({
                success: true,
                error: true,
                message: "AI service temporarily unavailable. Please consult your doctor for an explanation.",
                data: {
                    explanation: "Please consult your doctor for an explanation regarding these medications.",
                    lifestyleAdvice: [],
                    preventiveAdvice: []
                }
            });
        }
    }
    catch (error) {
        console.error('[Explain Prescription Fatal Error]', error.message);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
exports.explainPrescription = explainPrescription;
// ── Drug Interaction Checker ──
const checkDrugInteractions = async (req, res) => {
    try {
        const { medicines } = req.body;
        if (!medicines || !Array.isArray(medicines) || medicines.length < 2) {
            return res.status(400).json({ success: false, message: 'At least 2 medicines are required to check interactions' });
        }
        // SEC-09 FIX: Sanitize drug names before embedding in prompt
        const drugNames = medicines.map((m) => (0, sanitize_1.sanitizePromptInput)(String(m.name || m), 100)).join(', ');
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
    `;
        const responseText = await (0, geminiQueue_1.queueGeminiRequest)(prompt);
        const cleanedText = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
        try {
            const parsedData = JSON.parse(cleanedText);
            res.status(200).json({ success: true, data: parsedData });
        }
        catch {
            res.status(500).json({ success: false, message: 'AI generated invalid formatting. Try again.' });
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
        const { message, messages } = req.body;
        // If 'message' is present (legacy) use it, else 'messages' array
        if (!message && (!messages || !Array.isArray(messages))) {
            return res.status(400).json({ success: false, message: 'A messages array is required' });
        }
        const currentMessage = message ? (0, sanitize_1.sanitizePromptInput)(message, 1000) : (0, sanitize_1.sanitizePromptInput)(messages[messages.length - 1].content, 1000);
        // -- PHASE 5: FAQ Mocking --
        const faqRegex = /book (an )?appointment|how (to|do i) book|opening hours|clinic hours/i;
        if (faqRegex.test(currentMessage)) {
            // Check headers to see if we should stream
            if (req.headers.accept === 'text/event-stream') {
                res.setHeader('Content-Type', 'text/event-stream');
                res.setHeader('Cache-Control', 'no-cache');
                res.setHeader('Connection', 'keep-alive');
                res.write(`data: ${JSON.stringify({ text: "You can book an appointment by heading over to the Appointments tab and clicking 'Book New Appointment'." })}\n\n`);
                return res.end();
            }
            else {
                return res.status(200).json({ success: true, reply: "You can book an appointment by heading over to the Appointments tab and clicking 'Book New Appointment'." });
            }
        }
        // Gather history
        let history = [];
        if (messages && Array.isArray(messages)) {
            // Keep last 10 messages to limit token usage
            history = messages.slice(-10, -1).map(m => ({
                role: m.role === 'ai' ? 'model' : 'user',
                parts: [{ text: String(m.content) }]
            }));
        }
        history.push({
            role: 'user',
            parts: [{ text: String(currentMessage) }]
        });
        const patientId = req.user._id;
        const [prescriptions, appointments] = await Promise.all([
            Prescription_1.default.find({ patientId }).populate('doctorId', 'name').sort({ createdAt: -1 }).limit(10).lean(),
            Appointment_1.default.find({ patientId }).populate('doctorId', 'name').sort({ date: -1 }).limit(10).lean(),
        ]);
        const systemInstruction = `
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
        }))) : 'No prescriptions on record.'}
      
      PATIENT'S RECENT APPOINTMENTS:
      ${appointments.length > 0 ? JSON.stringify(appointments.map((a) => ({
            doctor: a.doctorId?.name,
            date: a.date,
            status: a.status,
        }))) : 'No appointments on record.'}
    `;
        // We bypass geminiQueue for streaming
        const client = getGenAI();
        const model = client.getGenerativeModel({
            model: 'gemini-2.5-flash',
            systemInstruction
        });
        // -- PHASE 4: Safety Settings --
        const safetySettings = [
            {
                category: generative_ai_1.HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                threshold: generative_ai_1.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            },
            {
                category: generative_ai_1.HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                threshold: generative_ai_1.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            }
        ];
        // Ensure we handle streaming response or standard response based on header
        const expectsStream = req.headers.accept === 'text/event-stream';
        if (expectsStream) {
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            const resultStream = await model.generateContentStream({
                contents: history,
                safetySettings
            });
            for await (const chunk of resultStream.stream) {
                const chunkText = chunk.text();
                // Check safety blocks inside streaming chunks
                if (chunk.promptFeedback?.blockReason) {
                    res.write(`data: ${JSON.stringify({ error: true, text: "I'm sorry, I cannot discuss that." })}\n\n`);
                    break;
                }
                res.write(`data: ${JSON.stringify({ text: chunkText })}\n\n`);
            }
            return res.end();
        }
        else {
            // Fallback to basic JSON if no stream header
            const result = await model.generateContent({
                contents: history,
                safetySettings
            });
            if (result.response.promptFeedback?.blockReason || result.response.candidates?.[0]?.finishReason === generative_ai_1.FinishReason.SAFETY) {
                return res.status(200).json({ success: true, reply: "I'm sorry, I cannot discuss that." });
            }
            return res.status(200).json({ success: true, reply: result.response.text() });
        }
    }
    catch (error) {
        console.error('[AI Health Chat Error]', error);
        // Handle stream error elegantly
        if (req.headers.accept === 'text/event-stream') {
            res.write(`data: ${JSON.stringify({ error: true, text: "Connectivity issue. Please try again." })}\n\n`);
            return res.end();
        }
        handleAIError(error, res, 'AI Health Chat Error');
    }
};
exports.healthChat = healthChat;
// ── Predictive Analytics ──
const predictiveAnalytics = async (req, res) => {
    try {
        const user = await User_1.default.findById(req.user._id);
        if (!user)
            return res.status(404).json({ success: false, message: 'User not found' });
        const now = new Date();
        const resetDate = new Date(user.aiPredictiveGenResetDate || 0);
        if (now.toDateString() !== resetDate.toDateString()) {
            user.aiPredictiveGenCount = 0;
            user.aiPredictiveGenResetDate = now;
        }
        const maxLimit = user.subscriptionPlan === 'Pro' ? 20 : 10;
        if (user.aiPredictiveGenCount >= maxLimit) {
            return res.status(429).json({
                success: false,
                message: `Daily limit reached. You can generate predictive analytics ${maxLimit} times a day on the ${user.subscriptionPlan} plan.`
            });
        }
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 60); // 60 days for better trend
        const [recentDiagnoses, recentAppointments, recentPrescriptions] = await Promise.all([
            DiagnosisLog_1.default.find({ createdAt: { $gte: thirtyDaysAgo } }).populate('doctorId', 'name').lean(),
            Appointment_1.default.find({ createdAt: { $gte: thirtyDaysAgo } }).populate('doctorId', 'name').lean(),
            Prescription_1.default.find({ createdAt: { $gte: thirtyDaysAgo } }).lean(),
        ]);
        // Aggregate some data manually to help AI (and save tokens)
        const revenueByDoctor = {};
        recentAppointments.forEach((a) => {
            if (a.status === 'completed') {
                const name = a.doctorId?.name || 'Unknown';
                revenueByDoctor[name] = (revenueByDoctor[name] || 0) + (a.price || 500);
            }
        });
        const medicineCounts = {};
        recentPrescriptions.forEach((p) => {
            p.medicines.forEach((m) => {
                medicineCounts[m.name] = (medicineCounts[m.name] || 0) + 1;
            });
        });
        const topMedicines = Object.entries(medicineCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5);
        const prompt = `
      You are a Senior Clinic Performance Analyst AI. Analyze the following 60-day clinic performance data and provide advanced strategic insights.
      
      DATA SUMMARY:
      - Total Appointments: ${recentAppointments.length}
      - Total Completed: ${recentAppointments.filter((a) => a.status === 'completed').length}
      - Total Revenue: ${recentAppointments.filter((a) => a.status === 'completed').reduce((acc, curr) => acc + (curr.price || 500), 0)}
      - Revenue by Doctor: ${JSON.stringify(revenueByDoctor)}
      - Top Medicines Prescribed: ${JSON.stringify(topMedicines)}
      - Recent Diagnoses Counts: ${recentDiagnoses.length}
      
      Provide your analysis strictly as JSON matching this format:
      {
        "topConditions": ["condition1", "condition2", "condition3"],
        "patientLoadForecast": "Detailed forecast of patient volume for the next 30 days based on trends",
        "doctorPerformanceTrends": "Strategic evaluation of doctor workload and productivity",
        "revenueForecast": "Financial prediction for the next 30 days with reasoning",
        "resourceAdvice": "Actionable advice on staffing or equipment needs",
        "strategicGrowth": "One major strategic recommendation to grow the clinic's revenue or efficiency"
      }
      
      Output ONLY valid JSON.
    `;
        const client = getGenAI();
        const model = client.getGenerativeModel({
            model: 'gemini-2.5-flash',
            generationConfig: { responseMimeType: "application/json" }
        });
        const result = await model.generateContent(prompt);
        const cleaned = result.response.text().trim();
        try {
            const parsed = JSON.parse(cleaned);
            user.aiPredictiveGenCount += 1;
            await user.save();
            res.status(200).json({ success: true, data: parsed });
        }
        catch {
            user.aiPredictiveGenCount += 1;
            await user.save();
            res.status(200).json({
                success: true,
                data: {
                    topConditions: ['Insufficient data'],
                    patientLoadForecast: 'Not enough data for forecasting yet.',
                    doctorPerformanceTrends: 'Need more appointment and diagnosis logs.',
                    revenueForecast: 'Forecast unavailable.',
                    resourceAdvice: 'Continue standard operations.',
                    strategicGrowth: 'Increase data collection for better insights.',
                },
            });
        }
    }
    catch (error) {
        handleAIError(error, res, 'Predictive Analytics Error');
    }
};
exports.predictiveAnalytics = predictiveAnalytics;
// ── Medical Record Upload & OCR ──
const uploadMedicalRecord = async (req, res) => {
    console.log('[uploadMedicalRecord] Request received. File:', req.file?.originalname, 'Mime:', req.file?.mimetype);
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No record file uploaded' });
        }
        const client = getGenAI();
        const model = client.getGenerativeModel({
            model: 'gemini-2.5-flash',
            generationConfig: { responseMimeType: "application/json" }
        });
        const prompt = `
      You are an expert AI medical record parser. 
      Analyze the attached medical document and extract the following information in a clear format:
      1. Patient Name (if present)
      2. Document Date
      3. Primary Findings/Diagnoses
      4. Recommended Next Steps
      
      Format the output as a JSON object:
      {
        "patientName": "...",
        "date": "...",
        "findings": ["...", "..."],
        "nextSteps": ["...", "..."],
        "metrics": [
            { "name": "...", "value": "...", "unit": "...", "referenceRange": "...", "status": "Normal | Abnormal" }
        ],
        "rawText": "full extracted text summary (IMPORTANT: ensure all newlines inside this string are properly escaped as \\n so the JSON is valid)"
      }
    `;
        const filePart = {
            inlineData: {
                data: req.file.buffer.toString('base64'),
                mimeType: req.file.mimetype,
            },
        };
        const result = await model.generateContent([prompt, filePart]);
        const responseText = result.response.text();
        // Safety check for empty or blocked response
        if (!responseText) {
            return res.status(500).json({ success: false, message: 'AI returned an empty response. It might have been blocked for safety.' });
        }
        const cleanedText = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
        let parsedData;
        try {
            parsedData = JSON.parse(cleanedText);
        }
        catch (parseError) {
            console.error('[OCR Parse Error]', cleanedText);
            try {
                fs_1.default.appendFileSync(path_1.default.join(process.cwd(), 'error.log'), `[${new Date().toISOString()}] [OCR Parse Error] ${cleanedText}\n\n`);
            }
            catch (e) { }
            return res.status(500).json({ success: false, message: 'Failed to parse AI output. Raw: ' + (cleanedText.substring(0, 100)) });
        }
        // Fetch patient based on user context
        let patientId = req.body.patientId;
        if (!patientId && req.user.role === 'Patient') {
            const patient = await Patient_1.default.findOne({ createdBy: req.user._id }).lean();
            if (patient)
                patientId = patient._id;
        }
        // Only attempt DB save if patientId is resolved
        if (patientId) {
            // 1. Upload to Supabase
            const fileExt = req.file.originalname.split('.').pop();
            const uniqueFileName = `record-${patientId}-${Date.now()}.${fileExt}`;
            const fileKey = await (0, supabase_service_1.uploadMedicalRecordFile)(req.file.buffer, uniqueFileName, req.file.mimetype);
            // 2. Save to MedicalRecord DB
            const newRecord = await MedicalRecord_1.default.create({
                patientId,
                fileName: req.file.originalname,
                fileType: req.file.mimetype,
                fileKey,
                aiAnalysis: parsedData,
            });
            return res.status(200).json({ success: true, data: parsedData, recordId: newRecord._id });
        }
        // Fallback for missing patientId (e.g. testing)
        res.status(200).json({ success: true, data: parsedData });
    }
    catch (error) {
        console.error('[Medical Record Upload Fatal Error]', error);
        handleAIError(error, res, 'Medical Record OCR Error');
    }
};
exports.uploadMedicalRecord = uploadMedicalRecord;
// ── Plan Upgrade (SaaS Simulation) ──
const upgradePlan = async (req, res) => {
    try {
        // User imported statically at top
        const user = await User_1.default.findById(req.user._id);
        if (!user)
            return res.status(404).json({ success: false, message: 'User not found' });
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
        res.status(500).json({ success: false, message: 'Failed to update plan.' });
    }
};
exports.upgradePlan = upgradePlan;
