import {prisma} from '../../../shared/database/prisma.js';

const CLIENT_PREFIX = 'TESTE QUERIES -';
const EQUIPMENT_PREFIX = 'TESTE-QRY-';
const FINANCIAL_TRANSACTION_PREFIX = 'TESTE RESUMO MENSAL';
const SERVICE_HISTORY_MARKER = 'TESTE QUERIES - SERVIÇO';
const ACTIVITY_PREFIX = 'TESTE QUERIES - ATIVIDADE';

const serviceStatuses = [
    'pendente',
    'aguardando_resposta_cliente',
    'cancelado',
    'aguardando_peças',
    'em_execução',
    'finalizado',
    'equipamento_saiu',
    'aguardando_pagamento',
    'pagamento_atrasado',
    'pagamento_recebido'
] as const;

const activityStatuses = [
    'pendente',
    'em_execução',
    'concluida',
    'cancelada'
] as const;

const activityTemplates = [
    {title: 'Inspeção inicial', description: 'Inspeção visual, leitura de falhas e avaliação inicial do equipamento.'},
    {title: 'Diagnóstico técnico', description: 'Verificação dos sistemas e identificação da causa provável.'},
    {title: 'Reparo mecânico', description: 'Execução dos reparos necessários conforme o diagnóstico.'},
    {title: 'Teste operacional', description: 'Teste funcional e conferência dos itens revisados.'}
] as const;

type TestService = {
    id: string;
    clientId: string;
    equipamentId: string;
    entryDate: Date;
    exitDate: Date | null;
    status: string;
    hoursWorked: number | null;
    costPerHour: number | null;
    titheTransactionId: string | null;
};

function roundMoney(value: number){
    return Math.round((value + Number.EPSILON) * 100) / 100;
}

function serviceKey(year: number, month: number){
    return `${SERVICE_HISTORY_MARKER} ${year}-${String(month).padStart(2, '0')}`;
}

function getDateForService(year: number, monthIndex: number, day: number){
    return new Date(Date.UTC(year, monthIndex, day, 12, 0, 0));
}

function getExitDate(entryDate: Date, index: number){
    if(index % 5 === 0){
        return null;
    }

    const exitDate = new Date(entryDate);
    exitDate.setUTCDate(exitDate.getUTCDate() + 1 + (index % 12));
    return exitDate;
}

function getServiceStatus(index: number, exitDate: Date | null){
    if(exitDate === null){
        const openStatuses = [
            'pendente',
            'aguardando_resposta_cliente',
            'aguardando_peças',
            'em_execução',
            'aguardando_pagamento',
            'pagamento_atrasado'
        ] as const;

        return openStatuses[index % openStatuses.length]!;
    }

    return serviceStatuses[index % serviceStatuses.length]!;
}

async function createOrReuseService(data: {
    key: string;
    clientId: string;
    equipamentId: string;
    entryDate: Date;
    exitDate: Date | null;
    status: string;
    hoursWorked: number | null;
    costPerHour: number | null;
    titheStatus: string;
}): Promise<TestService>{
    const existing = await prisma.service.findFirst({
        where: {
            history: {
                some: {
                    eventType: 'service_created',
                    description: data.key
                }
            }
        }
    });

    if(existing){
        const service = await prisma.service.update({
            where: {id: existing.id},
            data: {
                clientId: data.clientId,
                equipamentId: data.equipamentId,
                entryDate: data.entryDate,
                exitDate: data.exitDate,
                status: data.status,
                ...(existing.titheTransactionId === null && {
                    hoursWorked: data.hoursWorked,
                    costPerHour: data.costPerHour
                })
            }
        });

        return {
            ...service,
            hoursWorked: service.hoursWorked === null ? null : Number(service.hoursWorked),
            costPerHour: service.costPerHour === null ? null : Number(service.costPerHour)
        };
    }

    const service = await prisma.$transaction(async tx => {
        const createdService = await tx.service.create({
            data: {
                clientId: data.clientId,
                equipamentId: data.equipamentId,
                entryDate: data.entryDate,
                exitDate: data.exitDate,
                status: data.status,
                hoursWorked: data.hoursWorked,
                costPerHour: data.costPerHour,
                titheStatus: data.titheStatus,
                titheTransactionId: null
            }
        });

        await tx.serviceHistory.create({
            data: {
                serviceId: createdService.id,
                eventType: 'service_created',
                description: data.key,
                createdAt: data.entryDate
            }
        });

        return createdService;
    });

    return {
        ...service,
        hoursWorked: service.hoursWorked === null ? null : Number(service.hoursWorked),
        costPerHour: service.costPerHour === null ? null : Number(service.costPerHour)
    };
}

