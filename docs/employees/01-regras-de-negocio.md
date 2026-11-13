# Módulo de colaboradores — Regras de negócio

> Documento de referência funcional. Reúne as decisões discutidas antes da implementação. Não representa parecer jurídico, folha oficial ou definição final de todos os detalhes técnicos.

## 1. Objetivo e limites do módulo

O módulo deve ajudar a oficina a organizar informações dos colaboradores, vínculos, competências/obrigações administrativas, movimentações financeiras e não financeiras e histórico.

O cenário inicial inclui pessoas que já colaboram com a empresa sem formalização, mas a estrutura deve permitir registrar futuras relações CLT, PJ e outras modalidades sem reconstrução do módulo.

O Blue Admin será um **assistente administrativo**, não um comandante de folha de pagamento ou autoridade jurídica/contábil. Deve apresentar informações, cálculos estimados, alertas e sugestões transparentes. A decisão de reconhecer valores, criar obrigações e confirmar pagamentos permanece com o responsável.

### Princípios obrigatórios

1. **Flexibilidade:** aceitar dados incompletos, registros retroativos e ajustes manuais justificados.
2. **Histórico preservado:** alterações relevantes devem ser rastreáveis; não sobrescrever silenciosamente o passado.
3. **Separação de conceitos:** pessoa, vínculo, competência, obrigação, evento, pagamento e crédito/adiantamento são conceitos distintos.
4. **Revisão humana:** sugestões do sistema não são dívidas reconhecidas e não geram pagamentos automaticamente.
5. **Integridade financeira:** pagamentos, alocações, saldos e créditos precisam fechar matematicamente.
6. **Evolução:** permitir futura ampliação para INSS, FGTS, IRRF, eSocial e integrações oficiais sem exigir refazer a base.
7. **Neutralidade jurídica:** a modalidade cadastrada é uma informação administrativa; não determina por si só a natureza jurídica real da relação.

## 2. Conceitos fundamentais

- **Colaborador:** a pessoa cadastrada.
- **Vínculo (engagement):** período/relação daquela pessoa com a empresa, com modalidade, função, remuneração e situação próprias.
- **Competência:** período ao qual um valor ou evento se refere (por exemplo, salário de novembro).
- **Obrigação reconhecida:** valor administrativo que foi revisado e confirmado pelo responsável como devido.
- **Sugestão:** cálculo ou item esperado apresentado pelo sistema, ainda não reconhecido e que não deve compor dívida confirmada.
- **Movimentação:** registro de pagamento, ausência, atraso, ajuste, adiantamento, correção ou outro evento.
- **Alocação:** parte de um pagamento ou crédito direcionada a uma obrigação específica.
- **Histórico:** trilha de auditoria de mudanças relevantes, com data efetiva e data de registro.

A data do evento e a competência afetada não são necessariamente iguais. Exemplo: uma ausência em 12/11 pode afetar a competência salarial de novembro, cujo pagamento pode ocorrer em dezembro.

## 3. Estrutura funcional em seis partes

### 3.1 Colaboradores — `employees`

Representa a pessoa, não o vínculo.

Campos previstos:
- `id` (UUID)
- `name` (obrigatório)
- `cpfCnpj` (opcional, texto; aceitar CPF numérico e CNPJ numérico ou alfanumérico de 14 posições)
- `address` (opcional)
- `birthDate` (opcional)
- `observations` (opcional)
- `createdAt` e `updatedAt`

Regras:
- Permitir cadastro com informações incompletas.
- Não colocar situação ativo/inativo na pessoa; essa situação pertence ao vínculo.
- Uma pessoa pode ter vários vínculos ao longo do tempo.
- CPF/CNPJ não deve ser obrigatório para cadastrar registros históricos/incompletos. Normalizar removendo máscara e mantendo letras em maiúsculo. O CNPJ alfanumérico aceita letras e números nas 12 primeiras posições e mantém os dois dígitos verificadores numéricos; CNPJs numéricos existentes continuam válidos. Documento informado deve ser validado e único, mas nulos são permitidos.

