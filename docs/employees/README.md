# Módulo de funcionários — Blue Admin

Documentação funcional e técnica do módulo de funcionários. Este material consolida as decisões acordadas e os fluxos já implementados.

## Documentos

1. [Regras de negócio](./01-regras-de-negocio.md) — objetivo, conceitos, vínculos, obrigações, movimentações, pagamentos, alocações e helpers.
2. [Modelo de dados e fluxos técnicos](./02-modelo-de-dados-e-fluxos.md) — entidades propostas, relacionamentos, responsabilidades do backend, integração financeira e plano incremental.

## Objetivo

O módulo será um assistente administrativo para a oficina. Deve centralizar o cadastro de funcionários, seus vínculos, histórico, obrigações, pagamentos e acontecimentos relevantes. Também deve ajudar a identificar valores vencidos, próximos do vencimento e competências que ainda precisam ser registradas.

O sistema não será, nesta etapa, um sistema completo de folha de pagamento nem implementará todas as regras legais de CLT ou PJ. Sugestões e estimativas auxiliam o responsável; a criação e confirmação de obrigações permanecem sob decisão do usuário.

## Estado

- Cadastro de funcionários, vínculos, obrigações, sugestões de competências, movimentações e pagamentos vinculados a obrigações foram implementados no backend.
- O schema Prisma já contém as relações necessárias; esta etapa não exigiu migration.
- Todo pagamento exige uma obrigação do mesmo vínculo. A integração financeira cria uma única despesa por pagamento quando habilitada e permite pagamentos históricos sem transação financeira.
- Build e testes de integração ainda precisam ser executados no ambiente local antes de considerar o módulo validado.
- Frontend e cenários de integração devem ser desenvolvidos/revisados incrementalmente.