async function createActivitiesAndHistory(service: TestService, serviceIndex: number, key: string){
    for(let activityIndex = 0; activityIndex < activityTemplates.length; activityIndex++){
        const template = activityTemplates[activityIndex]!;
        const title = `${ACTIVITY_PREFIX} ${key} - ${template.title}`;
        const existingActivity = await prisma.serviceActivity.findFirst({
            where: {
                serviceId: service.id,
                title
            }
        });

        if(!existingActivity){
            const proposedStartAt = new Date(service.entryDate);
            proposedStartAt.setUTCDate(proposedStartAt.getUTCDate() + activityIndex);
            proposedStartAt.setUTCHours(12, 0, 0, 0);

            const boundedStartAt = service.exitDate !== null && proposedStartAt > service.exitDate
                ? new Date(service.exitDate)
                : proposedStartAt;

            const startAt = activityIndex === 0 && serviceIndex % 4 === 0
                ? null
                : boundedStartAt;

            const proposedEndAt = startAt === null
                ? null
                : new Date(startAt.getTime() + (1 + activityIndex) * 60 * 60 * 1000);

            const endAt = proposedEndAt === null || (activityIndex === 3 && serviceIndex % 3 === 0)
                ? null
                : service.exitDate !== null && proposedEndAt > service.exitDate
                    ? new Date(service.exitDate)
                    : proposedEndAt;

            await prisma.$transaction(async tx => {
                await tx.serviceActivity.create({
                    data: {
                        serviceId: service.id,
                        title,
                        description: template.description,
                        startAt,
                        endAt,
                        status: activityStatuses[(serviceIndex + activityIndex) % activityStatuses.length]!,
                        createdAt: startAt ?? service.entryDate
                    }
                });

                await tx.serviceHistory.create({
                    data: {
                        serviceId: service.id,
                        eventType: 'activity_created',
                        description: `Activity created: ${title}`,
                        createdAt: startAt ?? service.entryDate
                    }
                });
            });
        }
    }

    if(serviceIndex % 3 === 0){
        const historyDescription = `TESTE QUERIES - Histórico complementar - ${key}`;
        const existingHistory = await prisma.serviceHistory.findFirst({
            where: {
                serviceId: service.id,
                description: historyDescription
            }
        });

        if(!existingHistory){
            await prisma.serviceHistory.create({
                data: {
                    serviceId: service.id,
                    eventType: serviceIndex % 2 === 0 ? 'service_status_updated' : 'service_updated',
                    description: historyDescription,
                    createdAt: new Date(service.entryDate.getTime() + 2 * 24 * 60 * 60 * 1000)
                }
            });
        }
    }
}

async function linkDirectTransactions(service: TestService, year: number, month: number){
    const currentTransactions = await prisma.financialTransaction.findMany({
        where: {
            originType: 'services',
            originId: service.id
        },
        select: {type: true}
    });

    const counts = {
        income: currentTransactions.filter(transaction => transaction.type === 'income').length,
        expense: currentTransactions.filter(transaction => transaction.type === 'expense').length
    };

    for(const type of ['income', 'expense'] as const){
        let missing = Math.max(0, 2 - counts[type]);
        if(missing === 0){
            continue;
        }

        const candidates = await prisma.financialTransaction.findMany({
            where: {
                description: {startsWith: FINANCIAL_TRANSACTION_PREFIX},
                type,
                originId: null,
                originType: null,
                referenceDate: {
                    gte: new Date(Date.UTC(year, month - 1, 1)),
                    lt: new Date(Date.UTC(year, month, 1))
                }
            },
            orderBy: [
                {referenceDate: 'asc'},
                {createdAt: 'asc'},
                {id: 'asc'}
            ],
            take: missing
        });

        for(const candidate of candidates){
            const linked = await prisma.$transaction(async tx => {
                const result = await tx.financialTransaction.updateMany({
                    where: {
                        id: candidate.id,
                        originId: null,
                        originType: null
                    },
                    data: {
                        originId: service.id,
                        originType: 'services'
                    }
                });

                if(result.count !== 1){
                    return false;
                }

                await tx.serviceHistory.create({
                    data: {
                        serviceId: service.id,
                        eventType: 'transaction_linked',
                        description: `TESTE QUERIES - Lançamento financeiro vinculado: ${candidate.id}`,
                        createdAt: candidate.referenceDate
                    }
                });

                return true;
            });

            if(linked){
                counts[type]++;
                missing--;
            }
        }
    }
}

