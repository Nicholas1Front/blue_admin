import { prisma } from '../../../shared/database/prisma.js';
import type { Prisma } from '../../../generated/prisma/client.js';

const SEED_PREFIX = 'TESTE BLUE ADMIN -';
const SEED_YEAR = 2026;
const completedMonth = new Date().getUTCFullYear() === SEED_YEAR
    ? new Date().getUTCMonth()
    : 12;

type SeedAttendance = {
    type: 'falta' | 'atraso';
    month: number;
    day: number;
    description: string;
};

type SeedEngagement = {
    role: string;
    modality: string;
    salary: number;
    entryDate: Date;
    exitDate: Date | null;
    status: string;
    months: number[];
    attendance?: SeedAttendance[];
    bonus?: { month: number; value: number };
    thirteenthMonths?: number;
    partialPayment?: { month: number; value: number };
};

type SeedEmployee = {
    name: string;
    document: string;
    address: string;
    birthDate: Date;
    observations: string;
    engagements: SeedEngagement[];
    termination?: {
        engagementIndex: number;
        title: string;
        referenceStart: Date;
        referenceEnd: Date;
        dueDate: Date;
        eventDate: Date;
        value: number;
        paid: boolean;
    };
    rehire?: boolean;
};

const employees: SeedEmployee[] = [
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
                attendance: [
                    { type: 'falta', month: 2, day: 12, description: 'Falta registrada para exemplo de histórico.' },
                    { type: 'atraso', month: 3, day: 4, description: 'Atraso registrado para exemplo de histórico.' },
                ],
            },
        ],
        termination: {
            engagementIndex: 0,
            title: 'Rescisão - Rafael Nascimento',
            referenceStart: dateOnly(SEED_YEAR, 1, 1),
            referenceEnd: dateOnly(SEED_YEAR, 8, 31),
            dueDate: dateOnly(SEED_YEAR, 9, 10),
            eventDate: dateOnly(SEED_YEAR, 8, 31),
            value: 9200,
            paid: false,
        },
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
                attendance: [
                    { type: 'atraso', month: 10, day: 21, description: 'Atraso registrado após a recontratação.' },
                ],
                bonus: { month: 7, value: 700 },
                thirteenthMonths: 7,
            },
        ],
        termination: {
            engagementIndex: 0,
            title: 'Rescisão quitada - vínculo anterior',
            referenceStart: dateOnly(SEED_YEAR, 1, 9),
            referenceEnd: dateOnly(SEED_YEAR, 4, 30),
            dueDate: dateOnly(SEED_YEAR, 5, 10),
            eventDate: dateOnly(SEED_YEAR, 4, 30),
            value: 6400,
            paid: true,
        },
        rehire: true,
    },
    {
        name: 'TESTE BLUE ADMIN - Bruno Ferreira',
        document: 'TESTE-EMP-003',
        address: 'Rua do Comércio, 315 - Cohama, São Luís/MA',
        birthDate: new Date('1995-12-02T00:00:00.000Z'),
        observations: 'Cadastro fictício com vínculo ativo e pagamento parcial de salário.',
        engagements: [
            {
                role: 'Eletricista de equipamentos',
                modality: 'PJ',
                salary: 3600,
                entryDate: dateOnly(SEED_YEAR, 1, 2),
                exitDate: null,
                status: 'trabalhando',
                months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
                attendance: [
                    { type: 'falta', month: 5, day: 14, description: 'Falta registrada para exemplo de histórico.' },
                    { type: 'atraso', month: 9, day: 2, description: 'Atraso registrado para exemplo de histórico.' },
                ],
                bonus: { month: 4, value: 500 },
                thirteenthMonths: 12,
                partialPayment: { month: 10, value: 3300 },
            },
        ],
    },
];

function dateOnly(year: number, month: number, day: number) {
    return new Date(Date.UTC(year, month - 1, day));
}

function monthStart(month: number) {
    return dateOnly(SEED_YEAR, month, 1);
}

function monthEnd(month: number) {
    return dateOnly(SEED_YEAR, month + 1, 0);
}

function salaryDueDate(month: number) {
    return dateOnly(SEED_YEAR, month + 1, 5);
}

function money(value: number) {
    return Number(value.toFixed(2));
}

async function findPreviousSeed() {
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

    const linkedToFinancialTransaction = seededEmployees.some(employee =>
        employee.engagements.some(engagement =>
            engagement.movements.some(movement => movement.financialTransactionId !== null)
        )
    );

    if (linkedToFinancialTransaction) {
        throw new Error(
            'Seed reset stopped: a TESTE BLUE ADMIN movement is linked to a financial transaction. Review it before resetting test data.'
        );
    }

    return seededEmployees;
}

