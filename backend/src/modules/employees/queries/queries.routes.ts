import { Router } from 'express'
import employeesQueriesController from './queries.controller.js'

const router = Router()

router.get('/find-employee-overview/:employeeId', employeesQueriesController.findEmployeeOverview)

export default router
