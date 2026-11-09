import { Router } from 'express'
import { authMiddleware } from '../../../middlewares/auth.middleware.js'
import vehicleQueriesController from './queries.controller.js'

const router = Router()

router.use(authMiddleware)

router.get('/dashboard', vehicleQueriesController.findVehicleDashboard)
router.get('/find-vehicles-by-filters', vehicleQueriesController.findVehiclesByAdvancedFilters)
router.get(
    '/find-vehicle-with-history/:vehicleId',
    vehicleQueriesController.findVehicleWithHistoryByPeriod
)

export default router
