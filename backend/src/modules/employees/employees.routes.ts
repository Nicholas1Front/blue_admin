import { Router } from 'express'
import { authMiddleware } from '../../middlewares/auth.middleware.js'
import employeesController from './employees.controller.js'
import engagementsRoutes from './engagements/engagements.routes.js'

const router = Router()

router.use(authMiddleware)

router.post('/create-employee', employeesController.createEmployee)
router.put('/update-employee/:id', employeesController.updateEmployee)
router.get('/find-employee-by-id/:id', employeesController.findEmployeeById)
router.get('/find-all-employees', employeesController.findAllEmployees)
router.get('/find-employees-by-filters', employeesController.findEmployeesByFilters)

router.use('/:employeeId/engagements', engagementsRoutes)

export default router