async function linkTithe(service: TestService, year: number, month: number){
    const currentService = await prisma.service.findUnique({
        where: {id: service.id},
        include: {
            titheTransaction: {select: {id: true}}
        }
    });

    if(!currentService || currentService.titheTransactionId !== null){
        return false;
    }

    const [directTransactions, activeExpenses] = await Promise.all([
        prisma.financialTransaction.findMany({
            where: {
                originType: 'services',
                originId: service.id
            },
            select: {type: true, value: true}
        }),
        prisma.monthlyExpense.findMany({
            where: {active: true},
            select: {expectedValue: true}
        })
    ]);

    const incomeTotal = roundMoney(directTransactions
        .filter(transaction => transaction.type === 'income')
        .reduce((sum, transaction) => sum + Number(transaction.value), 0));

    const expenseTotal = roundMoney(directTransactions
        .filter(transaction => transaction.type === 'expense')
        .reduce((sum, transaction) => sum + Number(transaction.value), 0));

    const operationalCost = service.hoursWorked !== null && service.costPerHour !== null
        ? roundMoney(service.hoursWorked * service.costPerHour)
        : 0;

    const titheBase = operationalCost > 0 && expenseTotal > 0
        ? incomeTotal - expenseTotal - operationalCost
        : incomeTotal;

    const titheValue = Math.max(0, roundMoney(titheBase / 10));

    if(titheValue <= 0){
        console.log(`Dízimo não vinculado ao serviço ${service.id}: base de cálculo sem valor positivo.`);
        return false;
    }

    const candidate = await prisma.financialTransaction.findFirst({
        where: {
            description: {startsWith: FINANCIAL_TRANSACTION_PREFIX},
            type: 'expense',
            originId: null,
            originType: null,
            referenceDate: {
                gte: new Date(Date.UTC(year, month - 1, 1)),
                lt: new Date(Date.UTC(year, month, 1))
            }
        },
        orderBy: [
            {referenceDate: 'asc'},
            {createdAt: 'asc'},
            {id: 'asc'}
        ]
    });

    if(!candidate){
        return false;
    }

    const result = await prisma.$transaction(async tx => {
        const transactionUpdate = await tx.financialTransaction.updateMany({
            where: {
                id: candidate.id,
                originId: null,
                originType: null
            },
            data: {
                description: `TESTE QUERIES - DÍZIMO - ${year}-${String(month).padStart(2, '0')}`,
                value: titheValue,
                originId: service.id,
                originType: 'service_tithe'
            }
        });

        if(transactionUpdate.count !== 1){
            return false;
        }

        const serviceUpdate = await tx.service.updateMany({
            where: {
                id: service.id,
                titheTransactionId: null
            },
            data: {
                titheTransactionId: candidate.id,
                titheStatus: 'concluído'
            }
        });

        if(serviceUpdate.count !== 1){
            throw new Error('O serviço mudou durante o vínculo do dízimo; a transação foi revertida.');
        }

        await tx.serviceHistory.create({
            data: {
                serviceId: service.id,
                eventType: 'tithe_paid',
                description: `TESTE QUERIES - Dízimo vinculado - transação: ${candidate.id}; valor: ${titheValue.toFixed(2)}`,
                createdAt: candidate.referenceDate
            }
        });

        return true;
    });

    if(result){
        console.log(`Dízimo vinculado ao serviço ${service.id}: R$ ${titheValue.toFixed(2)}.`);
    }

    return result;
}

