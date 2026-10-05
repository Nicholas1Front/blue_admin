import {Router} from 'express';
import equipamentsController from './equipaments.controller.js';
import {authMiddleware} from '../../middlewares/auth.middleware.js';

const router = Router();

router.use(authMiddleware);

router.post('/create-equipament/:clientId', equipamentsController.createEquipament);
router.put('/update-equipament/:id', equipamentsController.updateEquipament);
router.get('/find-equipaments-by-filters', equipamentsController.findEquipamentsByFilters);
router.delete('/delete-equipament/:id', equipamentsController.deleteEquipament);

export default router;