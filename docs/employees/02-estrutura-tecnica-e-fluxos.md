# Módulo de colaboradores — Estrutura técnica e fluxos

> Proposta de implementação para o Blue Admin. Deve ser conferida com a estrutura real do repositório no início do desenvolvimento. Este documento descreve responsabilidades e contratos, não código definitivo.

## 1. Diretrizes de arquitetura

O módulo deve seguir os padrões já utilizados nos módulos de Vehicles, Services, Budgets e Financial:
- Prisma como camada de persistência, mantendo uma única instância/adaptador conforme o padrão atual.
- Backend organizado em schema/model, repository, service, controller, routes, queries e shareds, respeitando os nomes e convenções existentes.
- Frontend organizado por módulo, com types, API, query keys, hooks, pages e components.
- Respostas da API no envelope já adotado pelo projeto (`message` + `data`).
- Validação no backend; validação visual no frontend não substitui as regras do servidor.
- Operações que alterem mais de uma entidade devem usar transação Prisma.
- Evitar `try/catch` redundante em controllers e seguir o tratamento central de erros existente.
- Não introduzir uma arquitetura paralela nem abstrações genéricas antes de haver necessidade real.

## 2. Organização de documentação

```text
docs/
└── employees/
    ├── README.md
    ├── 01-regras-de-negocio.md
    └── 02-estrutura-tecnica-e-fluxos.md
```

## 3. Modelo de dados proposto

As seis entidades principais são:

```text
Employee
  └── EmployeeEngagement[]
        ├── EmployeeObligation[]
        │     └── EmployeePaymentAllocation[]
        ├── EmployeeMovement[]
        │     └── EmployeePaymentAllocation[]
        └── EmployeeHistory[]

EmployeePaymentAllocation
  ├── EmployeeMovement
  └── EmployeeObligation? (nulo somente para crédito de adiantamento)

EmployeeMovement
  ├── FinancialTransaction? (via transactionId opcional)
  └── EmployeeMovement? (self relation: adiantamento aponta para pagamento; aplicação aponta para adiantamento)
```

### 3.1 Relações e cardinalidade

| Entidade | Relação | Regra |
|---|---|---|
| Employee | Engagement | 1:N; pessoa pode ter vários vínculos ao longo do tempo |
| Engagement | Obligation | 1:N; cada competência pertence a um vínculo |
| Engagement | Movement | 1:N; eventos pertencem a um vínculo |
| Employee | History | 1:N; auditoria associada à pessoa |
| Engagement | History | 1:N opcional; evento pode ser específico do vínculo |
| Movement | Allocation | 1:N |
| Obligation | Allocation | 1:N |
| Movement | FinancialTransaction | referência opcional 1:1, conforme `transactionId` |
| Movement | Movement | auto-relação opcional para rastrear aplicação de crédito até sua origem |

A relação com `financial_transactions` deve respeitar a convenção de origem já existente no financeiro (`originType` e `originId`). Como `transactionId` é opcional, registros históricos podem existir sem transação vinculada.

### 3.2 Campos e tipos gerais

- IDs e FKs: UUID, seguindo o padrão do schema atual.
- Valores monetários: Decimal Prisma, nunca float.
- Datas de evento/competência: escolher `DateTime` e normalização de início/fim do dia de acordo com o padrão atual do projeto; consultas por período devem ser inclusivas e consistentes com timezone.
- Listas controladas: campos String no banco/Prisma, sem enums.
- Metadados de auditoria: Json opcional quando realmente útil; não usar JSON para substituir relações consultáveis.
- Campos opcionais devem representar informação realmente desconhecida/não aplicável, não valores artificiais.

A lista exata de campos está descrita em `01-regras-de-negocio.md`. Antes da migration, comparar com o schema atual e revisar nomes, índices, onDelete e constraints.

### 3.3 Índices e integridade a considerar

- FKs de todas as relações.
- `employee_engagements.employeeId` + datas/status para consultas de vínculo.
- `employee_obligations.engagementId`, status, dueDate e período de referência.
- Índice/unique de `engagementId + referenceKey` para evitar duplicação de competências.
- `employee_movements.engagementId + eventDate`, `transactionId` (unique quando não nulo, se a relação for 1:1) e `sourceMovementId`.
- `employee_payment_allocations.movementId` e `obligationId`.
- `employee_history.employeeId + eventDate` e `engagementId + eventDate`.
- Validar valores positivos de alocação e integridade de vínculo no service/transação. Constraints SQL podem complementar, mas não substituem validação de domínio.
- Definir explicitamente comportamento de exclusão. Registros financeiros/auditáveis não devem ser apagados em cascata sem análise. Preferir bloqueio de exclusão ou encerramento/inativação lógica quando houver histórico financeiro. A política final deve seguir o padrão de exclusão já adotado no projeto.

