# Módulo de colaboradores (Employees)

> **Status: documentação de planejamento — novembro de 2026.**
>
> Este documento consolida o contexto, os objetivos, as decisões de negócio e os cuidados acordados para o futuro módulo de colaboradores do Blue Admin. Não representa uma implementação concluída, orientação jurídica ou definição final de schema Prisma. As propostas técnicas devem ser validadas antes de qualquer migration.

## 1. Objetivo do módulo

O módulo **Employees** deverá ajudar a oficina a organizar informações dos colaboradores e acompanhar, com transparência, valores combinados, obrigações administrativas, pagamentos, ocorrências e histórico.

O cenário atual inclui colaboradores sem formalização tradicional, mas existe a possibilidade de, nos próximos anos, contratar pessoas pelo regime CLT ou por prestação de serviços PJ. A empresa procura cumprir e registrar diversos compromissos com as pessoas que trabalham nela, mesmo quando a relação atual não está formalizada.

O Blue Admin deve apoiar esse controle sem tentar determinar a natureza jurídica da relação, substituir contador/advogado ou assumir o papel de uma folha de pagamento oficial.

### 1.1 O que o módulo deve ser

- Um **assistente administrativo** para registrar, organizar, consultar e conferir informações.
- Um lugar confiável para acompanhar compromissos, valores, pagamentos parciais e saldos.
- Um histórico rastreável de alterações, períodos de relacionamento, remuneração e ajustes.
- Uma ferramenta flexível para cadastrar dados atuais e reconstruir históricos antigos, inclusive quando parte das informações não estiver disponível.
- Uma base que possa evoluir futuramente para integrações e controles mais formais, sem exigir uma reconstrução completa.

### 1.2 O que o módulo não deve ser

- Não será, nesta primeira concepção, um sistema completo de folha de pagamento.
- Não será uma autoridade jurídica ou trabalhista.
- Não decidirá automaticamente se uma pessoa é CLT, PJ ou possui outra natureza jurídica.
- Não criará dívidas, descontos ou pagamentos definitivos com base em cálculos automáticos sem revisão e confirmação de uma pessoa responsável.
- Não presumirá que um valor histórico foi pago ou está em aberto apenas porque não existe registro suficiente.
- Não substituirá os sistemas, declarações ou validações oficiais exigidos por lei.

## 2. Princípios fundamentais acordados

Estes princípios devem orientar schema, serviços, queries, telas, cálculos e futuras integrações.

### 2.1 Natureza da relação e benefícios são conceitos distintos

O sistema precisa permitir registrar diferentes tipos administrativos de relacionamento, inicialmente:
- Não formalizado.
- CLT.
- PJ / prestação de serviços.
- Outros tipos que possam ser necessários futuramente.

Essa classificação é um dado administrativo informado por um responsável. **Uma opção selecionada no sistema não determina nem comprova a natureza jurídica real da relação.**

Também é possível registrar que a empresa decidiu conceder determinado benefício ou compromisso administrativo a uma pessoa não formalizada ou prestadora PJ. Registrar esse compromisso não transforma a relação em CLT, não altera sua natureza jurídica e não substitui obrigações legais ou contratuais aplicáveis.

Por isso, devem permanecer separados:
1. o tipo administrativo de relacionamento registrado;
2. a natureza e os documentos jurídicos/contratuais, quando conhecidos;
3. os benefícios e compromissos que a empresa decidiu acompanhar;
4. as obrigações legais ou contratuais, quando devidamente identificadas e validadas.

### 2.2 Revisão humana obrigatória

O sistema pode organizar dados, sugerir valores, apresentar estimativas e indicar possíveis pendências. Entretanto, uma pessoa responsável deve revisar e confirmar antes de transformar uma sugestão em obrigação financeira definitiva ou pagamento.

Isso vale especialmente para:
- salário/remuneração e alterações retroativas;
- 13º salário;
- férias;
- descontos por faltas, atrasos ou saídas antecipadas;
- bônus, comissões e adiantamentos;
- encerramento de relacionamento e verbas de saída;
- recálculos de competências já encerradas.

Uma estimativa nunca deve aparecer como dívida confirmada.

### 2.3 Histórico preservado

