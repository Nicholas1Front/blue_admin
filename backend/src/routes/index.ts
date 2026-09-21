import {Router} from "express";
import usersRoutes from "../modules/users/users.routes.js";
import authRoutes from "../modules/auth/auth.routes.js";
const routes = Router();

routes.use('/users', usersRoutes);
routes.use('/auth', authRoutes);

export default routes;