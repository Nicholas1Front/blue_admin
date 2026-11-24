-- Keep obligation_id nullable for administrative movements, but require it for financial movements.
-- NOT VALID preserves existing legacy rows while enforcing the rule for new or updated rows.
ALTER TABLE "employee_movements"
ADD CONSTRAINT "employee_movements_financial_type_requires_obligation_check"
CHECK (
    "type" NOT IN (
        'pagamento',
        'bonificacao',
        'decimo_terceiro',
        'ferias',
        'rescisao',
        'ajuste'
    )
    OR "obligation_id" IS NOT NULL
) NOT VALID;
