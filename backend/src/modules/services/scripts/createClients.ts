import {prisma} from '../../../shared/database/prisma.js';

const CLIENT_PREFIX = 'TESTE QUERIES -';

const clients = [
    {name: 'Transportadora Horizonte', document: '91000000000001', address: 'Av. Industrial, 1200 - Fortaleza/CE', contactName: 'Marcos Almeida', phoneNumber: '85990001001'},
    {name: 'Logística São Miguel', document: '91000000000002', address: 'Rua dos Expedicionários, 240 - Caucaia/CE', contactName: 'Renata Costa', phoneNumber: '85990001002'},
    {name: 'Agropecuária Vale Verde', document: '91000000000003', address: 'Rodovia CE-040, km 18 - Eusébio/CE', contactName: 'Paulo Mendes', phoneNumber: '85990001003'},
    {name: 'Construções Pedra Forte', document: '91000000000004', address: 'Rua das Oficinas, 85 - Maracanaú/CE', contactName: 'Luciana Rocha', phoneNumber: '85990001004'},
    {name: 'Distribuidora Nordeste', document: '91000000000005', address: 'Av. Contorno, 550 - Itaitinga/CE', contactName: 'André Ribeiro', phoneNumber: '85990001005'},
    {name: 'Transvale Cargas', document: '91000000000006', address: 'Rua do Porto, 410 - Fortaleza/CE', contactName: 'Camila Freitas', phoneNumber: '85990001006'},
    {name: 'Mineração Serra Azul', document: '91000000000007', address: 'Estrada da Mina, 70 - Pacatuba/CE', contactName: 'Roberto Lima', phoneNumber: '85990001007'},
    {name: 'Serviços Municipais Ceará', document: '91000000000008', address: 'Rua Central, 100 - Aquiraz/CE', contactName: 'Juliana Nogueira', phoneNumber: '85990001008'}
] as const;

async function createClients(){
    let created = 0;
    let reused = 0;

    for(const [index, clientData] of clients.entries()){
        const name = `${CLIENT_PREFIX} ${clientData.name}`;
        const existing = await prisma.client.findFirst({where: {name}});

        if(existing){
            await prisma.client.update({
                where: {id: existing.id},
                data: {
                    document: clientData.document,
                    address: clientData.address
                }
            });

            const contact = await prisma.clientContact.findFirst({
                where: {clientId: existing.id, name: clientData.contactName}
            });

            if(!contact){
                await prisma.clientContact.create({
                    data: {
                        clientId: existing.id,
                        name: clientData.contactName,
                        phoneNumber: clientData.phoneNumber,
                        email: `contato${index + 1}@teste-blue-admin.local`
                    }
                });
            }

            reused++;
            console.log(`Cliente de teste reutilizado: ${name}`);
            continue;
        }

        await prisma.client.create({
            data: {
                name,
                document: clientData.document,
                address: clientData.address,
                contacts: {
                    create: {
                        name: clientData.contactName,
                        phoneNumber: clientData.phoneNumber,
                        email: `contato${index + 1}@teste-blue-admin.local`
                    }
                }
            }
        });

        created++;
        console.log(`Cliente de teste criado: ${name}`);
    }

    console.log(`\nConcluído. Criados: ${created}; reutilizados: ${reused}. Nenhum cliente fora do prefixo de teste foi alterado.`);
}

createClients()
    .catch(error => {
        console.error('Erro ao criar clientes de teste:', error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
