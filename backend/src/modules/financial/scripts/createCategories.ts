import {prisma} from '../../../shared/database/prisma.js';

const categories = [
    {
        name : 'Serviços prestados',
        description : 'Receitas provenientes de serviços realizados',
        type : 'income'
    },
    {
        name : 'Venda de peças',
        description : 'Receitas com venda de peças e materiais',
        type : 'income'
    },
    {
        name : 'Mão de obra',
        description : 'Receitas de mão de obra da oficina',
        type : 'income'
    },
    {
        name : 'Outras receitas',
        description : 'Receitas diversas',
        type : 'income'
    },
    {
        name : 'Peças e materiais',
        description : 'Compra de peças e materiais utilizados nos serviços',
        type : 'expense'
    },
    {
        name : 'Ferramentas e equipamentos',
        description : 'Compra e manutenção de ferramentas e equipamentos',
        type : 'expense'
    },
    {
        name : 'Despesas operacionais',
        description : 'Despesas gerais de operação da oficina',
        type : 'expense'
    },
    {
        name : 'Contas e serviços',
        description : 'Contas recorrentes e serviços contratados',
        type : 'expense'
    }
] as const;

async function createCategories(){
    let created = 0;
    let reused = 0;

    for(const category of categories){
        const existingCategory = await prisma.financialCategory.findFirst({
            where : {
                name : category.name,
                type : category.type
            }
        });

        if(existingCategory){
            reused++;
            console.log(`Categoria já existente, reutilizada: ${category.name}`);
            continue;
        }

        await prisma.financialCategory.create({
            data : {
                ...category,
                active : true
            }
        });

        created++;
        console.log(`Categoria criada: ${category.name}`);
    }

    console.log(`\nConcluído. Criadas: ${created}; reutilizadas: ${reused}.`);
}

createCategories()
    .catch(error => {
        console.error('Erro ao criar categorias de teste:', error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
