import { Router } from 'express'
import { authMiddleware } from '../../middlewares/auth.middleware.js'
import vehiclesController from './vehicles.controller.js'
import historyRoutes from './history/history.routes.js'

const router = Router()

router.use(authMiddleware)
router.use('/history', historyRoutes)

router.post('/create-vehicle', vehiclesController.create)
router.put('/update-vehicle/:id', vehiclesController.update)
router.patch('/update-odometer/:id', vehiclesController.updateOdometer)
router.delete('/delete-vehicle/:id', vehiclesController.delete)

export default router
