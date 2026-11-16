import type { Request, Response } from 'express'
import { AppError } from '../../shared/errors/AppError.js'
import {
    createEmployeeSchema,
    updateEmployeeSchema
} from './employees.schema.js'
import employeesService from './employees.service.js'

class EmployeesController {
    async createEmployee(req: Request, res: Response) {
        if (!req.user) throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED')

        const data = createEmployeeSchema.parse(req.body)
        const employee = await employeesService.createEmployee(data)

        return res.status(201).json({
            message: 'Employee created successfully',
            data: employee
        })
    }

    async updateEmployee(req: Request, res: Response) {
        if (!req.user) throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED')

        const data = updateEmployeeSchema.parse(req.body)
        const employee = await employeesService.updateEmployee(req.params.id as string, data)

        return res.status(200).json({
            message: 'Employee updated successfully',
            data: employee
        })
    }

    async findEmployeeById(req: Request, res: Response) {
        if (!req.user) throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED')

        const employee = await employeesService.findEmployeeById(req.params.id as string)
        return res.status(200).json({
            message: 'Employee found successfully',
            data: employee
        })
    }
}

export default new EmployeesController()
