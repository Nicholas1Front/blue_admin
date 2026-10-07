import {prisma} from '../../../shared/database/prisma.js';

class CategoryRepository{
    async createCategory(
        name : string,
        description : string | null,
        type : any
    ){
        const category = await prisma.financialCategory.create({
            data : {
                name : name,
                description : description,
                type : type,
                active : true
            }
        })

        return category
    }

    async updateCategory(
        id : string,
        data : any
    ){
        const category = await prisma.financialCategory.update({
            where : { id },
            data
        })

        return category
    }

    async findCategoryById(id : string){
        return prisma.financialCategory.findUnique({
            where : { id }
        })
    }

    async findCategoryByName( name : string){
        return prisma.financialCategory.findMany({
            where : { name }
        })
    }

    async findCategoriesByFilters(
        id : string | undefined,
        name : string | undefined,
        description : string | null | undefined,
        type : any | undefined,
        active : boolean | undefined
    ){
        const categories = await prisma.financialCategory.findMany({
            where : {
                ...(id !== undefined && {
                    id : {
                        contains : id,
                        mode : 'insensitive'
                    }
                }),
                ...(name !== undefined && {
                    name : {
                        contains : name,
                        mode : 'insensitive'
                    }
                }),
                ...(description !== undefined && (
                    description === null
                        ? { description : null }
                        : {
                            description : {
                                contains : description,
                                mode : 'insensitive'
                            }
                        }
                )),
                ...(type !== undefined && {
                    type : type
                }),
                ...(active !== undefined && {
                    active : active
                })
            }
        })

        return categories
    }

    async findAllCategories(){
        return prisma.financialCategory.findMany()
    }

    async deactivateCategoryById(
        id : string
    ){
        const category = await prisma.financialCategory.update({
            where : { id },
            data : {
                active : false
            }
        })

        return category
    }

    async activateCategoryById(
        id : string
    ){
        const category = await prisma.financialCategory.update({
            where : { id },
            data : {
                active : true
            }
        })

        return category
    }
}

export default new CategoryRepository();