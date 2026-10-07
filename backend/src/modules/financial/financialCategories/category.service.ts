import categoryRepository from "./category.repository.js";
import {AppError} from '../../../shared/errors/AppError.js'
import type {
    createCategoryDTO,
    updateCategoryDTO,
    findCategoryByFiltersDTO
} from './category.dto.js';
import {removeUndefined} from '../../../shared/helpers/objects/removeUndefined.js'
import{undefinedToNull} from '../../../shared/helpers/objects/undefinedToNull.js'

class CategoryService {
    async createCategory(
        data : createCategoryDTO
    ){
        const categoryExists = await categoryRepository.findCategoryByName(data.name)

        if(categoryExists.length > 0){
            throw new AppError('This category name already is in use', 400, 'CATEGORY_ALREADY_IN_USE')
        }

        const cleanedData = undefinedToNull(data)

        const category = await categoryRepository.createCategory(
            cleanedData.name,
            cleanedData.description,
            cleanedData.type
        )

        if(!category){
            throw new AppError('Internal server error', 500, 'INTERNAL_SERVER_ERROR')
        }

        return category
    }

    async updateCategory(
        id : string,
        data : updateCategoryDTO
    ){
        const categoryExists = await categoryRepository.findCategoryById(id)

        if(!categoryExists){
            throw new AppError('Category not found', 404, 'CATEGORY_NOT_FOUND')
        }

        const cleanedData = removeUndefined(data)

        if(cleanedData.name !== undefined){
            const categoryExists = await categoryRepository.findCategoryByName(cleanedData.name)

            if(categoryExists.length > 0){
                throw new AppError('This category name already is in use', 400, 'CATEGORY_ALREADY_IN_USE')
            }
        }

        const category = await categoryRepository.updateCategory(id, cleanedData)

        if(!category){
            throw new AppError('Internal server error', 500, 'INTERNAL_SERVER_ERROR')
        }

        return category
    }

    async findCategoriesByFilters(
        filters : findCategoryByFiltersDTO
    ){
        const cleanedFilters = removeUndefined(filters);

        const categories = await categoryRepository.findCategoriesByFilters(
            cleanedFilters.id,
            cleanedFilters.name,
            cleanedFilters.description,
            cleanedFilters.type,
            cleanedFilters.active
        )

        return categories
    }

    async deactivateCategoryById(id : string){
        const categoryExists = await categoryRepository.findCategoryById(id)

        if(!categoryExists){
            throw new AppError('Category not found', 404, 'CATEGORY_NOT_FOUND')
        }

        if(categoryExists.active === false){
            throw new AppError('Category already deactivated', 400, 'CATEGORY_ALREADY_DEACTIVATED')
        }

        const category = await categoryRepository.deactivateCategoryById(id)

        if(!category){
            throw new AppError('Internal server error', 500, 'INTERNAL_SERVER_ERROR')
        }

        return category
    }

    async findAllCategories(){
        const categories = await categoryRepository.findAllCategories()

        if(!categories){
            throw new AppError('Internal server error', 500, 'INTERNAL_SERVER_ERROR')
        }

        return categories
    }

    async activateCategoryById(id : string){
        const categoryExists = await categoryRepository.findCategoryById(id)

        if(!categoryExists){
            throw new AppError('Category not found', 404, 'CATEGORY_NOT_FOUND')
        }

        if(categoryExists.active === true){
            throw new AppError('Category already activated', 400, 'CATEGORY_ALREADY_ACTIVATED')
        }

        const category = await categoryRepository.activateCategoryById(id)

        if(!category){
            throw new AppError('Internal server error', 500, 'INTERNAL_SERVER_ERROR')
        }

        return category
    }
}

export default new CategoryService();