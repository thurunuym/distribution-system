import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { InvoiceCreateSchema } from '../lib/validators.ts';
import api from '../lib/axios.ts';
import { formatCurrency, cn } from '../lib/utils.ts';
import { Loader2 } from 'lucide-react';

export default function NewInvoice() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { data: shops } = useQuery({
    queryKey: ['shops'],
    queryFn: async () => (await api.get('/shops')).data
  });

  const { register, handleSubmit, setValue, watch, control, formState: { errors } } = useForm({
    resolver: zodResolver(InvoiceCreateSchema),
    defaultValues: {
      number: '',
      shopId: 0,
      date: new Date().toISOString().split('T')[0],
      totalAmount: 0,
      remarks: '',
      payments: [{ type: 'cash', amount: 0 }, { type: 'cheque', amount: 0 }],
      cheque: {
        chequeNo: '',
        bank: '',
        amount: 0,
        dateReceived: new Date().toISOString().split('T')[0],
        dueDate: ''
      }
    }
  });

  const totalAmount = watch('totalAmount');
  const cashAmount = watch('payments.0.amount');
  const chequeAmount = watch('payments.1.amount');
  
  const creditAmount = Math.max(0, totalAmount - (Number(cashAmount) + Number(chequeAmount)));

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      // Filter out empty payments/cheque before sending
      const payload = { ...data };
      const activePayments = [];
      if (data.payments[0].amount > 0) activePayments.push(data.payments[0]);
      if (data.payments[1].amount > 0) activePayments.push(data.payments[1]);
      
      payload.payments = activePayments;
      if (data.payments[1].amount === 0) delete payload.cheque;
      
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

  const onSubmit = (data: any) => {
    mutation.mutate(data);
  };

  const setSettleWithCash = () => {
    setValue('payments.0.amount', totalAmount);
    setValue('payments.1.amount', 0);
  };

  const setFullCredit = () => {
    setValue('payments.0.amount', 0);
    setValue('payments.1.amount', 0);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="md:flex md:items-center md:justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">New Invoice</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Header Section */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-bold mb-4 text-blue-600 border-b pb-2">Part 1 — Invoice Details</h2>
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

        {/* Payment Section */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-bold mb-4 text-blue-600 border-b pb-2">Part 2 — Payment Allocation</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Cash Column */}
            <div className="bg-green-50 p-4 rounded-lg border border-green-100 flex flex-col h-full">
              <h3 className="font-bold text-green-800 mb-4 flex items-center">
                <span className="bg-green-600 text-white w-6 h-6 rounded-full inline-flex items-center justify-center mr-2 text-xs">1</span>
                Cash
              </h3>
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

            {/* Cheque Column */}
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-100 flex flex-col h-full">
              <h3 className="font-bold text-purple-800 mb-4 flex items-center">
                <span className="bg-purple-600 text-white w-6 h-6 rounded-full inline-flex items-center justify-center mr-2 text-xs">2</span>
                Cheque
              </h3>
              <div className="flex-grow space-y-4">
                <div>
                  <label className="block text-xs font-medium text-purple-700 mb-1">CHEQUE AMOUNT</label>
                  <input
                    type="number"
                    step="0.01"
                    {...register('payments.1.amount', { valueAsNumber: true })}
                    className="block w-full rounded-md border-purple-200 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm p-2 border bg-white"
                  />
                </div>
                
                {chequeAmount > 0 && (
                  <div className="space-y-3 pt-4 border-t border-purple-200 animate-in fade-in slide-in-from-top-2">
                    <div>
                      <label className="block text-xs font-medium text-purple-700 mb-1">CHEQUE NO</label>
                      <input
                        {...register('cheque.chequeNo')}
                        className="block w-full rounded-md border-purple-200 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-xs p-1.5 border bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-purple-700 mb-1">BANK</label>
                      <input
                        {...register('cheque.bank')}
                        className="block w-full rounded-md border-purple-200 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-xs p-1.5 border bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-purple-700 mb-1">DUE DATE</label>
                      <input
                        type="date"
                        {...register('cheque.dueDate')}
                        className="block w-full rounded-md border-purple-200 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-xs p-1.5 border bg-white"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Credit Column */}
            <div className="bg-red-50 p-4 rounded-lg border border-red-100 flex flex-col h-full">
              <h3 className="font-bold text-red-800 mb-4 flex items-center">
                <span className="bg-red-600 text-white w-6 h-6 rounded-full inline-flex items-center justify-center mr-2 text-xs">3</span>
                Credit
              </h3>
              <div className="flex-grow">
                <label className="block text-xs font-medium text-red-700 mb-1">AUTO-COMPUTED CREDIT</label>
                <div className="block w-full rounded-md border-red-200 shadow-sm p-2 border bg-gray-100 font-bold text-lg text-red-600">
                  {formatCurrency(creditAmount)}
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
              {errors.payments.message || (errors.payments as any).root?.message}
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
            {mutation.isPending ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : null}
            Enter Invoice
          </button>
        </div>
      </form>
    </div>
  );
}
