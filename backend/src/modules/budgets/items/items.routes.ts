import { Router } from 'express'
import budgetItemController from './items.controller.js'

const router = Router()

router.post('/create-item/:budgetId', budgetItemController.create)
router.put('/update-item/:id', budgetItemController.update)
router.get('/find-items-by-budget/:budgetId', budgetItemController.findByBudgetId)
router.delete('/delete-item/:id', budgetItemController.delete)

export default router
