import { prisma } from '../../../shared/database/prisma.js';
import type { Prisma } from '../../../generated/prisma/client.js';

const SEED_PREFIX = 'TESTE BLUE ADMIN -';
const SEED_YEAR = 2026;
const currentDate = new Date();
const lastCompletedMonth = currentDate.getUTCFullYear() === SEED_YEAR
    ? currentDate.getUTCMonth()
    : 12;

const employees = [
    {
        name: 'TESTE BLUE ADMIN - Rafael Nascimento',
        document: 'TESTE-EMP-001',
        address: 'Rua das Máquinas, 101 - Distrito Industrial, São Luís/MA',
        birthDate: new Date('1992-04-18T00:00:00.000Z'),
        observations: 'Cadastro fictício para testes anuais do módulo Employees.',
        engagements: [
            {
                role: 'Mecânico de máquinas pesadas',
                modality: 'CLT',
                salary: 3200,
                entryDate: dateOnly(SEED_YEAR, 1, 5),
                exitDate: dateOnly(SEED_YEAR, 8, 31),
                status: 'demitido',
                months: [1, 2, 3, 4, 5, 6, 7, 8],
            },
        ],
    },
    {
        name: 'TESTE BLUE ADMIN - Mateus Carvalho',
        document: 'TESTE-EMP-002',
        address: 'Av. do Trabalho, 220 - Vila Industrial, São Luís/MA',
        birthDate: new Date('1988-09-07T00:00:00.000Z'),
        observations: 'Cadastro fictício com desligamento quitado e recontratação.',
        engagements: [
            {
                role: 'Auxiliar de mecânica',
                modality: 'CLT',
                salary: 2800,
                entryDate: dateOnly(SEED_YEAR, 1, 9),
                exitDate: dateOnly(SEED_YEAR, 4, 30),
                status: 'demitido',
                months: [1, 2, 3, 4],
            },
            {
                role: 'Auxiliar de mecânica',
                modality: 'CLT',
                salary: 3000,
                entryDate: dateOnly(SEED_YEAR, 6, 2),
                exitDate: null,
                status: 'trabalhando',
                months: [6, 7, 8, 9, 10, 11, 12],
            },
        ],
    },
    {
        name: 'TESTE BLUE ADMIN - Bruno Ferreira',
        document: 'TESTE-EMP-003',
        address: 'Rua do Comércio, 315 - Cohama, São Luís/MA',
        birthDate: new Date('1995-12-02T00:00:00.000Z'),
        observations: 'Cadastro fictício com vínculo ativo e pagamentos parcialmente alocados.',
        engagements: [
            {
                role: 'Eletricista de equipamentos',
                modality: 'PJ',
                salary: 3600,
                entryDate: dateOnly(SEED_YEAR, 1, 2),
                exitDate: null,
                status: 'trabalhando',
                months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
                partialMonth: 10,
                partialValue: 3300,
            },
        ],
    },
] as const;

function dateOnly(year: number, month: number, day: number) {
    return new Date(Date.UTC(year, month - 1, day));
}

function monthStart(month: number) {
    return dateOnly(SEED_YEAR, month, 1);
}

function monthEnd(month: number) {
    return dateOnly(SEED_YEAR, month + 1, 0);
}

function nextMonthDueDate(month: number) {
    return dateOnly(SEED_YEAR, month + 1, 5);
}

function money(value: number) {
    return Number(value.toFixed(2));
}

