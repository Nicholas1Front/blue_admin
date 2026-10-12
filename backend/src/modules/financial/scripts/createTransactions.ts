import {prisma} from '../../../shared/database/prisma.js';

const transactionOriginType = 'blue_admin_test_seed';
const categoriesOriginPrefix = 'monthly-summary';

function getYearArgument(){
    const year = Number(process.argv[2] ?? new Date().getFullYear());

    if(!Number.isInteger(year) || year < 1 || year > 9999){
        throw new Error('Informe um ano válido. Exemplo: npm run seed:financial:transactions -- 2026');
    }

    return year;
}

function randomInteger(min : number, max : number){
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomValue(min : number, max : number){
    return Math.round((min + Math.random() * (max - min)) * 100) / 100;
}

async function createTransactions(){
    const year = getYearArgument();

    const [incomeCategories, expenseCategories] = await Promise.all([
        prisma.financialCategory.findMany({
            where : {
                type : 'income',
                active : true
            }
        }),
        prisma.financialCategory.findMany({
            where : {
                type : 'expense',
                active : true
            }
        })
    ]);

    if(incomeCategories.length === 0 || expenseCategories.length === 0){
        throw new Error(
            'Não existem categorias ativas dos dois tipos. Execute primeiro o script de criação de categorias.'
        );
    }

    const originIdPrefix = `${categoriesOriginPrefix}-${year}-`;

    const removed = await prisma.financialTransaction.deleteMany({
        where : {
            originType : transactionOriginType,
            originId : {
                startsWith : originIdPrefix
            }
        }
    });

    if(removed.count > 0){
        console.log(`Removidos ${removed.count} lançamentos de teste anteriores do ano ${year}.`);
    }

    const transactions = [];

    for(let month = 1; month <= 12; month++){
        const monthlyTypes = [
            ...Array.from({length : 6}, () => 'income' as const),
            ...Array.from({length : 6}, () => 'expense' as const)
        ];

        for(let index = monthlyTypes.length - 1; index > 0; index--){
            const swapIndex = randomInteger(0, index);
            [monthlyTypes[index], monthlyTypes[swapIndex]] = [
                monthlyTypes[swapIndex]!,
                monthlyTypes[index]!
            ];
        }

        for(let index = 0; index < monthlyTypes.length; index++){
            const type = monthlyTypes[index];
            const category = type === 'income'
                ? incomeCategories[randomInteger(0, incomeCategories.length - 1)]
                : expenseCategories[randomInteger(0, expenseCategories.length - 1)];

            if(!category){
                throw new Error('Não foi possível selecionar uma categoria para o lançamento.');
            }

            const day = randomInteger(1, 28);
            const referenceDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
            const value = type === 'income'
                ? randomValue(250, 4500)
                : randomValue(50, 2200);

            transactions.push({
                description : `TESTE RESUMO MENSAL ${year}-${String(month).padStart(2, '0')} - lançamento ${String(index + 1).padStart(2, '0')}`,
                value,
                type : category.type,
                categoryId : category.id,
                referenceDate,
                originType : transactionOriginType,
                originId : `${originIdPrefix}${String(month).padStart(2, '0')}-${String(index + 1).padStart(2, '0')}`
            });
        }
    }

    const result = await prisma.financialTransaction.createMany({
        data : transactions
    });

    console.log(`Concluído. Criados ${result.count} lançamentos de teste para ${year} (12 por mês: 6 entradas e 6 saídas).`);
    console.log('Os lançamentos foram identificados com originType "blue_admin_test_seed".');
}

createTransactions()
    .catch(error => {
        console.error('Erro ao criar transações de teste:', error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
