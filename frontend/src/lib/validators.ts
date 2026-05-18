import { z } from 'zod';

export const InvoiceCreateSchema = z.object({
  number: z.string().min(1, 'Invoice number is required'),
  date: z.string().min(1, 'Date is required'),
  shopId: z.number().min(1, 'Shop selection is required'),
  totalAmount: z.number().min(0.01, 'Total amount must be greater than 0'),
  remarks: z.string().optional(),
  payments: z.array(
    z.object({
      type: z.string(),
      amount: z.number().min(0),
    })
  ),
  cheque: z.object({
    chequeNo: z.string().optional(),
    bank: z.string().optional(),
    amount: z.number().optional(),
    dateReceived: z.string().optional(),
    dueDate: z.string().optional(),
  }).optional(),
});

export type InvoiceCreate = z.infer<typeof InvoiceCreateSchema>;
