# Employees — plano de interações e comportamentos

## Objetivo

Evoluir o módulo Employees para permitir que a empresa cadastre, edite, exclua e organize funcionários, vínculos, obrigações e movimentos por fluxos simples, com ações rápidas e sugestões contextuais.

O frontend deve orientar o usuário quando isso facilitar o trabalho, mas não obrigá-lo a seguir uma sequência fixa.

## Princípios acordados

1. **A decisão final é do usuário.** O sistema pode sugerir, alertar e pedir confirmação; não deve criar obrigações, alterar status ou registrar pagamentos sem confirmação explícita.
2. **As sugestões não são regras universais.** A empresa pode criar ou editar obrigações mesmo quando o vínculo está desligado. A análise de salário, férias e décimo terceiro é uma estimativa administrativa, não uma imposição legal.
3. **Fluxos são opcionais.** O usuário pode seguir os passos sugeridos, pular uma etapa, fechar o fluxo e executar a ação depois por um acesso rápido.
4. **Preservar histórico e integridade.** Alterações e exclusões devem respeitar movimentos, obrigações, vínculos e transações financeiras relacionadas.
5. **Separar obrigação de movimento.** Obrigação representa o compromisso/competência reconhecido pela empresa. Movimento registra um acontecimento ou lançamento. Um movimento pode ser independente de obrigação.
6. **Faltas e atrasos são independentes.** Podem existir com ou sem `obligationId`; sua contagem mensal não deve depender da existência de uma obrigação.
7. **Não automatizar decisões financeiras.** O frontend não deve recalcular ou mudar status de obrigações silenciosamente após pagamento ou alteração salarial.

## Análise do estado atual do repositório

### Banco de dados (Prisma)

- `Employee` contém os dados cadastrais e se relaciona com vários `EmployeeEngagement`.
- `EmployeeEngagement` registra admissão, desligamento, status, modalidade e remuneração. Um funcionário pode ter vários vínculos ao longo do tempo.
- `EmployeeObligation` pertence a um vínculo e contém tipo, título, período de referência, vencimento, valores e status.
- `EmployeeMovement` pertence a um vínculo; `obligationId` é opcional e `financialTransactionId` também é opcional.
- `EmployeeHistory` registra eventos do funcionário e do vínculo, com metadados.
- Relações de funcionário, vínculo e obrigação usam `Restrict` em pontos importantes para impedir exclusões que removam dados relacionados sem tratamento explícito.
- Uma transação financeira pode ser referenciada por movimentos de funcionário. Ela não deve ser apagada automaticamente apenas porque um movimento de alocação foi excluído.

### Backend existente

Já existem endpoints e regras para:

- Criar e atualizar funcionários.
- Criar e atualizar vínculos.
- Criar obrigação individual e em lote (lote de até 100).
- Atualizar e excluir obrigações.
- Analisar competências e sugerir salário, férias e décimo terceiro.
- Criar, atualizar e excluir movimentos não financeiros.
- Criar e atualizar pagamentos por um fluxo específico, separado dos movimentos comuns.
- Consultar dashboard, resumos, histórico e análise de consistência.

A análise de competências já utiliza o histórico salarial registrado com a data efetiva da alteração. O endpoint de análise retorna ações sugeridas (`create`, `update`, `none`, `manual_review`) e payloads possíveis; o usuário ainda precisa revisar e confirmar as ações.

O backend já exige obrigação para alguns tipos de movimento, incluindo pagamento, bonificação, décimo terceiro, férias, rescisão e ajuste. Faltas e atrasos não estão nessa lista e podem ser registrados sem obrigação.

### Frontend existente

- As APIs, tipos e hooks TanStack Query já existem para funcionários, vínculos, obrigações, movimentos e consultas.
- As mutations existentes invalidam o conjunto de queries de Employees após sucesso, o que atualiza dashboard, resumo, detalhe e listas.
- A ficha do funcionário já permite editar o cadastro.
- O popup de detalhes do vínculo já permite editar o vínculo.
- A página Employees já apresenta dashboard, resumos por funcionário, faltas/atrasos e listagem de movimentos.
- A ficha individual já apresenta vínculos, obrigações, movimentos e histórico, com filtros e paginação.
- A home possui uma seção de acessos rápidos acima do resumo por funcionário, com cadastro de funcionário, criação e edição de obrigações e lançamentos, além de ações visuais para sugestões e exclusão.
- A ficha do funcionário disponibiliza ações dentro das seções de obrigações e lançamentos. Os formulários reutilizam as mutations/hooks existentes e invalidam as consultas após salvar.
- O cadastro rápido de funcionário encaminha para a ficha após salvar. O formulário completo de vínculo e o fluxo de continuidade (criar vínculo / analisar / concluir) ainda serão implementados.
- A análise de obrigações ainda não está conectada à revisão e confirmação de sugestões em lote.

### Contagem mensal de faltas e atrasos

A consulta do dashboard agrupa movimentos por vínculo e tipo, filtrando `eventDate` dentro do mês. Ela não filtra por `obligationId`.

