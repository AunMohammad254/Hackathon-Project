"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSignedMedicalRecordUrl = exports.uploadMedicalRecordFile = exports.getSignedInvoiceUrl = exports.getSignedPrescriptionUrl = exports.uploadInvoicePDF = exports.uploadPrescriptionPDF = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
// Lazily create client to avoid crash at import time if env vars aren't ready
let _supabase = null;
const getSupabase = () => {
    if (!_supabase) {
        const url = process.env.SUPABASE_URL || '';
        const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
        if (!url || !key) {
            throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment variables');
        }
        _supabase = (0, supabase_js_1.createClient)(url, key);
    }
    return _supabase;
};
/**
 * Uploads a PDF buffer to the 'prescriptions' bucket in Supabase Storage.
 */
const uploadPrescriptionPDF = async (fileBuffer, fileName) => {
    if (process.env.NODE_ENV === 'test') {
        return `mock-url-${fileName}`;
    }
    try {
        const { data, error } = await getSupabase().storage
            .from('prescriptions')
            .upload(fileName, fileBuffer, {
            contentType: 'application/pdf',
            upsert: true,
        });
        if (error) {
            console.error('Supabase Storage Error:', error);
            throw new Error(`Failed to upload to Supabase: ${error.message}`);
        }
        // We return the raw filename. The controller will store this in the DB
        // and generate fresh signed URLs whenever retrieved.
        return fileName;
    }
    catch (error) {
        console.error('Detailed Error uploading PDF to Supabase:', error);
        throw error;
    }
};
exports.uploadPrescriptionPDF = uploadPrescriptionPDF;
/**
 * Uploads an Invoice PDF buffer to Supabase Storage.
 */
const uploadInvoicePDF = async (fileBuffer, fileName) => {
    if (process.env.NODE_ENV === 'test')
        return `mock-url-${fileName}`;
    try {
        const { error } = await getSupabase().storage
            .from('invoices')
            .upload(fileName, fileBuffer, { contentType: 'application/pdf', upsert: true });
        if (error) {
            // Fallback to prescriptions bucket if invoices doesn't exist
            if (error.message.includes('not found')) {
                return (0, exports.uploadPrescriptionPDF)(fileBuffer, fileName);
            }
            throw new Error(`Supabase upload failed: ${error.message}`);
        }
        return fileName;
    }
    catch (error) {
        console.error('Error uploading invoice:', error);
        throw error;
    }
};
exports.uploadInvoicePDF = uploadInvoicePDF;
/**
 * Generates a signed URL for a prescription.
 */
const getSignedPrescriptionUrl = async (fileName) => {
    if (process.env.NODE_ENV === 'test')
        return `https://mock-supabase.com/${fileName}`;
    try {
        if (!fileName)
            return null;
        if (fileName.startsWith('http'))
            return fileName;
        const { data, error } = await getSupabase().storage
            .from('prescriptions')
            .createSignedUrl(fileName, 3600);
        if (error) {
            console.error('Supabase signed URL error:', error);
            return null;
        }
        return data?.signedUrl || null;
    }
    catch (error) {
        console.error('Failed to generate signed url for prescription:', error);
        return null;
    }
};
exports.getSignedPrescriptionUrl = getSignedPrescriptionUrl;
/**
 * Generates a signed URL for an invoice.
 */
const getSignedInvoiceUrl = async (fileName) => {
    if (process.env.NODE_ENV === 'test')
        return `https://mock-supabase.com/${fileName}`;
    try {
        if (!fileName)
            return null;
        if (fileName.startsWith('http'))
            return fileName;
        let { data, error } = await getSupabase().storage
            .from('invoices')
            .createSignedUrl(fileName, 3600);
        if (error && error.message.includes('not found')) {
            return (0, exports.getSignedPrescriptionUrl)(fileName);
        }
        return data?.signedUrl || null;
    }
    catch (error) {
        console.error('Failed to generate signed url for invoice:', error);
        return null;
    }
};
exports.getSignedInvoiceUrl = getSignedInvoiceUrl;
/**
 * Uploads a Medical Record buffer to Supabase Storage.
 */
const uploadMedicalRecordFile = async (fileBuffer, fileName, contentType) => {
    if (process.env.NODE_ENV === 'test')
        return `mock-url-${fileName}`;
    try {
        const { error } = await getSupabase().storage
            .from('medical-records')
            .upload(fileName, fileBuffer, { contentType, upsert: true });
        if (error) {
            throw new Error(`Supabase upload failed: ${error.message}`);
        }
        return fileName;
    }
    catch (error) {
        console.error('Error uploading medical record:', error);
        throw error;
    }
};
exports.uploadMedicalRecordFile = uploadMedicalRecordFile;
/**
 * Generates a signed URL for a medical record.
 */
const getSignedMedicalRecordUrl = async (fileName) => {
    if (process.env.NODE_ENV === 'test')
        return `https://mock-supabase.com/${fileName}`;
    try {
        if (!fileName)
            return null;
        if (fileName.startsWith('http'))
            return fileName;
        const { data, error } = await getSupabase().storage
            .from('medical-records')
            .createSignedUrl(fileName, 3600);
        if (error) {
            console.error('Supabase signed URL error:', error);
            return null;
        }
        return data?.signedUrl || null;
    }
    catch (error) {
        console.error('Failed to generate signed url for medical record:', error);
        return null;
    }
};
exports.getSignedMedicalRecordUrl = getSignedMedicalRecordUrl;