## 4. Shareds — listas sem enums

Criar listas centralizadas para valores persistidos como strings. O caminho exato deve acompanhar a organização atual do projeto; a intenção é manter um único contrato de valores e labels para backend e frontend.

Conjuntos esperados:
- `modalidadesDeVinculo`: `clt`, `pj`, `nao_formalizado`, `outro`.
- `statusDoVinculo`: `ativo`, `suspenso`, `afastado`, `encerrado`.
- `tiposDeObrigacao`: `salario`, `decimo_terceiro`, `ferias`, `rescisao`, `bonus`, `comissao`, `ajuste`, `outro`. Crédito de adiantamento não é obrigação.
- `statusDaObrigacao`: `em_revisao`, `pendente`, `parcial`, `pago`, `cancelado`.
- `origensDaObrigacao`: `manual`, `sugestao_sistema`, `historico_importado`.
- `tiposDeMovimentacao`: `pagamento`, `falta`, `atraso`, `saida_antecipada`, `desconto`, `ajuste`, `bonus`, `adiantamento`, `aplicacao_adiantamento`, `estorno`, `registro_administrativo`.
- `tiposDeHistorico`: tipos de auditoria em português.
- `tiposDeAlocacao`: `pagamento`, `credito_adiantamento`, `aplicacao_adiantamento`.

Os valores acima são uma proposta inicial; a lista definitiva deve ser definida durante a implementação. Shareds devem oferecer constantes tipadas e, se útil, labels/traduções. O backend valida os valores recebidos. O frontend não deve manter cópias divergentes das listas.

Não alterar valores persistidos apenas renomeando uma constante. Se um valor já foi gravado, a alteração precisa considerar os registros existentes e uma possível migração de dados.

## 5. Backend — responsabilidades e estrutura sugerida

Ajustar nomes/pastas às convenções existentes, mas preservar separação de responsabilidades.

```text
backend/src/
├── modules/
│   └── employees/
│       ├── employees.controller.ts
│       ├── employees.routes.ts
│       ├── employees.service.ts
│       ├── employees.repository.ts
│       ├── employees.validation.ts
│       ├── employees.types.ts
│       ├── employees.shared.ts (ou shareds centralizados do projeto)
│       └── queries/
│           ├── employees-dashboard/
│           ├── find-employee-by-id/
│           ├── find-employees-by-filters/
│           ├── find-employee-history/
│           ├── find-engagement-obligations/
│           └── find-engagement-movements/
└── ...
```

Se o repositório já organiza módulos em diretórios separados por responsabilidade, seguir o padrão existente em vez de impor a árvore ilustrativa acima.

### Responsabilidades

- **Routes:** declarar endpoints e middlewares de autenticação/validação.
- **Controller:** receber request, encaminhar ao service/query e montar resposta padrão.
- **Validation:** validar payloads, UUIDs, datas, strings shared e valores monetários.
- **Service:** regras de negócio, transações, cálculos transparentes e coordenação entre entidades.
- **Repository:** operações Prisma de persistência; sem regras complexas de domínio.
- **Queries:** leituras otimizadas para dashboard, filtros, detalhes e históricos.
- **Shareds:** listas oficiais de strings, tipos e labels compartilháveis.

### Endpoints — proposta funcional

Os caminhos finais devem seguir o roteamento já utilizado no projeto.

**Colaboradores**
- criar colaborador;
- editar dados pessoais;
- consultar por ID;
- pesquisar por filtros/paginação;
- consultar dashboard/listagem resumida.

**Vínculos**
- criar vínculo;
- editar dados atuais;
- encerrar vínculo;
- consultar vínculos da pessoa;
- registrar mudança relevante de salário/função/modalidade com data efetiva.

**Obrigações**
- consultar obrigações por vínculo/período/status;
- confirmar sugestão do sistema;
- criar obrigação manual;
- editar obrigação em revisão/pendente conforme regras;
- cancelar com justificativa;
- consultar saldo e alocações.