async function createServices(){
    const currentYear = new Date().getFullYear();

    const [clients, equipaments, activeExpenses] = await Promise.all([
        prisma.client.findMany({
            where: {name: {startsWith: CLIENT_PREFIX}},
            select: {id: true, name: true}
        }),
        prisma.equipament.findMany({
            where: {mainIdentification: {startsWith: EQUIPMENT_PREFIX}},
            select: {id: true, clientId: true, mainIdentification: true}
        }),
        prisma.monthlyExpense.findMany({
            where: {active: true},
            select: {expectedValue: true}
        })
    ]);

    if(clients.length === 0 || equipaments.length === 0){
        throw new Error('Clientes ou equipamentos de teste não encontrados. Execute primeiro npm run seed:services:clients e npm run seed:services:equipaments.');
    }

    const costPerHour = activeExpenses.length > 0
        ? roundMoney(activeExpenses.reduce((sum, expense) => sum + Number(expense.expectedValue), 0) / 240)
        : null;

    if(costPerHour === null){
        console.warn('Aviso: não há despesas mensais ativas. Os serviços serão criados com costPerHour nulo para não inventar um custo operacional.');
    }

    const equipamentsByClient = new Map<string, typeof equipaments>();
    for(const equipament of equipaments){
        const clientEquipaments = equipamentsByClient.get(equipament.clientId) ?? [];
        clientEquipaments.push(equipament);
        equipamentsByClient.set(equipament.clientId, clientEquipaments);
    }

    const orderedClients = [...clients].sort((a, b) => a.name.localeCompare(b.name));
    const createdServices: TestService[] = [];
    let created = 0;
    let reused = 0;

    for(let yearOffset = 0; yearOffset < 3; yearOffset++){
        const year = currentYear - 2 + yearOffset;

        for(let month = 1; month <= 12; month++){
            const index = yearOffset * 12 + month - 1;
            const client = orderedClients[index % orderedClients.length]!;
            const clientEquipaments = equipamentsByClient.get(client.id) ?? [];

            if(clientEquipaments.length === 0){
                throw new Error(`Nenhum equipamento de teste associado ao cliente ${client.name}.`);
            }

            const equipament = clientEquipaments[index % clientEquipaments.length]!;
            const entryDate = getDateForService(year, month - 1, 3 + (index % 24));
            const exitDate = getExitDate(entryDate, index);
            const key = serviceKey(year, month);
            const hoursWorked = index % 7 === 0 ? null : [2.5, 4, 6.5, 8, 10, 12, 16][index % 7]!;
            const titheStatus = index % 4 === 0 ? 'não concluído' : 'aguardando';

            const existing = await prisma.service.findFirst({
                where: {
                    history: {
                        some: {
                            eventType: 'service_created',
                            description: key
                        }
                    }
                }
            });

            const service = await createOrReuseService({
                key,
                clientId: client.id,
                equipamentId: equipament.id,
                entryDate,
                exitDate,
                status: getServiceStatus(index, exitDate),
                hoursWorked,
                costPerHour,
                titheStatus
            });

            if(existing){
                reused++;
            }else{
                created++;
            }

            createdServices.push(service);
            await createActivitiesAndHistory(service, index, key);
        }
    }

    let linkedDirect = 0;
    let linkedTithes = 0;

    for(const service of createdServices){
        const year = service.entryDate.getUTCFullYear();
        const month = service.entryDate.getUTCMonth() + 1;

        if(year === currentYear){
            await linkDirectTransactions(service, year, month);
            if(month % 3 === 0 && await linkTithe(service, year, month)){
                linkedTithes++;
            }
        }
    }

    linkedDirect = await prisma.financialTransaction.count({
        where: {
            originType: 'services',
            originId: {in: createdServices.map(service => service.id)},
            description: {startsWith: FINANCIAL_TRANSACTION_PREFIX}
        }
    });

    const activityCount = await prisma.serviceActivity.count({
        where: {
            serviceId: {in: createdServices.map(service => service.id)},
            title: {startsWith: ACTIVITY_PREFIX}
        }
    });

    const historyCount = await prisma.serviceHistory.count({
        where: {
            serviceId: {in: createdServices.map(service => service.id)}
        }
    });

    console.log('\nConcluído: conjunto fictício de serviços preparado.');
    console.log(`Serviços criados: ${created}; reutilizados: ${reused}; total preparado: ${createdServices.length}.`);
    console.log(`Atividades de teste: ${activityCount}; eventos de histórico dos serviços: ${historyCount}.`);
    console.log(`Lançamentos financeiros de teste atualmente vinculados como serviços: ${linkedDirect}.`);
    console.log(`Dízimos vinculados nesta execução: ${linkedTithes}.`);
    console.log('Somente transações com descrição iniciada por "TESTE RESUMO MENSAL" e sem origem foram consideradas para vínculo.');
    console.log('Nenhum cliente, equipamento, serviço ou lançamento financeiro fora do conjunto de teste foi removido.');

    const availableSeedTransactions = await prisma.financialTransaction.count({
        where: {
            description: {startsWith: FINANCIAL_TRANSACTION_PREFIX},
            originId: null,
            originType: null
        }
    });

    if(availableSeedTransactions === 0){
        console.warn('Não há lançamentos fictícios livres para novos vínculos. Para preparar transações, execute primeiro npm run seed:financial:categories e npm run seed:financial:transactions.');
    }
}

createServices()
    .catch(error => {
        console.error('Erro ao criar serviços fictícios para teste:', error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