Alterações relevantes precisam ser rastreáveis. O módulo deve preservar, quando aplicável:
- o valor anterior e o novo;
- a data em que a mudança passou a valer (**data de vigência/efetiva**);
- a data em que a mudança foi registrada no sistema (**data de registro**);
- o motivo ou justificativa;
- o responsável pelo registro, quando houver identificação de usuário disponível.

Não se deve sobrescrever informações históricas importantes como se elas sempre tivessem sido iguais ao valor atual.

### 2.4 Cadastro flexível e reconstrução histórica

O cadastro deve aceitar datas retroativas, registros inseridos muito tempo depois do acontecimento, informações parciais, campos ainda desconhecidos, valores informados manualmente e correções justificadas.

Não obrigar o usuário a inventar datas, comprovantes ou valores para conseguir salvar um cadastro.

### 2.5 Integridade financeira

Obrigação, pagamento e alocação de pagamento são conceitos diferentes e precisam continuar independentes.

O módulo deve permitir:
- uma obrigação paga integralmente;
- uma obrigação paga parcialmente;
- várias parcelas para uma obrigação;
- um pagamento que cubra mais de uma obrigação;
- valores negociados e parcelados, quando cabível;
- correção/reversão rastreável de lançamentos;
- conciliação com as transações financeiras já existentes no Blue Admin.

O saldo deve ser calculado a partir dos valores da obrigação e das alocações válidas, e não mantido como uma informação independente que possa divergir.

### 2.6 Evolução sem refazer a base

A modelagem deve evitar bloquear futuras funcionalidades, como controles específicos de INSS, FGTS, IRRF, eSocial e integrações oficiais. Isso não significa implementar esses recursos agora: significa evitar decisões que tornem uma evolução futura desnecessariamente difícil.

## 3. Escopo funcional esperado

### 3.1 Cadastro de colaboradores

Informações inicialmente consideradas:
- nome;
- data de nascimento;
- CPF ou CNPJ, conforme o caso;
- endereço e formas de contato;
- observações administrativas;
- situação cadastral/operacional;
- datas importantes, quando conhecidas.

O cadastro pessoal deve existir independentemente dos períodos de relacionamento. Uma pessoa pode ter um relacionamento encerrado e, futuramente, iniciar outro, sem perder seu histórico anterior.

Campos desconhecidos devem permanecer nulos/pendentes, sem valores fictícios. A validação de CPF/CNPJ e a obrigatoriedade de cada documento ainda precisam ser definidas conforme os cenários reais de cadastro.

### 3.2 Períodos de relacionamento

Uma pessoa pode ter um ou mais períodos de relacionamento com a empresa. Cada período deve poder registrar, conforme aplicável:
- tipo administrativo de relacionamento;
- data de início;
- data de encerramento;
- função/atividade;
- forma ou periodicidade de remuneração;
- valor combinado ou referência de remuneração;
- informações contratuais/documentais;
- observações e motivo de encerramento.

O encerramento de um período não deve apagar o cadastro da pessoa nem seus registros anteriores. Uma recontratação ou novo acordo deve poder gerar um novo período.

Não se deve presumir que todo colaborador terá um contrato formal ou que todos os campos serão conhecidos.

### 3.3 Histórico de remuneração

A remuneração deve ter histórico próprio, com:
- valor;
- periodicidade/unidade (por exemplo, mensal, diária, por hora ou outra modalidade necessária);
- data de início de vigência;
- data final de vigência, quando aplicável;
- motivo da alteração;
- observação;
- data de registro.

O valor atual deve ser identificado a partir do histórico vigente, e não depender de um campo duplicado que possa ficar desatualizado.

Uma alteração retroativa precisa manter a diferença entre quando passou a valer e quando foi cadastrada. Se afetar competências já fechadas ou obrigações já geradas, o sistema deve sinalizar a necessidade de revisão; não deve recalcular silenciosamente registros anteriores.

### 3.4 Obrigações financeiras

O módulo deverá acompanhar compromissos financeiros associados ao colaborador. Exemplos de tipos que podem existir:
- remuneração/salário;
- 13º;
- férias;
- rescisão/encerramento;
- bônus;
- comissão;
- adiantamento ou outros compromissos definidos pela empresa;
- ajustes manuais devidamente identificados.

Cada obrigação deve ter, conceitualmente:
- colaborador;
- período de relacionamento, quando aplicável;
- tipo;
- competência/período de referência, quando aplicável;
- vencimento, quando conhecido;
- valor original;
- origem (manual, cálculo revisado, histórico importado etc.);
- situação de confirmação;
- observações e justificativas;
- dados ou parâmetros usados para chegar ao valor, quando calculado.