Portanto, o comportamento atual já conta faltas e atrasos independentemente de estarem ligados a uma obrigação. Ao implementar formulários e exclusões, devemos preservar essa regra.

## Experiência planejada

### Acessos rápidos

Na página inicial Employees, disponibilizar ações para:

- Adicionar funcionário.
- Adicionar vínculo.
- Adicionar obrigação.
- Adicionar movimento/pagamento.

No detalhe do funcionário, disponibilizar ações equivalentes, com o funcionário já selecionado.

No detalhe do vínculo, disponibilizar ações para adicionar obrigação, movimento/pagamento e analisar o vínculo, com o vínculo já selecionado.

A seleção de funcionário/vínculo deve ser solicitada somente quando o contexto da página não fornecer essa informação.

### Fluxo opcional de cadastro

1. O usuário cria um funcionário.
2. Após salvar, a interface navega para a ficha desse funcionário.
3. Um popup pergunta se deseja criar um vínculo agora ou continuar sem vínculo.
4. Se criar o vínculo, após salvar, oferecer opções para:
   - cadastrar obrigações manualmente;
   - analisar o vínculo e receber sugestões;
   - concluir e continuar na ficha.
5. A análise apresenta sugestões para revisão. Nenhuma obrigação é criada até o usuário selecionar e confirmar.

Cada etapa deve poder ser pulada ou fechada. O usuário poderá executar as ações depois pelos acessos rápidos.

### Criação e edição de obrigações

- Permitir criar uma obrigação individual manualmente.
- Permitir criar várias obrigações manualmente em um único fluxo, usando o endpoint de lote.
- Permitir revisar e editar cada item antes de confirmar o lote.
- Permitir editar obrigação existente, inclusive após desligamento do funcionário.
- Ao editar status ou valores, apresentar alertas quando existirem movimentos relacionados.
- Ao alterar salário do vínculo, oferecer uma sugestão para analisar/criar novas competências com base no salário e na data efetiva. Não alterar competências antigas automaticamente.

### Criação e edição de movimentos

- Separar o formulário de movimento comum do formulário de pagamento.
- Faltas e atrasos podem ser criados sem obrigação.
- Para tipos que exigem obrigação, selecionar a obrigação correspondente.
- Ao criar um pagamento vinculado a uma obrigação, oferecer, após salvar, abrir essa obrigação para revisar o status ou os valores.
- A edição de pagamento deve continuar usando o endpoint de pagamento, não o endpoint de movimento comum.
- Após qualquer alteração, invalidar as consultas relacionadas para atualizar os valores exibidos.

### Avisos de consistência

Antes de confirmar ações sensíveis, mostrar avisos claros e permitir que o usuário prossiga quando a ação for válida, mesmo que os valores não coincidam.

Exemplos:

- A obrigação é de R$ 2.000,00, mas os pagamentos vinculados somam R$ 1.800,00 e o usuário deseja marcá-la como paga.
- Os pagamentos excedem o valor final da obrigação.
- A obrigação está marcada como paga, mas não há pagamentos vinculados.
- O status está como parcial, mas os pagamentos já alcançam o valor da obrigação.
- A obrigação possui movimentos financeiros relacionados e será alterada ou excluída.
- Uma transação financeira compartilhada é referenciada por mais de um movimento.

A análise de consistência existente pode ser usada para identificar divergências. Os avisos não devem corrigir os dados automaticamente.

### Exclusões

- Excluir um movimento deve preservar o histórico de auditoria.
- Excluir um pagamento não deve apagar automaticamente a transação financeira relacionada. A transação pode ser compartilhada ou continuar válida no módulo financeiro.
- Ao excluir uma obrigação, oferecer a exclusão dos movimentos vinculados para evitar registros sem contexto.
- A exclusão em cascata de obrigação + movimentos deve ser uma operação transacional no backend, com histórico e confirmação explícita no frontend.
- Antes de excluir movimentos de pagamento, avisar que as transações financeiras relacionadas serão preservadas e podem continuar aparecendo no financeiro.
- Não apagar funcionário ou vínculo fisicamente sem decidir como tratar obrigações, movimentos, histórico e transações relacionados.

## Comportamentos existentes que precisam ser ajustados ou aproveitados

- Atualmente, excluir uma obrigação é bloqueado quando há movimentos do tipo pagamento ou tipos que exigem obrigação.
- Quando a exclusão é permitida, o backend desassocia os movimentos restantes (`obligationId = null`) em vez de excluí-los. Isso não corresponde ao fluxo de exclusão em cascata que queremos oferecer; será necessário um novo comportamento explícito.
- A exclusão de movimento atualmente registra histórico e preserva a transação financeira vinculada.
- O backend possui exclusão explícita de funcionário com confirmação do nome e exclusão transacional de vínculos, obrigações, movimentos e histórico. Transações financeiras são preservadas; a exclusão do histórico do funcionário é permanente.
- A exclusão de obrigação com movimentos possui endpoint explícito e transacional, com registro de histórico e preservação das transações financeiras.
- Os botões de exclusão na interface permanecem desabilitados até conectarmos os diálogos de confirmação e avisos de integridade.
- O backend já valida que o total alocado de movimentos ligados a uma transação financeira não ultrapasse o valor da transação.
- O backend já possui análise de consistência para pagamentos sem obrigação, status divergentes, valores excedentes, vínculo incorreto e alocação acima da transação. Essa consulta é somente de leitura.

