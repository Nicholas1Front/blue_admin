import {Router} from "express";
import categoryController from "./category.controller.js";
import {authMiddleware} from "../../../middlewares/auth.middleware.js";

const router = Router() 

router.use(authMiddleware)

router.post('/create-category', categoryController.createCategory);

router.put('/update-category/:id', categoryController.updateCategory);

router.get('/find-all-categories', categoryController.findAllCategories);
router.get('/find-categories-by-filters', categoryController.findCategoriesByFilters);

router.patch('/deactivate-category/:id', categoryController.deactivateCategory);
router.patch('/activate-category/:id', categoryController.activateCategory);

export default router