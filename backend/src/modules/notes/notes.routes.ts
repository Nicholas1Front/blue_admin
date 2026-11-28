import { Router } from 'express'
import { authMiddleware } from '../../middlewares/auth.middleware.js'
import notesController from './notes.controller.js'

const router = Router()

router.use(authMiddleware)

router.post('/create-note', notesController.create)
router.get('/find-notes-dashboard', notesController.findDashboard)
router.get('/find-notes-by-filters', notesController.find)
router.get('/find-note-by-id/:id', notesController.findById)
router.put('/update-note/:id', notesController.update)
router.delete('/delete-note/:id', notesController.delete)

export default router
