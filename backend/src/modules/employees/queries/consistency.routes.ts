import { Router } from 'express'
import consistencyController from './consistency.controller.js'

const router = Router()

router.get('/analyze-consistency/:employeeId', consistencyController.analyzeEmployee)

export default router
