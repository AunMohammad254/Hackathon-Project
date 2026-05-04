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
// General admin routes require Admin (or Super Admin via inheritance)
router.use(authMiddleware_1.protect, (0, roleMiddleware_1.authorizeRoles)('Admin'));
router.get('/analytics', admin_controller_1.getDashboardStats);
router.get('/financials', admin_controller_1.getFinancialAnalytics);
router.get('/orders', admin_controller_1.getAllOrders);
router.put('/subscription', admin_controller_1.updateSubscriptionPlan);
// Users management
router.get('/users', admin_controller_1.getAllUsers);
router.get('/users/pending', admin_controller_1.getPendingUsers);
router.put('/users/:id/role', admin_controller_1.updateUserRole);
// Destructive/Critical actions
router.delete('/users/:id', admin_controller_1.deleteUser);
// Super Admin ONLY routes
router.put('/users/:id/status', (0, roleMiddleware_1.authorizeRoles)('Super Admin'), admin_controller_1.updateUserStatus);
exports.default = router;