Uma obrigação pode estar em aberto, parcialmente paga, paga, vencida, cancelada ou aguardando confirmação, conforme os estados que forem definidos na implementação. Os estados finais devem ser derivados de regras claras, evitando estados contraditórios.

**Não confundir ausência de informação com obrigação em aberto.** Registros históricos sem confirmação devem ficar em uma área de reconciliação/pendência e não entrar no total confirmado a pagar.

### 3.5 Pagamentos e alocações

O sistema deve registrar o fato de que um pagamento ocorreu, com data, valor, meio e informações de referência/comprovante, quando disponíveis.

Um pagamento pode ser:
- alocado integralmente a uma obrigação;
- dividido entre várias obrigações;
- parcial em relação a uma obrigação;
- registrado inicialmente sem alocação, aguardando conciliação, se houver justificativa operacional.

A entidade de alocação deve representar quanto de determinado pagamento foi destinado a determinada obrigação.

Exemplo conceitual:
- obrigação: R$ 1.725,50;
- pagamento alocado: R$ 1.000,00;
- saldo confirmado: R$ 725,50.

O sistema deve impedir alocação superior ao valor disponível do pagamento ou ao saldo da obrigação, considerando concorrência e transações simultâneas.

### 3.6 Integração com o financeiro existente

O Blue Admin já possui a entidade FinancialTransaction, com categoria obrigatória, valor, tipo, data de referência e campos de origem (originType e originId).

O pagamento do colaborador deverá se relacionar com uma transação financeira existente ou criada no mesmo fluxo. A integração deve:
- manter uma referência rastreável entre pagamento e transação;
- evitar duplicidade de lançamentos;
- garantir consistência se uma das gravações falhar;
- respeitar a estrutura atual de categorias e transações;
- não excluir a transação financeira ao corrigir um registro de colaborador sem uma regra explícita e auditável.

Os campos originType/originId atuais são uma referência polimórfica, não uma chave estrangeira relacional para qualquer tabela. A solução concreta deve considerar essa característica e não presumir integridade referencial que o schema atual não oferece.

### 3.7 Ajustes financeiros

O módulo deve permitir registrar ajustes positivos ou negativos, como bônus, comissão, adiantamento, desconto acordado, ajuste manual ou desconto eventualmente relacionado a uma ocorrência de frequência.

Cada ajuste precisa ter valor, data, competência quando aplicável, motivo, origem e situação de revisão/confirmação.

Ajuste não deve ser confundido com ocorrência de frequência. Uma falta ou atraso pode existir sem gerar qualquer desconto. Se houver decisão de descontar, isso deve gerar um ajuste financeiro separado, revisado e justificado.

### 3.8 Frequência e ocorrências

O módulo poderá registrar:
- falta;
- atraso;
- saída antecipada;
- hora extra;
- afastamento/licença;
- justificativa;
- outras ocorrências relevantes.

O registro da ocorrência não deve, por si só, modificar remuneração, criar desconto ou alterar obrigação. Uma consequência financeira, se aplicável, será um ajuste separado e confirmado por responsável.

### 3.9 Observações e histórico administrativo

Deve existir espaço para observações administrativas e eventos importantes. O histórico precisa ajudar a entender o que aconteceu sem misturar:
- alterações cadastrais;
- mudanças de relacionamento;
- mudanças de remuneração;
- criação/alteração/cancelamento de obrigações;
- pagamentos e correções;
- frequência;
- ajustes;
- encerramentos.

A solução pode combinar histórico específico por domínio e trilha de auditoria, mas não deve gerar registros duplicados sem utilidade.

## 4. Situações históricas e grau de confiança

O histórico da empresa pode estar incompleto. O sistema precisa representar a qualidade da informação, sem transformar suposições em fatos.

Estados conceituais de confiança/proveniência:
- **Confirmado:** há comprovante, transação financeira ou outra evidência considerada suficiente.
- **Informado manualmente:** dado repassado por uma pessoa responsável, sem documento anexado.
- **Estimado:** valor ou período aproximado, ainda sujeito a validação.
- **Pendente de verificação:** existe um dado ou possível compromisso que precisa ser conferido.
- **Desconhecido:** não há informação suficiente para afirmar o que ocorreu.

