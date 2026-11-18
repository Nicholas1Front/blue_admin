# Módulo de funcionários — Regras de negócio

> Documento de referência funcional. Consolida o que foi acordado até agora. Não é parecer jurídico, contábil nem especificação de folha oficial.

## 1. Objetivo e limites

O módulo deve permitir à oficina:

- Cadastrar e consultar funcionários atuais e antigos em um só lugar.
- Registrar vários vínculos/admissões da mesma pessoa ao longo do tempo.
- Acompanhar salários, férias, décimo terceiro, bonificações, rescisões acordadas e outras obrigações.
- Saber o que está pendente, parcialmente pago, pago ou próximo do vencimento.
- Registrar faltas, atrasos, alterações salariais e outras movimentações relevantes.
- Registrar pagamentos e identificar exatamente quais obrigações foram quitadas.
- Incluir registros antigos mesmo quando não existirem todos os documentos ou datas.

O Blue Admin será um **assistente administrativo**, não um motor de folha de pagamento. Não serão implementadas todas as regras de CLT/PJ neste primeiro escopo. Não haverá cálculo automático definitivo de rescisão, impostos ou encargos. O responsável decide quais valores reconhecer e quando criar obrigações.

## 2. Princípios

1. Simplicidade: cada entidade deve ter responsabilidade clara; não criar tabelas auxiliares sem necessidade demonstrada.
2. Histórico: preservar alterações importantes e acontecimentos financeiros/administrativos.
3. Flexibilidade: aceitar registros retroativos, dados incompletos e datas desconhecidas.
4. Separação: pessoa, vínculo, obrigação, movimentação e alocação são conceitos distintos.
5. Revisão humana: sugestões não criam obrigações automaticamente.
6. Integridade financeira: valores pagos devem ser distribuídos e rastreáveis; não contar uma mesma saída financeira duas vezes.
7. Precisão: preservar competência, data do acontecimento, vencimento e data efetiva de pagamento como informações distintas.

## 3. Conceitos

- **Employee:** pessoa cadastrada.
- **EmployeeEngagement:** cada vínculo/contrato que a pessoa teve com a empresa.
- **EmployeeObligation:** valor que a empresa reconheceu que deve ao funcionário.
- **EmployeeMovement:** acontecimento ou operação registrada durante um vínculo.
- **EmployeePaymentAllocation:** distribuição de um pagamento entre obrigações ou destinação de excedente.
- **EmployeeHistory:** histórico de alterações cadastrais, contratuais e movimentações importantes.
- **Competência/referência:** período ao qual a obrigação ou movimentação diz respeito.
- **Vencimento:** data em que a obrigação deve ser paga.
- **Sugestão:** resultado apresentado pelo sistema que ainda depende de decisão do usuário.

A data do acontecimento não precisa ser igual à competência afetada ou ao vencimento. Exemplo: uma falta ocorre em novembro, o responsável escolhe aplicar o desconto ao salário da competência novembro e esse salário vence em dezembro.

## 4. Funcionário — `employees`

Representa a pessoa, independentemente dos vínculos.

Campos candidatos:
- `id`
- `name`
- documento opcional, caso seja útil ao cadastro
- dados pessoais opcionais que realmente forem utilizados
- `observations`
- `createdAt` e `updatedAt`

Regras:
- O cadastro deve aceitar informações incompletas.
- Não colocar salário, modalidade ou status do vínculo no funcionário.
- Uma pessoa pode possuir vários vínculos ao longo do tempo.
- Não exigir CPF/CNPJ nem criar validações complexas sem necessidade funcional definida.

## 5. Vínculo — `employee_engagements`

Representa cada período de relação da pessoa com a oficina.

Campos candidatos:
- `id`
- `employeeId`
- `entryDate` (pode ser desconhecida)
- `exitDate` (pode ser desconhecida)
- `status`
- `currentSalary` (remuneração bruta atual, quando conhecida)
- `hourlyRate` (valor da hora informado/administrado)
- `modality` (CLT, PJ ou outra modalidade)
- `observations`
- timestamps

