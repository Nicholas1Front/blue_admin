import { Router } from 'express'
import allocationsController from './allocations.controller.js'

const router = Router()

router.post('/register-payment', allocationsController.registerPayment)
router.post('/apply-advance', allocationsController.applyAdvance)

export default router
