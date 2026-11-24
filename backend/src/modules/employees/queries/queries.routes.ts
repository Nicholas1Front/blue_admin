import { Router } from 'express'
import employeesQueriesController from './queries.controller.js'

const router = Router()

router.get('/find-employee-overview/:employeeId', employeesQueriesController.findEmployeeOverview)
router.get('/dashboard', employeesQueriesController.findDashboard)
router.get('/analyze-consistency/:employeeId', employeesQueriesController.analyzeEmployee)

export default router
