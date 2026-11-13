import { Router } from 'express'
import obligationsController from './obligations.controller.js'

const router = Router()

router.post('/create-obligation', obligationsController.create)
router.put('/update-obligation/:id', obligationsController.update)
router.patch('/review-obligation/:id', obligationsController.review)
router.patch('/cancel-obligation/:id', obligationsController.cancel)

export default router
