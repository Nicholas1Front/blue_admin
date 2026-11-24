# Employees Queries

Este submódulo concentra consultas compostas de leitura do módulo employees. Ele não substitui os repositories de cadastro, vínculos, obrigações ou movimentos e não executa correções automáticas.

## Endpoints

### Visão geral do funcionário

`GET /employees/queries/find-employee-overview/:employeeId`

Retorna cadastro, vínculos e três coleções independentes:
- obrigações/competências, com valores pagos e saldo em aberto;
- movimentos, com resumo da obrigação e da transação financeira relacionada;
- histórico, separado entre eventos do funcionário e eventos de cada vínculo.

Parâmetros independentes:
- `obligationsCursor`, `obligationsLimit`;
- `movementsCursor`, `movementsLimit`;
- `historyCursor`, `historyLimit`.

Cada limite usa padrão 20 e máximo 100. A paginação busca um item adicional para informar `hasMore`; `nextCursor` recebe o ID do último item entregue. Os cursores são validados dentro do funcionário solicitado.

A paginação é global por coleção entre os vínculos do funcionário. Os resultados são agrupados por `engagementId`, e o histórico sem vínculo permanece em `history.employee`.

### Dashboard

`GET /employees/queries/dashboard`

Sem parâmetros, considera o mês e ano atuais. Também aceita `month` e `year` juntos para consultar outro período. `movementsCursor` e `movementsLimit` paginam a lista de movimentos recentes (padrão 20, máximo 100).

O dashboard retorna:
- quantidade de funcionários;
- obrigações abertas e valor total em aberto;
- obrigações com vencimento no período consultado e seus saldos;
- valor vencido considerando obrigações com vencimento anterior ao dia atual;
- pagamentos registrados no período, pela data efetiva do movimento;
- próxima obrigação ainda em aberto com vencimento a partir do dia atual;
- resumo por funcionário: saldo em aberto, vencimentos do período, pagamentos registrados, faltas e atrasos;
- movimentos recentes.

Para os indicadores de saldo, são consideradas obrigações com status `pendente` ou `parcial`. Obrigações em revisão e canceladas não entram no total reconhecido em aberto. A consulta não altera status nem cria obrigações.

### Análise de consistência

`GET /employees/queries/analyze-consistency/:employeeId`

Aponta divergências que precisam de revisão manual:
- movimentos financeiros sem obrigação vinculada (incluindo possíveis registros legados);
- pagamentos que ultrapassam o valor final da obrigação;
- divergência entre o status manual da obrigação e os pagamentos registrados;
- movimentos cuja obrigação pertence a outro vínculo;
- soma dos movimentos vinculados que ultrapassa o valor da transação financeira compartilhada.

A análise considera o total de movimentos associados a cada transação financeira, inclusive movimentos de outros funcionários que compartilhem a mesma transação. Nenhum registro é corrigido ou alterado automaticamente.

## Regras de leitura

- `referenceStart` e `referenceEnd` representam a competência da obrigação.
- `dueDate` representa a previsão de pagamento/vencimento da obrigação.
- `eventDate` representa a data em que o movimento ocorreu.
- Somente movimentos do tipo `pagamento` reduzem o saldo da obrigação.
- O saldo é calculado como valor final menos a soma dos pagamentos diretamente vinculados, limitado a zero para apresentação. A análise de consistência aponta pagamentos excedentes separadamente.
- Uma transação financeira compartilhada não é somada como várias despesas; os movimentos são alocações daquela mesma transação.
- Consultas usam seleções explícitas, agrupamento em memória e leituras paralelas quando independentes. Não há consulta individual por vínculo (N+1).

## Limites conhecidos

A paginação da visão geral é independente por coleção, mas global entre os vínculos do funcionário. O dashboard carrega as obrigações abertas para calcular os saldos por funcionário e por vencimento; se o volume crescer significativamente, essa agregação deverá ser movida para uma consulta SQL agregada ou materialização avaliada com dados reais.

A análise de consistência é uma leitura completa por funcionário e pode retornar várias divergências. Ela não deve ser executada automaticamente em cada carregamento da tela; é uma consulta de auditoria sob demanda.
