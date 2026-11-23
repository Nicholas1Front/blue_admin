# Módulo de funcionários — Modelo de dados e fluxos técnicos

> Proposta de arquitetura para revisão antes do schema Prisma. Os nomes e campos são candidatos, não uma migration pronta.

## 1. Padrões do projeto

A implementação deverá seguir a arquitetura já utilizada nos módulos existentes do Blue Admin:
- TypeScript e Prisma no backend;
- separação por responsabilidade entre schemas/validation, routes, controller, service e repository;
- queries específicas separadas dos fluxos de escrita, conforme o padrão atual dos módulos;
- AppError para erros de domínio e validações de negócio;
- uma instância compartilhada do Prisma;
- transações Prisma quando uma operação envolver múltiplas gravações relacionadas;
- envelope de resposta da API já utilizado pelo projeto.

Nomenclatura técnica em inglês, seguindo o padrão do repositório. Nomes de conceitos específicos de negócio podem permanecer em português quando fizer sentido. Exemplo: uma constante exportada pode ter nome `modalidadesDeVinculo`, enquanto o tipo, arquivo ou função ao redor segue o padrão técnico do projeto. Shareds e helpers não devem ser inteiramente traduzidos nem receber abstrações desnecessárias.

Valores persistidos em campos do tipo String podem ser códigos de domínio em português ou inglês conforme decisão dos shareds. Não criar enums Prisma sem necessidade; seguir a convenção atual do schema.

## 2. Entidades e responsabilidades propostas

### 2.1 `Employee` — `employees`
Pessoa cadastrada. Não armazena modalidade, salário ou status do vínculo.

Relações:
- um Employee possui vários EmployeeEngagements;
- um Employee possui vários EmployeeHistory entries.

### 2.2 `EmployeeEngagement` — `employee_engagements`
Cada admissão/contrato/período de vínculo.

Responsabilidades:
- funcionário relacionado;
- datas de entrada/saída, opcionais quando desconhecidas;
- status;
- salário bruto atual;
- valor da hora;
- modalidade;
- observações.

Relações:
- pertence a Employee;
- possui várias obrigações;
- possui várias movimentações;
- aparece no histórico.

### 2.3 `EmployeeObligation` — `employee_obligations`
Valor reconhecido como devido pela empresa.

Responsabilidades:
- vínculo;
- tipo e descrição;
- referência/competência;
- vencimento;
- valor original e valor reconhecido;
- status e observações.

Relações:
- pertence a EmployeeEngagement;
- recebe vários movimentos de pagamento diretamente vinculados;
- pode ser referenciada por movimentação que altere diretamente aquela obrigação.

Não criar tabela auxiliar de períodos de férias nem tabela específica de histórico de obrigações. O período de férias será identificado pelos dados do vínculo e pelo helper; as obrigações e pagamentos ficam nas entidades comuns.

### 2.4 `EmployeeMovement` — `employee_movements`
Registro de acontecimentos do vínculo.

Responsabilidades:
- tipo e descrição;
- data efetiva do evento;
- competência afetada quando aplicável;
- valor quando aplicável;
- referência opcional à obrigação afetada;
- `financialTransactionId` opcional para integração com FinancialTransaction.

Relações:
- pertence a EmployeeEngagement;
- pode apontar para uma FinancialTransaction;
- pode apontar para uma obrigação por meio de `obligationId`;
- pode ser referenciada por outra movimentação em fluxos de correção, se o desenho final precisar disso.

### 2.5 Relação entre EmployeeMovement e EmployeeObligation

Não existe tabela associativa de pagamentos. Cada EmployeeMovement possui um `obligationId` opcional:
- um movimento aponta para, no máximo, uma obrigação;
- uma obrigação pode receber vários movimentos de pagamento;
- pagamentos parciais são registrados como movimentos separados;
- uma transferência pode ser compartilhada por vários movimentos através de `financialTransactionId`;
- valores não destinados a uma obrigação permanecem em movimentos sem `obligationId`.

