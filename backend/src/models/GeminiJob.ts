import mongoose from 'mongoose';

const geminiJobSchema = new mongoose.Schema({
    prompt: { type: String, required: true },
    status: { type: String, enum: ['pending', 'processing', 'completed', 'failed'], default: 'pending' },
    response: { type: String },
    error: { type: String },
    retries: { type: Number, default: 0 },
    lastAttemptedAt: { type: Date }
}, { timestamps: true });

export default mongoose.model('GeminiJob', geminiJobSchema);
