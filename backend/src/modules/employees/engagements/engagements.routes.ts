import { Router } from 'express'
import engagementsController from './engagements.controller.js'

const router = Router()

router.post('/create-engagement', engagementsController.create)
router.put('/update-engagement/:id', engagementsController.update)
router.patch('/close-engagement/:id', engagementsController.close)

export default router
