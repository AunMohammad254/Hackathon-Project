"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const patient_controller_1 = require("../controllers/patient.controller");
const authMiddleware_1 = require("../middleware/authMiddleware");
const roleMiddleware_1 = require("../middleware/roleMiddleware");
const router = express_1.default.Router();
router.route('/profile')
    .post(authMiddleware_1.protect, (0, roleMiddleware_1.authorizeRoles)('Patient'), patient_controller_1.createPatientProfile);
router.route('/')
    .post(authMiddleware_1.protect, (0, roleMiddleware_1.authorizeRoles)('Admin', 'Receptionist', 'Doctor'), patient_controller_1.createPatient)
    .get(authMiddleware_1.protect, (0, roleMiddleware_1.authorizeRoles)('Admin', 'Receptionist', 'Doctor'), patient_controller_1.getPatients);
router.route('/my-diagnoses')
    .get(authMiddleware_1.protect, (0, roleMiddleware_1.authorizeRoles)('Patient'), patient_controller_1.getMyDiagnoses);
router.route('/my-records')
    .get(authMiddleware_1.protect, (0, roleMiddleware_1.authorizeRoles)('Patient'), patient_controller_1.getMyRecords);
router.route('/records/:id')
    .delete(authMiddleware_1.protect, (0, roleMiddleware_1.authorizeRoles)('Patient'), patient_controller_1.deleteRecord);
router.route('/:id/records')
    .get(authMiddleware_1.protect, (0, roleMiddleware_1.authorizeRoles)('Admin', 'Doctor'), patient_controller_1.getPatientRecordsForDoctor);
router.route('/:id')
    .get(authMiddleware_1.protect, (0, roleMiddleware_1.authorizeRoles)('Admin', 'Receptionist', 'Doctor', 'Patient'), patient_controller_1.getPatientById)
    .put(authMiddleware_1.protect, (0, roleMiddleware_1.authorizeRoles)('Admin', 'Receptionist', 'Doctor'), patient_controller_1.updatePatient)
    .delete(authMiddleware_1.protect, (0, roleMiddleware_1.authorizeRoles)('Admin'), patient_controller_1.deletePatient);
exports.default = router;
