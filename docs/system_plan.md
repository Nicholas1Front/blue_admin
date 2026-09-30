# Blue Admin — System Scratch

> Documento vivo de arquitetura, regras e ideias do sistema.
>
> Não é uma especificação definitiva. Ele registra o que estamos imaginando, as decisões arquiteturais e os pontos que ainda precisam ser discutidos antes de virar código.

---

# 1. Objetivo

O Blue Admin será um sistema interno de gestão para uma empresa/oficina.

A ideia é deixar de ser apenas uma coleção de CRUDs e concentrar:

- clientes;
- equipamentos;
- serviços;
- orçamentos;
- funcionários;
- financeiro / fluxo de caixa;
- agenda e anotações;
- notificações;
- informações e consultas para dashboards.

Vários módulos terão relacionamento entre si. A arquitetura precisa permitir essas relações sem transformar o backend em uma grande cadeia de services dependentes.

---

# 2. Stack

## Backend

- Node.js
- Express
- TypeScript
- PostgreSQL
- Prisma ORM
- JWT
- bcrypt
- Zod
- Pino / pino-http
- Helmet
- CORS
- express-rate-limit

## Frontend

- React
- Vite
- TypeScript
- React Router
- Axios
- Zod
- React Hook Form
- Font Awesome

## Desenvolvimento e infraestrutura

- Docker / Docker Compose para desenvolvimento local
- PostgreSQL em container durante desenvolvimento
- Neon Database para produção
- Render para hospedagem planejada do backend
- GitHub para versionamento

---

# 3. Organização

A aplicação será organizada por módulos de domínio.

    backend/
    └── src/
        ├── modules/
        │   ├── auth/
        │   ├── users/
        │   ├── clients/
        │   ├── equipments/
        │   ├── services/
        │   ├── budgets/
        │   ├── employees/
        │   ├── financial/
        │   ├── agenda/
        │   ├── notifications/
        │   └── notes/
        │
        ├── shared/
        │   ├── database/
        │   ├── errors/
        │   ├── logger/
        │   ├── middleware/
        │   └── ...
        │
        ├── routes/
        ├── app.ts
        └── server.ts

A estrutura básica de cada módulo continuará simples:

    module/
    ├── controller
    ├── service
    ├── repository
    ├── routes
    ├── schema
    ├── dto
    └── types

Quando um módulo realmente precisar de responsabilidades adicionais, poderemos adicionar:

    module/
    ├── use-cases/
    └── queries/

Não vamos criar camadas apenas por estética.

---

# 4. Service, Use Case e Query

Até aqui muitos services seguiram uma ideia parecida com:

    await otherService.something();
    await otherService.update();

Isso continua sendo válido quando a relação é simples.

O Blue Admin terá processos mais complexos, por exemplo:

    criar serviço
    ├── verificar/criar cliente
    ├── verificar/criar equipamento
    ├── criar dados do serviço
    ├── eventualmente gerar orçamento
    └── eventualmente gerar movimentações financeiras

Não queremos transformar isso em:

    serviceService
      ↓
    clientService
      ↓
    equipmentService
      ↓
    financialService
      ↓
    budgetService

porque os módulos começariam a conhecer demais uns aos outros.

## 4.1 Service

O service concentra as operações e regras próprias daquele domínio.

Exemplo:

    services.service.ts

    createService()
    updateService()
    deleteService()
    getService()

## 4.2 Use Case

Um use case representa uma operação de negócio que coordena uma sequência de ações.

Exemplo:

    CreateServiceFromBudget

Pode:

1. validar o orçamento;
2. verificar os dados necessários;
3. criar o serviço;
4. relacionar cliente/equipamentos;
5. registrar as relações necessárias.

O use case coordena o processo sem transformar um service em uma classe gigante.

## 4.3 Query

Uma query existe quando a necessidade não é simplesmente buscar uma entidade.

Exemplo normal:

    getServiceById()

Exemplos de queries específicas:

    getServiceDashboard()
    getAnnualServiceEvolution()
    getServiceFinancialSummary()
    getRecentFinishedServices()

Uma query pode juntar várias tabelas, fazer agregações e retornar exatamente os dados necessários para uma tela.

---

# 5. Regra arquitetural principal

Uma relação no banco não significa automaticamente uma dependência de código.

