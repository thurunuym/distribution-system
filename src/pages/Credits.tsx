import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import api from '../lib/axios.ts';
import { formatCurrency, formatDate, cn } from '../lib/utils.ts';
import { Filter, Calendar, MapPin, Receipt, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Credits() {
  const [routeId, setRouteId] = useState('');
  const [agingMonths, setAgingMonths] = useState<number | undefined>(undefined);
  const [specificDate, setSpecificDate] = useState('');

  const { data: credits, isLoading } = useQuery({
    queryKey: ['credits', routeId, agingMonths, specificDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (routeId) params.append('routeId', routeId);
      if (agingMonths !== undefined) params.append('agingMonths', agingMonths.toString());
      if (specificDate) params.append('specificDate', specificDate);
      
      const res = await api.get(`/credits?${params.toString()}`);
      return res.data;
    }
  });

  const { data: routes } = useQuery({
    queryKey: ['routes'],
    queryFn: async () => (await api.get('/routes')).data
  });

  const agingOptions = [
    { label: 'All Credits', value: undefined },
    { label: '> 1 Month', value: 1 },
    { label: '> 2 Months', value: 2 },
    { label: '3+ Months', value: 3 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Credit Management</h1>
        <div className="flex space-x-2">
            <button 
                onClick={() => { setRouteId(''); setAgingMonths(undefined); setSpecificDate(''); }}
                className="text-sm text-blue-600 hover:bg-blue-50 px-3 py-1 rounded"
            >
                Clear All Filter
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Side: Classified List */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                className="text-sm border-gray-300 rounded-md p-1 border"
                value={routeId}
                onChange={(e) => { setRouteId(e.target.value); setSpecificDate(''); }}
              >
                <option value="">All Routes</option>
                {routes?.map((r: any) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
            <div className="text-sm text-gray-500">
              Showing <span className="font-bold text-gray-900">{credits?.length || 0}</span> credit invoices
            </div>
          </div>

          <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Inv #</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Shop</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Route</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Due</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">View</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {isLoading ? (
                    [1,2,3,4].map(i => <tr key={i}><td colSpan={7} className="p-4 h-12 bg-gray-50 animate-pulse"></td></tr>)
                  ) : credits?.map((c: any) => (
                    <tr key={c.id} className="hover:bg-blue-50 transition-colors">
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(c.date)}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-blue-600">{c.number}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{c.shop_name}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-xs text-gray-500">
                        <span className="flex items-center">
                            <MapPin className="w-3 h-3 mr-1 text-gray-300" />
                            {c.route_name}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-right text-gray-500">{formatCurrency(c.total_amount)}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-right text-red-600 font-bold">{formatCurrency(c.due)}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-center">
                        <Link to={`/invoices/${c.id}`} className="text-gray-400 hover:text-blue-600">
                            <ArrowRight className="w-4 h-4 mx-auto" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {credits?.length === 0 && !isLoading && (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-gray-500">No credit invoices found for the selected filter.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Side: Filters */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center">
              <Calendar className="w-4 h-4 mr-2 text-blue-500" />
              Aging Report
            </h3>
            <div className="grid grid-cols-1 gap-2">
              {agingOptions.map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => { setAgingMonths(opt.value); setSpecificDate(''); }}
                  className={cn(
                    "w-full text-left px-4 py-2 rounded-md text-sm font-medium transition",
                    agingMonths === opt.value 
                      ? "bg-blue-600 text-white shadow-md" 
                      : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-100"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center">
              <Calendar className="w-4 h-4 mr-2 text-green-500" />
              Filter by Date
            </h3>
            <input
              type="date"
              className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
              value={specificDate}
              onChange={(e) => { 
                setSpecificDate(e.target.value); 
                setAgingMonths(undefined);
              }}
            />
            <p className="text-[10px] text-gray-400 mt-2">Find credits created on a specific calendar day.</p>
          </div>

          <div className="bg-red-50 p-6 rounded-lg border border-red-100">
            <h3 className="text-red-800 font-bold text-sm mb-2">Total Credit Outstanding</h3>
            <p className="text-2xl font-bold text-red-600">
              {formatCurrency(credits?.reduce((sum: number, c: any) => sum + c.due, 0) || 0)}
            </p>
            <p className="text-[10px] text-red-400 mt-1 uppercase tracking-wider font-bold">In filtered view</p>
          </div>
        </div>
      </div>
    </div>
  );
}