**Movimentações e pagamentos**
- registrar evento não financeiro;
- registrar pagamento histórico sem `transactionId`;
- registrar novo pagamento integrado ao financeiro;
- alocar pagamento entre obrigações;
- registrar excedente como crédito de adiantamento;
- aplicar crédito a competência futura;
- registrar correção/reversão.

**Histórico**
- consultar histórico do colaborador/vínculo por período e natureza;
- histórico é gerado pelos serviços de domínio, não por CRUD genérico editável.

Evitar criar endpoints genéricos para permitir editar/excluir livremente pagamentos e eventos de auditoria.

## 6. Fluxos de backend

### 6.1 Criar colaborador e vínculo

1. Validar dados básicos; aceitar campos opcionais ausentes.
2. Criar `employees`.
3. Criar vínculo separadamente quando houver dados de relação com a empresa.
4. Registrar histórico de cadastro e abertura de vínculo.
5. Executar operações relacionadas na mesma transação quando forem uma única ação de negócio.
6. Não gerar competências confirmadas automaticamente.

### 6.2 Dashboard e sugestões sob demanda

1. Consultar colaboradores e vínculos pertinentes.
2. Buscar competências existentes, pagamentos/alocações e eventos relevantes.
3. Calcular sugestões esperadas com base em datas, modalidade, situação e regras administrativas.
4. Comparar sugestões com `referenceKey` das competências já existentes.
5. Retornar separadamente: obrigações confirmadas, sugestões, saldos, créditos disponíveis e alertas.
6. Não gravar sugestões durante a query.
7. Ao confirmar, revalidar a referência no banco e criar a obrigação em transação, evitando duplicidade concorrente.

Não implementar worker/cron na primeira versão.

### 6.3 Registrar pagamento distribuído

1. Receber vínculo, data, valor, descrição e alocações escolhidas.
2. Validar que valor total é positivo e que todas as competências pertencem ao mesmo vínculo.
3. Validar saldo atual de cada competência e soma das alocações.
4. Se houver excedente, exigir que seja destinado a crédito de adiantamento ou que o usuário ajuste o valor.
5. Criar transação financeira e movimento de pagamento atomicamente quando for pagamento novo integrado.
6. Se for lançamento histórico, permitir `transactionId = null` e não fabricar transação.
7. Persistir alocações e eventual crédito de adiantamento.
8. Atualizar/recalcular status/saldos conforme a fonte de verdade definida.
9. Registrar histórico.
10. Retornar pagamento, alocações, saldos atualizados e vínculo financeiro quando existir.

Toda validação de saldo deve acontecer dentro da transação e proteger contra duas requisições concorrentes consumirem o mesmo saldo.

### 6.4 Aplicar adiantamento em competência futura

1. Consultar créditos disponíveis do vínculo.
2. Sugerir a próxima competência futura elegível, explicando a razão.
3. Permitir ao responsável selecionar a competência destino.
4. Validar vínculo, saldo do crédito e saldo da competência.
5. Criar movimentação de aplicação sem nova transação financeira.
6. Criar alocação do tipo `advance_application` para a competência destino.
7. Vincular a aplicação à movimentação que originou o crédito (`sourceMovementId`).
8. Atualizar saldos calculados e histórico.
9. Impedir consumo acima do crédito disponível ou do saldo da competência.

O algoritmo de saldo deve distinguir dinheiro pago no passado de crédito aplicado no futuro. A aplicação nunca pode ser somada como novo pagamento no financeiro.

### 6.5 Ausência/atraso e impacto

1. Registrar evento com `eventDate`, descrição e vínculo.
2. Opcionalmente associar à competência afetada.
3. Não alterar automaticamente o valor da obrigação.
4. Se houver estimativa de impacto, retornar memória de cálculo e permitir revisão.
5. Após confirmação explícita, criar/alterar ajuste e histórico.
6. Se a competência já tiver pagamentos, avaliar necessidade de reversão/novo ajuste sem reescrever o pagamento original.

### 6.6 Alterar salário ou encerrar vínculo

**Alteração salarial**
1. Receber novo valor e data efetiva.
2. Registrar valor anterior/novo no histórico.
3. Atualizar `currentSalary` do vínculo.
4. Identificar competências futuras ainda não confirmadas que podem precisar de revisão.
5. Não modificar competências reconhecidas automaticamente.

