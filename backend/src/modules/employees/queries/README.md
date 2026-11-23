# Employees Queries

Este submódulo concentra consultas de leitura que precisam combinar dados de mais de um domínio de employees. Ele não substitui os repositories de employees, engagements, obligations, movements ou history: sua responsabilidade é montar visões compostas para leitura, sem transferir para cá as regras de escrita.

## Primeiro endpoint planejado

`GET /employees/queries/find-employee-overview/:employeeId`

A consulta deverá apresentar:
- cadastro do funcionário;
- vínculos e seus dados contratuais;
- obrigações/competências e seus valores reconhecidos, pagamentos considerados e saldos;
- movimentações do vínculo, incluindo faltas, atrasos, bonificações e pagamentos;
- histórico do funcionário e de cada vínculo.

A resposta deverá agrupar os registros pelo funcionário e pelo vínculo correspondente. O histórico com `engagementId` nulo permanece no nível do funcionário.

## Estratégia de paginação

Obrigações, movimentações e histórico são coleções independentes. Cada coleção terá seu próprio cursor e limite, para que a tela possa carregar mais itens de uma seção sem bloquear ou recarregar as demais.

A paginação será por cursor, não por `skip/offset`, com ordenação determinística e desempate por ID. Cada consulta buscará `limit + 1` registros para informar `hasMore` e `nextCursor`, evitando consultas de contagem exata em toda navegação.

A primeira resposta poderá trazer uma página inicial de cada coleção. As páginas seguintes serão solicitadas independentemente, preservando os dados já carregados no frontend. Os limites deverão ser validados e ter um máximo definido no schema.

## Estratégia de leitura

- Buscar o funcionário e os vínculos com seleção explícita dos campos necessários.
- Buscar uma página de obrigações para os IDs dos vínculos.
- Buscar uma página de movimentações para os mesmos vínculos, incluindo somente o resumo necessário da obrigação e da transação financeira.
- Buscar uma página de histórico pelo `employeeId`, incluindo eventos gerais e eventos dos vínculos.
- Executar as leituras independentes em paralelo quando não houver dependência entre elas.
- Agrupar os resultados em memória por `engagementId`; não fazer uma consulta adicional para cada vínculo.
- Não carregar todas as movimentações, obrigações ou entradas de histórico em um único `include`.
- Não duplicar a transação financeira como uma nova saída: vários movimentos podem compartilhar o mesmo `financialTransactionId`.

A paginação inicial será global por coleção dentro do funcionário, com os itens agrupados por vínculo na resposta. Se a experiência da interface exigir navegação isolada por vínculo, isso deverá ser decidido no contrato antes da implementação, sem multiplicar consultas N+1.

## Contrato e desempenho

Antes de implementar o endpoint, definir:
1. Os campos mínimos de cada entidade no resumo e nos itens paginados.
2. A ordenação de cada coleção e os campos usados no cursor.
3. Os limites padrão e máximo de cada coleção.
4. Como o frontend solicitará páginas seguintes de forma independente.
5. Os índices compostos necessários após conferir os índices existentes no Prisma.

Não retornar contagens exatas por padrão: `hasMore` e `nextCursor` atendem à navegação sem custo extra de `COUNT(*)`. Se um total exato for realmente necessário para uma tela, será uma opção explícita e avaliada separadamente.

O endpoint não será implementado nesta etapa. Primeiro estabilizamos as regras de saldo e a organização dos dados; depois fechamos o contrato e implementamos a consulta em etapas pequenas.
