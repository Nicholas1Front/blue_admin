import {Router} from 'express';
import usersController from './users.controller.js';

const router = Router();

router.post('/first-user', usersController.createFirstUser);

export default router;