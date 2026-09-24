import {Router} from 'express';
import usersController from './users.controller.js';
import {authMiddleware} from "../../middlewares/auth.middleware.js";
const router = Router();

router.post('/first-user', usersController.createFirstUser);
router.post('/create-user', authMiddleware, usersController.createUser);

router.put('/update-user/:id', authMiddleware, usersController.updateUser);
router.get('/find-user', authMiddleware, usersController.findUserByFilters);
router.delete('/delete-user/:id', authMiddleware, usersController.deleteUserById);

export default router;