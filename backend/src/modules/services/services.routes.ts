import {Router} from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import servicesController from './services.controller.js'
import activitiesRoutes from './activity/activity.routes.js'
import transactionsRoutes from './transactions/transactions.routes.js'

const router = Router();

router.use(authMiddleware)

router.use('/activity', activitiesRoutes)
router.use('/transactions', transactionsRoutes)

router.post('/create-service', servicesController.createService)
router.put('/update-service/:id', servicesController.updateService)
router.patch('/update-status/:id', servicesController.updateServiceStatus)
router.get('/find-services-by-filters', servicesController.findServiceByFilters)
router.delete('/delete-service/:id', servicesController.deleteServiceById)

export default router