Esses estados são diferentes do estado financeiro da obrigação. Por exemplo, “pago” e “confirmado” não são sinônimos: uma informação pode estar confirmada como pendente, e um pagamento pode estar informado manualmente sem comprovante.

Regras:
1. Valor desconhecido não deve ser convertido em zero como se o histórico estivesse completo.
2. Ausência de pagamento cadastrado não prova que a obrigação está em aberto.
3. Ausência de obrigação cadastrada não prova que nada era devido.
4. Estimativas devem ficar visualmente separadas dos valores confirmados.
5. A tela deve oferecer uma forma de revisar e reconciliar pendências históricas.
6. O usuário deve poder registrar a origem da informação e observações sobre sua confiabilidade.

## 5. Competências e fechamento de período

A ideia é oferecer um fluxo de fechamento/revisão de competência, sem gerar lançamentos automaticamente antes da confirmação.

Fluxo conceitual:
1. Conferir o relacionamento vigente e a remuneração aplicável.
2. Conferir as ocorrências de frequência.
3. Conferir ajustes, bônus, comissões e adiantamentos.
4. Conferir compromissos especiais, como 13º, férias e valores anteriores.
5. Apresentar um resumo com memória de cálculo, pendências e alertas.
6. Permitir editar/corrigir os dados ainda não confirmados.
7. Solicitar confirmação explícita.
8. Somente após a confirmação criar as obrigações correspondentes e registrar os parâmetros utilizados.

Competências encerradas não devem ser alteradas silenciosamente. Uma mudança retroativa deve gerar alerta e exigir decisão explícita sobre correção/reprocessamento, preservando os valores e registros anteriores.

## 6. Férias, 13º e compromissos especiais

O sistema pode oferecer controles e estimativas para compromissos como férias e 13º, mas não deve aplicar automaticamente uma regra única a todos os colaboradores.

- Para relacionamento CLT, regras legais dependem da legislação vigente, datas, remuneração, afastamentos, pagamentos e outras condições.
- Para PJ ou relação não formalizada, qualquer valor registrado pode decorrer de contrato, acordo ou política interna, não devendo ser apresentado como direito CLT automático.
- A empresa pode decidir registrar um compromisso administrativo mesmo em uma relação não formalizada ou PJ.
- Descontos ou ajustes em férias/13º devem ser explícitos, justificados e revisados.
- A memória de cálculo e os parâmetros usados devem ser preservados para que uma alteração futura de configuração não reescreva o passado.

A implementação de cálculos legais deve depender de validação profissional e fontes oficiais atualizadas. Esta documentação não fixa fórmulas legais nem prazos como regra definitiva de software.

## 7. Encerramento de relacionamento e rescisão

O encerramento deve ser um fluxo específico, e não apenas uma troca simples de status.

Fluxo conceitual:
1. Informar e revisar a data de encerramento.
2. Identificar o período de relacionamento que será encerrado.
3. Conferir remuneração e competências até a data final.
4. Conferir ocorrências e ajustes pendentes.
5. Conferir obrigações existentes e pagamentos já realizados.
6. Apresentar itens que podem exigir revisão (férias, 13º, saldos, valores contratuais ou outros).
7. Permitir informar manualmente valores acordados/validados.
8. Criar obrigações específicas de encerramento somente após revisão e confirmação.
9. Permitir registrar cronograma de parcelas, quando juridicamente/contratualmente cabível.
10. Acompanhar pagamentos, saldo e documentação até a conclusão.

Um exemplo administrativo é uma quantia de R$ 3.000,00 negociada para pagamento em parcelas: o módulo deve permitir registrar o valor total revisado, as parcelas/obrigações correspondentes, os pagamentos e o saldo.

**A possibilidade técnica de parcelar não significa que todo valor rescisório possa ser livremente parcelado.** O sistema deve exigir validação jurídica/contábil quando aplicável. Para PJ, o encerramento deve respeitar o contrato e os valores efetivamente acordados.

## 8. Visões e consultas esperadas

### 8.1 Dashboard

Indicadores e listas úteis:
- colaboradores ativos;
- obrigações confirmadas em aberto;
- obrigações vencidas;
- próximos vencimentos;
- valores por tipo de obrigação;
- pagamentos recentes;
- competências que precisam de revisão;
- históricos incompletos ou pendentes de reconciliação;
- datas de encerramento/revisão próximas.