async function cleanupPreviousSeed(
    tx: Prisma.TransactionClient,
    seededEmployees: Awaited<ReturnType<typeof findPreviousSeed>>,
) {
    if (seededEmployees.length === 0) return;

    const employeeIds = seededEmployees.map(employee => employee.id);
    const engagementIds = seededEmployees.flatMap(employee =>
        employee.engagements.map(engagement => engagement.id)
    );

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
        data: { employeeId, engagementId, eventType, description, metadata, eventDate },
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
    data: SeedEngagement,
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
        { seed: true, modality: data.modality, status: data.status, role: data.role, salary: data.salary },
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
    engagement: SeedEngagement,
) {
    for (const month of engagement.months) {
        const salary = engagement.salary;
        const dueDate = salaryDueDate(month);
        const paidValue = month <= completedMonth
            ? (engagement.partialPayment?.month === month
                ? engagement.partialPayment.value
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

async function createAttendance(
    tx: Prisma.TransactionClient,
    employeeId: string,
    engagementId: string,
    events: SeedAttendance[] = [],
) {
    for (const event of events) {
        await createMovement(tx, employeeId, engagementId, {
            type: event.type,
            description: event.description,
            eventDate: dateOnly(SEED_YEAR, event.month, event.day),
            value: null,
        });
    }
}

async function createBonus(
    tx: Prisma.TransactionClient,
    employeeId: string,
    engagementId: string,
    bonus: NonNullable<SeedEngagement['bonus']>,
) {
    const dueDate = monthEnd(bonus.month);
    const obligation = await createObligation(tx, employeeId, engagementId, {
        type: 'bonificacao',
        title: `Bonificação de desempenho - ${String(bonus.month).padStart(2, '0')}/${SEED_YEAR}`,
        description: 'Bonificação fictícia definida manualmente para demonstração.',
        referenceStart: monthStart(bonus.month),
        referenceEnd: monthEnd(bonus.month),
        dueDate,
        value: bonus.value,
        status: 'pago',
    });

    await createMovement(tx, employeeId, engagementId, {
        type: 'bonificacao',
        description: 'Bonificação de desempenho registrada.',
        eventDate: dueDate,
        value: bonus.value,
        obligationId: obligation.id,
        referenceStart: monthStart(bonus.month),
        referenceEnd: monthEnd(bonus.month),
    });
    await createMovement(tx, employeeId, engagementId, {
        type: 'pagamento',
        description: 'Pagamento da bonificação de desempenho.',
        eventDate: dueDate,
        value: bonus.value,
        obligationId: obligation.id,
        referenceStart: monthStart(bonus.month),
        referenceEnd: monthEnd(bonus.month),
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

    for (const installment of [
        { title: '1ª parcela', dueDate: dateOnly(SEED_YEAR, 11, 30), value: firstInstallment },
        { title: '2ª parcela', dueDate: dateOnly(SEED_YEAR, 12, 20), value: secondInstallment },
    ]) {
        await createObligation(tx, employeeId, engagementId, {
            type: 'decimo_terceiro',
            title: `Décimo terceiro - ${installment.title}/${SEED_YEAR}`,
            description: 'Valor ilustrativo do seed para testar competência e vencimento; não é cálculo legal automático.',
            referenceStart,
            referenceEnd,
            dueDate: installment.dueDate,
            value: installment.value,
            status: 'pendente',
        });
    }
}

async function createTermination(
    tx: Prisma.TransactionClient,
    employeeId: string,
    engagementId: string,
    data: NonNullable<SeedEmployee['termination']>,
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

async function seedEmployees() {
    const previousSeed = await findPreviousSeed();

    await prisma.$transaction(async tx => {
        await cleanupPreviousSeed(tx, previousSeed);

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

            const engagementIds: string[] = [];

            for (const engagementData of employeeData.engagements) {
                const engagement = await createEngagement(tx, employee.id, engagementData);
                engagementIds.push(engagement.id);

                await createSalaryYear(tx, employee.id, engagement.id, engagementData);
                await createAttendance(tx, employee.id, engagement.id, engagementData.attendance);

                if (engagementData.bonus) {
                    await createBonus(tx, employee.id, engagement.id, engagementData.bonus);
                }
                if (engagementData.thirteenthMonths) {
                    await createThirteenthInstallments(
                        tx,
                        employee.id,
                        engagement.id,
                        engagementData.salary,
                        engagementData.thirteenthMonths,
                    );
                }
            }

            if (employeeData.termination) {
                const engagementId = engagementIds[employeeData.termination.engagementIndex];
                if (!engagementId) throw new Error('Seed termination engagement was not created.');
                await createTermination(tx, employee.id, engagementId, employeeData.termination);
            }

            if (employeeData.rehire) {
                const previousEngagementId = engagementIds[0];
                const currentEngagementId = engagementIds[1];
                if (!previousEngagementId || !currentEngagementId) {
                    throw new Error('Seed rehire requires both previous and current engagements.');
                }

                await createHistory(
                    tx,
                    employee.id,
                    currentEngagementId,
                    'vinculo_recontratado',
                    'Funcionário fictício retornou à oficina após a rescisão anterior ter sido quitada.',
                    { seed: true, previousEngagementId, previousTerminationPaid: true },
                    dateOnly(SEED_YEAR, 6, 2),
                );
            }
        }
    }, { timeout: 30000 });

    if (previousSeed.length > 0) {
        console.log(`Seed anterior removido e recriado: ${previousSeed.length} funcionários fictícios.`);
    }
    console.log(`Seed anual concluído: ${employees.length} funcionários fictícios para ${SEED_YEAR}.`);
    console.log('Cenários: funcionário desligado com rescisão pendente; desligamento quitado e recontratação; vínculo ativo com pagamento parcial.');
    console.log('Os valores de rescisão e décimo terceiro são ilustrativos, não cálculos legais.');
}

seedEmployees()
    .catch(error => {
        console.error('Erro ao criar funcionários de teste:', error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