### 2.6 `EmployeeHistory` — `employee_history`
Trilha única de auditoria.

Responsabilidades:
- funcionário;
- vínculo opcional;
- tipo de evento;
- título/descrição;
- metadata JSON com valores anterior/novo e contexto;
- data efetiva e data de registro.

O histórico salarial e o histórico de obrigações ficam aqui. Não criar tabelas auxiliares para esses históricos.

## 3. Relacionamentos conceituais

```text
Employee
  | 1:N
  +---- EmployeeEngagement
           | 1:N
           +---- EmployeeObligation
           |        ^
           |        | 0..N movimentos de pagamento
           |
           +---- EmployeeMovement
           |        | 0..1 EmployeeObligation
           |        | 0..1 FinancialTransaction
           |
           +---- EmployeeHistory

Employee
  +---- EmployeeHistory

FinancialTransaction
  | 1:N
  +---- EmployeeMovement
```

Cada EmployeeMovement pode referenciar uma obrigação e uma transação financeira, ambas opcionais. Uma obrigação recebe movimentos de pagamento independentes; a transação financeira representa a transferência real e pode ser compartilhada por vários movimentos.

## 4. Integridade do banco e do backend

Regras que devem ser garantidas:
- obrigações e movimentações pertencem ao vínculo correto;
- valores monetários usam Decimal no banco;
- uma mesma referência de obrigação recorrente não é criada duas vezes;
- a soma dos valores dos movimentos vinculados a uma transação não pode superar o valor dessa transação, inclusive sob requisições concorrentes;
- o status das obrigações não é alterado automaticamente pelo registro de pagamentos;
- exclusões não podem apagar histórico ou registros financeiros importantes.

O banco deve proteger relações, unicidade e índices possíveis. Regras que dependem de somas entre várias linhas, estado de estorno ou pertencimento ao mesmo vínculo precisam ser validadas no service dentro de transação. Constraints SQL adicionais só devem ser consideradas depois de revisar o schema e a migration gerada.

## 5. Integração com FinancialTransaction

O schema atual contém `FinancialTransaction` com:
- `id`;
- `description`;
- `value`;
- `type`;
- `categoryId`;
- `referenceDate`;
- `originType`;
- `originId`;
- timestamps.

O módulo de funcionários deverá manter `financialTransactionId` opcional em EmployeeMovement. A transação financeira representa a saída de dinheiro; cada movimentação do funcionário registra a parte do pagamento destinada a uma obrigação, quando houver.

Ao criar um pagamento integrado, a movimentação e a transação financeira devem ser persistidas de maneira consistente. Para pagamento histórico sem transação, `financialTransactionId` permanece nulo. Pagamentos atuais integrados criam uma transação de despesa com categoria ativa do tipo `expense`. Uma mesma transação pode ser compartilhada por vários EmployeeMovements.

A soma dos valores dos movimentos vinculados não pode superar o valor da transação. A API financeira pode editar descrição, data e categoria mantendo o tipo despesa, mas não pode reduzir o valor abaixo da soma vinculada, converter a transação em entrada ou excluí-la enquanto houver movimentos relacionados. Excluir um movimento não exclui a transação.

## 6. Fluxos principais de backend

### 6.1 Cadastro e vínculo
1. Validar os dados essenciais e aceitar campos opcionais ausentes.
2. Criar Employee.
3. Criar EmployeeEngagement em operação própria ou no mesmo fluxo quando a interface oferecer cadastro combinado.
4. Registrar histórico de cadastro e vínculo.
5. Não gerar obrigações automaticamente apenas por criar o vínculo.

### 6.2 Alteração salarial
1. Consultar vínculo e salário atual.
2. Receber novo salário e data efetiva.
3. Registrar no EmployeeHistory o valor anterior, novo valor e data efetiva.
4. Atualizar o salário atual do vínculo.
5. Não reescrever obrigações nem pagamentos antigos.

