import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { InvoiceCreateSchema, type InvoiceCreate } from '../lib/validators.ts';
import api from '../lib/axios.ts';
import { formatCurrency } from '../lib/utils.ts';
import { Loader2, Plus, Trash2 } from 'lucide-react';

const today = new Date().toISOString().split('T')[0];

const createChequePayment = () => ({
  type: 'cheque' as const,
  amount: 0,
  cheque: {
    chequeNo: '',
    bank: '',
    amount: 0,
    dateReceived: today,
    dueDate: ''
  }
});

export default function NewInvoice() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { data: shops } = useQuery({
    queryKey: ['shops'],
    queryFn: async () => (await api.get('/shops')).data
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors }
  } = useForm<InvoiceCreate>({
    resolver: zodResolver(InvoiceCreateSchema),
    defaultValues: {
      number: '',
      shopId: 0,
      date: today,
      totalAmount: 0,
      remarks: '',
      payments: [{ type: 'cash', amount: 0, cheque: undefined }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'payments'
  });

  const payments = watch('payments');
  const totalAmount = Number(watch('totalAmount') || 0);
  const cashAmount = Number(payments?.[0]?.amount || 0);
  const chequePayments = (payments ?? []).slice(1);
  const chequeTotal = chequePayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const creditAmount = Math.max(0, totalAmount - (cashAmount + chequeTotal));

  const mutation = useMutation({
    mutationFn: async (data: InvoiceCreate) => {
      const payload = {
        ...data,
        payments: data.payments
          .filter((payment) => payment.amount > 0)
          .map((payment) => {
            if (payment.type === 'cash') {
              return {
                type: payment.type,
                amount: payment.amount,
                cheque: null
              };
            }

            return {
              type: payment.type,
              amount: payment.amount,
              cheque: payment.cheque
                ? {
                    ...payment.cheque,
                    bank: payment.cheque.bank || null,
                    dueDate: payment.cheque.dueDate || null
                  }
                : null
            };
          })
      };

      return api.post('/invoices', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['summary'] });
      queryClient.invalidateQueries({ queryKey: ['recentInvoices'] });
      navigate('/');
    },
    onError: (error: any) => {
      setSubmitError(error.response?.data?.detail || 'Failed to save invoice');
    }
  });

  const onSubmit = (data: InvoiceCreate) => {
    setSubmitError(null);
    mutation.mutate(data);
  };

  const setSettleWithCash = () => {
    setValue('payments.0.amount', totalAmount);

    chequePayments.forEach((_, index) => {
      setValue(`payments.${index + 1}.amount`, 0);
      setValue(`payments.${index + 1}.cheque.amount`, 0);
    });
  };

  const setFullCredit = () => {
    setValue('payments.0.amount', 0);

    chequePayments.forEach((_, index) => {
      setValue(`payments.${index + 1}.amount`, 0);
      setValue(`payments.${index + 1}.cheque.amount`, 0);
    });
  };

  const addCheque = () => {
    append(createChequePayment());
  };

  const handleChequeAmountChange = (index: number, value: number) => {
    setValue(`payments.${index}.amount`, value, { shouldValidate: true, shouldDirty: true });
    setValue(`payments.${index}.cheque.amount`, value, { shouldValidate: true, shouldDirty: true });
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="md:flex md:items-center md:justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">New Invoice</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-bold mb-4 text-blue-600 border-b pb-2">Part 1 - Invoice Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Invoice Number</label>
              <input
                {...register('number')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
              />
              {errors.number && <p className="mt-1 text-sm text-red-600">{errors.number.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Shop</label>
              <select
                {...register('shopId', { valueAsNumber: true })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
              >
                <option value={0}>Select a shop</option>
                {shops?.map((shop: any) => (
                  <option key={shop.id} value={shop.id}>{shop.name} ({shop.route_name})</option>
                ))}
              </select>
              {errors.shopId && <p className="mt-1 text-sm text-red-600">{errors.shopId.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Date</label>
              <input
                type="date"
                {...register('date')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Total Amount (LKR)</label>
              <input
                type="number"
                step="0.01"
                {...register('totalAmount', { valueAsNumber: true })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
              />
              {errors.totalAmount && <p className="mt-1 text-sm text-red-600">{errors.totalAmount.message}</p>}
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Remarks</label>
              <textarea
                {...register('remarks')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                rows={2}
              />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-bold mb-4 text-blue-600 border-b pb-2">Part 2 - Payment Allocation</h2>
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <div className="bg-green-50 p-4 rounded-lg border border-green-100 flex flex-col h-full">
              <h3 className="font-bold text-green-800 mb-4">Cash</h3>
              <div className="flex-grow">
                <label className="block text-xs font-medium text-green-700 mb-1">CASH AMOUNT</label>
                <input
                  type="number"
                  step="0.01"
                  {...register('payments.0.amount', { valueAsNumber: true })}
                  className="block w-full rounded-md border-green-200 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm p-2 border bg-white"
                />
              </div>
              <button
                type="button"
                onClick={setSettleWithCash}
                className="mt-4 w-full bg-green-600 text-white py-2 px-4 rounded-md text-sm font-bold hover:bg-green-700 transition"
              >
                Settle with Cash
              </button>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg border border-purple-100 xl:col-span-1">
              <div className="flex items-center justify-between gap-4 mb-4">
                <div>
                  <h3 className="font-bold text-purple-800">Cheques</h3>
                  <p className="text-xs text-purple-600 mt-1">
                    Add one entry per cheque for this invoice.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addCheque}
                  className="inline-flex items-center px-3 py-2 bg-purple-600 text-white rounded-md text-sm font-bold hover:bg-purple-700 transition"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Cheque
                </button>
              </div>

              <div className="space-y-4">
                {fields.slice(1).map((field, offset) => {
                  const index = offset + 1;
                  const chequeErrors = errors.payments?.[index];

                  return (
                    <div key={field.id} className="bg-white rounded-lg border border-purple-200 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-purple-800">Cheque {offset + 1}</h4>
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          className="text-purple-500 hover:text-red-600 transition"
                          aria-label={`Remove cheque ${offset + 1}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-purple-700 mb-1">AMOUNT</label>
                        <input
                          type="number"
                          step="0.01"
                          value={payments?.[index]?.amount ?? 0}
                          onChange={(e) => handleChequeAmountChange(index, Number(e.target.value || 0))}
                          className="block w-full rounded-md border-purple-200 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm p-2 border bg-white"
                        />
                        {chequeErrors?.amount && (
                          <p className="mt-1 text-sm text-red-600">{chequeErrors.amount.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-purple-700 mb-1">CHEQUE NO</label>
                        <input
                          {...register(`payments.${index}.cheque.chequeNo`)}
                          className="block w-full rounded-md border-purple-200 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm p-2 border bg-white"
                        />
                        {chequeErrors?.cheque?.chequeNo && (
                          <p className="mt-1 text-sm text-red-600">{chequeErrors.cheque.chequeNo.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-purple-700 mb-1">BANK</label>
                        <input
                          {...register(`payments.${index}.cheque.bank`)}
                          className="block w-full rounded-md border-purple-200 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm p-2 border bg-white"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-purple-700 mb-1">DATE RECEIVED</label>
                          <input
                            type="date"
                            {...register(`payments.${index}.cheque.dateReceived`)}
                            className="block w-full rounded-md border-purple-200 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm p-2 border bg-white"
                          />
                          {chequeErrors?.cheque?.dateReceived && (
                            <p className="mt-1 text-sm text-red-600">{chequeErrors.cheque.dateReceived.message}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-purple-700 mb-1">DUE DATE</label>
                          <input
                            type="date"
                            {...register(`payments.${index}.cheque.dueDate`)}
                            className="block w-full rounded-md border-purple-200 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm p-2 border bg-white"
                          />
                        </div>
                      </div>

                      {chequeErrors?.cheque?.message && (
                        <p className="text-sm text-red-600">{chequeErrors.cheque.message}</p>
                      )}
                    </div>
                  );
                })}

                {fields.length === 1 && (
                  <div className="border border-dashed border-purple-200 rounded-lg p-6 text-sm text-purple-600 text-center bg-white/70">
                    No cheques added yet.
                  </div>
                )}
              </div>
            </div>

            <div className="bg-red-50 p-4 rounded-lg border border-red-100 flex flex-col h-full">
              <h3 className="font-bold text-red-800 mb-4">Credit</h3>
              <div className="flex-grow space-y-4">
                <div>
                  <label className="block text-xs font-medium text-red-700 mb-1">TOTAL CHEQUES</label>
                  <div className="block w-full rounded-md border-red-200 shadow-sm p-2 border bg-white font-bold text-red-600">
                    {formatCurrency(chequeTotal)}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-red-700 mb-1">AUTO-COMPUTED CREDIT</label>
                  <div className="block w-full rounded-md border-red-200 shadow-sm p-2 border bg-gray-100 font-bold text-lg text-red-600">
                    {formatCurrency(creditAmount)}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={setFullCredit}
                className="mt-4 w-full bg-red-600 text-white py-2 px-4 rounded-md text-sm font-bold hover:bg-red-700 transition"
              >
                Full Credit
              </button>
            </div>
          </div>

          {errors.payments && (
            <div className="mt-4 bg-red-50 p-3 rounded border border-red-200 text-red-700 text-sm">
              {(errors.payments as any).message || (errors.payments as any).root?.message}
            </div>
          )}
        </div>

        {submitError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {submitError}
          </div>
        )}

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={mutation.isPending}
            className="inline-flex items-center px-8 py-3 border border-transparent text-base font-bold rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {mutation.isPending ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : null}
            Enter Invoice
          </button>
        </div>
      </form>
    </div>
  );
}