Regras:
- Uma pessoa pode ser admitida, desligada e readmitida quantas vezes forem necessárias. Cada relação será um novo vínculo.
- O status pertence ao vínculo, não à pessoa.
- Datas desconhecidas devem ser aceitas. Não inventar datas para completar registros antigos.
- A ausência de `exitDate` não deve, sozinha, definir o status; o status é um dado próprio.
- O salário e o valor da hora no vínculo representam o estado atual.
- Mudanças salariais serão registradas em `employee_history`, com evento específico, valor anterior, valor novo e data efetiva.
- Alterar o salário atual não deve reescrever obrigações antigas nem alterar pagamentos já registrados.
- A política para vínculos sobrepostos ainda precisa ser definida; não presumir bloqueio automático.

## 6. Obrigações — `employee_obligations`

Representa o que a empresa reconhece que deve ao funcionário.

Tipos iniciais esperados:
- salário;
- férias;
- décimo terceiro;
- bonificação;
- rescisão acordada;
- ajuste;
- outros tipos administrativos que forem necessários.

Campos candidatos:
- `id`
- `engagementId`
- `type`
- `title` ou descrição curta
- `description` opcional
- `referenceStart` e `referenceEnd` (competência/período; opcionais quando desconhecidos ou não aplicáveis)
- `dueDate` (vencimento opcional)
- `originalValue`
- `finalValue`
- `status`
- `observations`
- timestamps

Regras:
- Uma obrigação sempre pertence a um vínculo.
- Competência/período de referência e vencimento são campos distintos.
- A obrigação pode ser cadastrada manualmente, inclusive retroativamente.
- O sistema pode sugerir obrigações recorrentes, mas o usuário decide se cria.
- Sugestões não entram no total devido nem são consideradas dívidas reconhecidas.
- Uma obrigação criada e confirmada não deve ser duplicada para a mesma referência por acidente.
- Para salário e décimo terceiro, deve existir uma referência identificável que permita detectar a obrigação já criada. A estratégia exata de unicidade será definida no schema.
- Uma obrigação pode ser paga em várias parcelas.
- Uma obrigação pode ser quitada por uma única alocação ou por várias alocações originadas de pagamentos distintos.
- Alterar competência, vencimento ou valor de uma obrigação deve gerar evento em `employee_history`, preservando os valores anteriores e novos no metadata.
- Não haverá tabela auxiliar exclusiva para histórico de obrigações.
- A regra de cancelamento quando já existem alocações deverá preservar a trilha financeira; não apagar pagamentos anteriores.

Status conceituais:
- em revisão: ainda não reconhecida definitivamente;
- pendente: obrigação reconhecida sem quitação;
- parcial: parte do valor foi quitada;
- pago: saldo zerado;
- cancelado: obrigação anulada por decisão registrada.

## 7. Sugestões recorrentes

O módulo poderá sugerir competências de salário e obrigações recorrentes ou periódicas.

Fluxo:
1. O backend consulta vínculo, datas conhecidas e obrigações existentes.
2. Calcula quais referências podem precisar de registro.
3. Retorna sugestões separadas das obrigações confirmadas.
4. O usuário revisa, ajusta ou descarta a sugestão.
5. Somente após confirmação explícita a obrigação é criada.
6. A criação revalida no banco se a mesma referência já foi registrada, para evitar duplicidade.

Não implementar worker/cron para criar obrigações automaticamente nesta etapa.

## 8. Movimentações — `employee_movements`

Registra acontecimentos relacionados ao vínculo.

Exemplos:
- falta;
- atraso;
- saída antecipada;
- pagamento;
- desconto;
- bonificação;
- alteração ou ajuste administrativo;
- outros registros importantes.

Campos candidatos:
- `id`
- `engagementId`
- `type`
- `description`
- `eventDate` (quando aconteceu)
- referência/competência afetada, quando aplicável
- `value`, quando houver valor
- `obligationId`, quando a movimentação afetar diretamente uma obrigação específica
- `financialTransactionId` opcional
- observações
- timestamps