Podemos ter:

    Service
      ├── Client
      ├── Equipment
      ├── Budget
      └── Financial

sem precisar fazer:

    serviceService → clientService → equipmentService → financialService

O banco representa os relacionamentos dos dados.

Services, use cases e queries representam responsabilidades do código.

---

# 6. Domínios

Domínios centrais:

    clients
    equipments
    services
    budgets
    employees
    financial

Domínios de suporte:

    agenda
    notifications
    notes

Auth, Users e Shared fazem parte da base atual do sistema.

---

# 7. Clients

## Responsabilidade

Gerenciar os clientes da empresa.

Um cliente poderá ser:

- pessoa física;
- pessoa jurídica;
- eventualmente não identificado em determinadas situações de serviço.

## Relacionamentos

Clientes poderão estar relacionados a:

- equipamentos;
- serviços;
- orçamentos;
- possivelmente outros documentos.

## Ainda precisamos definir

- campos definitivos;
- contatos;
- CPF/CNPJ;
- endereço;
- regras de exclusão;
- possibilidade de cliente não identificado.

---

# 8. Equipments

## Responsabilidade

Gerenciar os equipamentos pertencentes ou relacionados aos clientes.

Informações imaginadas:

- tipo;
- marca;
- modelo;
- placa;
- identificação/frota;
- cliente responsável.

Um equipamento poderá aparecer em:

- serviços;
- orçamentos;
- histórico do cliente;
- futuramente outros módulos.

Um serviço poderá possuir um ou mais equipamentos.

Relação inicialmente imaginada:

    client 1 ─── N equipment
    service N ─── N equipment
    budget N ─── N equipment

A modelagem definitiva será discutida antes do Prisma schema.

---

# 9. Services

Este é um dos módulos centrais.

Um serviço poderá possuir:

- cliente;
- um ou mais equipamentos;
- status;
- data de entrada;
- data de saída;
- horas trabalhadas;
- custo operacional;
- gastos diretos;
- recebimentos;
- o que foi feito;
- documentos relacionados;
- informações sobre dízimo.

## Status

O status não depende exclusivamente da data de saída.

Ele poderá ser alterado durante a vida do serviço.

Os status definitivos serão definidos quando o módulo for desenvolvido.

## Horas trabalhadas

Serão informadas manualmente.

Não serão calculadas automaticamente.

## Custo operacional

Ideia inicial:

    horas trabalhadas
    ×
    (soma das contas mensais / 30 / 24)

A fórmula ainda precisa ser discutida e transformada em regra clara antes da implementação.

## Gastos diretos

Representam gastos diretamente relacionados ao serviço.

Provavelmente terão registros próprios em vez de apenas um campo numérico em services.

## Recebimentos

Também podem possuir registros próprios.

Representam valores recebidos relacionados ao serviço.

## O que foi feito

O serviço terá informações sobre o trabalho realizado.

A estrutura e eventual status próprio ainda precisam ser definidos.

## Dízimo

Informativo calculado inicialmente como:

    recebimentos
    -
    (gastos diretos + custo operacional)

O dízimo também será tratado como gasto direto do serviço.

Precisaremos impedir que ele seja contado novamente no cálculo que o originou.

Essa regra deverá ser explícita.

## Documentos

Um serviço poderá possuir referências para:

- orçamento do próprio sistema;
- anotação;
- documento externo;
- outro tipo de referência.

A modelagem ainda será definida.

## Relações

Um serviço pode:

- utilizar um cliente existente;
- criar um cliente quando necessário;
- utilizar equipamentos existentes;
- criar equipamento quando necessário;
- servir como base para criação de orçamento;
- gerar gastos financeiros;
- gerar recebimentos financeiros.

## Queries planejadas

- últimos 10 serviços finalizados;
- serviços em andamento;
- serviços em planejamento/análise;
- evolução de gastos x recebimentos ao longo do ano;
- quantidade de serviços ao longo do ano;
- consultas por cliente;
- consultas por equipamento;
- dashboard de serviço;
- resumo financeiro de serviço.

---

# 10. Budgets

Orçamentos possuem módulo próprio.

Um orçamento pode nascer de um serviço e um serviço também pode originar um orçamento.

Essa relação precisa ser estudada antes das FKs definitivas.

## Um orçamento terá

