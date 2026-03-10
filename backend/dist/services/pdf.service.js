"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatePrescriptionPDF = void 0;
const worker_threads_1 = require("worker_threads");
const path_1 = __importDefault(require("path"));
/**
 * Generates a PDF buffer using pdfkit format.
 *
 * @param {PrescriptionData} data - All the textual data needed for the PDF.
 * @returns {Promise<Buffer>} - The assembled PDF buffer.
 */
const generatePrescriptionPDF = (data) => {
    return new Promise((resolve, reject) => {
        // Resolve worker path accommodating both uncompiled dev and compiled prod directories
        const extension = __filename.endsWith('.ts') ? 'ts' : 'js';
        const workerPath = path_1.default.join(__dirname, `pdfWorker.${extension}`);
        const worker = new worker_threads_1.Worker(workerPath, {
            workerData: data,
            // When executing raw .ts files in bun, this works naturally. 
            // In ts-node/tsc, we might need a loader, but bun natively runs ts workers.
            execArgv: extension === 'ts' && !process.versions.bun ? ['-r', 'ts-node/register'] : undefined
        });
        worker.on('message', (message) => {
            if (message.type === 'SUCCESS') {
                resolve(Buffer.from(message.buffer)); // Re-hydrate buffer from worker thread
            }
            else {
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
exports.generatePrescriptionPDF = generatePrescriptionPDF;