**Encerramento**
1. Registrar `exitDate` e status de encerramento.
2. Registrar histórico.
3. Consultar competências abertas, créditos disponíveis e pagamentos.
4. Retornar lista de pendências e sugestão de revisão/rescisão.
5. Não calcular nem confirmar rescisão definitiva automaticamente.

## 7. Frontend — estrutura sugerida

Seguir o padrão de módulos já existente no frontend.

```text
frontend/src/modules/employees/
├── employees.types.ts
├── employees.api.ts
├── employees.queryKeys.ts
├── employees.hooks.ts
├── pages/
│   ├── EmployeesDashboardPage.tsx
│   ├── EmployeeDetailPage.tsx
│   └── EmployeeHistoryPage.tsx
└── components/
    ├── EmployeeForm/
    ├── EngagementForm/
    ├── EngagementSummary/
    ├── Obligations/
    ├── ObligationReviewModal/
    ├── PaymentForm/
    ├── PaymentAllocations/
    ├── AdvanceCreditSelector/
    ├── MovementForm/
    ├── EmployeeHistory/
    └── EmployeeFilters/
```

A árvore é ilustrativa: reutilizar componentes existentes e adaptar nomes ao padrão real do projeto.

### Páginas e experiência esperada

**Dashboard de colaboradores**
- lista/resumo de colaboradores e situação dos vínculos;
- seletor de período quando fizer sentido;
- indicadores de obrigações confirmadas em aberto, pagamentos e créditos de adiantamento;
- alertas/sugestões do sistema claramente separados de dívidas reconhecidas;
- filtros e acesso ao cadastro/detalhe.

**Detalhe do colaborador**
- dados pessoais;
- vínculos atuais e anteriores;
- resumo do vínculo selecionado;
- competências confirmadas, saldos e vencimentos;
- créditos de adiantamento disponíveis;
- movimentações e histórico;
- ações para editar, abrir/encerrar vínculo e registrar eventos.

**Revisão de competência**
- exibir origem da sugestão;
- período de referência e vencimento;
- memória de cálculo e dados utilizados;
- valor estimado e valor final editável;
- confirmar, ajustar ou descartar;
- nunca apresentar sugestão como dívida confirmada antes da confirmação.

**Registro de pagamento**
- valor e data do pagamento;
- lista de competências abertas com saldo;
- seleção de uma ou várias competências;
- valor a alocar por competência;
- indicador do total alocado e restante;
- se houver excedente, ação para reservar como crédito;
- sugestão de competência futura destino;
- confirmação explícita da distribuição antes de salvar.

**Aplicação de adiantamento**
- saldo de crédito disponível e sua origem;
- competência futura sugerida;
- seletor para escolher outra competência elegível;
- valor a aplicar limitado ao crédito disponível e ao saldo da competência;
- aviso de que a aplicação não cria nova saída financeira.

### Estados visuais importantes

- `Sugestão`: ainda não reconhecida.
- `Pendente`: obrigação confirmada sem pagamento.
- `Parcial`: parte quitada/aplicada.
- `Pago`: saldo zerado.
- `Cancelado`: obrigação anulada com justificativa.
- `Crédito disponível`: dinheiro já pago ainda não aplicado a uma competência.
- `Histórico sem transação`: registro antigo sem vínculo com o financeiro.

Não depender somente de cores; usar texto/labels claros.

## 8. React Query, API e invalidação

- Definir query keys hierárquicas por colaborador, vínculo, dashboard, competências, movimentações e histórico.
- Hooks de leitura separados de mutations.
- Após criar/editar colaborador: invalidar listagens e detalhe pertinentes.
- Após criar/editar/encerrar vínculo: invalidar colaborador, vínculos, dashboard, sugestões e competências relacionadas.
- Após confirmar/cancelar obrigação: invalidar competências, saldos, dashboard e histórico.
- Após pagamento/alocação: invalidar movimentos, competências, saldos, créditos, dashboard, histórico e consultas financeiras relacionadas.
- Após aplicar adiantamento: invalidar crédito de origem, competência destino, saldos, movimentos e histórico.
- Não copiar regras de cálculo para o frontend como fonte de verdade. Frontend pode calcular prévias para interação, mas o backend recalcula e valida ao confirmar.

## 9. Precisão monetária, datas e concorrência

