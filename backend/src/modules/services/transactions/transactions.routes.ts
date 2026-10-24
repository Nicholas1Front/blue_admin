import {Router} from 'express'
import { authMiddleware } from "../../../middlewares/auth.middleware.js";
import transactionsController from "./transactions.controller.js";

const router = Router()

router.use(authMiddleware)

router.put('/update-origins/:serviceId', transactionsController.updateOrigins)
router.delete('/remove-origins/:transactionId', transactionsController.removeOrigins)

router.put('/update-tithe/:transactionId/:serviceId', transactionsController.updateTithe)
router.delete('/remove-tithe/:transactionId/:serviceId', transactionsController.removeTithe)

router.get('/find-all-transactions/:serviceId', transactionsController.findAllTransactionsByService)

export default router