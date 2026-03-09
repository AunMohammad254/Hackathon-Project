import express from 'express';
import { getDashboardStats, getAllUsers, updateUserRole, deleteUser, updateSubscriptionPlan } from '../controllers/admin.controller';
import { protect } from '../middleware/authMiddleware';
import { authorizeRoles } from '../middleware/roleMiddleware';

const router = express.Router();

// All admin routes require Admin role
router.use(protect, authorizeRoles('Admin'));

router.get('/analytics', getDashboardStats);
router.put('/subscription', updateSubscriptionPlan);
router.get('/users', getAllUsers);
router.put('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);

export default router;
