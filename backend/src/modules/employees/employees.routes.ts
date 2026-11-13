import { Router } from 'express'
import { authMiddleware } from '../../middlewares/auth.middleware.js'
import employeesController from './employees.controller.js'
import engagementsRoutes from './engagements/engagements.routes.js'
import obligationsRoutes from './obligations/obligations.routes.js'
import movementsRoutes from './movements/movements.routes.js'
import allocationsRoutes from './allocations/allocations.routes.js'

const router = Router()

router.use(authMiddleware)
router.use('/engagements', engagementsRoutes)
router.use('/obligations', obligationsRoutes)
router.use('/movements', movementsRoutes)
router.use('/allocations', allocationsRoutes)

router.post('/create-employee', employeesController.create)
router.put('/update-employee/:id', employeesController.update)

export default router