Regras:
- Uma movimentação sempre pertence a um vínculo.
- Movimentações sem efeito financeiro podem ter valor nulo.
- Faltas e atrasos não geram descontos automaticamente.
- Quando houver desconto, o responsável escolhe a obrigação/competência em que ele será aplicado. A data do evento e a competência afetada podem ser diferentes.
- O desconto deve alterar o valor reconhecido da obrigação por um fluxo explícito e rastreável, sem apagar o valor original.
- Pagamentos são movimentações.
- `financialTransactionId` é opcional: pagamentos antigos ou registros administrativos podem não ter transação no módulo financeiro.
- Quando informado, o identificador aponta para a transação financeira correspondente. O vínculo deverá ser validado no backend e a integração deve respeitar o padrão de origem já existente no financeiro (`originType`/`originId`).
- Não criar uma transação financeira fictícia para registros históricos.
- Pagamentos e outras operações financeiras confirmadas não devem ser apagados ou editados silenciosamente; correções precisam preservar o histórico.

## 9. Alocações — `employee_payment_allocations`

A alocação é o mecanismo que explica como o valor de uma movimentação de pagamento foi destinado.

Cardinalidade:
- Uma movimentação de pagamento pode possuir várias alocações.
- Uma obrigação pode receber alocações de vários pagamentos.
- Uma obrigação pode ser quitada em parcelas.
- Uma movimentação pode quitar várias obrigações de uma só vez.

Campos candidatos:
- `id`
- `movementId` (movimentação de pagamento ou operação de aplicação, conforme o tipo)
- `obligationId` (obrigação destinatária; obrigatório para cada alocação)
- `type`
- `value`
- timestamps

Regras:
- O usuário escolhe como distribuir o pagamento. O sistema pode ajudar a sugerir, mas não deve impor uma única forma de pagar.
- Exemplo: um pagamento pode quitar salários atrasados, parte de férias e parte de rescisão em uma única operação, desde que cada parcela tenha sua própria alocação.
- O inverso também é permitido: uma obrigação pode receber pagamentos em várias datas.
- O total alocado deve fechar com o valor da movimentação de pagamento. Todo excedente precisa receber uma destinação escolhida pelo usuário.
- O excedente pode ser direcionado a outra obrigação pendente do mesmo vínculo.
- Alternativamente, o usuário pode escolher transformar o excedente em bonificação. Nesse caso, o sistema cria uma obrigação de bonificação, e o usuário escolhe a competência/período em que ela será registrada; a alocação identifica essa destinação.
- Não registrar o mesmo valor como nova saída financeira ao distribuir um pagamento já realizado.
- Não permitir alocar mais do que o saldo reconhecido de uma obrigação.
- Todas as obrigações alocadas devem pertencer ao mesmo vínculo da movimentação.
- A validação de saldo e distribuição deve ocorrer no backend, dentro de transação, protegendo contra operações concorrentes.
- Estornos/correções devem preservar as alocações originais e reverter seus efeitos de forma rastreável.

## 10. Histórico — `employee_history`

Será a trilha única de alterações cadastrais, contratuais e movimentações importantes.

Não haverá tabela separada de histórico salarial nem de histórico de obrigações.

O histórico deve distinguir:
- data efetiva do acontecimento/alteração;
- data em que o registro foi inserido no sistema.

Eventos esperados:
- cadastro e alteração de dados do funcionário;
- criação/alteração/encerramento de vínculo;
- alteração salarial, com valor anterior, valor novo e data efetiva;
- criação, revisão, alteração e cancelamento de obrigação;
- faltas, atrasos e movimentações importantes;
- pagamentos, alocações relevantes e correções.

O campo metadata pode armazenar detalhes estruturados, como valores anterior/novo, competência, obrigação afetada e motivo. O histórico não será fonte de saldo financeiro; sua finalidade é auditoria e contexto.

## 11. Análise e sugestão de competências

A análise é um mecanismo administrativo para identificar competências que podem precisar ser criadas ou revisadas. Ela consulta o vínculo, o histórico salarial e as obrigações já registradas. Não cria nem altera obrigações automaticamente.

A análise é feita por período mensal: mês/ano inicial e mês/ano final, ambos inclusivos. O período máximo aceito é de 40 anos. A consulta permite habilitar ou desabilitar separadamente os cálculos de salário, férias e décimo terceiro; por padrão, os três são executados.

### 11.1 Salários

O helper percorre cada mês do período e estima a obrigação salarial do vínculo.

