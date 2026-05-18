import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import api from '../lib/axios.ts';
import { formatCurrency, formatDate, cn } from '../lib/utils.ts';
import { ArrowLeft, Printer, RefreshCw } from 'lucide-react';
import { useState } from 'react';

export default function InvoiceDetail() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [remarks, setRemarks] = useState('');

  const { data: invoice, isLoading } = useQuery({
    queryKey: ['invoice', id],
    queryFn: async () => (await api.get(`/invoices/${id}`)).data
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => api.put(`/invoices/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice', id] });
    }
  });

  if (isLoading) return <div className="animate-pulse space-y-6">
    <div className="h-8 bg-gray-200 w-1/4 rounded"></div>
    <div className="h-32 bg-gray-200 rounded"></div>
  </div>;

  if (!invoice) return <div>Invoice not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/invoices" className="p-2 hover:bg-gray-100 rounded-full">
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Invoice {invoice.number}</h1>
        </div>
        <div className="flex space-x-3">
          <button className="flex items-center px-4 py-2 border border-blue-600 text-blue-600 rounded-md text-sm font-medium hover:bg-blue-50">
            <Printer className="w-4 h-4 mr-2" />
            Print
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Details */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-lg font-bold mb-4 border-b pb-2">Information</h2>
            <div className="grid grid-cols-2 gap-y-4">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase">Shop</p>
                <p className="text-sm font-bold text-gray-900">{invoice.shop_name || 'Loading...'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase">Date</p>
                <p className="text-sm font-bold text-gray-900">{formatDate(invoice.date)}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase">Total Amount</p>
                <p className="text-sm font-bold text-gray-900">{formatCurrency(invoice.total_amount)}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase">Paid Amount</p>
                <p className="text-sm font-bold text-green-600">{formatCurrency(invoice.paid)}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase">Due Amount</p>
                <p className="text-lg font-bold text-red-600">{formatCurrency(invoice.due)}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase">Status</p>
                <span className={cn(
                  "px-2 inline-flex text-xs leading-5 font-semibold rounded-full",
                  invoice.status === 'settled' ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                )}>
                  {invoice.status.toUpperCase()}
                </span>
              </div>
            </div>
            <div className="mt-6">
              <label className="block text-xs font-medium text-gray-500 uppercase">Remarks</label>
              <div className="mt-1 flex space-x-2">
                <textarea
                  className="block w-full p-2 border rounded-md text-sm border-gray-300"
                  defaultValue={invoice.remarks || ''}
                  onBlur={(e) => mutation.mutate({ remarks: e.target.value })}
                  placeholder="Add notes..."
                  rows={2}
                />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-lg font-bold mb-4 border-b pb-2">Payments</h2>
            <table className="min-w-full">
              <thead className="border-b border-gray-100">
                <tr>
                  <th className="text-left py-2 text-xs font-medium text-gray-500">TYPE</th>
                  <th className="text-left py-2 text-xs font-medium text-gray-500">DATE</th>
                  <th className="text-right py-2 text-xs font-medium text-gray-500">AMOUNT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {invoice.payments?.map((p: any) => (
                  <tr key={p.id}>
                    <td className="py-3 text-sm text-gray-900 capitalize font-medium">{p.type}</td>
                    <td className="py-3 text-sm text-gray-500">{formatDate(p.date)}</td>
                    <td className="py-3 text-sm text-right text-gray-900">{formatCurrency(p.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Side Details - Cheques */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-lg font-bold mb-4 border-b pb-2">Related Cheques</h2>
            {invoice.cheques?.length > 0 ? (
              <div className="space-y-4">
                {invoice.cheques.map((c: any) => (
                  <div key={c.id} className="p-3 bg-gray-50 border border-gray-100 rounded-md">
                    <p className="text-sm font-bold text-gray-900"># {c.cheque_no}</p>
                    <p className="text-xs text-gray-500 uppercase">{c.bank}</p>
                    <div className="flex justify-between mt-2">
                      <p className="text-sm font-bold text-blue-600">{formatCurrency(c.amount)}</p>
                      <span className={cn(
                        "px-1.5 text-[10px] leading-4 font-semibold rounded uppercase",
                        c.status === 'paid' ? "bg-green-100 text-green-800" : 
                        c.status === 'returned' ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"
                      )}>
                        {c.status}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">Due: {formatDate(c.due_date)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 py-4 text-center">No cheques associated</p>
            )}
          </div>

          <div className="bg-blue-600 p-6 rounded-lg shadow-lg text-white">
            <h3 className="font-bold text-lg mb-2">Invoice Summary</h3>
            <div className="space-y-2 text-sm opacity-90">
              <div className="flex justify-between">
                <span>Items Total</span>
                <span>{formatCurrency(invoice.total_amount)}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Paid</span>
                <span>{formatCurrency(invoice.paid)}</span>
              </div>
              <div className="border-t border-blue-400 pt-2 flex justify-between font-bold text-lg">
                <span>Balance Due</span>
                <span>{formatCurrency(invoice.due)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
