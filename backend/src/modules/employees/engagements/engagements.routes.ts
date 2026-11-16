import { Router } from 'express'
import engagementsController from './engagements.controller.js'

const router = Router({ mergeParams: true })

router.post('/', engagementsController.createEngagement)
router.put('/:engagementId', engagementsController.updateEngagement)
router.get('/', engagementsController.findEngagementsByEmployee)

export default router
