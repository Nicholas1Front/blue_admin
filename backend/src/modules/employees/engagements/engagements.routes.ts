import { Router } from 'express'
import engagementsController from './engagements.controller.js'

const router = Router({ mergeParams: true })

router.post('/create-engagement/:employeeId', engagementsController.createEngagement)
router.put('/update-engagement/:employeeId/:engagementId', engagementsController.updateEngagement)
router.get('/find-engagements-by-employee/:employeeId', engagementsController.findEngagementsByEmployee)

export default router
