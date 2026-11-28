# Tentativa do módulo de funcionários

> Registro histórico da implementação experimental. O módulo foi interrompido e não faz parte da versão atual do Blue Admin.

## Contexto

O módulo foi pensado para atender à rotina administrativa de uma pequena oficina, com foco em acompanhar funcionários e os valores que precisam ser pagos, sem tentar implementar um sistema completo de departamento pessoal ou um motor de regras trabalhistas.

A ideia era manter os cálculos e sugestões simples, deixando o cadastro das obrigações e dos pagamentos sob controle manual do usuário.

## Escopo que foi explorado

A modelagem inicial considerava:

- **Funcionário:** dados cadastrais básicos e observações.
- **Vínculo:** períodos de admissão e saída, modalidade (CLT, PJ, informal ou outros), status, função e salário atual. Um funcionário poderia ter mais de um vínculo ao longo do tempo.
- **Obrigação:** valores a pagar, como salário, bonificação, 13º, férias ou rescisão, com competência, vencimento, valor e status.
- **Movimentação:** registro de pagamentos e outros movimentos financeiros vinculados ao vínculo e, quando aplicável, a uma obrigação.
- **Histórico:** registro de alterações cadastrais e de salário.
- **Integração financeira:** possibilidade de associar uma movimentação do funcionário a uma transação do módulo financeiro.

A primeira implementação de schema foi registrada no commit [d2641b0](https://github.com/Nicholas1Front/blue_admin/commit/d2641b00f98318153c7935ade4e58d98c333036c), que adicionou modelos ao Prisma. O commit imediatamente anterior foi [f8988c2](https://github.com/Nicholas1Front/blue_admin/commit/f8988c2b017fe3667ff65a640f5acfaa29765a95).

## Decisões e simplificações discutidas

Durante a construção, o escopo foi reduzido para evitar regras excessivamente complexas:

- Não implementar um motor completo de legislação trabalhista.
- Manter modalidades e status como strings com listas compartilhadas, sem enums no banco.
- Manter obrigações e movimentações explícitas e cadastradas manualmente.
- Permitir sugestões e cálculos auxiliares, sem automatizar a criação de obrigações.
- Vincular cada movimentação financeira a uma obrigação específica.
- Tratar 13º, férias e rescisão como apoio administrativo, não como cálculo legal definitivo.
- Exibir no resumo somente obrigações relevantes no momento, em vez de listar toda obrigação futura em aberto.

## Problemas encontrados durante a tentativa

### 1. Complexidade do domínio

Mesmo com a intenção de manter o módulo simples, os conceitos de funcionário, múltiplos vínculos, competências, vencimentos, obrigações, pagamentos e histórico precisavam se relacionar corretamente. Cada ajuste na modelagem repercutia em consultas, regras de negócio e interface.

### 2. Diferença entre competência e vencimento

Um dos desafios mais importantes foi definir o que deveria aparecer como valor a pagar no resumo. Uma obrigação pode estar cadastrada para uma competência futura e vencer apenas depois. Exibi-la como pendência imediata gera uma visão incorreta do caixa e da rotina administrativa.

Foi necessário distinguir:
- período/competência a que o valor se refere;
- data de vencimento;
- situação da obrigação;
- valor já movimentado/pago.

### 3. Visão de obrigações versus movimentações

A interface precisava deixar claro o que a oficina ainda deve pagar e o que já foi efetivamente movimentado. Somar ou apresentar essas informações sem separação poderia confundir saldo devido, pagamento parcial e histórico financeiro.

### 4. Integração com o módulo financeiro

A associação entre movimentações de funcionários e transações financeiras exigia cuidado para evitar duplicidade ou inconsistência entre os registros. A modelagem e as regras de associação ainda precisariam de uma revisão completa antes de considerar o fluxo confiável.

### 5. Complexidade crescente do frontend

A página de detalhes reuniu ações de vínculo, obrigações, movimentações, edição e sugestões. Ajustes de interação e estado dos modais aumentaram a complexidade e geraram problemas de tipagem durante o desenvolvimento.

Na última etapa de frontend relatada, o build apresentou um erro TypeScript **TS2367** em EmployeeRecordActions.tsx, relacionado a uma comparação entre tipos de ação incompatíveis. Esse erro precisava ser corrigido e o build validado novamente antes de concluir o módulo.

### 6. Validação incompleta

O módulo não chegou a um estado final validado de ponta a ponta. Ainda seria necessário confirmar, com testes e dados realistas, cenários como pagamentos parciais, obrigações vencidas e futuras, encerramento de vínculo, histórico e sincronização com o financeiro.

## Resultado e decisão

A tentativa foi interrompida para preservar a estabilidade dos módulos já concluídos e evitar que o Blue Admin assumisse uma responsabilidade maior do que a necessidade atual da oficina.

O código experimental foi removido da linha de desenvolvimento por meio do reset para o commit anterior à inclusão dos modelos. O registro desta tentativa permanece apenas como documentação, para que decisões e dificuldades não sejam perdidas caso o módulo seja reconsiderado.

## Possíveis aprendizados para uma futura retomada

Se o módulo voltar a ser desenvolvido, recomenda-se:

1. Começar por um fluxo mínimo e validá-lo com exemplos reais antes de ampliar o escopo.
2. Definir claramente a diferença entre competência, vencimento, obrigação e pagamento.
3. Desenhar primeiro a consulta do resumo administrativo e os casos de uso que ela precisa responder.
4. Separar a visão de valores a pagar da visão de movimentações realizadas.
5. Tratar a integração com o financeiro como uma etapa independente, com regras contra duplicidade.
6. Validar cada pequena etapa com testes e build antes de adicionar novos componentes.

---

**Status:** interrompido; não faz parte do módulo ativo.