### 3.2 Vínculos — `employee_engagements`

Representa cada período de relação da pessoa com a oficina.

Campos previstos:
- `id` (UUID)
- `employeeId` (FK)
- `entryDate`
- `exitDate` (opcional)
- `position` (função/cargo)
- `currentSalary` (Decimal; pode ser nulo quando desconhecido ou não aplicável)
- `dailyHours` (opcional; horas diárias de referência, não horas efetivamente trabalhadas)
- `modality` (string: `clt`, `pj`, `nao_formalizado`, `outro`)
- `status` (string: `ativo`, `suspenso`, `afastado`, `encerrado`)
- `observations` (opcional)
- `createdAt` e `updatedAt`

Regras:
- Uma pessoa pode possuir vínculos sucessivos; o vínculo concentra os dados que mudam de um período para outro.
- A existência de vínculo ativo/suspenso/encerrado é controlada aqui, não em `employees`.
- Validar datas coerentes (por exemplo, saída não anterior à entrada).
- Detectar possíveis vínculos ativos sobrepostos e exigir revisão conforme a política da empresa; não presumir que todo caso de sobreposição seja inválido sem analisar o cenário.
- Mudanças de salário, função ou modalidade devem gerar histórico com valor anterior, novo valor e data efetiva.
- `currentSalary` representa o estado atual do vínculo. Competências já reconhecidas preservam seus próprios valores.
- Alterar o salário atual não deve reescrever competências passadas nem confirmar automaticamente competências futuras. O sistema deve sinalizar competências ainda não confirmadas que talvez precisem de revisão.
- Uma alteração retroativa exige ação explícita e avaliação dos efeitos nas competências afetadas.
- Referência horária administrativa pode ser exibida como salário / (30 × horas diárias), quando os dados existirem. Isso é apenas uma referência gerencial, não cálculo oficial de hora extra, adicional ou verba trabalhista.

### 3.3 Obrigações e competências — `employee_obligations`

Representa valores administrativos associados a um vínculo e a uma competência.

Campos previstos:
- `id` (UUID)
- `engagementId` (FK)
- `type` (string: `salario`, `decimo_terceiro`, `ferias`, `rescisao`, `bonus`, `comissao`, `ajuste`, `outro`; crédito de adiantamento não é obrigação)
- `title`
- `description` (opcional)
- `originalValue` (Decimal, pode ser nulo durante revisão)
- `finalValue` (Decimal, pode ser nulo durante revisão)
- `status` (string: `em_revisao`, `pendente`, `parcial`, `pago`, `cancelado`)
- `startReference` / `endReference` (opcionais, período de referência)
- `dueDate` (opcional, vencimento/pagamento previsto)
- `source` (string: `manual`, `sugestao_sistema`, `historico_importado`)
- `referenceKey` (chave de referência para evitar duplicação)
- `reviewedAt` (opcional)
- `createdAt` e `updatedAt`

Regras:
- Uma sugestão calculada não precisa ser gravada. O dashboard pode calcular sugestões a partir do vínculo e das competências existentes.
- Ao confirmar uma sugestão, o backend deve revalidar se ela ainda é válida e se não foi criada por outro fluxo/usuário.
- Usar uma chave estável por vínculo e referência, por exemplo `SALARY:2026-11`, `13TH:2026` ou uma chave de período aquisitivo de férias. A combinação apropriada deve ser protegida contra duplicidade no banco.
- `dueDate` é independente do período de referência.
- `originalValue` registra a estimativa/valor inicial quando aplicável; `finalValue` registra o valor revisado e reconhecido. A semântica exata deve ser mantida consistente no fluxo de revisão.
- Valores nulos são aceitáveis enquanto faltarem dados; não inventar valor para fechar cálculo.
- Sugestões não entram no saldo de obrigações reconhecidas, nem devem aparecer como dívida confirmada.
- Status de obrigação reconhecida deve refletir seu saldo: pendente sem pagamento/crédito aplicado; parcial com saldo reduzido; pago quando saldo chega a zero; cancelado quando anulada com justificativa.
- Uma obrigação cancelada não deve apagar pagamentos/alocações anteriores. Se já houver movimentação financeira, exigir fluxo de correção/estorno e preservar rastreabilidade.
- Mudanças em competências reconhecidas devem exigir justificativa e gerar histórico.
- A alteração de uma obrigação salarial não atualiza silenciosamente o salário atual do vínculo. O sistema pode sugerir essa atualização, deixando a decisão ao usuário.

