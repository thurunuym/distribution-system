import { z } from 'zod';

export const InvoiceCreateSchema = z.object({
  number: z.string().min(1, 'Invoice number is required'),
  date: z.string().min(1, 'Date is required'),
  shopId: z.number().min(1, 'Shop selection is required'),
  totalAmount: z.number().min(0.01, 'Total amount must be greater than 0'),
  remarks: z.string().optional(),
  payments: z.array(
    z.object({
      type: z.enum(['cash', 'cheque']),
      amount: z.number().min(0),
      cheque: z.object({
        chequeNo: z.string().min(1, 'Cheque number is required'),
        bank: z.string().optional(),
        amount: z.number().min(0.01, 'Cheque amount must be greater than 0'),
        dateReceived: z.string().min(1, 'Date received is required'),
        dueDate: z.string().optional(),
      }).nullable().optional(),
    })
  ).superRefine((payments, ctx) => {
    payments.forEach((payment, index) => {
      if (payment.type === 'cash' && payment.cheque) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Cash payments cannot include cheque details',
          path: [index, 'cheque'],
        });
      }

      if (payment.type === 'cheque') {
        if (!payment.cheque) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Cheque details are required',
            path: [index, 'cheque'],
          });
          return;
        }

        if (payment.amount !== payment.cheque.amount) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Payment amount must match cheque amount',
            path: [index, 'amount'],
          });
        }
      }
    });
  }),
});

export type InvoiceCreate = z.infer<typeof InvoiceCreateSchema>;