async function cleanupPreviousSeed() {
    const seededEmployees = await prisma.employee.findMany({
        where: { name: { startsWith: SEED_PREFIX } },
        select: {
            id: true,
            engagements: {
                select: {
                    id: true,
                    movements: { select: { financialTransactionId: true } },
                },
            },
        },
    });

    if (seededEmployees.length === 0) return;

    const engagementIds = seededEmployees.flatMap(employee =>
        employee.engagements.map(engagement => engagement.id)
    );
    const hasLinkedFinancialTransactions = seededEmployees.some(employee =>
        employee.engagements.some(engagement =>
            engagement.movements.some(movement => movement.financialTransactionId !== null)
        )
    );

    if (hasLinkedFinancialTransactions) {
        throw new Error(
            'Seed cleanup stopped: a TESTE BLUE ADMIN movement is linked to a financial transaction. Review it before resetting seed data.'
        );
    }

    const employeeIds = seededEmployees.map(employee => employee.id);

    await prisma.$transaction(async tx => {
        await tx.employeeMovement.deleteMany({
            where: { engagementId: { in: engagementIds } },
        });
        await tx.employeeObligation.deleteMany({
            where: { engagementId: { in: engagementIds } },
        });
        await tx.employeeHistory.deleteMany({
            where: { employeeId: { in: employeeIds } },
        });
        await tx.employeeEngagement.deleteMany({
            where: { id: { in: engagementIds } },
        });
        await tx.employee.deleteMany({
            where: { id: { in: employeeIds } },
        });
    });

    console.log(`Seed anterior removido: ${seededEmployees.length} funcionários fictícios.`);
}

async function createHistory(
    tx: Prisma.TransactionClient,
    employeeId: string,
    engagementId: string | null,
    eventType: string,
    description: string,
    metadata: Prisma.InputJsonValue,
    eventDate: Date,
) {
    await tx.employeeHistory.create({
        data: {
            employeeId,
            engagementId,
            eventType,
            description,
            metadata,
            eventDate,
        },
    });
}

async function createMovement(
    tx: Prisma.TransactionClient,
    employeeId: string,
    engagementId: string,
    data: {
        type: string;
        description: string;
        eventDate: Date;
        value: number | null;
        obligationId?: string | null;
        referenceStart?: Date | null;
        referenceEnd?: Date | null;
    },
) {
    const movement = await tx.employeeMovement.create({
        data: {
            engagementId,
            type: data.type,
            description: data.description,
            eventDate: data.eventDate,
            value: data.value,
            obligationId: data.obligationId ?? null,
            referenceStart: data.referenceStart ?? null,
            referenceEnd: data.referenceEnd ?? null,
            observations: SEED_PREFIX,
        },
    });

    await createHistory(
        tx,
        employeeId,
        engagementId,
        'movimento_registrado',
        `Movimentação fictícia registrada: ${movement.description}`,
        {
            seed: true,
            movementId: movement.id,
            type: movement.type,
            value: movement.value?.toString() ?? null,
            obligationId: movement.obligationId,
        },
        movement.eventDate ?? data.eventDate,
    );

    return movement;
}

async function createObligation(
    tx: Prisma.TransactionClient,
    employeeId: string,
    engagementId: string,
    data: {
        type: string;
        title: string;
        description: string;
        referenceStart?: Date | null;
        referenceEnd?: Date | null;
        dueDate: Date;
        value: number;
        status: string;
    },
) {
    const obligation = await tx.employeeObligation.create({
        data: {
            engagementId,
            type: data.type,
            title: data.title,
            description: data.description,
            referenceStart: data.referenceStart ?? null,
            referenceEnd: data.referenceEnd ?? null,
            dueDate: data.dueDate,
            originalValue: data.value,
            finalValue: data.value,
            status: data.status,
            observations: SEED_PREFIX,
        },
    });

    await createHistory(
        tx,
        employeeId,
        engagementId,
        'obrigacao_criada',
        `Obrigação fictícia criada: ${obligation.title}`,
        {
            seed: true,
            obligationId: obligation.id,
            type: obligation.type,
            value: obligation.finalValue.toString(),
            status: obligation.status,
        },
        obligation.createdAt,
    );

    return obligation;
}