- Persistir valores com Decimal.
- Definir conversões entre Decimal, strings e payloads de API seguindo o padrão do projeto.
- Evitar `number`/float como fonte de verdade para valores financeiros.
- Definir timezone e normalização de datas antes das queries por competência.
- Usar intervalo inclusivo coerente para datas de início/fim.
- Proteger criação de competência por `referenceKey` única.
- Proteger alocação e aplicação de crédito contra concorrência; validar e persistir dentro da transação.
- Considerar bloqueio/isolamento ou estratégia equivalente do Prisma/PostgreSQL se duas operações simultâneas puderem consumir o mesmo saldo.
- Nunca confiar no saldo enviado pelo frontend.

## 10. Sequência sugerida de implementação

Implementar em etapas pequenas, validando build e comportamento a cada etapa:

1. **Inspeção prévia:** revisar schema Prisma, módulos existentes, shareds, rotas, validações, financeiro e padrões do frontend; conferir histórico de commits e alterações locais.
2. **Schema e shareds:** definir campos, relações, strings permitidas, índices, constraints e política de exclusão. Revisar cuidadosamente antes de migration.
3. **Base de colaboradores/vínculos:** CRUD e histórico de cadastro/alteração.
4. **Consultas:** detalhe, filtros, histórico e dashboard sem geração automática de dados.
5. **Obrigações:** CRUD controlado, sugestões sob demanda, confirmação idempotente e saldos.
6. **Movimentações não financeiras:** ausência, atraso, ajuste e correções com revisão humana.
7. **Pagamentos e alocações:** integração financeira, pagamentos históricos sem transactionId, pagamentos parciais/múltiplos e validações transacionais.
8. **Adiantamentos:** crédito de excedentes, sugestão/seleção de competência destino e aplicação sem nova saída financeira.
9. **Frontend:** dashboard, detalhes, formulários, modais e fluxos, mantendo o padrão visual do sistema.
10. **Testes de cenários:** conferir regras de negócio, concorrência, retroatividade, saldo e histórico.

Não implementar todos os fluxos de uma vez. Cada etapa deve gerar diff pequeno, revisão e commit separado quando o responsável decidir.

## 11. Cenários mínimos de validação

1. Criar colaborador sem CPF/CNPJ e com dados pessoais parciais.
2. Criar dois vínculos sucessivos para a mesma pessoa.
3. Registrar alteração salarial retroativa sem reescrever competências confirmadas.
4. Abrir dashboard sem gravar sugestões no banco.
5. Confirmar a mesma sugestão em duas requisições concorrentes sem duplicar competência.
6. Registrar pagamento histórico sem `transactionId`.
7. Registrar pagamento integrado ao financeiro com transação e origem corretas.
8. Pagar uma obrigação em duas parcelas.
9. Quitar várias obrigações com um pagamento.
10. Rejeitar alocação acima do saldo ou entre vínculos diferentes.
11. Destinar excedente a crédito de adiantamento.
12. Aplicar parcialmente crédito em competência futura escolhida a partir de sugestão do sistema.
13. Garantir que aplicação de crédito não crie nova transação/saída financeira.
14. Impedir que o mesmo crédito seja aplicado duas vezes.
15. Registrar ausência sem desconto automático.
16. Encerrar vínculo com pendências e créditos, apresentando revisão sem criar rescisão definitiva.
17. Corrigir pagamento mantendo o evento original e sua trilha de auditoria.
18. Consultar histórico diferenciando data efetiva de data de registro.

## 12. Antes da primeira migration

Checklist obrigatório:
- [ ] Conferir nomes e padrões reais do schema atual.
- [ ] Definir tipos finais das strings e criar shareds.
- [ ] Revisar todas as relações e regras de exclusão.
- [ ] Definir unicidade e índices.
- [ ] Fechar a modelagem do crédito de adiantamento e da aplicação para evitar dupla contagem.
- [ ] Confirmar como a movimentação aponta para `financial_transactions` e como os campos `originType`/`originId` serão preenchidos.
- [ ] Conferir precisão Decimal e serialização da API.
- [ ] Revisar o schema completo com cuidado antes de rodar migration.
- [ ] Deixar a execução de `migrate dev` e `generate` para o fluxo combinado com o responsável pelo projeto.


## 13. Implementação inicial registrada no repositório

