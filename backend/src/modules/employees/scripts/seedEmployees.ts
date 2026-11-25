import { prisma } from '../../../shared/database/prisma.js';

const SEED_PREFIX = 'TESTE BLUE ADMIN -';

const employees = [
    {
        name: 'TESTE BLUE ADMIN - Rafael Nascimento',
        document: 'TESTE-EMP-001',
        address: 'Rua das Máquinas, 101 - Distrito Industrial, São Luís/MA',
        birthDate: new Date('1992-04-18T00:00:00.000Z'),
        role: 'Mecânico de máquinas pesadas',
        modality: 'CLT',
        salary: 3200,
        entryDate: new Date('2021-03-15T00:00:00.000Z'),
        notes: 'Cadastro fictício para testes do módulo Employees.',
        salaryPaid: 3200,
        absence: false,
        bonus: 350
    },
    {
        name: 'TESTE BLUE ADMIN - Mateus Carvalho',
        document: 'TESTE-EMP-002',
        address: 'Av. do Trabalho, 220 - Vila Industrial, São Luís/MA',
        birthDate: new Date('1988-09-07T00:00:00.000Z'),
        role: 'Auxiliar de mecânica',
        modality: 'CLT',
        salary: 2100,
        entryDate: new Date('2023-01-09T00:00:00.000Z'),
        notes: 'Cadastro fictício para testes do módulo Employees.',
        salaryPaid: 1500,
        absence: true,
        bonus: 0
    },
    {
        name: 'TESTE BLUE ADMIN - Bruno Ferreira',
        document: 'TESTE-EMP-003',
        address: 'Rua do Comércio, 315 - Cohama, São Luís/MA',
        birthDate: new Date('1995-12-02T00:00:00.000Z'),
        role: 'Eletricista de equipamentos',
        modality: 'PJ',
        salary: 4100,
        entryDate: new Date('2022-06-01T00:00:00.000Z'),
        notes: 'Cadastro fictício para testes do módulo Employees.',
        salaryPaid: 4100,
        absence: false,
        bonus: 0
    },
    {
        name: 'TESTE BLUE ADMIN - Diego Sousa',
        document: 'TESTE-EMP-004',
        address: 'Travessa das Oficinas, 44 - Anil, São Luís/MA',
        birthDate: new Date('1990-02-25T00:00:00.000Z'),
        role: 'Operador e apoio de oficina',
        modality: 'Informal',
        salary: 2600,
        entryDate: new Date('2024-02-12T00:00:00.000Z'),
        notes: 'Cadastro fictício para testes do módulo Employees.',
        salaryPaid: 2600,
        absence: false,
        bonus: 0
    },
    {
        name: 'TESTE BLUE ADMIN - André Lima',
        document: 'TESTE-EMP-005',
        address: 'Rua da Manutenção, 508 - Maiobão, Paço do Lumiar/MA',
        birthDate: new Date('1998-07-14T00:00:00.000Z'),
        role: 'Assistente administrativo',
        modality: 'CLT',
        salary: 2400,
        entryDate: new Date('2025-05-05T00:00:00.000Z'),
        notes: 'Cadastro fictício para testes do módulo Employees.',
        salaryPaid: 2400,
        absence: false,
        bonus: 0
    }
] as const;

const dateOnly = (year: number, month: number, day: number) =>
    new Date(Date.UTC(year, month - 1, day));

