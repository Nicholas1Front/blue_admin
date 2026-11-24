import type { Request, Response } from 'express'
import { AppError } from '../../../shared/errors/AppError.js'
import employeesQueriesService from './queries.service.js'
import { employeeOverviewQuerySchema } from './queries.schema.js'

class EmployeesQueriesController {
    async findEmployeeOverview(req: Request, res: Response) {
        if (!req.user) throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED')

        const query = employeeOverviewQuerySchema.parse(req.query)
        const overview = await employeesQueriesService.findEmployeeOverview(
            req.params.employeeId as string,
            query
        )

        return res.status(200).json({
            message: 'Employee overview found successfully',
            data: overview
        })
    }
}

export default new EmployeesQueriesController()