### 6.3 Sugestões de obrigações
1. Consultar vínculos, histórico e obrigações existentes.
2. Calcular sugestões sem persistir registros.
3. Retornar separadamente sugestões, obrigações confirmadas e saldos.
4. Usuário escolhe se cria.
5. Backend revalida a referência e cria a obrigação em transação, evitando duplicidade concorrente.

### 6.4 Registro de movimentação
1. Validar o vínculo, tipo e eventual obrigação relacionada.
2. Registrar evento, competência afetada e valor quando aplicáveis; datas desconhecidas permanecem nulas.
3. Movimentações não financeiras não criam obrigações nem descontos automaticamente.
4. Registrar histórico com snapshot dos dados relevantes.

### 6.5 Pagamento e vínculo com obrigação
1. Receber vínculo, data (quando conhecida), valor, descrição e obrigação opcional.
2. Validar que a obrigação pertence ao vínculo informado.
3. Um movimento pode apontar para apenas uma obrigação. Para destinar uma transferência a várias obrigações, cadastrar primeiro a FinancialTransaction pelo valor total da transferência e registrar vários movimentos com o mesmo `financialTransactionId`, cada um com seu valor correspondente.
4. Se houver transação financeira nova, criar uma única FinancialTransaction de despesa com categoria ativa do tipo `expense`. Para pagamentos históricos, permitir `createFinancialTransaction: false`.
5. Se houver uma transação existente, validar que ela existe, é uma despesa e que a soma dos movimentos vinculados, incluindo o novo movimento, não supera seu valor.
6. Registrar histórico com a obrigação e a transação vinculadas.
7. O status da obrigação permanece manual. O total pago e o saldo são derivados dos movimentos vinculados.

Rotas implementadas sob `/employees`:
- `POST /create-movement/:engagementId`
- `PUT /update-movement/:engagementId/:movementId`
- `GET /find-movements-by-engagement/:engagementId`
- `GET /find-movement-by-id/:engagementId/:movementId`
- `DELETE /delete-movement/:engagementId/:movementId`
- `POST /create-payment/:engagementId`
- `PUT /update-payment/:engagementId/:movementId`
- `GET /find-open-obligations/:engagementId`

A exclusão de um movimento preserva a transação financeira compartilhada. A exclusão de uma obrigação desvincula seus movimentos e preserva os registros financeiros.

Exemplo de pagamento vinculado a uma obrigação:

```json
{
  "description": "Pagamento parcial do salário",
  "value": 1500,
  "obligationId": "<obligation-id>",
  "categoryId": "<expense-category-id>"
}
```

Para associar outra parte da mesma transferência a uma segunda obrigação, enviar outro pagamento com o mesmo `financialTransactionId` e o valor correspondente. O valor excedente pode permanecer em um movimento sem `obligationId`.

Para pagamento histórico sem lançamento financeiro, incluir `"createFinancialTransaction": false`; nesse caso, `categoryId` pode ser omitido e `eventDate` pode permanecer nulo quando desconhecida.

