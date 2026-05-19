import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import api from '../lib/axios.ts';
import { formatCurrency, formatDate, cn } from '../lib/utils.ts';
import { ArrowLeft, Calendar, Store, MapPin, Receipt, CheckCircle, AlertTriangle, CreditCard, Landmark } from 'lucide-react';

export default function InvoiceDetail() {
  const { id } = useParams<{ id: string }>();

  const { data: invoice, isLoading, error } = useQuery({
    queryKey: ['invoice', id],
    queryFn: async () => {
      const res = await api.get(`/invoices/${id}`);
      return res.data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-6 bg-gray-200 w-1/4 rounded" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-100 rounded-lg" />
          ))}
        </div>
        <div className="h-64 bg-gray-100 rounded-lg" />
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border border-gray-200 shadow-sm">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-lg font-bold text-gray-900">Failed to load invoice</h2>
        <p className="text-gray-500 mt-1">The requested invoice details could not be found or retrieved.</p>
        <Link to="/invoices" className="mt-4 inline-flex items-center text-sm font-medium text-blue-600 hover:underline">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Invoices
        </Link>
      </div>
    );
  }

  const isSettled = invoice.status.toLowerCase() === 'settled';

  return (
    <div className="space-y-6">
      {/* Header action panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link to="/invoices" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 transition mb-2">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Invoice List
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">Invoice: {invoice.number}</h1>
            <span className={cn(
              "px-2.5 py-0.5 text-xs font-semibold rounded-full uppercase tracking-wider",
              isSettled ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
            )}>
              {invoice.status}
            </span>
          </div>
        </div>
      </div>

      {/* Meta Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Customer & Route Details */}
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 flex items-start space-x-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <Store className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-xs font-medium text-gray-400 uppercase tracking-wider">Customer Entity</span>
            <span className="block font-bold text-gray-900 text-base mt-0.5">{invoice.shopName}</span>
            <span className="inline-flex items-center text-xs text-gray-500 mt-1 bg-gray-100 px-2 py-0.5 rounded">
              <MapPin className="w-3 h-3 mr-1" /> {invoice.routeName}
            </span>
          </div>
        </div>

        {/* Invoice Date */}
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 flex items-start space-x-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-xs font-medium text-gray-400 uppercase tracking-wider">Issue Date</span>
            <span className="block font-bold text-gray-900 text-base mt-0.5">{formatDate(invoice.date)}</span>
            <span className="block text-xs text-gray-400 mt-1">System updated: {new Date(invoice.updatedAt).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Financial Accounting Breakdown */}
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 flex items-start space-x-4">
          <div className={cn("p-3 rounded-lg", isSettled ? "bg-green-50 text-green-600" : "bg-orange-50 text-orange-600")}>
            <Receipt className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <span className="block text-xs font-medium text-gray-400 uppercase tracking-wider">Balance Status</span>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <div>
                <span className="block text-xs text-gray-500">Total:</span>
                <span className="block text-sm font-semibold text-gray-900">{formatCurrency(invoice.totalAmount)}</span>
              </div>
              <div>
                <span className="block text-xs text-gray-500">Outstanding:</span>
                <span className={cn("block text-sm font-bold", invoice.due > 0 ? "text-red-600" : "text-green-600")}>
                  {formatCurrency(invoice.due)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Internal Remarks Memo */}
      {invoice.remarks && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-700">
          <span className="font-semibold block text-gray-900 mb-1">Invoice Remarks / Memo:</span>
          {invoice.remarks}
        </div>
      )}

      {/* Financial Collections Audit Log Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Payments Component Panel */}
        <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200 bg-gray-50 flex items-center space-x-2">
            <CreditCard className="w-5 h-5 text-gray-500" />
            <h2 className="font-bold text-gray-900 text-sm uppercase tracking-wide">Payments Received Ledger</h2>
          </div>
          {invoice.payments?.length === 0 ? (
            <div className="p-6 text-center text-sm text-gray-500">No payment entries recorded on this invoice.</div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Receipt Date</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Method Type</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Amount Split</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-sm text-gray-900">
                {invoice.payments?.map((pmt: any) => (
                  <tr key={pmt.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap">{formatDate(pmt.date)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={cn(
                        "px-2 py-0.5 text-xs font-medium rounded-full uppercase",
                        pmt.type === 'cash' ? "bg-amber-100 text-amber-800" : "bg-indigo-100 text-indigo-800"
                      )}>
                        {pmt.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right font-medium">{formatCurrency(pmt.amount)}</td>
                  </tr>
                ))}
                <tr className="bg-gray-50 border-t-2 font-semibold">
                  <td colSpan={2} className="px-4 py-3 text-right text-gray-700">Total Collected Allocation:</td>
                  <td className="px-4 py-3 text-right font-bold text-green-700">{formatCurrency(invoice.paid)}</td>
                </tr>
              </tbody>
            </table>
          )}
        </div>

        {/* Associated Cheques Tracking Panel */}
        <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200 bg-gray-50 flex items-center space-x-2">
            <Landmark className="w-5 h-5 text-gray-500" />
            <h2 className="font-bold text-gray-900 text-sm uppercase tracking-wide">Linked Instruments (Cheques)</h2>
          </div>
          {invoice.cheques?.length === 0 ? (
            <div className="p-6 text-center text-sm text-gray-500">No active banking cheque instruments tied to this transaction.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Instrument No / Bank</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Maturity Date</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Face Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-xs text-gray-900">
                  {invoice.cheques?.map((chq: any) => {
                    const statusLower = chq.status.toLowerCase();
                    return (
                      <tr key={chq.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <span className="block font-medium text-gray-900 text-sm">{chq.chequeNo}</span>
                          <span className="block text-gray-400 text-xs">{chq.bank || 'Not Specified'}</span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          {chq.dueDate ? formatDate(chq.dueDate) : <span className="text-gray-400">Immediate</span>}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-center">
                          <span className={cn(
                            "px-2 py-0.5 text-xs font-semibold rounded-full uppercase tracking-wider",
                            statusLower === 'paid' && "bg-green-100 text-green-800",
                            statusLower === 'pending' && "bg-yellow-100 text-yellow-800",
                            statusLower === 'returned' && "bg-red-100 text-red-800"
                          )}>
                            {chq.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-semibold">{formatCurrency(chq.amount)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}