"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const auth_route_1 = __importDefault(require("./routes/auth.route"));
const patient_route_1 = __importDefault(require("./routes/patient.route"));
const appointment_route_1 = __importDefault(require("./routes/appointment.route"));
const ai_route_1 = __importDefault(require("./routes/ai.route"));
const prescription_route_1 = __importDefault(require("./routes/prescription.route"));
const admin_route_1 = __importDefault(require("./routes/admin.route"));
dotenv_1.default.config();
const app = (0, express_1.default)();
// Middleware
app.use(express_1.default.json());
app.use((0, cors_1.default)());
// Routes
app.use('/api/auth', auth_route_1.default);
app.use('/api/patients', patient_route_1.default);
app.use('/api/appointments', appointment_route_1.default);
app.use('/api/ai', ai_route_1.default);
app.use('/api/prescriptions', prescription_route_1.default);
app.use('/api/admin', admin_route_1.default);
// Database connection
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/clinic-saas';
mongoose_1.default.connect(MONGO_URI)
    .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
})
    .catch((error) => {
    console.error('MongoDB connection error:', error);
});