#### Sugestões iniciais de competências

- **Salário:** sugerir competências mensais esperadas conforme datas e situação do vínculo e regras administrativas configuradas.
- **13º:** pode apresentar estimativa para qualquer modalidade cadastrada, deixando explícito que é uma previsão administrativa. Para CLT, regras legais específicas (incluindo mês com pelo menos 15 dias e remuneração variável) não devem ser simplificadas para uma média genérica sem validação.
- **Férias:** pode sugerir acompanhamento de períodos aquisitivos/concessivos e valores administrativos. Para CLT, períodos, fracionamento, faltas, adicional de 1/3 e prazo de pagamento têm regras próprias; não implementar um calculador jurídico completo nesta primeira versão.
- **Bônus e ajustes:** normalmente dependem de entrada manual ou de evento que gere sugestão.
- **Rescisão:** somente sugerir revisão quando houver encerramento do vínculo (`exitDate`). Listar pendências e preparar estimativa; nunca criar valor definitivo automaticamente.
- **Adiantamento/crédito:** não deve ser tratado como uma dívida comum da empresa com o colaborador. É saldo de dinheiro já pago que poderá ser aplicado a uma competência futura. A modelagem e o cálculo desse saldo devem ficar separados da dívida a pagar (ver seção 7).

Essas regras são administrativas e não substituem orientação profissional ou obrigações legais aplicáveis.

### 3.4 Movimentações — `employee_movements`

Livro de eventos financeiros e não financeiros do vínculo.

Campos previstos:
- `id` (UUID)
- `engagementId` (FK)
- `type` (string: `pagamento`, `falta`, `atraso`, `saida_antecipada`, `desconto`, `ajuste`, `bonus`, `aplicacao_adiantamento`, `estorno`, `registro_administrativo`)
- `title`
- `description` (opcional)
- `value` (Decimal opcional; pode ser nulo para eventos sem valor)
- `eventDate` (data em que o fato ocorreu/foi efetivado)
- `transactionId` (UUID opcional, referência a `financial_transactions`)
- `obligationId` (FK opcional para eventos não financeiros que afetem uma competência específica; pagamentos não devem depender desse vínculo direto)
- `sourceMovementId` (FK opcional para identificar a movimentação de adiantamento que está sendo aplicada; detalhes na seção 7)
- `createdAt` e `updatedAt`

Regras:
- Nem toda movimentação representa saída/entrada financeira. Ausência e atraso, por exemplo, podem ter valor nulo.
- Não interpretar qualquer movimentação com valor como pagamento.
- `transactionId` será **opcional em todos os casos**. Isso permite cadastrar fatos e pagamentos históricos anteriores à implantação ou sem transação financeira correspondente no Blue Admin.
- Quando uma movimentação representar um pagamento novo integrado ao financeiro, a criação da movimentação e da transação financeira deverá ocorrer atomicamente. A transação deve apontar para a movimentação por meio dos campos de origem já existentes no financeiro (`originType` / `originId`), e o movimento pode guardar o `transactionId` correspondente.
- Quando houver `transactionId`, validar que a transação existe, não está vinculada indevidamente a outro pagamento e corresponde ao valor esperado. A obrigatoriedade de vínculo deve ser definida pelo fluxo de criação atual, não pelo schema.
- Pagamento histórico pode ser registrado sem `transactionId`; nesse caso, deixar claro na interface que não existe vínculo financeiro no sistema.
- Ausência/atraso podem apontar para a competência afetada por `obligationId`, mas não devem gerar desconto automático. O sistema pode sugerir impacto; o usuário revisa e confirma o ajuste.
- Pagamentos confirmados não devem ser apagados/editados silenciosamente. Correções devem ser registradas por reversão/ajuste com justificativa e histórico.
- Para pagamento distribuído entre várias competências, não usar `obligationId` diretamente no movimento: usar a tabela de alocações.
- Vínculo e consistência entre pagamento, transação financeira e alocações devem ser validados no backend, dentro de transação Prisma.

