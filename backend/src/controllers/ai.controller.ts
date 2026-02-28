import { Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AuthRequest } from '../middleware/authMiddleware';

// BUG-01: Lazy-initialize Gemini client to avoid using env vars before dotenv.config()
let genAI: GoogleGenerativeAI | null = null;

const getGenAI = (): GoogleGenerativeAI => {
    if (!genAI) {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error('GEMINI_API_KEY is not configured');
        }
        genAI = new GoogleGenerativeAI(apiKey);
    }
    return genAI;
};

export const analyzeSymptoms = async (req: AuthRequest, res: Response) => {
    try {
        const { symptoms } = req.body;

        if (!symptoms || !Array.isArray(symptoms) || symptoms.length === 0) {
            return res.status(400).json({ message: 'A valid array of symptoms is required' });
        }

        const client = getGenAI();
        const model = client.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const prompt = `
      You are an expert AI medical assistant participating in a specialized diagnosis workflow.
      A patient has presented the following symptoms: ${symptoms.join(', ')}
      
      Please provide a highly professional, brief, yet insightful potential diagnosis.
      Also, provide a 'riskLevel' strictly chosen from: "Low", "Medium", "High".
      
      Format your response strictly as a JSON object, like this:
      {
        "insights": "Your professional explanation here...",
        "riskLevel": "Low | Medium | High"
      }
      
      Ensure your output is ONLY valid JSON.
    `;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        // Clean up potential markdown formatting in Gemini's response
        const cleanedText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

        try {
            const parsedData = JSON.parse(cleanedText);
            res.status(200).json({
                success: true,
                data: parsedData,
            });
        } catch (parseError) {
            console.error('[AI Parse Error] Failed to parse Gemini JSON output');
            res.status(500).json({ message: 'AI generated invalid formatting. Try again.' });
        }
    } catch (error) {
        console.error('[AI Diagnosis Error]', (error as Error).message);
        res.status(500).json({ message: 'Failed to process symptoms with AI.' });
    }
};

export const analyzeLabReport = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No report file uploaded' });
        }

        const client = getGenAI();
        const model = client.getGenerativeModel({ model: 'gemini-1.5-pro' });

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

        // Clean up potential markdown formatting in Gemini's response
        const cleanedText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

        try {
            const parsedData = JSON.parse(cleanedText);
            res.status(200).json({
                success: true,
                data: parsedData,
            });
        } catch (parseError) {
            console.error('[AI Parse Error] Failed to parse Gemini JSON output', cleanedText);
            res.status(500).json({ message: 'AI generated invalid formatting. Try again.' });
        }
    } catch (error) {
        console.error('[AI Report Analysis Error]', (error as Error).message);
        res.status(500).json({ message: 'Failed to analyze report with AI.' });
    }
};