- O valor mensal é proporcional aos dias corridos de vínculo ativo dentro do mês.
- Se houver alteração salarial com data efetiva dentro do mês, o cálculo divide o mês pelos intervalos em que cada salário esteve vigente.
- O divisor é a quantidade de dias corridos do mês. Exemplo: 15 dias ativos em um mês de 30 dias correspondem a 15/30 do salário.
- O histórico de alterações salariais é usado para reconstruir os valores por data efetiva.
- Quando o histórico não permite reconstrução de um mês passado, o helper pode usar a última competência salarial anterior como referência. Se não houver competência anterior, usa o salário atual apenas como estimativa e exige revisão para períodos passados.
- Competências salariais existentes são comparadas com o cálculo. A identificação e a proteção contra duplicidade consideram o mês/ano de referenceStart e referenceEnd, não a igualdade exata dos dias. Registros duplicados ou com referências incompletas exigem revisão.
- A referência mensal da obrigação usa o primeiro e o último dia do mês, mesmo quando o valor é proporcional.

Não são calculados descontos automáticos por falta, atraso ou saída antecipada. Também não são considerados adicionais variáveis ou regras específicas de folha.

### 11.2 Férias

O helper parte da data de entrada do vínculo e identifica períodos aquisitivos consecutivos de 12 meses. Se a data de entrada for desconhecida, mas existir uma competência válida de férias, pode projetar o próximo período a partir do dia seguinte ao referenceEnd da última competência registrada. Essa projeção exige revisão manual e não reconstrói os períodos anteriores.

- Cada período é representado por referenceStart e referenceEnd na obrigação do tipo férias.
- A identificação de uma competência de férias considera mês e ano de referenceStart e referenceEnd. Diferenças de dia não devem fazer o sistema tratar o mesmo período aquisitivo como uma competência diferente.
- As competências existentes são consultadas para reconhecer os períodos já registrados, identificar o último período conhecido e evitar duplicidade.
- O próximo período é identificado a partir da sequência aquisitiva do vínculo; o helper não reinicia o período aquisitivo pela data em que o pagamento foi registrado.
- A estimativa usa a remuneração disponível para o fim do período aquisitivo, acrescida de um terço, sem impostos ou retenções.
- Para identificar a remuneração, usa a última competência salarial anterior ou, quando necessário, o histórico salarial e o salário atual como estimativa.
- Quando já existe uma competência histórica de férias, mas não há histórico salarial suficiente, o valor original dessa obrigação é preservado como referência, em vez de substituí-lo pelo salário atual.
- Um período histórico completo sem obrigação registrada exige revisão manual: a ausência de registro não prova que as férias não foram concedidas ou pagas.
- O prazo concessivo é informado como 12 meses após o fim do período aquisitivo. Se estiver vencido, exige conferência sobre a concessão e eventual pagamento em dobro; o helper não aplica dobra automaticamente.
- dueDate permanece nulo quando não existe data real de início das férias. Não se inventa vencimento com base no período aquisitivo.

O cálculo não considera abono pecuniário, faltas que alterem os dias de férias, remuneração variável, suspensão/perda do período aquisitivo ou efeitos específicos de afastamentos. Vínculos encerrados e afastados exigem revisão.

### 11.3 Décimo terceiro

Para cada ano que intersecta o período consultado, o helper calcula os meses elegíveis desde janeiro até o mês final da análise naquele ano.

- Um mês conta quando existem pelo menos 15 dias de vínculo ativo nele.
- A base é a última competência de salário registrada até o mês de referência do cálculo, usando o valor original da obrigação salarial (remuneração bruta).
- Se não existir competência salarial anterior, utiliza currentSalary do vínculo como estimativa.
- Se a estimativa histórica depender de currentSalary ou de uma competência salarial de ano anterior, o resultado exige revisão manual.
- A fórmula administrativa acordada é salário de referência / 12 * meses trabalhados.
- A competência anual usa referenceStart em 1º de janeiro e referenceEnd em 31 de dezembro. Se a análise terminar antes de dezembro, o valor representa uma projeção acumulada até o mês final informado.
- O vencimento de referência é 20 de dezembro. O calendário legal também admite pagamento em parcela única até 30 de novembro ou em duas parcelas, com a segunda até 20 de dezembro.
- Competências existentes, valores pagos e saldos são apresentados para evitar duplicidade e preservar o histórico.

