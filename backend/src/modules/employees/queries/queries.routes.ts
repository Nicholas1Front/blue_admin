import { Router } from 'express'
import employeesQueriesController from './queries.controller.js'
import dashboardRoutes from './dashboard.routes.js'
import consistencyRoutes from './consistency.routes.js'

const router = Router()

router.get('/find-employee-overview/:employeeId', employeesQueriesController.findEmployeeOverview)
router.use('/', dashboardRoutes)
router.use('/', consistencyRoutes)

export default router