- cliente ou clientes;
- equipamento ou equipamentos;
- prazo de entrega;
- condição de pagamento;
- garantia;
- itens;
- status;
- observações;
- validade.

## Budget items

Estrutura inicial:

    budget
    └── budget_items

Cada item possui:

- título;
- categoria;
- descrição opcional;
- quantidade;
- valor unitário;
- valor total.

## Categorias

As categorias poderão ser criadas pelo frontend e armazenadas em tabela própria.

Exemplos:

    Peças
    Serviço
    Deslocamento
    Desconto

Os valores dos itens poderão aceitar valores negativos para representar descontos diretamente.

Ainda precisamos definir claramente:

    quantity × unitValue = totalValue

e como o total geral será calculado.

## Status imaginados

- DRAFT
- SENT / WAITING_RESPONSE
- APPROVED
- REJECTED
- CANCELLED
- FINISHED

Os nomes finais e as transições serão definidos posteriormente.

## PDF

No frontend, o orçamento será apresentado em proporção semelhante a uma folha A4.

Objetivos:

- layout clean;
- responsividade;
- pouca quebra de conteúdo;
- paginação adequada;
- possibilidade de gerar/salvar PDF.

A biblioteca ainda não foi definida.

## Queries

- aguardando resposta;
- aprovados;
- rascunhos com max_limit;
- orçamentos ao longo do ano;
- orçamentos que viraram serviços;
- por cliente;
- por equipamento;
- por data de criação.

---

# 11. Financial / Cash Flow

Financeiro será um dos domínios mais importantes.

Será responsável por registrar e consultar movimentações financeiras.

## Financial entry

Cada lançamento possui:

- descrição;
- quantidade;
- valor unitário;
- valor total;
- tipo: entrada ou saída;
- categoria;
- data de referência;
- createdAt;
- updatedAt.

## Financial categories

Categorias terão tabela própria:

    financial_categories

Isso permitirá consultas por categoria.

## Origem do lançamento

Um lançamento poderá possuir referência à entidade que o originou.

Exemplo:

    source_type = SERVICE
    source_id = UUID

ou:

    source_type = EMPLOYEE
    source_id = UUID

A ideia é saber de onde veio um lançamento sem o financeiro precisar conhecer as regras internas do módulo de origem.

O modelo definitivo ainda será discutido.

## Contas mensais

Submódulo para contas recorrentes/esperadas.

Uma conta poderá possuir:

- nome;
- descrição opcional;
- valor médio/esperado;
- data inicial de pagamento;
- data final de pagamento;
- observações.

Essas contas podem participar do cálculo do custo operacional dos serviços.

## Queries

- gastos no mês;
- entradas no mês;
- total por categoria;
- entradas ao longo do ano;
- saídas ao longo do ano;
- entradas por categoria;
- saídas por categoria;
- últimas movimentações;
- últimas movimentações com max_limit;
- resumo financeiro para dashboards.

---

# 12. Employees

Funcionários será um dos módulos mais críticos.

Não será tratado como CRUD simples.

As regras precisam ser rastreáveis, editáveis e seguras.

> Valores e cálculos relacionados a funcionários, especialmente obrigações trabalhistas, precisam ser tratados como regras de negócio que devem ser verificadas antes de serem consideradas definitivas. Uma fórmula implementada no sistema não representa automaticamente a legislação brasileira.

## Estrutura inicialmente imaginada

    employees/
    ├── cadastro / quadro
    ├── lançamentos
    ├── competências
    └── auditoria

Os nomes reais das tabelas ficarão em inglês.

## Employee

Dados imaginados:

- nome;
- cargo;
- data de entrada;
- data de saída;
- CPF/CNPJ;
- chave PIX;
- salário;
- outras informações necessárias.

## Employee entries

Podem representar:

- informações financeiras;
- faltas;
- atrasos;
- descontos;
- acréscimos;
- outros ajustes.

Também poderemos informar a competência manualmente.

Quando a competência não for informada, existe a ideia de FIFO para abater a competência mais antiga.

Essa regra precisa ser detalhada antes da implementação.

## Competências

A competência representa aquilo que a empresa deve ao funcionário em determinado período.

Exemplo:

    Funcionário entra em 01/02/2026

    Competência:
    janeiro/2026

O sistema poderá criar e calcular competências conforme:

- data de entrada;
- data de saída;
- salário;
- férias;
- décimo terceiro;
- rescisão;
- descontos;
- alterações;
- lançamentos;
- outros ajustes.

As competências precisam ser editáveis.

## Valor calculado x valor final

Ideia:

    calculatedValue
    +
    adjustments
    =
    finalValue

O sistema deve conseguir explicar de onde veio um valor.

## Pendências

Ao consultar um funcionário, o sistema poderá analisar:

- data atual;
- competências abertas;
- salários;
- férias;
- décimo terceiro;
- rescisão;
- descontos;
- outros valores.

E responder o que a empresa possui pendente.

A ideia inicial é considerar o 5º dia útil do mês como referência para pagamento, mas isso ainda precisa ser definido como regra configurável.

## Saída

Ao existir uma data de demissão/saída, o sistema deve parar de criar ou contabilizar novas competências após o período aplicável.

## Rescisão

Ainda não está decidido se será:

- calculada por helper próprio;
- assistida por mecanismo externo;
- preenchida manualmente;
- ou implementada de outra forma.

Como envolve regras legais e valores sensíveis, qualquer cálculo automático deverá ser validado cuidadosamente antes de ser tratado como definitivo.

## Auditoria

Precisamos registrar alterações importantes, especialmente:

- cargo;
- salário;
- chave PIX;
- datas;
- outras informações críticas.

Ainda precisamos decidir se a auditoria será exclusiva de employees ou se criaremos audit_logs como infraestrutura geral.

## Queries

- últimas movimentações de funcionários;
- últimas movimentações com max_limit;
- movimentações de um funcionário;
- dashboard de funcionário;
- pendências;
- resumo das competências.

---

# 13. Agenda

A agenda será responsável por compromissos e lembretes.

Objetivos:

- criar compromissos;
- definir data/hora;
- gerar lembretes;
- relacionar compromissos a entidades do sistema.

Exemplo:

    Appointment
        ↓
    Service

ou:

    Appointment
        ↓
    Client

## Anotações

Também existe a ideia de anotações relacionadas a dias específicos.

Uma anotação poderá opcionalmente ser relacionada a alguma entidade.

Exemplo:

    Note
     ├── date
     ├── content
     └── reference

A modelagem ainda será definida.

---

# 14. Notifications

Notificações poderão ser um domínio próprio caso a complexidade justifique.

Inicialmente podem existir apenas para:

- compromissos;
- reminders da agenda.

Posteriormente:

    Salário do funcionário X vence hoje.
    Serviço X foi finalizado hoje.
    Orçamento X foi enviado para o cliente Y.

## Notificação por usuário

Uma notificação pode ser destinada a vários usuários.

Cada usuário possui seu próprio estado.

Exemplo:

    Notification
        │
        ├── User 1 → seenAt = hoje
        └── User 2 → seenAt = daqui a 2 dias

Provavelmente teremos uma separação entre a notificação e o estado dela para cada usuário.

---

# 15. Relacionamentos entre domínios

Relações de negócio não devem ser confundidas com dependências diretas entre services.

Exemplo:

    Client
       │
       ├── Equipment
       ├── Service
       └── Budget

    Service
       │
       ├── Equipment
       ├── Budget
       └── Financial entries

    Employee
       │
       ├── Competences
       ├── Entries
       ├── Audit
       └── Financial entries

Quando uma operação precisar coordenar vários módulos, devemos avaliar um use case.

---

# 16. Shared

shared deve conter somente coisas realmente compartilhadas.

Exemplos atuais:

    shared/
    ├── database/
    ├── errors/
    ├── logger/
    └── middleware/

Não devemos transformar shared em uma pasta genérica para código que não sabemos onde colocar.

Regra:

> Se uma regra pertence claramente a um domínio, ela deve continuar dentro daquele domínio.

---

# 17. Queries e dashboards

Dashboards não devem obrigar repositories básicos a conhecer todas as necessidades do frontend.

Exemplo:

    services.repository.ts

pode cuidar das operações básicas.

Enquanto:

    services/queries/
    ├── getServiceDashboard.ts
    ├── getRecentFinishedServices.ts
    ├── getAnnualServiceEvolution.ts
    └── getServiceFinancialSummary.ts

pode cuidar das consultas específicas.

Isso permite joins e agregações específicas sem transformar o CRUD em uma estrutura gigantesca.

