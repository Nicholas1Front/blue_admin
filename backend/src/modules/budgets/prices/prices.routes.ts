import { Router } from 'express'
import budgetPriceController from './prices.controller.js'

const router = Router()

router.post('/create-price', budgetPriceController.create)
router.put('/update-price/:id', budgetPriceController.update)
router.get('/find-price-by-id/:id', budgetPriceController.findById)
router.get('/find-price-by-filters', budgetPriceController.findByFilters)
router.delete('/delete-price/:id', budgetPriceController.delete)

export default router
