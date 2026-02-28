"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadPrescriptionPDF = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
// Lazily create client to avoid crash at import time if env vars aren't ready
let _supabase = null;
const getSupabase = () => {
    if (!_supabase) {
        if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
            throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment variables');
        }
        _supabase = (0, supabase_js_1.createClient)(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    }
    return _supabase;
};
/**
 * Uploads a PDF buffer to the 'prescriptions' bucket in Supabase Storage.
 *
 * @param {Buffer} fileBuffer - The PDF file in buffer format
 * @param {string} fileName - Unique identifier for the file (e.g., patientId-timestamp.pdf)
 * @returns {Promise<string>} - The public URL of the uploaded generated PDF
 */
const uploadPrescriptionPDF = async (fileBuffer, fileName) => {
    try {
        const { data, error } = await getSupabase().storage
            .from('prescriptions')
            .upload(fileName, fileBuffer, {
            contentType: 'application/pdf',
            upsert: true, // Replace if already exists
        });
        if (error) {
            console.error('Supabase Storage Error:', error);
            throw new Error(`Failed to upload to Supabase: ${error.message}`);
        }
        // Get public URL
        const { data: publicUrlData } = getSupabase().storage
            .from('prescriptions')
            .getPublicUrl(fileName);
        return publicUrlData.publicUrl;
    }
    catch (error) {
        console.error('Detailed Error uploading PDF to Supabase:', error);
        throw error;
    }
};
exports.uploadPrescriptionPDF = uploadPrescriptionPDF;