O mesmo princípio poderá ser usado em:

    financial/queries/
    employees/queries/
    budgets/queries/

quando houver necessidade.

---

# 18. Backend e frontend

O frontend também respeitará os limites dos módulos.

Ideia atual:

    frontend/src/
    ├── api/
    ├── modules/
    │   ├── auth/
    │   ├── users/
    │   ├── clients/
    │   ├── equipments/
    │   ├── services/
    │   ├── budgets/
    │   ├── employees/
    │   └── ...
    ├── pages/
    ├── components/
    └── ...

Cada módulo poderá possuir:

    module/
    ├── module.api.ts
    ├── module.types.ts
    ├── module.schema.ts
    ├── module.hooks.ts
    └── components/

A página coordena a tela.

O hook cuida do estado e das operações da interface.

A API cuida da comunicação HTTP.

Types e schemas representam o contrato esperado pelo frontend.

---

# 19. Frontend: relação com Use Cases e Queries

O frontend não precisa saber como o backend realizou uma operação.

Exemplo:

    frontend
        ↓
    POST /services/from-budget
        ↓
    backend use-case
        ├── valida budget
        ├── cria service
        ├── relaciona equipamentos
        └── retorna resultado

O frontend conhece somente o contrato:

    CreateServiceFromBudgetRequest
    CreateServiceFromBudgetResponse

Da mesma forma:

    frontend
        ↓
    GET /services/dashboard
        ↓
    backend query
        ├── services
        ├── equipments
        ├── financial
        └── aggregates

O frontend recebe um DTO específico para aquela tela.

Uma query de dashboard pode retornar dados que não correspondem diretamente a uma única tabela.

---

# 20. Regras de ouro

## 20.1 Não criar abstração sem necessidade

Se um CRUD simples resolve, não precisamos criar:

    use-case
    factory
    strategy
    manager
    adapter

apenas porque a arquitetura permite.

## 20.2 Criar abstração quando a responsabilidade existir

Operação de negócio complexa → use case.

Consulta específica/complexa → query.

## 20.3 Evitar dependências circulares

Evitar:

    AService → BService → CService → AService

Quando isso aparecer, parar e redesenhar o fluxo.

## 20.4 Banco representa dados; Use Cases representam processos

Uma FK não significa que um service precisa chamar outro service.

## 20.5 Queries podem ser específicas para o frontend

Uma query não precisa retornar exatamente o formato de uma tabela.

## 20.6 Regras críticas devem ser rastreáveis

Principalmente:

- funcionários;
- financeiro;
- cálculos;
- alterações sensíveis.

## 20.7 Valores calculados devem permitir explicação

Quando possível:

    valor base
    + ajustes
    = valor final

## 20.8 Não antecipar todos os módulos

A arquitetura deve crescer junto com o sistema.

---

# 21. Pontos ainda em aberto

Antes da implementação de cada domínio, precisamos discutir:

- relação exata entre clientes e equipamentos;
- equipamento sem cliente;
- serviço sem cliente identificado;
- relação Service ↔ Budget;
- relação Service ↔ Equipment;
- estrutura de gastos e recebimentos de serviço;
- cálculo definitivo do custo operacional;
- regra definitiva do dízimo;
- referência de documentos;
- estrutura de categorias financeiras;
- origem dos lançamentos financeiros;
- contas mensais e sua participação no custo operacional;
- estrutura das competências de funcionários;
- regras de FIFO;
- regras configuráveis de pagamento;
- férias;
- décimo terceiro;
- rescisão;
- auditoria;
- agenda;
- notas;
- notificações;
- notificações por usuário;
- geração de PDF dos orçamentos;
- queries específicas de cada dashboard.

---

# 22. Próxima etapa

Antes de escrever código dos próximos módulos, vamos construir o modelo de domínio de:

    Clients
        ↓
    Equipments
        ↓
    Services
        ↓
    Budgets
        ↓
    Financial
        ↓
    Employees

Para cada módulo vamos definir:

1. responsabilidade;
2. entidades;
3. tabelas;
4. relacionamentos;
5. regras de negócio;
6. efeitos sobre outros módulos;
7. queries;
8. use cases necessários;
9. DTOs/API;
10. impacto no frontend.

Somente depois disso começaremos a implementar.

A intenção é que o system_scratch.md continue sendo atualizado conforme as decisões forem tomadas.
