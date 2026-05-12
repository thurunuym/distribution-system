import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import api from '../lib/axios.ts';
import { formatCurrency, formatDate, cn } from '../lib/utils.ts';
import { Receipt, Landmark, Wallet, AlertCircle, Calendar, CheckCircle, XCircle } from 'lucide-react';

export default function Dashboard() {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [returnModal, setReturnModal] = useState<{ id: number, open: boolean, reason: string }>({ id: 0, open: false, reason: '' });

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['summary', selectedDate],
    queryFn: async () => {
      const res = await api.get(`/invoices/summary?date=${selectedDate}`);
      return res.data;
    }
  });

  const { data: dueCheques, isLoading: dueLoading } = useQuery({
    queryKey: ['chequesDue', selectedDate],
    queryFn: async () => {
      const res = await api.get(`/dashboard/cheques-due?date=${selectedDate}`);
      return res.data;
    }
  });

  const updateChequeMutation = useMutation({
    mutationFn: async (vars: { id: number, data: any }) => api.put(`/cheques/${vars.id}`, vars.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chequesDue'] });
      queryClient.invalidateQueries({ queryKey: ['summary'] });
      setReturnModal({ id: 0, open: false, reason: '' });
    }
  });

  if (summaryLoading || dueLoading) {
    return <div className="space-y-6 animate-pulse">
      <div className="h-10 bg-gray-200 w-48 rounded" />
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-32 bg-gray-200 rounded-lg" />)}
      </div>
      <div className="h-64 bg-gray-200 rounded-lg" />
    </div>;
  }

  const cards = [
    { title: 'Total Invoiced', value: summary?.totalAmount, icon: Receipt, color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'Cash Collected', value: summary?.cashCollected, icon: Wallet, color: 'text-green-600', bg: 'bg-green-50' },
    { 
      title: 'Cheques Received', 
      value: summary?.chequeAmount, 
      count: summary?.chequeCount,
      icon: Landmark, color: 'text-purple-600', bg: 'bg-purple-50' 
    },
    { title: 'Day Credit', value: summary?.creditAmount, icon: AlertCircle, color: 'text-orange-600', bg: 'bg-orange-50' },
    { title: 'Total Credit', value: summary?.totalOutstandingCredit, icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Agency Summary</h1>
        <div className="flex items-center space-x-2 bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm">
          <Calendar className="w-4 h-4 text-gray-400" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="text-sm font-medium focus:outline-none border-none p-0 cursor-pointer"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.title} className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">{card.title}</p>
                  <p className="text-2xl font-bold mt-1">{formatCurrency(card.value || 0)}</p>
                  {card.count !== undefined && (
                    <p className="text-xs text-purple-500 font-medium mt-1">
                      {card.count} {card.count === 1 ? 'cheque' : 'cheques'}
                    </p>
                  )}
                </div>
                <div className={`${card.bg} p-3 rounded-full`}>
                  <Icon className={`w-6 h-6 ${card.color}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-900">Cheques Due Today ({formatDate(selectedDate)})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cheque #</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bank</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Shop</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {dueCheques?.map((c: any) => (
                <tr key={c.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{c.cheque_no}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 uppercase">{c.bank}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{c.shop_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold">{formatCurrency(c.amount)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className={cn(
                      "px-2 py-0.5 inline-flex text-xs font-semibold rounded-full capitalize",
                      c.status === 'paid' ? "bg-green-100 text-green-800" : 
                      c.status === 'returned' ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"
                    )}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                    {c.status === 'pending' && (
                      <div className="flex justify-center space-x-2">
                        <button
                          onClick={() => updateChequeMutation.mutate({ id: c.id, data: { status: 'paid', clearedDate: selectedDate } })}
                          className="text-green-600 hover:text-green-900"
                        >
                          <CheckCircle className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => setReturnModal({ id: c.id, open: true, reason: '' })}
                          className="text-red-600 hover:text-red-900"
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {(!dueCheques || dueCheques.length === 0) && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">No cheques due on this day.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {returnModal.open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-lg font-bold mb-4">Mark Cheque Returned</h3>
            <textarea
              className="w-full p-2 border rounded-md text-sm mb-4"
              rows={3}
              placeholder="Reason for return..."
              value={returnModal.reason}
              onChange={(e) => setReturnModal({ ...returnModal, reason: e.target.value })}
            />
            <div className="flex space-x-3">
              <button 
                onClick={() => setReturnModal({ ...returnModal, open: false })}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm"
              >Cancel</button>
              <button
                onClick={() => updateChequeMutation.mutate({
                  id: returnModal.id,
                  data: { status: 'returned', returnReason: returnModal.reason }
                })}
                disabled={!returnModal.reason || updateChequeMutation.isPending}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium disabled:opacity-50"
              >Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