async function createEngagement(
    tx: Prisma.TransactionClient,
    employeeId: string,
    data: {
        role: string;
        modality: string;
        salary: number;
        entryDate: Date;
        exitDate: Date | null;
        status: string;
    },
) {
    const engagement = await tx.employeeEngagement.create({
        data: {
            employeeId,
            entryDate: data.entryDate,
            exitDate: data.exitDate,
            status: data.status,
            currentSalary: data.salary,
            hourlyRate: money(data.salary / 30 / 8),
            modality: data.modality,
            observations: `Cargo fictício: ${data.role}. ${SEED_PREFIX}`,
        },
    });

    await createHistory(
        tx,
        employeeId,
        engagement.id,
        'vinculo_criado',
        `Vínculo fictício criado: ${data.role}`,
        {
            seed: true,
            modality: data.modality,
            status: data.status,
            role: data.role,
            salary: data.salary,
        },
        data.entryDate,
    );

    if (data.exitDate) {
        await createHistory(
            tx,
            employeeId,
            engagement.id,
            'vinculo_encerrado',
            'Vínculo fictício encerrado para demonstrar histórico de desligamento.',
            { seed: true, status: data.status, exitDate: data.exitDate.toISOString() },
            data.exitDate,
        );
    }

    return engagement;
}

async function createSalaryYear(
    tx: Prisma.TransactionClient,
    employeeId: string,
    engagementId: string,
    engagement: typeof employees[number]['engagements'][number],
) {
    for (const month of engagement.months) {
        const salary = engagement.salary;
        const dueDate = nextMonthDueDate(month);
        const paidValue = month <= lastCompletedMonth
            ? ('partialMonth' in engagement && engagement.partialMonth === month
                ? engagement.partialValue
                : salary)
            : 0;
        const status = paidValue >= salary ? 'pago' : paidValue > 0 ? 'parcial' : 'pendente';
        const obligation = await createObligation(tx, employeeId, engagementId, {
            type: 'salario',
            title: `Salário - ${String(month).padStart(2, '0')}/${SEED_YEAR}`,
            description: 'Competência mensal fictícia para testar pagamentos, saldo e vencimento.',
            referenceStart: monthStart(month),
            referenceEnd: monthEnd(month),
            dueDate,
            value: salary,
            status,
        });

        if (paidValue > 0) {
            await createMovement(tx, employeeId, engagementId, {
                type: 'pagamento',
                description: `Pagamento de salário - competência ${String(month).padStart(2, '0')}/${SEED_YEAR}`,
                eventDate: dueDate,
                value: paidValue,
                obligationId: obligation.id,
                referenceStart: monthStart(month),
                referenceEnd: monthEnd(month),
            });
        }
    }
}

async function createPaidBonus(
    tx: Prisma.TransactionClient,
    employeeId: string,
    engagementId: string,
    month: number,
    value: number,
) {
    const dueDate = dateOnly(SEED_YEAR, month, 30);
    const obligation = await createObligation(tx, employeeId, engagementId, {
        type: 'bonificacao',
        title: `Bonificação de desempenho - ${String(month).padStart(2, '0')}/${SEED_YEAR}`,
        description: 'Bonificação fictícia definida manualmente para demonstração.',
        referenceStart: monthStart(month),
        referenceEnd: monthEnd(month),
        dueDate,
        value,
        status: 'pago',
    });

    await createMovement(tx, employeeId, engagementId, {
        type: 'bonificacao',
        description: 'Bonificação de desempenho registrada.',
        eventDate: dueDate,
        value,
        obligationId: obligation.id,
        referenceStart: monthStart(month),
        referenceEnd: monthEnd(month),
    });
    await createMovement(tx, employeeId, engagementId, {
        type: 'pagamento',
        description: 'Pagamento da bonificação de desempenho.',
        eventDate: dueDate,
        value,
        obligationId: obligation.id,
        referenceStart: monthStart(month),
        referenceEnd: monthEnd(month),
    });
}

