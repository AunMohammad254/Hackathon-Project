import express from 'express';
import { 
    getDashboardStats, 
    getAllUsers, 
    updateUserRole, 
    deleteUser, 
    updateSubscriptionPlan, 
    getPendingUsers, 
    updateUserStatus,
    getAllOrders,
    getFinancialAnalytics
} from '../controllers/admin.controller';
import { protect } from '../middleware/authMiddleware';
import { authorizeRoles } from '../middleware/roleMiddleware';

const router: express.Router = express.Router();

// General admin routes require Admin (or Super Admin via inheritance)
router.use(protect, authorizeRoles('Admin'));

router.get('/analytics', getDashboardStats);
router.get('/financials', getFinancialAnalytics);
router.get('/orders', getAllOrders);
router.put('/subscription', updateSubscriptionPlan);

// Users management
router.get('/users', getAllUsers);
router.get('/users/pending', getPendingUsers);
router.put('/users/:id/role', updateUserRole);

// Destructive/Critical actions
router.delete('/users/:id', deleteUser);

// Super Admin ONLY routes
router.put('/users/:id/status', authorizeRoles('Super Admin'), updateUserStatus);

export default router;
