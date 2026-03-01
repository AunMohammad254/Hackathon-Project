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

        const { data: publicUrlData } = getSupabase().storage
            .from('prescriptions')
            .getPublicUrl(fileName);

        return publicUrlData.publicUrl;
    } catch (error) {
        console.error('Detailed Error uploading PDF to Supabase:', error);
        throw error;
    }
};
