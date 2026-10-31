import { Router } from 'express'
import budgetCategoryController from './categories.controller.js'

const router = Router()

router.post('/create-category', budgetCategoryController.create)
router.put('/update-category/:id', budgetCategoryController.update)
router.get('/find-all-categories', budgetCategoryController.findAll)
router.patch('/deactivate-category/:id', budgetCategoryController.deactivate)
router.patch('/activate-category/:id', budgetCategoryController.activate)

export default router
