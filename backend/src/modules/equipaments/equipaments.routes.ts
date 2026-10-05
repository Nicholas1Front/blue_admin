import {Router} from 'express';
import {authMiddleware} from '../../middlewares/auth.middleware.js';

const router = Router();

router.use(authMiddleware);

export default router;