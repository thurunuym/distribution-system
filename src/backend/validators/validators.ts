import { z } from 'zod';

export const InvoiceCreateSchema = z.object({
  number: z.string().min(1),
  shopId: z.number().int(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  totalAmount: z.number().positive(),
  remarks: z.string().optional(),
  payments: z.array(z.object({
    type: z.enum(['cash', 'cheque']),
    amount: z.number().positive()
  })).min(1),
  cheque: z.object({
    chequeNo: z.string().min(1),
    bank: z.string().min(1),
    amount: z.number().positive(),
    dateReceived: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
  }).optional()
}).refine(data => {
  const totalPaid = data.payments.reduce((sum, p) => sum + p.amount, 0);
  return totalPaid <= data.totalAmount;
}, {
  message: "Total payments cannot exceed invoice amount",
  path: ["payments"]
});

export const ShopSchema = z.object({
  name: z.string().min(1),
  address: z.string().optional(),
  routeId: z.number().int()
});
