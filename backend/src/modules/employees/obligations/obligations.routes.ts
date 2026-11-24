import { Router } from 'express'
import obligationsController from './obligations.controller.js'

const router = Router()

router.get('/analyze-obligations/:engagementId', obligationsController.analyzeObligations)
router.post('/create-obligations-batch/:engagementId', obligationsController.createObligationsBatch)

router.post('/create-obligation/:engagementId', obligationsController.createObligation)
router.put('/update-obligation/:engagementId/:obligationId', obligationsController.updateObligation)
router.get('/find-obligations-by-filters', obligationsController.findObligationsByFilters)
router.get('/find-open-obligations/:engagementId', obligationsController.findOpenObligations)
router.get('/find-obligations-by-engagement/:engagementId', obligationsController.findObligationsByEngagement)
router.delete('/delete-obligation/:engagementId/:obligationId', obligationsController.deleteObligation)

export default router