### 3.5 Histórico — `employee_history`

Trilha de auditoria de mudanças relevantes.

Campos previstos:
- `id` (UUID)
- `employeeId` (FK)
- `engagementId` (FK opcional)
- `type` (string)
- `title`
- `description` (opcional)
- `metadata` (Json opcional, por exemplo valores antigo/novo e detalhes)
- `eventDate` (data efetiva da mudança)
- `createdAt` (data em que o registro foi gravado)

Regras:
- Histórico é trilha de auditoria, não fonte do estado atual.
- Registrar operações relevantes: cadastro, abertura/encerramento de vínculo, alteração de salário/função/modalidade, criação/cancelamento de obrigação, pagamento, aplicação de adiantamento e correções.
- Diferenciar data efetiva (`eventDate`) da data em que o sistema registrou (`createdAt`), permitindo lançamentos retroativos.
- Eventos de histórico não devem ser editados ou excluídos como se fossem dados comuns. Correções geram novos eventos.
- Não é necessário criar evento para toda alteração cosmética ou irrelevante; registrar mudanças com impacto administrativo/financeiro ou de vínculo.
- Consultas devem permitir agrupar por período e natureza, além de filtrar por colaborador/vínculo.

### 3.6 Alocações de pagamento — `employee_payment_allocations`

Tabela associativa para distribuir um pagamento entre várias obrigações e permitir pagamentos parciais.

Campos previstos:
- `id` (UUID)
- `movementId` (FK para a movimentação que representa o pagamento ou aplicação de crédito)
- `obligationId` (FK opcional; nulo somente para a reserva de crédito de adiantamento)
- `value` (Decimal positivo)
- `type` (string: `pagamento`, `credito_adiantamento`, `aplicacao_adiantamento`)
- `createdAt`

Cardinalidade:
- Uma movimentação de pagamento pode possuir várias alocações.
- Uma obrigação pode receber alocações de vários pagamentos.
- Uma obrigação pode ser quitada em partes.
- Todas as obrigações alocadas devem pertencer ao mesmo vínculo da movimentação.

Regras:
- Valor de cada alocação deve ser maior que zero.
- A soma das alocações de um pagamento deve fechar exatamente o valor do pagamento; não deixar sobra sem destino.
- A soma alocada a uma obrigação não pode exceder seu saldo reconhecido.
- A validação deve ocorrer no backend, em transação Prisma, considerando concorrência.
- O saldo de obrigação reconhecida é calculado com base no valor final confirmado menos os pagamentos e créditos efetivamente aplicados, respeitando reversões/correções.
- Status pendente/parcial/pago deve acompanhar o saldo; não depender de estado enviado pelo frontend.
- Uma alocação não pode misturar vínculos diferentes.
- A tabela deve distinguir pagamento em dinheiro de aplicação de adiantamento, pois aplicação de crédito não representa nova saída financeira.

## 4. Regras de pagamentos

Exemplo: salário de R$ 3.000 e bônus de R$ 500 em aberto. Um pagamento de R$ 3.500 pode ser dividido em duas alocações: R$ 3.000 no salário e R$ 500 no bônus.

Exemplo de pagamento parcial: uma obrigação de R$ 3.000 pode receber R$ 1.000 hoje e R$ 2.000 depois. O saldo passa por pendente, parcial e pago.

