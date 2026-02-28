import { Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Gemini API client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export const analyzeSymptoms = async (req: Request, res: Response) => {
    try {
        const { symptoms } = req.body;

        if (!symptoms || !Array.isArray(symptoms) || symptoms.length === 0) {
            return res.status(400).json({ message: 'A valid array of symptoms is required' });
        }

        // For the hackathon demo, we default to the standard gemini-1.5-pro or flash model
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

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

        // Clean up potential markdown formatting in Gemini's response for JSON parsing
        const cleanedText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

        try {
            const parsedData = JSON.parse(cleanedText);
            res.status(200).json({
                success: true,
                data: parsedData
            });
        } catch (parseError) {
            console.error('Failed to parse Gemini JSON output:', parseError);
            res.status(500).json({ message: 'AI generated invalid formatting. Try again.' });
        }

    } catch (error) {
        console.error('AI Diagnosis Error:', error);
        res.status(500).json({ message: 'Failed to process symptoms with AI.', error });
    }
};