A primeira camada foi organizada em submódulos por responsabilidade:
- `employees`: cadastro pessoal;
- `engagements`: vínculo, remuneração atual e encerramento;
- `obligations`: registro em revisão, confirmação, atualização e cancelamento;
- `movements`: faltas, atrasos, descontos revisados, ocorrências e estornos;
- `allocations`: pagamentos, distribuição entre obrigações, reserva e aplicação de adiantamentos;
- `history`: gravação interna da trilha de auditoria;
- `shared`: listas de valores em português.

Os endpoints de escrita estão registrados em `backend/src/modules/employees/employees.routes.ts` e montados em `backend/src/routes/index.ts`. A autenticação é aplicada no router raiz do módulo.

### Regras técnicas implementadas

- O cadastro normaliza e valida CPF/CNPJ, incluindo CNPJ alfanumérico, e o campo é único quando informado.
- As operações que criam ou alteram mais de uma entidade usam transações Prisma.
- Pagamentos e aplicações de adiantamento usam isolamento Serializable para proteger a consistência de saldos.
- A obrigação mantém `originalValue` e `finalValue`; o valor original é preservado quando a obrigação é revisada pela primeira vez.
- A alocação de crédito de adiantamento não possui obrigação de destino; cada aplicação futura tem obrigação de destino e referência à movimentação que originou o crédito.
- Transações financeiras vinculadas a pagamentos de colaboradores não podem ser editadas diretamente pelo módulo financeiro.
- Não há exclusão física de colaborador, vínculo, obrigação, movimentação ou histórico nesta camada.

### Endpoints de escrita disponíveis

| Submódulo | Método e caminho |
|---|---|
| Colaboradores | `POST /employees/create-employee` |
| Colaboradores | `PUT /employees/update-employee/:id` |
| Vínculos | `POST /employees/engagements/create-engagement` |
| Vínculos | `PUT /employees/engagements/update-engagement/:id` |
| Vínculos | `PATCH /employees/engagements/close-engagement/:id` |
| Obrigações | `POST /employees/obligations/create-obligation` |
| Obrigações | `PUT /employees/obligations/update-obligation/:id` |
| Obrigações | `PATCH /employees/obligations/review-obligation/:id` |
| Obrigações | `PATCH /employees/obligations/cancel-obligation/:id` |
| Movimentações | `POST /employees/movements/create-movement` |
| Movimentações | `PATCH /employees/movements/reverse-movement/:id` |
| Alocações | `POST /employees/allocations/register-payment` |
| Alocações | `POST /employees/allocations/apply-advance` |

As queries de leitura, filtros, dashboard, sugestão automática da competência destino e frontend permanecem para etapas futuras, conforme o escopo solicitado.


### Helper de sugestão de destino do adiantamento

Foi preparado `allocations/helpers/sugerirCompetenciaDestino.ts` para selecionar a competência futura elegível mais próxima, priorizando salário em caso de empate. A função é pura e não grava nem aplica crédito. A query futura deverá fornecer as competências com seus saldos; a interface continuará permitindo que o responsável escolha outro destino antes da confirmação.


### Semântica da alocação de adiantamento

Na tabela `employee_payment_allocations`, `obligationId` é anulável apenas quando `type = credito_adiantamento`. Para `pagamento` e `aplicacao_adiantamento`, a obrigação de destino é obrigatória. Essa regra é validada pelo backend. A aplicação futura é uma movimentação sem transação financeira, ligada ao pagamento original por `sourceMovementId`.


### Limites e validações ainda pendentes

- A política para vínculos simultâneos/ sobrepostos ainda não foi fechada. A primeira camada não bloqueia sobreposição automaticamente; essa validação deve ser definida antes de criar a query de vínculos e o fluxo de cadastro definitivo.
- O estorno de pagamentos ainda não está disponível. O endpoint genérico bloqueia essa operação porque é necessário definir o lançamento financeiro de reversão sem apagar a saída original. Estornos de ocorrências, descontos e aplicações de adiantamento já são tratados.
- As regras semânticas de alocação (por exemplo, `credito_adiantamento` com `obligationId = null`) são validadas no backend. O Prisma Schema não expressa CHECK constraints; se quisermos reforço direto no PostgreSQL, adicionar essas constraints na migration SQL gerada/revisada antes da aplicação.
- Não há ainda query de leitura, sugestão de competência via endpoint, dashboard, filtros ou frontend. O helper de sugestão está pronto para ser usado pela futura query.