Regras adicionais:
- O pagamento deve ser confirmado pelo responsável.
- A interface apresenta as obrigações abertas, seus saldos e o valor ainda disponível para alocar.
- O usuário escolhe a distribuição; o sistema pode sugerir uma ordem, mas não deve decidir silenciosamente.
- Se o valor do pagamento for maior que as obrigações escolhidas, o excedente precisa ser destinado a um crédito de adiantamento ou o usuário deve corrigir o valor/distribuição antes de confirmar.
- Não permitir alocação acima do saldo de cada obrigação.
- O total das alocações precisa corresponder ao pagamento integral.
- Transação financeira, movimentação, alocações, crédito gerado e histórico devem ser consistentes e, quando criados juntos, atômicos.
- Registros antigos podem não ter transação financeira vinculada (`transactionId = null`).

## 5. Regras para ausência, atraso e ajustes

- Registrar o evento com data efetiva, descrição e valor opcional.
- Permitir vincular o evento à competência afetada.
- Não calcular nem aplicar desconto automaticamente.
- O sistema pode apresentar uma estimativa de impacto, explicando a regra utilizada e os dados considerados.
- O responsável revisa, altera se necessário e confirma uma obrigação/ajuste.
- Toda alteração confirmada deve deixar histórico com justificativa.
- Não alterar uma competência já paga sem fluxo explícito de correção/reversão e reavaliação das alocações.

## 6. Retroatividade e correções

- Permitir cadastrar colaboradores, vínculos, competências, eventos e pagamentos anteriores à implantação do módulo.
- Diferenciar data do acontecimento e data de registro.
- Não exigir `transactionId` para registros antigos.
- Não inventar transações financeiras retroativas apenas para satisfazer uma relação de banco.
- Correção não deve apagar o fato original: registrar reversão/correção, motivo, data efetiva e histórico.
- Ajustes retroativos podem exigir revisão de várias competências; o sistema deve mostrar o impacto antes da confirmação.

## 7. Adiantamentos e excedentes — regra acordada

O excedente de um pagamento não deve ficar sem destino nem ser confundido com uma nova dívida ou com uma segunda saída financeira.

### Fluxo esperado

1. O responsável registra um pagamento.
2. O sistema apresenta as obrigações abertas e seus saldos.
3. O responsável distribui o valor entre as obrigações.
4. Se houver excedente, o sistema oferece registrar esse valor como **crédito de adiantamento**.
5. O sistema procura competências futuras elegíveis e sugere uma competência destino (por exemplo, a próxima competência salarial ainda não quitada).
6. O responsável escolhe/confirma a competência destino sugerida; pode ajustar a escolha.
7. O crédito aplicado reduz o saldo a pagar daquela competência. Não cria um novo pagamento e não gera nova transação financeira.
8. O histórico deve mostrar o pagamento original, a origem do crédito, a competência destino, o valor aplicado e eventual saldo de crédito ainda disponível.

### Regras essenciais

- A competência destino será **sugerida pelo sistema e escolhida/confirmada pelo usuário**. A sugestão não é aplicação automática.
- O sistema pode priorizar a próxima competência futura compatível, mas deve mostrar o motivo da sugestão e permitir escolha de outra competência elegível.
- Um crédito não pode ser aplicado acima do saldo da competência destino.
- Um crédito pode ser aplicado parcialmente; o saldo remanescente continua disponível.
- O mesmo crédito não pode ser consumido duas vezes.
- Aplicar um adiantamento não representa saída de caixa nova. A saída aconteceu no pagamento original.
- A aplicação reduz a obrigação futura; não altera o valor original reconhecido da competência, apenas seu saldo.
- A origem do crédito deve permanecer rastreável até o pagamento original.
- Não usar uma competência comum como se fosse uma dívida negativa sem distinguir explicitamente o tipo e a semântica de crédito.
- A modelagem final deve permitir validar atomicamente: crédito disponível, valor aplicado, saldo da competência e vínculo de origem.

### Diretriz técnica a preservar