async function createThirteenthInstallments(
    tx: Prisma.TransactionClient,
    employeeId: string,
    engagementId: string,
    salary: number,
    eligibleMonths: number,
) {
    const totalValue = money(salary * eligibleMonths / 12);
    const firstInstallment = money(totalValue / 2);
    const secondInstallment = money(totalValue - firstInstallment);
    const referenceStart = dateOnly(SEED_YEAR, 1, 1);
    const referenceEnd = dateOnly(SEED_YEAR, 12, 31);

    await createObligation(tx, employeeId, engagementId, {
        type: 'decimo_terceiro',
        title: `Décimo terceiro - 1ª parcela/${SEED_YEAR}`,
        description: 'Valor ilustrativo do seed para testar competência e vencimento; não é cálculo legal automático.',
        referenceStart,
        referenceEnd,
        dueDate: dateOnly(SEED_YEAR, 11, 30),
        value: firstInstallment,
        status: 'pendente',
    });
    await createObligation(tx, employeeId, engagementId, {
        type: 'decimo_terceiro',
        title: `Décimo terceiro - 2ª parcela/${SEED_YEAR}`,
        description: 'Valor ilustrativo do seed para testar competência e vencimento; não é cálculo legal automático.',
        referenceStart,
        referenceEnd,
        dueDate: dateOnly(SEED_YEAR, 12, 20),
        value: secondInstallment,
        status: 'pendente',
    });
}

async function createTermination(
    tx: Prisma.TransactionClient,
    employeeId: string,
    engagementId: string,
    data: {
        title: string;
        referenceStart: Date;
        referenceEnd: Date;
        dueDate: Date;
        value: number;
        paid: boolean;
        eventDate: Date;
    },
) {
    const obligation = await createObligation(tx, employeeId, engagementId, {
        type: 'rescisao',
        title: data.title,
        description: 'Valor de rescisão fictício definido manualmente para demonstrar o fluxo; não é cálculo legal automático.',
        referenceStart: data.referenceStart,
        referenceEnd: data.referenceEnd,
        dueDate: data.dueDate,
        value: data.value,
        status: data.paid ? 'pago' : 'pendente',
    });

    await createMovement(tx, employeeId, engagementId, {
        type: 'rescisao',
        description: 'Rescisão registrada no encerramento do vínculo.',
        eventDate: data.eventDate,
        value: data.value,
        obligationId: obligation.id,
        referenceStart: data.referenceStart,
        referenceEnd: data.referenceEnd,
    });

    if (data.paid) {
        await createMovement(tx, employeeId, engagementId, {
            type: 'pagamento',
            description: 'Pagamento integral da obrigação de rescisão.',
            eventDate: data.dueDate,
            value: data.value,
            obligationId: obligation.id,
            referenceStart: data.referenceStart,
            referenceEnd: data.referenceEnd,
        });
    }
}

async function createAttendanceMovements(
    tx: Prisma.TransactionClient,
    employeeId: string,
    engagementId: string,
    events: Array<{ type: 'falta' | 'atraso'; date: Date; description: string }>,
) {
    for (const event of events) {
        await createMovement(tx, employeeId, engagementId, {
            type: event.type,
            description: event.description,
            eventDate: event.date,
            value: null,
        });
    }
}