O ano de desligamento, vínculos afastados, salário de referência antigo, registros salariais ambíguos e ausência de dados confiáveis exigem revisão manual. O helper não calcula verbas rescisórias, impostos ou encargos.

### 11.4 Ações e segurança da análise

Cada sugestão retorna uma das ações:

- create: competência ausente e cálculo suficientemente confiável para revisão e criação pelo usuário;
- update: valor estimado diferente, obrigação pendente, sem pagamentos, movimentações ou ajuste manual no valor reconhecido;
- none: competência existente compatível com o cálculo;
- manual_review: dados incompletos, duplicidade, referência inválida, histórico insuficiente, obrigação cancelada ou em revisão, obrigação parcial sem alocações ou divergência que exigiria alterar uma obrigação paga/parcial ou com registros financeiros.

A resposta distingue valor estimado, valor reconhecido, total alocado como pago e saldo da obrigação. Uma sugestão não é uma dívida reconhecida e não entra no financeiro antes da criação explícita da competência. A criação individual e em lote aplica os mesmos critérios de referência para evitar duplicidade: mês/ano para salários, mês/ano de início e fim do período aquisitivo para férias e ano para décimo terceiro.

Os três benefícios são analisados para todas as modalidades de vínculo (CLT, PJ, Informal e outros), conforme decisão atual do projeto. A regra poderá ser revista futuramente.

### 11.5 Referências consultadas

- [Ministério do Trabalho e Emprego — perguntas frequentes sobre 13º salário e férias](https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/acoes-e-programas/programas-projetos-acoes-obras-e-atividades/proteja/duvidas-frequentes/perguntas-frequentes)
- [eSocial — pagamento do décimo terceiro salário](https://www.gov.br/esocial/pt-br/empregador-domestico/perguntas-frequentes/perguntas-frequentes)
- [Senado Federal — CLT, art. 142 (remuneração das férias na data da concessão)](https://legis.senado.gov.br/norma/530547/publicacao/37353698)

As regras servem como referência para estimativas administrativas do Blue Admin. Não substituem conferência contábil, orientação trabalhista ou convenção coletiva aplicável.

## 12. Funcionários e vínculos antigos

O módulo deve permitir reconstruir o histórico administrativo sem exigir que todos os dados antigos estejam disponíveis.

- Datas de entrada e saída podem ser desconhecidas.
- Salário atual pode ser conhecido mesmo quando o histórico salarial não está completo.
- Obrigações antigas podem ser lançadas manualmente.
- Pagamentos históricos podem ser registrados sem `financialTransactionId`.
- O usuário pode registrar o valor que a empresa reconhece como pendente, sem precisar reconstruir todo o cálculo passado.
- Helpers devem sinalizar limitações quando não houver dados suficientes.

## 13. Integração com o financeiro

O módulo financeiro já possui `FinancialTransaction`, com `originType` e `originId`.

Regras de integração:
- Uma movimentação de pagamento pode ter `financialTransactionId` nulo ou apontar para uma transação financeira existente/criada no mesmo fluxo.
- Uma saída financeira representa o dinheiro efetivamente pago.
- As alocações apenas distribuem essa saída entre obrigações; não criam novas despesas.
- A aplicação futura de um valor já pago não pode gerar uma segunda transação financeira.
- A relação e as regras de exclusão/edição devem ser definidas no schema e backend sem quebrar os fluxos existentes do financeiro.

## 14. Decisões ainda pendentes

Os pontos abaixo não devem ser resolvidos por suposição durante a implementação:
- Política para vínculos com períodos sobrepostos.
- Regras de operação em vínculo encerrado ou suspenso, distinguindo lançamento histórico de nova operação.
- Semântica final de datas desconhecidas em outros helpers e operações.
- Tratamento futuro de remuneração variável, adicionais, afastamentos e faltas nos cálculos.
- Política de correção/estorno de pagamento já vinculado ao financeiro.

Essas decisões serão fechadas quando o fluxo correspondente for desenhado, sem antecipar complexidade desnecessária.