## Possíveis ajustes no backend

A maior parte dos fluxos de criação, edição, lote e sugestões pode ser implementada no frontend usando os endpoints existentes.

Ajustes provavelmente necessários:

1. **Excluir obrigação com movimentos:** criar uma operação explícita e transacional que, após confirmação, exclua a obrigação e os movimentos vinculados, mantendo o histórico e preservando as transações financeiras.
2. **Excluir funcionário/vínculo:** ainda precisamos decidir se será exclusão física limitada a registros sem dependências ou encerramento/arquivamento lógico. Não existe endpoint atualmente e não devemos improvisar uma exclusão no frontend.
3. **Avisos com dados atuais:** se a tela não tiver todos os movimentos/pagamentos carregados, usar uma consulta de resumo ou análise do backend para validar valores antes de exibir a confirmação. Não calcular alertas com uma página parcial de dados.
4. **Ações sugeridas em lote:** o endpoint de lote já existe. Se a análise precisar aplicar atualizações e criações juntas com atomicidade, avaliar endpoint próprio; por enquanto, criação em lote e atualização individual já permitem um fluxo gradual.

## Ordem sugerida de implementação

Cada etapa pode ser dividida em um ou dois comportamentos relacionados, mantendo commits pequenos e validando o build.

1. **Funcionário: adicionar + editar.** Criar formulário de cadastro, usar mutation existente, navegar para a ficha após sucesso e oferecer o próximo passo opcional.
2. **Vínculo: adicionar + editar.** Reutilizar o formulário atual para criação/edição, com funcionário selecionado pelo contexto e convite opcional para criar/analisar obrigações.
3. **Obrigações: adicionar + editar.** Formulário manual individual, validações visuais e edição no detalhe.
4. **Obrigações em lote.** Selecionar/revisar várias competências e confirmar com o endpoint existente.
5. **Movimentos: adicionar + editar.** Formulário de movimento comum, incluindo faltas/atrasos independentes.
6. **Pagamentos: adicionar + editar.** Formulário dedicado, seleção de obrigação, escolha de transação existente ou criação de transação, e atalho para revisar a obrigação após salvar.
7. **Sugestões de competências.** Fluxo de análise do vínculo, apresentação de estimativas/avisos, seleção de itens e confirmação de criação/atualização.
8. **Excluir movimentos e obrigações.** Confirmações contextuais, preservação das transações financeiras e ajuste transacional no backend para exclusão de obrigação com movimentos.
9. **Acessos rápidos e acabamento.** Consolidar os atalhos na página Employees e no detalhe, mantendo o contexto pré-selecionado, fluxo responsivo e mensagens claras.

## Cenários de validação

- Criar funcionário e sair do fluxo sem criar vínculo.
- Criar funcionário, seguir para vínculo e pular a criação de obrigações.
- Criar vínculo desligado e ainda assim criar/editar obrigações.
- Alterar salário com data efetiva e analisar competências sem modificar obrigações automaticamente.
- Criar falta e atraso sem `obligationId` e confirmar a contagem mensal.
- Criar movimento de tipo que exige obrigação sem selecionar obrigação e mostrar a validação.
- Registrar pagamento parcial e manter o status manual até o usuário decidir.
- Marcar obrigação como paga com valor de pagamento diferente e mostrar aviso antes da confirmação.
- Excluir obrigação com movimentos: confirmar exclusão relacionada, preservar transações financeiras e registrar histórico.
- Excluir movimento de pagamento e confirmar que a transação financeira permanece no módulo financeiro.
- Verificar que todas as mutations atualizam dashboard, resumos, listas e ficha do funcionário.


## Estado da interface — acessos rápidos e formulários

- Na home, os acessos rápidos ficam em uma seção acima do resumo por funcionário.
- Na ficha individual, os acessos de obrigação e lançamento ficam dentro de suas respectivas seções; os detalhes financeiros e de movimentos relacionados também exibem ações de edição contextualizadas.
- Criar e editar obrigação usa os endpoints individuais existentes. Criar/editar lançamento usa o endpoint de movimento comum; pagamentos continuam usando os endpoints específicos de pagamento.
- Para tipos que exigem obrigação, o formulário solicita o vínculo com uma obrigação. Faltas, atrasos, saída antecipada e anotações podem ser registrados sem obrigação.
- O formulário não altera automaticamente o status de uma obrigação após salvar um pagamento. O usuário deve revisar o status explicitamente.
- As ações de sugestão e exclusão estão apenas apresentadas visualmente; ainda não executam análise nem exclusão.
- O cadastro rápido de funcionário solicita nome e documento e, após salvar, abre a ficha. O formulário cadastral completo e a etapa opcional de criação de vínculo ficam para a próxima evolução.
