import { Router } from 'express'
import { authMiddleware } from '../../middlewares/auth.middleware.js'
import employeesController from './employees.controller.js'
import engagementsRoutes from './engagements/engagements.routes.js'
import obligationsRoutes from './obligations/obligations.routes.js'
import movementsRoutes from './movements/movements.routes.js'

const router = Router()

router.use(authMiddleware)

router.post('/create-employee', employeesController.createEmployee)
router.put('/update-employee/:id', employeesController.updateEmployee)
router.get('/find-employee-by-id/:id', employeesController.findEmployeeById)

router.use('/', engagementsRoutes)
router.use('/', obligationsRoutes)
router.use('/', movementsRoutes)

export default router
