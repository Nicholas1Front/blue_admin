import { Router } from 'express'
import { authMiddleware } from '../../../middlewares/auth.middleware.js'
import foldersController from './folders.controller.js'

const router = Router()

router.use(authMiddleware)

router.post('/create-folder', foldersController.create)
router.get('/find-folders', foldersController.findAll)
router.get('/find-folder-by-id/:id', foldersController.findById)
router.put('/update-folder/:id', foldersController.update)
router.delete('/delete-folder/:id', foldersController.delete)

export default router
