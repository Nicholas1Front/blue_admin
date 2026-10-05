import {Request, Response} from 'express'
import equipamentsService from './equipaments.service.js'
import {AppError} from '../../shared/errors/AppError.js'
import {
    createEquipamentSchema,
    updateEquipamentSchema,
    findEquipamentsByFiltersSchema
} from './equipaments.schema.js'

class EquipamentsController{
    async createEquipament(
        req: Request,
        res : Response
    ){
        if(!req.user){
            throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED');
        }

        const data = createEquipamentSchema.parse(req.body);

        const equipament = await equipamentsService.createEquipament(
            req.params.clientId as string,
            data
        )

        return res.status(200).json({
            message : "Equipament created successfully",
            data : equipament
        })
    }

    async updateEquipament(
        req : Request,
        res : Response
    ){
        if(!req.user){
            throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED');
        }

        const data = updateEquipamentSchema.parse(req.body);

        const equipament = await equipamentsService.updateEquipament(
            req.params.id as string,
            data
        )

        return res.status(200).json({
            message : "Equipament updated successfully",
            data : equipament
        })
    }

    async findEquipamentsByFilters(
        req : Request,
        res : Response
    ){
        if(!req.user){
            throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED');
        }

        const data = findEquipamentsByFiltersSchema.parse(req.query);

        const equipament = await equipamentsService.findEquipamentsByFilters(
            data
        )

        return res.status(200).json({
            message : "Equipaments found successfully using filters",
            data : equipament
        })
    }

    async deleteEquipament(
        req : Request,
        res : Response
    ){
        if(!req.user){
            throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED');
        }

        await equipamentsService.deleteEquipamentById(req.params.id as string);

        return res.status(200).json({
            message : "Equipament deleted successfully"
        })
    }
}

export default new EquipamentsController();