import { Worker } from 'worker_threads';
import path from 'path';
interface Medicine {
    name: string;
    dosage: string;
    duration: string;
}

interface PrescriptionData {
    patientName: string;
    doctorName: string;
    date: string;
    medicines: Medicine[];
    instructions?: string;
    aiInsights?: string;
    riskLevel?: string;
}

/**
 * Generates a PDF buffer using pdfkit format.
 * 
 * @param {PrescriptionData} data - All the textual data needed for the PDF.
 * @returns {Promise<Buffer>} - The assembled PDF buffer.
 */
export const generatePrescriptionPDF = (data: PrescriptionData): Promise<Buffer> => {
    return new Promise((resolve, reject) => {
        // Resolve worker path accommodating both uncompiled dev and compiled prod directories
        const extension = __filename.endsWith('.ts') ? 'ts' : 'js';
        const workerPath = path.join(__dirname, `pdfWorker.${extension}`);

        const worker = new Worker(workerPath, {
            workerData: data,
            // When executing raw .ts files in bun, this works naturally. 
            // In ts-node/tsc, we might need a loader, but bun natively runs ts workers.
            execArgv: extension === 'ts' && !process.versions.bun ? ['-r', 'ts-node/register'] : undefined
        });

        worker.on('message', (message) => {
            if (message.type === 'SUCCESS') {
                resolve(Buffer.from(message.buffer)); // Re-hydrate buffer from worker thread
            } else {
                reject(new Error(message.error || 'Failed to generate PDF in worker'));
            }
        });

        worker.on('error', reject);
        
        worker.on('exit', (code) => {
            if (code !== 0) {
                reject(new Error(`Worker stopped with exit code ${code}`));
            }
        });
    });
};
