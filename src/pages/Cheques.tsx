import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import api from '../lib/axios.ts';
import { formatCurrency, formatDate, cn } from '../lib/utils.ts';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

export default function Cheques() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [returnModal, setReturnModal] = useState<{ id: number, open: boolean, reason: string }>({ id: 0, open: false, reason: '' });

  const { data: cheques, isLoading } = useQuery({
    queryKey: ['cheques', statusFilter],
    queryFn: async () => {
      const res = await api.get(`/cheques${statusFilter ? `?status=${statusFilter}` : ''}`);
      return res.data;
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (vars: { id: number, data: any }) => api.put(`/cheques/${vars.id}`, vars.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cheques'] });
      queryClient.invalidateQueries({ queryKey: ['invoice'] });
      queryClient.invalidateQueries({ queryKey: ['summary'] });
      setReturnModal({ id: 0, open: false, reason: '' });
    }
  });

  const markPaid = (id: number) => {
    updateMutation.mutate({
      id,
      data: {
        status: 'paid',
        clearedDate: new Date().toISOString().split('T')[0]
      }
    });
  };

  const markReturned = (id: number) => {
    setReturnModal({ id, open: true, reason: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Cheque Management</h1>
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-500">Filter Status:</label>
          <select
            className="p-2 border rounded-md text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Cheques</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="returned">Returned</option>
          </select>
        </div>
      </div>

      <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="h-12 bg-gray-100 animate-pulse rounded" />)}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cheque # / Bank</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice / Shop</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {cheques?.map((c: any) => (
                  <tr key={c.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900">{c.cheque_no}</div>
                      <div className="text-xs text-gray-500 uppercase">{c.bank}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-blue-600">{c.invoice_number}</div>
                      <div className="text-xs text-gray-500">{c.shop_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-gray-900">
                      {formatCurrency(c.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(c.due_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={cn(
                        "px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full capitalize",
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
                            onClick={() => markPaid(c.id)}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded-full transition"
                            title="Mark Paid"
                          >
                            <CheckCircle className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => markReturned(c.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-full transition"
                            title="Mark Returned"
                          >
                            <XCircle className="w-5 h-5" />
                          </button>
                        </div>
                      )}
                      {c.status === 'returned' && (
                        <div className="text-[10px] text-red-500 max-w-[120px] truncate" title={c.return_reason}>
                          {c.return_reason}
                        </div>
                      )}
                      {c.status === 'paid' && (
                        <div className="text-[10px] text-green-600">
                          Cleared: {formatDate(c.cleared_date)}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Return Modal */}
      {returnModal.open && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Mark Cheque as Returned</h3>
            <p className="text-sm text-gray-500 mb-4 font-medium italic">
              Note: This will automatically deduct the cheque amount from the invoice balance and set it back to credit.
            </p>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Reason for return</label>
            <textarea
              className="w-full p-2 border rounded-md text-sm mb-4"
              rows={3}
              placeholder="e.g. Insufficient funds, Signature mismatch..."
              value={returnModal.reason}
              onChange={(e) => setReturnModal({ ...returnModal, reason: e.target.value })}
            />
            <div className="flex space-x-3">
              <button
                onClick={() => setReturnModal({ ...returnModal, open: false })}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => updateMutation.mutate({
                  id: returnModal.id,
                  data: {
                    status: 'returned',
                    returnReason: returnModal.reason
                  }
                })}
                disabled={!returnModal.reason || updateMutation.isPending}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 disabled:opacity-50"
              >
                Confirm Return
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
