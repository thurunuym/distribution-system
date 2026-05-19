import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/axios.ts';
import { formatCurrency, formatDate, cn } from '../lib/utils.ts';
import { Search, Filter, Eye } from 'lucide-react';

export default function Invoices() {
  const [filters, setFilters] = useState({
    date: '',
    shopId: '',
    status: ''
  });

  const { data: invoices, isLoading } = useQuery({
    queryKey: ['invoices', filters],
    queryFn: async () => {
      const params = new URLSearchParams(filters);
      const res = await api.get(`/invoices?${params.toString()}`);
      return res.data;
    }
  });

  const { data: shops } = useQuery({
    queryKey: ['shops'],
    queryFn: async () => (await api.get('/shops')).data
  });

  const { data: credits } = useQuery({
  // 1. Keep 'credits' in the cache key so it doesn't collide with the general invoice list
  queryKey: ['credits', routeId, agingMonths, specificDate], 
  queryFn: async () => {
    const params = new URLSearchParams();
    
    // 2. Force the status filter to always request 'credit' records
    params.append('status', 'credit'); 
    
    // 3. Fall back to date handling if specific mapping is targeted
    if (specificDate) params.append('date', specificDate);
    
    // 4. Request from the valid /invoices route path
    const res = await api.get(`/invoices?${params.toString()}`);
    
    let data = res.data;

    // 5. Apply Route Filtering on the client side since /invoices handles shops, not raw RouteId filtering
    if (routeId) {
      // (Your MapInvoice helper populates routeName, so we can check if it matches)
      const selectedRouteName = routes?.find((r: any) => r.id.toString() === routeId)?.name;
      if (selectedRouteName) {
        data = data.filter((c: any) => c.routeName === selectedRouteName);
      }
    }

    // 6. Client-side aging logic calculation buffer
    if (agingMonths !== undefined) {
      const today = new Date();
      data = data.filter((c: any) => {
        const invDate = new Date(c.date);
        const diffTime = Math.abs(today.getTime() - invDate.getTime());
        const diffMonths = diffTime / (1000 * 60 * 60 * 24 * 30.44); // Average month length
        return diffMonths >= agingMonths;
      });
    }

    return data;
  },
  // Ensure routes dropdown is loaded before running the route-name filter match
  enabled: true 
});

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Invoice List</h1>
        <Link
          to="/invoices/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-md font-medium text-sm hover:bg-blue-700 transition"
        >
          Add New Invoice
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase">Date</label>
          <input
            type="date"
            className="mt-1 block w-full p-2 border rounded-md text-sm"
            value={filters.date}
            onChange={(e) => setFilters({ ...filters, date: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase">Shop</label>
          <select
            className="mt-1 block w-full p-2 border rounded-md text-sm"
            value={filters.shopId}
            onChange={(e) => setFilters({ ...filters, shopId: e.target.value })}
          >
            <option value="">All Shops</option>
            {shops?.map((s: any) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase">Status</label>
          <select
            className="mt-1 block w-full p-2 border rounded-md text-sm"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="">All Statuses</option>
            <option value="settled">Settled</option>
            <option value="credit">Credit</option>
          </select>
        </div>
        <div className="flex items-end">
          <button
            onClick={() => setFilters({ date: '', shopId: '', status: '' })}
            className="w-full text-blue-600 font-medium text-sm p-2 hover:bg-blue-50 rounded-md transition"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-10 bg-gray-100 animate-pulse rounded" />)}
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice #</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shop</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Due</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {invoices?.map((inv: any) => (
                <tr key={inv.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(inv.date)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">{inv.number}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{inv.shop_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">{formatCurrency(inv.total_amount)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600 font-bold">{formatCurrency(inv.due)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className={cn(
                      "px-2 inline-flex text-xs leading-5 font-semibold rounded-full",
                      inv.status === 'settled' ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                    )}>
                      {inv.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <Link
                      to={`/invoices/${inv.id}`}
                      className="text-gray-400 hover:text-blue-600 transition"
                    >
                      <Eye className="w-5 h-5 mx-auto" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!isLoading && invoices?.length === 0 && (
          <div className="p-12 text-center text-gray-500">
            No invoices found for these filters.
          </div>
        )}
      </div>
    </div>
  );
}
