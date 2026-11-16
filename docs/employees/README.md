# Módulo de funcionários — Blue Admin

Documentação de planejamento do módulo de funcionários. Este material consolida as decisões funcionais e técnicas discutidas antes da implementação.

## Documentos

1. [Regras de negócio](./01-regras-de-negocio.md) — objetivo, conceitos, vínculos, obrigações, movimentações, pagamentos, alocações e helpers.
2. [Modelo de dados e fluxos técnicos](./02-modelo-de-dados-e-fluxos.md) — entidades propostas, relacionamentos, responsabilidades do backend, integração financeira e plano incremental.

## Objetivo

O módulo será um assistente administrativo para a oficina. Deve centralizar o cadastro de funcionários, seus vínculos, histórico, obrigações, pagamentos e acontecimentos relevantes. Também deve ajudar a identificar valores vencidos, próximos do vencimento e competências que ainda precisam ser registradas.

O sistema não será, nesta etapa, um sistema completo de folha de pagamento nem implementará todas as regras legais de CLT ou PJ. Sugestões e estimativas auxiliam o responsável; a criação e confirmação de obrigações permanecem sob decisão do usuário.

## Estado

- Planejamento funcional e técnico; nenhuma implementação do módulo está autorizada por este documento.
- O schema Prisma será desenhado e revisado em uma etapa separada.
- Backend, testes, frontend e refinamentos serão desenvolvidos incrementalmente, com revisão entre as etapas.
- As decisões explicitamente marcadas como pendentes deverão ser fechadas antes de implementar o respectivo fluxo.
