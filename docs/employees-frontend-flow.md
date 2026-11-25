# Employees — base do frontend

Este documento define a primeira etapa do módulo Employees no frontend: contratos TypeScript, chamadas API e hooks TanStack Query. As páginas e componentes visuais serão construídos depois, usando este documento como referência.

## Organização do módulo

`frontend/src/modules/employees/`

- `employees.types.ts`: cadastro de funcionário, filtros e paginação compartilhada.
- `employees.api.ts` / `employees.hooks.ts`: cadastro, busca, leitura e atualização do funcionário.
- `employees.queryKeys.ts`: chaves centralizadas do cache.
- `engagements/`: tipos, API e hooks dos vínculos.
- `obligations/`: tipos, API e hooks das obrigações/competências e análise de sugestões.
- `movements/`: tipos, API e hooks dos movimentos e pagamentos.
- `queries/`: tipos, API e hooks de dashboard, resumos, pagamentos mensais, histórico, overview e consistência.
- `index.ts`: exports públicos do módulo.

O fluxo de dados segue a convenção atual do frontend: componente/page → hook TanStack Query → função API → instância Axios compartilhada. As funções API desembrulham `ApiResponse.data`; hooks controlam cache e invalidação.

## Fluxo da tela principal

1. Ao abrir Employees, selecionar o mês e ano atuais.
2. Buscar `GET /employees/queries/dashboard` para os indicadores gerais e movimentos recentes.
3. Buscar `GET /employees/queries/find-employee-engagement-summaries` para a lista pesquisável de funcionários e vínculos.
4. Buscar `GET /employees/queries/monthly-payments` para listar pagamentos registrados no período. Esta rota é exclusiva de movimentos do tipo pagamento; para todos os tipos de movimento do mês, usar `find-movements-by-filters` com intervalo de datas.
5. Ao mudar mês/ano, atualizar as query keys com o novo período e refazer as consultas.

### Área de resumo de funcionários

Filtros:
- nome e documento;
- funcionário específico;
- vínculo específico;
- status e modalidade do vínculo.

Cada funcionário apresenta:
- saldo total reconhecido em aberto;
- número de obrigações abertas;
- faltas e atrasos no mês selecionado;
- vínculos correspondentes aos filtros.

O endpoint de resumo agrupa os vínculos por funcionário. A paginação é por funcionário, com cursor; não tratar o cursor como número de página.

### Movimentos do mês

A listagem de todos os movimentos usa `GET /employees/find-movements-by-filters`, com `eventDateFrom`, `eventDateTo`, `limit`, `cursor` e `order`. A ordenação inicial é mais recente primeiro. A lista de pagamentos pode usar a consulta mensal dedicada, que também retorna os totais do mês completo.

Ao selecionar um movimento, buscar `GET /employees/find-movement-by-id/:engagementId/:movementId`. Edição e exclusão são operações explícitas; após sucesso, os hooks invalidam as consultas de Employees.

## Fluxo de detalhe do funcionário

1. Buscar `GET /employees/find-employee-by-id/:id` para o cadastro.
2. Buscar vínculos com `GET /employees/find-engagements-by-employee/:employeeId`.
3. Permitir selecionar um vínculo. O vínculo selecionado é a referência das seções financeiras abaixo.
4. Buscar `GET /employees/queries/engagement-financial-summary/:engagementId` para saldo, valores agrupados por tipo, vencidos e próximos vencimentos.
5. Listar obrigações com `GET /employees/find-obligations-by-filters`, filtrando por `engagementId`, cursor e limite.
6. Listar movimentos com `GET /employees/find-movements-by-filters`, filtrando por `engagementId`, cursor, filtros de tipo/data e `order=asc` para apresentar do mais antigo ao mais recente.
7. Carregar histórico somente quando o usuário abrir a seção: `GET /employees/queries/find-employee-history/:employeeId`. A ordenação do histórico é mais recente primeiro.

O overview agregado existente continua disponível como alternativa, mas a tela pode preferir as consultas específicas para carregar o histórico sob demanda e controlar filtros/paginação de cada lista.

## Ações rápidas e comportamento

