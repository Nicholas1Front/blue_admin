import {Request, Response} from 'express';
import {AppError} from '../../../shared/errors/AppError.js';
import queriesService from './queries.service.js';
import {monthlySummaryQuerySchema, yearlySummaryQuerySchema} from './queries.schema.js';

class QueriesController {
    async findMonthlySummary(req : Request, res : Response){
        if(!req.user){
            throw new AppError(
                'User not authenticated',
                401,
                'USER_NOT_AUTHENTICATED'
            );
        }

        const filters = monthlySummaryQuerySchema.parse(req.query);
        const summary = await queriesService.findMonthlySummary(filters);

        return res.status(200).json({
            message : 'Monthly financial summary found successfully',
            data : summary
        });
    }
    
    async findYearlySummary(req : Request, res : Response){
        if(!req.user){
            throw new AppError(
                'User not authenticated',
                401,
                'USER_NOT_AUTHENTICATED'
            );
        }

        const filters = yearlySummaryQuerySchema.parse(req.query);
        const summary = await queriesService.findYearlySummary(filters.year);

        return res.status(200).json({
            message : 'Yearly financial summary found successfully',
            data : summary
        });
    }
}

export default new QueriesController();
