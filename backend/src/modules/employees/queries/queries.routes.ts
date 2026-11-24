import { Router } from 'express'
import employeesQueriesController from './queries.controller.js'
import dashboardRoutes from './dashboard.routes.js'

const router = Router()

router.get('/find-employee-overview/:employeeId', employeesQueriesController.findEmployeeOverview)
router.use('/', dashboardRoutes)

export default router
