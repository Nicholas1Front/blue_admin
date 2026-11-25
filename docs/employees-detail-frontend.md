# Employees — detalhe individual

## Rota e navegação

A ficha individual é acessada a partir do nome do funcionário na lista Employees:

`/employees/:employeeId`

A página mantém o padrão visual dos módulos recentes e apresenta os dados em áreas separadas para não misturar o cadastro da pessoa com informações de vínculos distintos.

## Fluxo de carregamento

1. Buscar o cadastro por `GET /employees/find-employee-by-id/:id`.
2. Buscar vínculos por `GET /employees/find-engagements-by-employee/:employeeId`.
3. Selecionar inicialmente o vínculo em andamento; se não houver, selecionar o primeiro vínculo retornado. O usuário pode trocar a seleção.
4. Para o vínculo selecionado, carregar o resumo financeiro, obrigações e movimentos usando os endpoints existentes.
5. Carregar o histórico somente quando a seção for aberta.

## Organização visual

### Cadastro

Exibe nome, documento, nascimento, endereço, observações e datas de cadastro/atualização. Esses dados pertencem ao funcionário e não a um vínculo específico.

### Vínculos

Cada vínculo é apresentado como um cartão selecionável com modalidade, status, período, remuneração e taxa horária quando disponível. A seleção define o contexto das áreas financeiras abaixo.

### Resumo financeiro do vínculo

Usa `GET /employees/queries/engagement-financial-summary/:engagementId` para apresentar saldo reconhecido em aberto, quantidade de obrigações abertas, vencidas, próximos vencimentos e agrupamento de saldo por tipo.

Os status das obrigações permanecem os registrados no backend. A interface não altera status nem gera competências automaticamente.

### Linha do tempo mensal

A linha do tempo reúne obrigações e movimentos do vínculo selecionado em grupos por mês:

- Obrigações são agrupadas pela competência (`referenceStart`); quando não existe, utiliza-se vencimento e depois data de criação como referência visual.
- Movimentos são agrupados pela data em que ocorreram (`eventDate`); quando não existe, utiliza-se a data de criação.
- Cada obrigação mostra valor reconhecido, valor alocado por pagamentos vinculados e saldo calculado.
- Cada movimento mostra tipo, descrição, valor e obrigação relacionada quando existir.
- Pagamentos indicam o título e a competência da obrigação que receberam a alocação.
- Quando há transação financeira vinculada, a interface também mostra sua descrição e data de referência. Essa data não substitui a data do movimento.

A apresentação é apenas uma organização de leitura. Não altera a competência, a data do movimento, o valor nem o status de qualquer registro.

### Histórico sob demanda

A seção começa recolhida e consulta `GET /employees/queries/find-employee-history/:employeeId` somente quando aberta. Mostra eventos gerais do funcionário e eventos do vínculo selecionado; eventos de outros vínculos ficam ocultos nessa visualização. A paginação utiliza cursor, não número de página.

## Limites desta etapa

Esta etapa implementa a navegação e a visualização dos dados existentes. Formulários de edição, criação de vínculos, registro de obrigações e lançamento de pagamentos serão desenvolvidos separadamente, utilizando os fluxos já definidos nos módulos e sem automatizar cálculos ou mudanças de status.
