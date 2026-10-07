import {Request, Response} from 'express'

import {AppError} from '../../../shared/errors/AppError.js'

import categoryService from './category.service.js'
import {
    createCategorySchema,
    updateCategorySchema,
    findCategoryByFiltersSchema
} from './category.schema.js'

class CategoryController{
    async createCategory(req : Request, res : Response) {
        if(!req.user){
            throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED')
        }
        const data = createCategorySchema.parse(req.body);

        const category = await categoryService.createCategory(data);

        return res.status(200).json({
            message : 'Category created successfully',
            data : category
        })
    }

    async updateCategory(req : Request, res : Response) {
        if(!req.user){
            throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED')
        }
        const data = updateCategorySchema.parse(req.body);

        const category = await categoryService.updateCategory(req.params.id as string, data);

        return res.status(200).json({
            message : 'Category updated successfully',
            data : category
        })
    }

    async findAllCategories(req : Request, res : Response) {
        if(!req.user){
            throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED')
        }

        const categories = await categoryService.findAllCategories();

        return res.status(200).json({
            message : 'Categories found successfully',
            data : categories
        })
    }

    async findCategoriesByFilters(req : Request, res : Response) {
        if(!req.user){
            throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED')
        }

        const data = findCategoryByFiltersSchema.parse(req.query);

        const categories = await categoryService.findCategoriesByFilters(data);

        return res.status(200).json({
            message : 'Categories found successfully using filters',
            data : categories
        })
    }

    async deactivateCategory(req : Request, res : Response) {
        if(!req.user){
            throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED')
        }

        const category = await categoryService.deactivateCategoryById(req.params.id as string);

        return res.status(200).json({
            message : 'Category deactivated successfully',
            data : category
        })

    }
    async activateCategory(req : Request, res : Response) {
        if(!req.user){
            throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED')
        }

        const category = await categoryService.activateCategoryById(req.params.id as string);

        return res.status(200).json({
            message : 'Category activated successfully',
            data : category
        })

    }
}

export default new CategoryController();