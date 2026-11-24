import { Router } from 'express'
import movementsController from './movements.controller.js'

const router = Router()

router.post('/create-movement/:engagementId', movementsController.createMovement)
router.post('/create-payment/:engagementId', movementsController.createPayment)

router.put('/update-movement/:engagementId/:movementId', movementsController.updateMovement)
router.put('/update-payment/:engagementId/:movementId', movementsController.updatePayment)

router.get('/find-movements-by-filters', movementsController.findMovementsByFilters)
router.get('/find-movements-by-engagement/:engagementId', movementsController.findMovementsByEngagement)
router.get('/find-movement-by-id/:engagementId/:movementId', movementsController.findMovementById)

router.delete('/delete-movement/:engagementId/:movementId', movementsController.deleteMovement)

export default router