A estrutura de seis partes deve ser mantida, sem criar uma tabela extra sem necessidade. A proposta é registrar o pagamento original como movimentação financeira, reservar a parcela excedente como crédito identificável e registrar cada aplicação futura como movimentação não financeira ligada à movimentação de origem (`sourceMovementId`), com alocação para a competência destino. A tabela de alocações deve distinguir `payment` de `advance_application`. O saldo do crédito deve ser calculável pela origem menos aplicações válidas e reversões.

**Ponto de validação na implementação:** fechar o modelo relacional e as restrições para que a alocação inicial do pagamento ao crédito e as aplicações futuras não contem o mesmo dinheiro duas vezes, nem exijam que a soma de alocações de uma aplicação represente uma nova transação. A regra funcional acima está acordada; a forma exata de persistir o crédito deve ser revisada junto do schema antes da migration.

## 8. Modalidade e cautela legal

Modalidades iniciais administrativas: informal/não formalizado, CLT, PJ e outro. A lista deve ser extensível.

A empresa pode decidir acompanhar administrativamente 13º, férias, bônus e outras verbas para pessoas de qualquer modalidade. Isso não altera a natureza jurídica da relação nem transforma automaticamente um benefício administrativo em obrigação legal. O sistema deve evitar textos que afirmem que uma pessoa é juridicamente CLT/PJ apenas porque essa opção foi selecionada.

O módulo não deve implementar nesta fase:
- cálculo oficial de folha;
- cálculo definitivo de INSS, FGTS, IRRF ou encargos;
- cálculo jurídico completo de férias, 13º, rescisão, horas extras ou descontos;
- geração/transmissão de eSocial;
- decisão automática de vínculo empregatício;
- pagamento automático ou reconhecimento automático de dívida.

Esses itens podem ser avaliados futuramente com regras validadas e orientação profissional.

## 9. Listas de valores e shareds

Não utilizar enums do banco de dados/Prisma para modalidade, status, tipo de obrigação, tipo de movimentação, tipo de histórico ou tipo de alocação.

Persistir esses valores como strings. Centralizar as listas e constantes em arquivos `shared` compartilhados entre backend e frontend quando a arquitetura atual permitir. A validação efetiva deve existir no backend; o frontend consome as opções para exibição e formulários.

Ao alterar uma lista:
- atualizar o shared central;
- revisar validações, filtros, labels e traduções;
- preservar compatibilidade com registros antigos;
- não renomear/remover valores persistidos sem estratégia de migração de dados.

## 10. Consultas e dashboard — comportamento esperado

Ao abrir o dashboard, o backend deve reunir colaboradores e vínculos relevantes, obrigações reconhecidas, movimentações e saldos, além de calcular sugestões esperadas.

A primeira versão não terá worker, cron ou rotina em background para gerar obrigações. As sugestões serão calculadas sob demanda pelas queries. Isso evita gravar obrigações sem revisão e reduz duplicações.

Consultas devem separar claramente:
- obrigações reconhecidas e seus saldos;
- sugestões não confirmadas;
- créditos de adiantamento disponíveis e aplicações;
- pagamentos com vínculo financeiro e registros históricos sem `transactionId`;
- eventos não financeiros (ausências, atrasos, observações);
- histórico auditável.

A confirmação de uma sugestão deve revalidar a situação atual e impedir duplicidade por `referenceKey`. O dashboard não deve gravar dados como efeito colateral de uma consulta.

## 11. Decisões fechadas e pontos para validar

### Decisões fechadas
- Seis partes funcionais/tabelas principais, incluindo alocações.
- Pessoa separada do vínculo.
- Modalidade/status/tipos persistidos como strings, sem enums no banco.
- Listas centralizadas em shareds.
- `transactionId` opcional em todos os casos.
- Sugestões calculadas sob demanda; sem worker inicialmente.
- Revisão humana obrigatória para reconhecer obrigações e confirmar pagamentos.
- Pagamento pode quitar várias competências; competência pode receber pagamentos parciais.
- Excedente vira crédito de adiantamento, com competência destino sugerida pelo sistema e confirmada pelo usuário.
- Aplicação do crédito não gera nova saída financeira.
- Histórico preservado; correções por novos registros, não apagamento silencioso.

