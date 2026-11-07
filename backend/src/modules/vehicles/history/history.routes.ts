import { Router } from 'express'
import vehicleHistoryController from './history.controller.js'

const router = Router()

router.post('/:vehicleId', vehicleHistoryController.create)
router.put('/:historyId', vehicleHistoryController.update)
router.delete('/:historyId', vehicleHistoryController.delete)

export default router