Os totais financeiros do dashboard devem considerar apenas registros confirmados e consistentes. Estimativas e pendências precisam aparecer separadamente.

### 8.2 Detalhamento do colaborador

A página de detalhe deverá permitir consultar:
- dados pessoais;
- relacionamentos atuais e anteriores;
- histórico de remuneração;
- resumo financeiro por tipo de obrigação;
- total confirmado em aberto, vencido e futuro;
- pagamentos e alocações;
- obrigações parciais e quitadas;
- férias e 13º, quando acompanhados;
- frequência e ocorrências;
- ajustes;
- notas e histórico administrativo;
- pendências de informação e reconciliação.

A interface deve diferenciar visualmente informação confirmada, estimativa e dado pendente.

### 8.3 Pesquisas e filtros

Prever consultas por nome/documento, situação, tipo de relacionamento, período de relacionamento, competência, tipo e situação de obrigação, vencimento, pagamento, frequência/ocorrência, valores e pendências históricas.

As consultas devem ser paginadas e seletivas. Não carregar todo o histórico financeiro de todos os colaboradores para montar o dashboard.

## 9. Privacidade, segurança e acesso

O módulo tratará dados pessoais e financeiros sensíveis do ponto de vista operacional, como documentos, endereço, remuneração e pagamentos.

Cuidados obrigatórios:
- aplicar autenticação e autorização conforme os mecanismos existentes;
- limitar acesso às informações conforme os perfis/permissões que o projeto vier a definir;
- não expor CPF/CNPJ, endereço ou remuneração em logs desnecessários;
- validar dados no backend, mesmo quando o frontend já valida;
- evitar enviar campos pessoais além do necessário nas queries;
- proteger backups e ambientes;
- avaliar criptografia em repouso/campos sensíveis conforme a infraestrutura e o risco;
- registrar operações relevantes para auditoria;
- não incluir dados reais de colaboradores em fixtures, commits, prints ou testes públicos.

As permissões detalhadas ainda precisam ser definidas. Não presumir que todo usuário autenticado poderá visualizar ou alterar dados de colaboradores.

## 10. Limites e decisões ainda abertas

Os pontos abaixo não devem ser tratados como já decididos:
- campos pessoais obrigatórios e regras de unicidade de CPF/CNPJ;
- se endereço terá histórico completo ou apenas auditoria das alterações relevantes;
- lista definitiva de tipos de relacionamento e periodicidades de remuneração;
- lista definitiva de tipos e estados de obrigação;
- se configurações serão globais, por tipo de relacionamento, por colaborador ou uma combinação;
- como representar anexos e comprovantes;
- quais eventos terão histórico próprio e quais usarão uma trilha de auditoria comum;
- como identificar o usuário responsável se a autenticação atual ainda não tiver essa associação no domínio;
- política de permissões e acesso a dados pessoais/financeiros;
- regras concretas de cálculos legais, que dependem de validação contábil/jurídica;
- estratégia técnica final para atomicidade entre pagamento, alocação e transação financeira;
- se o módulo terá fechamento mensal desde a primeira versão ou se começará com registros manuais e revisão assistida.

Essas decisões devem ser fechadas antes de consolidar o schema Prisma.

## 11. Fora do escopo inicial

A princípio, não implementar:
- folha de pagamento oficial completa;
- geração/transmissão de eSocial;
- cálculo oficial automático de INSS, FGTS ou IRRF;
- emissão de documentos trabalhistas oficiais;
- decisões automáticas sobre enquadramento jurídico;
- descontos automáticos por frequência;
- geração automática e irreversível de obrigações;
- integrações externas complexas antes de estabilizar o domínio básico.

## 12. Diretriz de desenvolvimento

O desenvolvimento deverá começar pela revisão da documentação e do schema atual do projeto, seguida pela definição final de entidades, relações, estados e operações. Só depois será elaborado o schema Prisma.

Cada etapa deve preservar os módulos existentes, especialmente o financeiro. Implementações futuras devem ser pequenas, revisáveis e testadas, respeitando a arquitetura e os padrões já usados em Services, Budgets e Vehicles.

---

**Regra de ouro do módulo:** o Blue Admin organiza e apresenta informações para apoiar uma decisão responsável. Ele não transforma ausência de informação em dívida, estimativa em obrigação, ocorrência em desconto ou cálculo em pagamento sem revisão humana.
