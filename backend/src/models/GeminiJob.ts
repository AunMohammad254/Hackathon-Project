import mongoose, { Document } from 'mongoose';

export interface IGeminiJobDocument extends Document {
    prompt: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    response?: string;
    error?: string;
    retries: number;
    lastAttemptedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const geminiJobSchema = new mongoose.Schema({
    prompt: { type: String, required: true },
    status: { type: String, enum: ['pending', 'processing', 'completed', 'failed'], default: 'pending' },
    response: { type: String },
    error: { type: String },
    retries: { type: Number, default: 0 },
    lastAttemptedAt: { type: Date }
}, { timestamps: true });

export default mongoose.models.GeminiJob || mongoose.model<IGeminiJobDocument>('GeminiJob', geminiJobSchema);
