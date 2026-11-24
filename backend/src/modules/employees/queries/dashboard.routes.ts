import { Router } from 'express'
import dashboardController from './dashboard.controller.js'

const router = Router()

router.get('/dashboard', dashboardController.findDashboard)

export default router
