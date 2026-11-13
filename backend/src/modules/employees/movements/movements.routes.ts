import { Router } from 'express'
import movementsController from './movements.controller.js'

const router = Router()

router.post('/create-movement', movementsController.create)
router.patch('/reverse-movement/:id', movementsController.reverse)

export default router
