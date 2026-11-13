# Documentação do módulo de colaboradores

Esta pasta reúne as decisões funcionais e a proposta técnica do módulo de colaboradores do Blue Admin.

## Documentos

1. [Regras de negócio](./01-regras-de-negocio.md) — objetivo, conceitos, seis partes do módulo, pagamentos, alocações, adiantamentos, retroatividade, histórico e limites legais.
2. [Estrutura técnica e fluxos](./02-estrutura-tecnica-e-fluxos.md) — modelo relacional proposto, shareds, backend, frontend, queries, fluxos, sequência de implementação e cenários de validação.

## Situação

Documentação de referência do módulo. A primeira camada de schema e backend já foi adicionada; as queries específicas e o frontend ainda serão desenvolvidos. Os pontos marcados como "a validar" devem ser fechados antes das etapas correspondentes.

A documentação não autoriza implementar cálculos oficiais de folha ou obrigações legais automaticamente. O módulo é uma ferramenta administrativa com revisão humana.


## Implementação

Em 13/11/2026 foi adicionada a primeira camada de schema e backend do módulo. O schema ainda depende da migration e da geração do Prisma Client pelo responsável pelo projeto. As queries específicas e o frontend permanecem pendentes.
