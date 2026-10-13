import {z} from 'zod';
import {stringToDate} from "../../../shared/helpers/objects/stringToDateTime.js";

const dueDateSchema = z.preprocess(
    stringToDate,
    z.date()
);

const queryBooleanSchema = z.preprocess(
    value => {
        if(value === 'true') return true;
        if(value === 'false') return false;
        return value;
    },
    z.boolean()
);

export const createExpenseSchema = z.object({
    name : z.string().min(1),
    description : z.string().min(1).nullable().optional(),
    expectedValue : z.number().min(1),
    dueDate : dueDateSchema.nullable().optional(),
    notes : z.string().min(1).nullable().optional()
})

export const updateExpenseSchema = z.object({
    name : z.string().min(1).optional(),
    description : z.string().min(1).nullable().optional(),
    expectedValue : z.number().min(1).optional(),
    dueDate : dueDateSchema.nullable().optional(),
    notes : z.string().min(1).nullable().optional()
}).refine(
    data => Object.keys(data).length > 0,
    {
        message : 'At least one field must be provided to update expense'
    }
)

export const findExpensesByFiltersSchema = z.object({
    id : z.string().min(1).optional(),
    name : z.string().min(1).optional(),
    description : z.string().min(1).nullable().optional(),
    expectedValue : z.coerce.number().min(1).optional(),
    dueDate : dueDateSchema.nullable().optional(),
    notes : z.string().min(1).nullable().optional(),
    active : queryBooleanSchema.optional()
}).refine(
    data => Object.keys(data).length > 0,
    {
        message : 'At least one field must be provided to find expense with filters'
    }
)