async function seedEmployee(employeeData: typeof employees[number]) {
    const existing = await prisma.employee.findFirst({
        where: { name: employeeData.name },
        select: { id: true }
    });

    if (existing) {
        console.log(`Funcionário de teste já existe; ignorado: ${employeeData.name}`);
        return false;
    }

    await prisma.$transaction(async tx => {
        const employee = await tx.employee.create({
            data: {
                name: employeeData.name,
                document: employeeData.document,
                address: employeeData.address,
                birthDate: employeeData.birthDate,
                observations: employeeData.notes
            }
        });

        const engagement = await tx.employeeEngagement.create({
            data: {
                employeeId: employee.id,
                entryDate: employeeData.entryDate,
                status: 'trabalhando',
                currentSalary: employeeData.salary,
                hourlyRate: Number((employeeData.salary / 30 / 8).toFixed(2)),
                modality: employeeData.modality,
                observations: `Cargo de teste: ${employeeData.role}. ${SEED_PREFIX} vínculo fictício.`
            }
        });

        const octoberSalary = await tx.employeeObligation.create({
            data: {
                engagementId: engagement.id,
                type: 'salario',
                title: 'Salário - Outubro/2026',
                description: 'Competência mensal fictícia para validar pagamentos e saldo.',
                referenceStart: dateOnly(2026, 10, 1),
                referenceEnd: dateOnly(2026, 10, 31),
                dueDate: dateOnly(2026, 11, 5),
                originalValue: employeeData.salary,
                finalValue: employeeData.salary,
                status: employeeData.salaryPaid < employeeData.salary ? 'parcial' : 'pago',
                observations: SEED_PREFIX
            }
        });

        const novemberSalary = await tx.employeeObligation.create({
            data: {
                engagementId: engagement.id,
                type: 'salario',
                title: 'Salário - Novembro/2026',
                description: 'Competência mensal fictícia pendente para testar listagem.',
                referenceStart: dateOnly(2026, 11, 1),
                referenceEnd: dateOnly(2026, 11, 30),
                dueDate: dateOnly(2026, 12, 5),
                originalValue: employeeData.salary,
                finalValue: employeeData.salary,
                status: 'pendente',
                observations: SEED_PREFIX
            }
        });

        const bonusObligation = employeeData.bonus > 0
            ? await tx.employeeObligation.create({
                data: {
                    engagementId: engagement.id,
                    type: 'bonificacao',
                    title: 'Bonificação de desempenho - Teste',
                    description: 'Obrigação fictícia vinculada ao movimento de bonificação.',
                    dueDate: dateOnly(2026, 11, 30),
                    originalValue: employeeData.bonus,
                    finalValue: employeeData.bonus,
                    status: 'pendente',
                    observations: SEED_PREFIX
                }
            })
            : null;

        const vacationObligation = await tx.employeeObligation.create({
            data: {
                engagementId: engagement.id,
                type: 'ferias',
                title: 'Férias - período de teste',
                description: 'Registro de férias fictício, sem cálculo automático.',
                referenceStart: dateOnly(2026, 12, 1),
                referenceEnd: dateOnly(2026, 12, 30),
                dueDate: dateOnly(2026, 11, 30),
                originalValue: Number((employeeData.salary * 1.3333).toFixed(2)),
                finalValue: Number((employeeData.salary * 1.3333).toFixed(2)),
                status: 'em_revisao',
                observations: 'Valor ilustrativo, não representa cálculo legal. ' + SEED_PREFIX
            }
        });

        const thirteenthObligation = await tx.employeeObligation.create({
            data: {
                engagementId: engagement.id,
                type: 'decimo_terceiro',
                title: 'Décimo terceiro - período de teste',
                description: 'Registro fictício para testar competência e status.',
                referenceStart: dateOnly(2026, 1, 1),
                referenceEnd: dateOnly(2026, 12, 31),
                dueDate: dateOnly(2026, 12, 20),
                originalValue: employeeData.salary,
                finalValue: employeeData.salary,
                status: 'pendente',
                observations: 'Valor ilustrativo, não representa cálculo legal. ' + SEED_PREFIX
            }
        });

        const movementRows = [
            {
                type: 'pagamento',
                description: 'Pagamento parcial/total do salário de Outubro/2026',
                eventDate: dateOnly(2026, 11, 5),
                value: employeeData.salaryPaid,
                obligationId: octoberSalary.id,
                observations: 'Movimento fictício sem transação financeira vinculada. ' + SEED_PREFIX
            },
            ...(employeeData.absence ? [{
                type: 'falta',
                description: 'Falta registrada - exemplo de teste',
                eventDate: dateOnly(2026, 11, 12),
                value: 120,
                obligationId: null,
                observations: 'Valor ilustrativo; nenhuma dedução automática foi aplicada. ' + SEED_PREFIX
            }] : []),
            ...(bonusObligation ? [{
                type: 'bonificacao',
                description: 'Bonificação registrada para teste',
                eventDate: dateOnly(2026, 11, 20),
                value: employeeData.bonus,
                obligationId: bonusObligation.id,
                observations: SEED_PREFIX
            }] : []),
            {
                type: 'anotacao',
                description: 'Registro de rotina da oficina - teste',
                eventDate: dateOnly(2026, 11, 18),
                value: null,
                obligationId: null,
                observations: 'Anotação fictícia para testar histórico de movimentações. ' + SEED_PREFIX
            }
        ];

        for (const movement of movementRows) {
            const createdMovement = await tx.employeeMovement.create({
                data: {
                    engagementId: engagement.id,
                    type: movement.type,
                    description: movement.description,
                    eventDate: movement.eventDate,
                    value: movement.value,
                    obligationId: movement.obligationId,
                    observations: movement.observations
                }
            });

            await tx.employeeHistory.create({
                data: {
                    employeeId: employee.id,
                    engagementId: engagement.id,
                    eventType: 'movimento_registrado',
                    description: `Movimento de teste registrado: ${createdMovement.description}`,
                    metadata: {
                        movementId: createdMovement.id,
                        type: createdMovement.type,
                        value: createdMovement.value?.toString() ?? null,
                        obligationId: createdMovement.obligationId
                    },
                    eventDate: createdMovement.eventDate
                }
            });
        }

        await tx.employeeHistory.createMany({
            data: [
                {
                    employeeId: employee.id,
                    eventType: 'funcionario_cadastrado',
                    description: 'Funcionário fictício cadastrado pelo seed de teste.',
                    metadata: { seed: true, document: employeeData.document },
                    eventDate: new Date()
                },
                {
                    employeeId: employee.id,
                    engagementId: engagement.id,
                    eventType: 'vinculo_criado',
                    description: 'Vínculo fictício criado pelo seed de teste.',
                    metadata: {
                        modality: engagement.modality,
                        status: engagement.status,
                        role: employeeData.role,
                        salary: employeeData.salary
                    },
                    eventDate: engagement.entryDate
                },
                ...[
                    octoberSalary,
                    novemberSalary,
                    ...(bonusObligation ? [bonusObligation] : []),
                    vacationObligation,
                    thirteenthObligation
                ].map(obligation => ({
                    employeeId: employee.id,
                    engagementId: engagement.id,
                    eventType: 'obrigacao_criada',
                    description: `Obrigação de teste criada: ${obligation.title}`,
                    metadata: {
                        obligationId: obligation.id,
                        type: obligation.type,
                        originalValue: obligation.originalValue.toString(),
                        finalValue: obligation.finalValue.toString(),
                        status: obligation.status
                    },
                    eventDate: obligation.createdAt
                }))
            ]
        });
    });

    console.log(`Funcionário de teste criado: ${employeeData.name}`);
    return true;
}

async function seedEmployees() {
    let created = 0;
    let reused = 0;

    for (const employee of employees) {
        if (await seedEmployee(employee)) created++;
        else reused++;
    }

    console.log(`\nSeed concluído. Criados: ${created}; já existentes/ignorados: ${reused}.`);
    console.log('Todos os registros são fictícios e identificados como dados de teste.');
}

seedEmployees()
    .catch(error => {
        console.error('Erro ao criar funcionários de teste:', error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