### Pontos técnicos que precisam ser definidos antes/durante o schema
- Valores finais e labels das listas shared.
- Estratégia de unicidade para CPF/CNPJ opcional.
- Regras exatas de sobreposição de vínculos.
- Formato final de `referenceKey` para cada tipo de competência.
- Como persistir o crédito de adiantamento e suas aplicações sem dupla contagem; preservar o fluxo funcional da seção 7.
- Política de reversão de pagamentos/alocações e reflexo no saldo.
- Se eventos de ausência/atraso poderão afetar mais de uma competência (a primeira proposta prevê um `obligationId` opcional por evento).
- Regras de permissão/autorização, conforme padrão de autenticação atual do projeto.


## 12. Regras operacionais consolidadas para a primeira camada do backend

- A lista de modalidades, status, tipos e origens é persistida como String; não usar enums Prisma. Os valores permitidos ficam em shareds em português.
- CPF é validado como documento numérico de 11 posições. CNPJ aceita o formato numérico existente e o alfanumérico de 14 posições, mantendo letras nas 12 primeiras e dígitos verificadores numéricos. O documento é opcional, normalizado e único quando informado.
- O saldo salarial proporcional e o valor-hora referencial usam uma referência administrativa de 30 dias. Não substituem divisor contratual ou cálculo oficial de folha.
- O 13º CLT estima 1/12 por mês com pelo menos 15 dias no vínculo, usando a remuneração-base informada. Médias variáveis, adicionais, afastamentos e projeção de aviso exigem revisão.
- Férias adquiridas usam as faixas de dias de direito por faltas injustificadas (30, 24, 18, 12 ou zero) e adicional de 1/3. Há helper separado para estimativa proporcional. Períodos, afastamentos, abono, médias e motivo de rescisão precisam ser conferidos.
- Falta e atraso são registrados como ocorrências. O helper de atraso aplica a tolerância de 5 minutos por marcação e 10 minutos diários como triagem CLT; não cria desconto.
- Um desconto só é registrado por ação explícita do responsável, com justificativa e obrigação de destino. O backend reduz `finalValue`, preserva `originalValue`, impede que o novo valor fique abaixo do total já pago e grava histórico. A ocorrência que motivou o desconto permanece separada.
- Rescisão não é calculada automaticamente por motivo. O helper apenas consolida componentes previamente calculados/revisados; aviso prévio, FGTS, encargos, médias e compensações exigem dados e validação.
- Um pagamento pode ser distribuído entre obrigações e crédito de adiantamento. A alocação `credito_adiantamento` usa `obligationId = null`; aplicações futuras são movimentações não financeiras com `sourceMovementId` apontando para o pagamento original e alocação `aplicacao_adiantamento`. Aplicar crédito não cria nova transação financeira.
- `transactionId` é opcional. Pagamentos históricos podem existir sem transação; pagamentos novos podem criar uma transação de despesa ou vincular uma transação de despesa existente ainda sem origem.
- Ocorrências e aplicações de adiantamento podem ser estornadas com motivo. Pagamentos não são estornados pelo fluxo genérico: exigem fluxo financeiro específico para não apagar ou distorcer a saída de caixa.
- Nesta etapa não foram criadas queries específicas de dashboard/filtros/histórico, nem telas frontend. Os fluxos de escrita e a estrutura de domínio são a base para essas etapas futuras.


### Observação sobre os status das obrigações

O status `pago` representa saldo reconhecido zerado. Quando isso ocorrer após pagamento parcial combinado com desconto confirmado, a movimentação de desconto e seu histórico deixam explícito que parte do valor foi abatida, não paga em dinheiro. O saldo é sempre a fonte para determinar se ainda há valor em aberto.
