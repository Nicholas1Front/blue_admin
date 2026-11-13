import { Router } from 'express'
import movementsController from './movements.controller.js'

const router = Router()

router.post('/create-movement', movementsController.create)

export default router
