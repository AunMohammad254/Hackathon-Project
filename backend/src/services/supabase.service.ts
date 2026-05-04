import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Lazily create client to avoid crash at import time if env vars aren't ready
let _supabase: ReturnType<typeof createClient> | null = null;

const getSupabase = () => {
    if (!_supabase) {
        if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
            throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment variables');
        }
        _supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    }
    return _supabase;
};

/**
 * Uploads a PDF buffer to the 'prescriptions' bucket in Supabase Storage.
 */
export const uploadPrescriptionPDF = async (fileBuffer: Buffer, fileName: string): Promise<string> => {
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
    } catch (error) {
        console.error('Detailed Error uploading PDF to Supabase:', error);
        throw error;
    }
};

/**
 * Dynamically generates a temporary signed URL for a given prescription file.
 */
export const getSignedPrescriptionUrl = async (fileName: string): Promise<string | null> => {
    if (process.env.NODE_ENV === 'test') {
        return `https://mock-supabase.com/${fileName}`;
    }
    try {
        if (!fileName) return null;
        // If it's already a full HTTP URL (e.g., from old mock data), just return it
        if (fileName.startsWith('http')) return fileName;

        const { data, error } = await getSupabase().storage
            .from('prescriptions')
            .createSignedUrl(fileName, 3600); // 1-hour TTL

        if (error || !data?.signedUrl) {
            console.error('Supabase Signed URL Error:', error);
            return null;
        }

        return data.signedUrl;
    } catch (error) {
        console.error('Failed to generate signed url:', error);
        return null;
    }
};