async function seedEmployees() {
    await cleanupPreviousSeed();

    await prisma.$transaction(async tx => {
        for (const employeeData of employees) {
            const employee = await tx.employee.create({
                data: {
                    name: employeeData.name,
                    document: employeeData.document,
                    address: employeeData.address,
                    birthDate: employeeData.birthDate,
                    observations: employeeData.observations,
                },
            });

            await createHistory(
                tx,
                employee.id,
                null,
                'funcionario_cadastrado',
                'Funcionário fictício cadastrado pelo seed anual.',
                { seed: true, document: employeeData.document },
                dateOnly(SEED_YEAR, 1, 1),
            );

            const engagements: Array<{ id: string; salary: number; entryDate: Date; exitDate: Date | null; months: readonly number[] }> = [];

            for (const engagementData of employeeData.engagements) {
                const engagement = await createEngagement(tx, employee.id, engagementData);
                engagements.push({
                    id: engagement.id,
                    salary: engagementData.salary,
                    entryDate: engagementData.entryDate,
                    exitDate: engagementData.exitDate,
                    months: engagementData.months,
                });

                await createSalaryYear(tx, employee.id, engagement.id, engagementData);

                if (employeeData.document === 'TESTE-EMP-001') {
                    await createAttendanceMovements(tx, employee.id, engagement.id, [
                        { type: 'falta', date: dateOnly(SEED_YEAR, 2, 12), description: 'Falta registrada para exemplo de histórico.' },
                        { type: 'atraso', date: dateOnly(SEED_YEAR, 3, 4), description: 'Atraso registrado para exemplo de histórico.' },
                    ]);
                }

                if (employeeData.document === 'TESTE-EMP-002' && engagementData.entryDate.getUTCMonth() === 5) {
                    await createAttendanceMovements(tx, employee.id, engagement.id, [
                        { type: 'atraso', date: dateOnly(SEED_YEAR, 10, 21), description: 'Atraso registrado após a recontratação.' },
                    ]);
                    await createPaidBonus(tx, employee.id, engagement.id, 7, 700);
                    await createThirteenthInstallments(tx, employee.id, engagement.id, engagementData.salary, 7);
                }

                if (employeeData.document === 'TESTE-EMP-003') {
                    await createAttendanceMovements(tx, employee.id, engagement.id, [
                        { type: 'falta', date: dateOnly(SEED_YEAR, 5, 14), description: 'Falta registrada para exemplo de histórico.' },
                        { type: 'atraso', date: dateOnly(SEED_YEAR, 9, 2), description: 'Atraso registrado para exemplo de histórico.' },
                    ]);
                    await createPaidBonus(tx, employee.id, engagement.id, 4, 500);
                    await createThirteenthInstallments(tx, employee.id, engagement.id, engagementData.salary, 12);
                }
            }

            if (employeeData.document === 'TESTE-EMP-001') {
                const firstEngagement = engagements[0];
                if (!firstEngagement) throw new Error('Expected first employee engagement was not created.');

                await createTermination(tx, employee.id, firstEngagement.id, {
                    title: 'Rescisão - Rafael Nascimento',
                    referenceStart: dateOnly(SEED_YEAR, 1, 1),
                    referenceEnd: dateOnly(SEED_YEAR, 8, 31),
                    dueDate: dateOnly(SEED_YEAR, 9, 10),
                    value: 9200,
                    paid: false,
                    eventDate: dateOnly(SEED_YEAR, 8, 31),
                });
            }

            if (employeeData.document === 'TESTE-EMP-002') {
                const firstEngagement = engagements[0];
                if (!firstEngagement) throw new Error('Expected previous engagement was not created.');

                await createTermination(tx, employee.id, firstEngagement.id, {
                    title: 'Rescisão quitada - vínculo anterior',
                    referenceStart: dateOnly(SEED_YEAR, 1, 9),
                    referenceEnd: dateOnly(SEED_YEAR, 4, 30),
                    dueDate: dateOnly(SEED_YEAR, 5, 10),
                    value: 6400,
                    paid: true,
                    eventDate: dateOnly(SEED_YEAR, 4, 30),
                });

                const secondEngagement = engagements[1];
                if (!secondEngagement) throw new Error('Expected re-hired engagement was not created.');

                await createHistory(
                    tx,
                    employee.id,
                    secondEngagement.id,
                    'vinculo_recontratado',
                    'Funcionário fictício retornou à oficina após a rescisão anterior ter sido quitada.',
                    {
                        seed: true,
                        previousEngagementId: firstEngagement.id,
                        previousTerminationPaid: true,
                    },
                    dateOnly(SEED_YEAR, 6, 2),
                );
            }
        }
    }, { timeout: 30000 });

    console.log(`Seed anual concluído: ${employees.length} funcionários fictícios para ${SEED_YEAR}.`);
    console.log('Cenários: funcionário desligado com rescisão pendente; desligamento quitado e recontratação; vínculo ativo com pagamento parcial.');
    console.log('Os valores de rescisão e décimo terceiro são ilustrativos, não cálculos legais.');
    console.log('Ao executar novamente, registros TESTE BLUE ADMIN anteriores serão removidos e recriados.');
}

seedEmployees()
    .catch(error => {
        console.error('Erro ao criar funcionários de teste:', error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
