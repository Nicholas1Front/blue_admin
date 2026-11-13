import { Request, Response } from 'express'
import { AppError } from '../../shared/errors/AppError.js'
import employeesService from './employees.service.js'
import { atualizarColaboradorSchema, criarColaboradorSchema } from './employees.schema.js'

class EmployeesController {
    async create(req: Request, res: Response) {
        if (!req.user) throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED')
        const data = criarColaboradorSchema.parse(req.body)
        const employee = await employeesService.create(data, req.user.id)
        return res.status(201).json({ message: 'Employee created successfully', data: employee })
    }

    async update(req: Request, res: Response) {
        if (!req.user) throw new AppError('User not authenticated', 401, 'USER_NOT_AUTHENTICATED')
        const data = atualizarColaboradorSchema.parse(req.body)
        const employee = await employeesService.update(req.params.id as string, data, req.user.id)
        return res.status(200).json({ message: 'Employee updated successfully', data: employee })
    }
}

export default new EmployeesController()