- **Novo funcionário:** criar cadastro e, se necessário, criar vínculo em ação separada.
- **Editar funcionário:** atualizar os dados cadastrais.
- **Novo vínculo / editar vínculo:** atualizar modalidade, status, datas e remuneração. A mudança de salário pode recalcular a taxa horária no backend; enviar `hourlyRate` somente quando a interface oferecer a definição explícita de valor manual.
- **Registrar movimento:** criar falta, atraso, saída antecipada, bonificação, férias, rescisão, ajuste ou anotação.
- **Registrar pagamento:** usar o endpoint de pagamento, sempre vinculando a uma obrigação. Pode vincular uma transação financeira existente ou criar uma transação conforme os campos aceitos pelo backend.
- **Analisar competências:** executar `GET /employees/analyze-obligations/:engagementId` somente após o usuário solicitar e fornecer período/opções. Mostrar sugestões e avisos; nunca criar ou atualizar obrigações automaticamente. A ação sugerida `manual_review` exige revisão.
- **Excluir movimento:** permitido pelo backend; não significa excluir a transação financeira vinculada.
- **Excluir obrigação:** permitido apenas se as regras do backend não bloquearem por movimentos financeiros associados.
- **Excluir funcionário/vínculo:** não existe endpoint de exclusão física. Usar atualização de status e datas, preservando o histórico.

## Estrutura/layout visual planejado

### Tela Employees

1. **Cabeçalho:** título “Funcionários”, mês/ano selecionados e ações rápidas.
2. **Indicadores gerais:** funcionários cadastrados, obrigações abertas, saldo em aberto, vencimentos do mês, vencido e pagamentos registrados no mês.
3. **Resumo por funcionário:** campo de busca, filtros de vínculo e lista/tabela responsiva com saldo, faltas e atrasos. Expandir/selecionar funcionário para navegar ao detalhe.
4. **Movimentações do mês:** lista/tabela com data, funcionário, vínculo, tipo, descrição, obrigação e valor. Paginação por cursor e filtros; ordenar inicialmente do mais recente ao mais antigo.
5. **Detalhe do movimento:** modal ou painel lateral com dados completos; botões de editar/excluir conforme tipo e endpoint.

### Detalhe do funcionário

1. **Perfil:** dados pessoais e ação de editar.
2. **Seletor de vínculo:** status, modalidade, datas e remuneração resumida.
3. **Resumo financeiro do vínculo:** saldo total, agrupamento por tipo, vencidos e próximos vencimentos.
4. **Obrigações/competências:** lista mais recente por competência primeiro, filtros e paginação por cursor.
5. **Movimentos:** lista do mais antigo ao mais recente, filtros e paginação por cursor. Pagamentos e movimentos comuns usam fluxos de edição diferentes.
6. **Histórico:** seção recolhida inicialmente; carregar sob demanda, paginar mais recente primeiro e aplicar estilo por `eventType`.

## Contratos e regras que a interface deve respeitar

- Todos os endpoints de Employees exigem autenticação; a API usa o Axios compartilhado que já aplica a sessão.
- Paginação é por cursor. Enviar `nextCursor` como `cursor` na próxima requisição; reiniciar o cursor quando filtros ou período mudarem.
- Os filtros de período do backend são dias completos em UTC. Datas de competência/vencimento são datas de calendário; evitar conversões locais que mudem o dia exibido.
- `eventDate` é a data do movimento e `referenceDate` da transação financeira é outra data. Não apresentar uma como se fosse a outra.
- Somente movimentos do tipo `pagamento` reduzem o saldo da obrigação.
- Status de obrigação são manuais. O frontend não deve marcar como pago/parcial automaticamente após registrar um pagamento.
- Vários movimentos podem alocar uma transação financeira compartilhada, mas o backend valida o total alocado contra o valor da transação.
- Não usar mutações otimistas para pagamentos ou obrigações nesta primeira etapa; invalidar as queries e refazer os dados do backend.
- Mensagens de erro do backend devem ser apresentadas ao usuário; especialmente conflitos de alocação, obrigação vinculada, transação compartilhada e exclusão bloqueada.

## Escopo desta etapa

Implementados apenas os contratos, funções API, query keys, hooks e este documento. Pages, components, formulários, modais, estilos e navegação serão feitos em uma etapa posterior.
