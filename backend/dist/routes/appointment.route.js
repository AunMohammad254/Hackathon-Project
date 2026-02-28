"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const appointment_controller_1 = require("../controllers/appointment.controller");
const authMiddleware_1 = require("../middleware/authMiddleware");
const roleMiddleware_1 = require("../middleware/roleMiddleware");
const router = express_1.default.Router();
router.route('/')
    .post(authMiddleware_1.protect, (0, roleMiddleware_1.authorizeRoles)('Admin', 'Receptionist', 'Patient', 'Doctor'), appointment_controller_1.createAppointment)
    .get(authMiddleware_1.protect, appointment_controller_1.getAppointments);
router.route('/patient/:patientId')
    .get(authMiddleware_1.protect, appointment_controller_1.getPatientAppointments);
router.route('/:id/status')
    .put(authMiddleware_1.protect, (0, roleMiddleware_1.authorizeRoles)('Admin', 'Receptionist', 'Doctor'), appointment_controller_1.updateAppointmentStatus);
exports.default = router;
