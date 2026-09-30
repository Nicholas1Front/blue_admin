import { prisma } from '../../shared/database/prisma.js';

class ClientsRepository {
    async createClient(
        name: string,
        document: string,
        address: string
    ) {
        return prisma.client.create({
            data: {
                name,
                document,
                address
            }
        });
    }

    async findClientById(id: string) {
        return prisma.client.findUnique({
            where: { id }
        });
    }

    async findAllClients() {
        return prisma.client.findMany({
            orderBy: {
                name: 'asc'
            }
        });
    }

    async findClientByFilters(
        id?: string,
        name?: string,
        document?: string
    ) {
        return prisma.client.findMany({
            where: {
                ...(id !== undefined && { id }),
                ...(name !== undefined && { name }),
                ...(document !== undefined && { document })
            },
            orderBy: {
                name: 'asc'
            }
        });
    }

    async updateClient(
        id: string,
        data: {
            name?: string;
            document?: string;
            address?: string;
        }
    ) {
        return prisma.client.update({
            where: { id },
            data
        });
    }

    async deleteClientById(id: string) {
        await prisma.client.delete({
            where: { id }
        });

        return true;
    }
}

export default new ClientsRepository();
