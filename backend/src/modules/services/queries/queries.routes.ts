import {Router} from 'express'
import {authMiddleware} from '../../../middlewares/auth.middleware.js'
import queriesController from './queries.controller.js'

const router = Router()

router.use(authMiddleware)

router.get('/dashboard', queriesController.findServiceDashboard)
router.get('/find-services-by-filters', queriesController.findServicesByAdvancedFilters)
router.get('/find-service-by-id/:serviceId', queriesController.findServiceById)

export default router
