import { AppError } from '../../../shared/errors/AppError.js'
import foldersRepository from './folders.repository.js'
import type { CreateFolderDTO, UpdateFolderDTO } from './folders.schema.js'

class FoldersService {
    private async ensureNameAvailable(name: string, currentId?: string) {
        const existing = await foldersRepository.findByName(name)
        if (existing && existing.id !== currentId) {
            throw new AppError('Folder name already exists', 409, 'FOLDER_NAME_ALREADY_EXISTS')
        }
    }

    async create(data: CreateFolderDTO, userId: string) {
        await this.ensureNameAvailable(data.name)
        return foldersRepository.create(data, userId)
    }

    async findAll() {
        return foldersRepository.findAll()
    }

    async findById(id: string) {
        const folder = await foldersRepository.findById(id)
        if (!folder) throw new AppError('Folder not found', 404, 'FOLDER_NOT_FOUND')
        return folder
    }

    async update(id: string, data: UpdateFolderDTO) {
        await this.findById(id)
        if (data.name !== undefined) await this.ensureNameAvailable(data.name, id)
        return foldersRepository.update(id, data)
    }

    async delete(id: string) {
        await this.findById(id)
        await foldersRepository.delete(id)
        return true
    }
}

export default new FoldersService()
