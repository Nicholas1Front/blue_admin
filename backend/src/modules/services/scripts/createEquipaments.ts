import {prisma} from '../../../shared/database/prisma.js';

const CLIENT_PREFIX = 'TESTE QUERIES -';

const equipaments = [
    {clientName: 'Transportadora Horizonte', type: 'Caminhão', brand: 'Volvo', model: 'FH 460', mainIdentification: 'TESTE-QRY-TRK-001', additionalIdentification: 'Frota HZ-01'},
    {clientName: 'Transportadora Horizonte', type: 'Caminhão', brand: 'Scania', model: 'R 450', mainIdentification: 'TESTE-QRY-TRK-002', additionalIdentification: 'Frota HZ-02'},
    {clientName: 'Logística São Miguel', type: 'Cavalo mecânico', brand: 'Mercedes-Benz', model: 'Actros 2651', mainIdentification: 'TESTE-QRY-TRK-003', additionalIdentification: 'Frota SM-01'},
    {clientName: 'Logística São Miguel', type: 'Semirreboque', brand: 'Randon', model: 'Graneleiro 3 eixos', mainIdentification: 'TESTE-QRY-TRL-001', additionalIdentification: 'Frota SM-02'},
    {clientName: 'Agropecuária Vale Verde', type: 'Trator', brand: 'John Deere', model: '6190J', mainIdentification: 'TESTE-QRY-AGR-001', additionalIdentification: 'Patrimônio VV-01'},
    {clientName: 'Agropecuária Vale Verde', type: 'Caminhão', brand: 'Ford', model: 'Cargo 2429', mainIdentification: 'TESTE-QRY-TRK-004', additionalIdentification: 'Frota VV-02'},
    {clientName: 'Construções Pedra Forte', type: 'Caminhão basculante', brand: 'Volkswagen', model: '31.280', mainIdentification: 'TESTE-QRY-TRK-005', additionalIdentification: 'Frota PF-01'},
    {clientName: 'Construções Pedra Forte', type: 'Escavadeira', brand: 'Caterpillar', model: '320D', mainIdentification: 'TESTE-QRY-MCH-001', additionalIdentification: 'Patrimônio PF-02'},
    {clientName: 'Distribuidora Nordeste', type: 'Caminhão', brand: 'Iveco', model: 'Tector 240E30', mainIdentification: 'TESTE-QRY-TRK-006', additionalIdentification: 'Frota DN-01'},
    {clientName: 'Distribuidora Nordeste', type: 'Caminhão', brand: 'DAF', model: 'CF 85', mainIdentification: 'TESTE-QRY-TRK-007', additionalIdentification: 'Frota DN-02'},
    {clientName: 'Transvale Cargas', type: 'Caminhão', brand: 'Mercedes-Benz', model: 'Axor 2544', mainIdentification: 'TESTE-QRY-TRK-008', additionalIdentification: 'Frota TV-01'},
    {clientName: 'Transvale Cargas', type: 'Semirreboque', brand: 'Facchini', model: 'Baú 3 eixos', mainIdentification: 'TESTE-QRY-TRL-002', additionalIdentification: 'Frota TV-02'},
    {clientName: 'Mineração Serra Azul', type: 'Caminhão fora de estrada', brand: 'Volvo', model: 'FMX 500', mainIdentification: 'TESTE-QRY-TRK-009', additionalIdentification: 'Frota SA-01'},
    {clientName: 'Mineração Serra Azul', type: 'Pá carregadeira', brand: 'Caterpillar', model: '950H', mainIdentification: 'TESTE-QRY-MCH-002', additionalIdentification: 'Patrimônio SA-02'},
    {clientName: 'Serviços Municipais Ceará', type: 'Caminhão compactador', brand: 'Iveco', model: 'Tector 170E', mainIdentification: 'TESTE-QRY-TRK-010', additionalIdentification: 'Frota MC-01'},
    {clientName: 'Serviços Municipais Ceará', type: 'Caminhão-pipa', brand: 'Volkswagen', model: '26.280', mainIdentification: 'TESTE-QRY-TRK-011', additionalIdentification: 'Frota MC-02'}
] as const;

async function createEquipaments(){
    const clients = await prisma.client.findMany({
        where: {name: {startsWith: CLIENT_PREFIX}},
        select: {id: true, name: true}
    });

    const clientByName = new Map(clients.map(client => [
        client.name.slice(CLIENT_PREFIX.length + 1),
        client
    ] as const));

    let created = 0;
    let reused = 0;

    for(const data of equipaments){
        const client = clientByName.get(data.clientName);

        if(!client){
            throw new Error(`Cliente de teste não encontrado: ${CLIENT_PREFIX} ${data.clientName}. Execute primeiro npm run seed:services:clients.`);
        }

        const existing = await prisma.equipament.findFirst({
            where: {
                clientId: client.id,
                mainIdentification: data.mainIdentification
            }
        });

        const equipamentData = {
            clientId: client.id,
            type: data.type,
            brand: data.brand,
            model: data.model,
            mainIdentification: data.mainIdentification,
            additionalIdentification: data.additionalIdentification
        };

        if(existing){
            await prisma.equipament.update({
                where: {id: existing.id},
                data: equipamentData
            });
            reused++;
            console.log(`Equipamento de teste reutilizado: ${data.mainIdentification}`);
            continue;
        }

        await prisma.equipament.create({data: equipamentData});
        created++;
        console.log(`Equipamento de teste criado: ${data.mainIdentification}`);
    }

    console.log(`\nConcluído. Criados: ${created}; reutilizados: ${reused}. Nenhum equipamento fora do conjunto de teste foi alterado.`);
}

createEquipaments()
    .catch(error => {
        console.error('Erro ao criar equipamentos de teste:', error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
