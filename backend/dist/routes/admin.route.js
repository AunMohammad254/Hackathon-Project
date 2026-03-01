"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const admin_controller_1 = require("../controllers/admin.controller");
const authMiddleware_1 = require("../middleware/authMiddleware");
const roleMiddleware_1 = require("../middleware/roleMiddleware");
const router = express_1.default.Router();
// All admin routes require Admin role
router.use(authMiddleware_1.protect, (0, roleMiddleware_1.authorizeRoles)('Admin'));
router.get('/stats', admin_controller_1.getDashboardStats);
router.get('/users', admin_controller_1.getAllUsers);
router.put('/users/:id/role', admin_controller_1.updateUserRole);
router.delete('/users/:id', admin_controller_1.deleteUser);
exports.default = router;
