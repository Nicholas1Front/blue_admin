import {Router} from "express";
import usersRoutes from "../modules/users/users.routes.js";
import authRoutes from "../modules/auth/auth.routes.js";
import clientsRoutes from "../modules/clients/clients.routes.js";
import equipamentsRoutes from '../modules/equipaments/equipaments.routes.js';
import financialRoutes from '../modules/financial/indexRoutes.js';
import serviceRoutes from '../modules/services/services.routes.js'
import budgetsRoutes from '../modules/budgets/budgets.routes.js'

const routes = Router();

routes.use('/users', usersRoutes);
routes.use('/auth', authRoutes);
routes.use('/clients', clientsRoutes);
routes.use('/equipaments', equipamentsRoutes);
routes.use('/financial', financialRoutes);
routes.use('/services', serviceRoutes)
routes.use('/budgets', budgetsRoutes)

export default routes;