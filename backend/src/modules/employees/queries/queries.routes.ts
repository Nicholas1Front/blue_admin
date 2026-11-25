import { Router } from 'express'
import employeesQueriesController from './queries.controller.js'

const router = Router()

router.get('/find-employee-overview/:employeeId', employeesQueriesController.findEmployeeOverview)
router.get('/find-employee-engagement-summaries', employeesQueriesController.findEmployeeEngagementSummaries)
router.get('/engagement-financial-summary/:engagementId', employeesQueriesController.findEngagementFinancialSummary)
router.get('/dashboard', employeesQueriesController.findDashboard)
router.get('/analyze-consistency/:employeeId', employeesQueriesController.analyzeEmployee)

export default router