### 6.6 Análise e sugestão de competências
1. A rota GET /employees/analyze-obligations/:engagementId consulta em uma única leitura o vínculo, o histórico de alterações salariais e as obrigações de salário, férias e décimo terceiro, incluindo movimentações.
2. A consulta exige startMonth, startYear, endMonth e endYear. O intervalo é inclusivo, limitado a 40 anos, e usa somente mês/ano na entrada.
3. Os parâmetros calculateSalary, calculateVacation e calculateThirteenthSalary permitem selecionar os cálculos. Quando omitidos, os três são executados.
4. O helper puro, localizado em employees/helpers/obligationSuggestions.ts, coordena três calculadoras independentes dentro de obligations/calculations/: salários, férias e décimo terceiro.
5. Salários são calculados mês a mês, proporcionalmente aos dias corridos de vínculo ativo e às alterações salariais efetivas no mês. Competências anteriores podem ser usadas como referência quando o histórico salarial não é suficiente, sempre sinalizando a estimativa.
6. Férias são identificadas pelos períodos aquisitivos de 12 meses a partir da entrada do vínculo. As obrigações existentes são comparadas pelo mês/ano de referenceStart e referenceEnd. Se entryDate for desconhecida, uma competência válida não cancelada permite projetar o próximo período a partir do dia seguinte ao referenceEnd; essa projeção exige revisão e não reconstrói períodos anteriores. Períodos históricos sem registro exigem revisão, pois ausência de obrigação não prova ausência de concessão ou pagamento.
7. O décimo terceiro é calculado por ano até o mês final da análise: última competência salarial disponível dividida por 12 e multiplicada pelos meses com pelo menos 15 dias de vínculo ativo. Sem competência salarial, usa currentSalary como estimativa e sinaliza a limitação.
8. Para cada competência, a resposta informa ação sugerida (create, update, none ou manual_review), estimativa, valor reconhecido, total pago pelos movimentos vinculados, saldo, memória de cálculo, projeção e alertas. O resumo separa saldo reconhecido em aberto, estimativas sugeridas para criação e estimativas que ainda exigem revisão manual.
9. A edição só é sugerida quando o valor estimado diverge, a obrigação não possui movimentações de pagamento nem ajuste manual e o status permite revisão automática. Obrigações canceladas ou em revisão exigem conferência; obrigações pagas/parciais só exigem revisão quando houver divergência, e o status parcial sem movimentos de pagamento também exige conferência.
10. Datas ou histórico insuficientes, duplicidades, vínculo encerrado/afastado, prazo concessivo vencido e referências salariais ambíguas exigem conferência humana.
11. A análise nunca cria nem altera obrigações. A criação confirmada pode continuar usando a rota de criação em lote.

### 6.7 Criação de obrigações em lote
1. A rota `POST /employees/create-obligations-batch/:engagementId` recebe uma lista de obrigações revisadas pelo usuário.
2. O service valida duplicidades dentro do próprio lote e identifica os períodos não repetíveis.
3. O repository bloqueia o vínculo durante a verificação de duplicidade e criação, evitando concorrência com a criação individual existente.
4. Todas as obrigações e seus eventos de histórico são criados em uma única transação. Se houver duplicidade, nenhuma obrigação do lote é criada.
5. O lote aceita até 100 obrigações por requisição. Não cria pagamentos nem transações financeiras.

## 7. Estrutura de backend proposta

A estrutura definitiva deve acompanhar a organização real dos módulos existentes. Proposta inicial:

```text
backend/src/modules/employees/
├── employees.schema.ts
├── employees.repository.ts
├── employees.service.ts
├── employees.controller.ts
├── employees.routes.ts
├── engagements/
│   ├── engagements.schema.ts
│   ├── engagements.repository.ts
│   ├── engagements.service.ts
│   ├── engagements.controller.ts
│   └── engagements.routes.ts
├── obligations/
│   ├── calculations/
│   │   ├── types.ts
│   │   ├── salaryCalculation.ts
│   │   ├── vacationCalculation.ts
│   │   └── thirteenthSalaryCalculation.ts
│   ├── obligations.schema.ts
│   ├── obligations.repository.ts
│   ├── obligations.service.ts
│   ├── obligations.controller.ts
│   └── obligations.routes.ts
├── movements/
│   ├── movements.schema.ts
│   ├── movements.repository.ts
│   ├── movements.service.ts
│   ├── movements.controller.ts
│   └── movements.routes.ts
├── history/
│   └── history.repository.ts
├── helpers/
│   └── obligationSuggestions.ts
└── shared/
```

A árvore é uma referência, não uma obrigação de criar arquivos vazios ou submódulos prematuramente. Helpers devem ser criados quando houver uma regra reutilizável concreta. Shareds centralizam códigos/labels usados em mais de um ponto. Manter nomes técnicos em inglês e permitir nomes pontuais de conceitos de negócio em português.

## 8. Plano de desenvolvimento incremental

A prioridade inicial é banco de dados e backend.

