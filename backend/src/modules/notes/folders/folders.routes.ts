import { Router } from 'express'
import { authMiddleware } from '../../../middlewares/auth.middleware.js'
import foldersController from './folders.controller.js'

const router = Router()

router.use(authMiddleware)

router.post('/create', foldersController.create)
router.get('/find', foldersController.findAll)
router.get('/find/:id', foldersController.findById)
router.put('/update/:id', foldersController.update)
router.delete('/delete/:id', foldersController.delete)

export default router
