"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const prescription_controller_1 = require("../controllers/prescription.controller");
const authMiddleware_1 = require("../middleware/authMiddleware");
const roleMiddleware_1 = require("../middleware/roleMiddleware");
const router = express_1.default.Router();
// Only Doctor can create prescription
router.post('/', authMiddleware_1.protect, (0, roleMiddleware_1.authorizeRoles)('Doctor'), prescription_controller_1.createPrescription);
// Doctor, Patient, and Admin can view a patient's prescriptions
router.get('/patient/:patientId', authMiddleware_1.protect, (0, roleMiddleware_1.authorizeRoles)('Doctor', 'Admin', 'Patient'), prescription_controller_1.getPatientPrescriptions);
exports.default = router;