### Etapa 1 — Banco de dados
- Revisar o schema Prisma atual e relações existentes.
- Desenhar os seis modelos e seus campos.
- Revisar FKs, onDelete, índices, unicidade e tipos Decimal.
- Conferir a relação opcional com FinancialTransaction.
- Revisar o schema completo antes de qualquer migration.
- Não criar tabelas auxiliares de histórico salarial, histórico de obrigações ou períodos de férias.

### Etapa 2 — Backend base
- Implementar cadastro de Employee e EmployeeEngagement.
- Registrar EmployeeHistory nas operações relevantes.
- Implementar validações simples e regras de domínio.
- Testar e revisar antes de seguir.

### Etapa 3 — Obrigações
- Cadastro manual e revisão de obrigações.
- Sugestões de obrigações sem persistência automática.
- Proteção contra duplicidade por referência.
- Testes de competência, vencimento, edição e histórico.

### Etapa 4 — Movimentações e pagamentos
- [x] Registro e edição de movimentações não financeiras.
- [x] Pagamentos manuais ou integrados ao financeiro.
- [x] Vínculo direto opcional entre pagamento e obrigação.
- [x] Vários movimentos podem compartilhar uma transação financeira.
- [x] Proteção do valor total vinculado e preservação da transação ao excluir um movimento.
- [ ] Executar build e validar cenários de integração no ambiente do projeto.

### Etapa 6 — Helpers
- Salários, férias e décimo terceiro calculados por período mensal, respeitando o histórico disponível e as regras acordadas.
- Memória de cálculo e sinalização de dados incompletos.
- Detecção de obrigação já criada e saldo já pago.
- Nenhuma criação automática de obrigação.

### Etapa 7 — Queries, testes e revisão
- Queries específicas depois que os modelos e fluxos de escrita estiverem estáveis.
- Testes unitários e de integração dos casos de negócio.
- Revisão dos diffs e refinamento antes do frontend.

### Etapa 8 — Frontend
- Desenvolver telas e fluxos somente após contratos do backend estabilizados.
- Testar, revisar e refinar em etapas pequenas.

## 9. Cenários essenciais de teste

1. Cadastrar pessoa com dados parciais.
2. Criar vários vínculos para a mesma pessoa.
3. Cadastrar vínculo antigo com data desconhecida.
4. Alterar salário e preservar valor anterior no histórico.
5. Criar obrigação manual retroativa.
6. Sugerir obrigação recorrente sem gravá-la.
7. Confirmar sugestão sem duplicar referência já existente.
8. Registrar falta sem desconto automático.
9. Aplicar desconto à competência escolhida, diferente da data do evento.
10. Registrar pagamento histórico sem FinancialTransaction.
11. Registrar pagamento integrado ao financeiro.
12. Registrar vários movimentos para destinar uma transferência a obrigações diferentes.
13. Quitar uma obrigação com pagamentos em datas diferentes.
14. Impedir que a soma dos movimentos vinculados ultrapasse o valor da transação financeira.
15. Registrar valores não destinados em movimentos sem obrigação vinculada.
16. Criar uma obrigação de bonificação manualmente quando o responsável decidir reconhecer esse valor.
17. Consultar férias/13º já registrados e não sugerir duplicação.
18. Apresentar saldo de obrigação parcialmente paga.
19. Informar insuficiência de dados históricos para cálculo.
20. Garantir que movimentos que compartilham uma transação não criem saídas financeiras duplicadas.

## 10. Regra de trabalho desta implementação

Trabalhar em pequenos passos:
- uma etapa de banco/backend/teste por vez;
- inspecionar o estado atual do repositório antes de editar;
- explicar a intenção e o impacto da alteração;
- revisar o diff de cada etapa;
- executar os testes/build disponíveis e informar exatamente o que foi executado;
- não avançar para a próxima etapa enquanto houver erro ou dúvida relevante;
- commits pequenos, com mensagens em português, somente quando combinados;
- não implementar funcionalidades adicionais sem necessidade definida.
