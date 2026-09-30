import { prisma } from '../../../shared/database/prisma.js';

class ClientsContactsRepository {
    async createContact(
        clientId: string,
        name: string,
        email: string,
        phoneNumber: string
    ) {
        return prisma.clientContact.create({
            data: {
                clientId,
                name,
                email,
                phoneNumber
            }
        });
    }

    async findContactById(id: string) {
        return prisma.clientContact.findUnique({
            where: { id }
        });
    }

    async findContactsByClientId(clientId: string) {
        return prisma.clientContact.findMany({
            where: { clientId },
            orderBy: {
                name: 'asc'
            }
        });
    }

    async updateContact(
        id: string,
        data: {
            name?: string;
            email?: string;
            phoneNumber?: string;
        }
    ) {
        return prisma.clientContact.update({
            where: { id },
            data
        });
    }

    async deleteContactById(id: string) {
        await prisma.clientContact.delete({
            where: { id }
        });

        return true;
    }
}

export default new ClientsContactsRepository();
