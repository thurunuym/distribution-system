import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import api from '../lib/axios.ts';
import { Store, MapPin, Plus, Loader2 } from 'lucide-react';

export default function Shops() {
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [formData, setFormData] = useState({ name: '', address: '', routeId: '' });

  const { data: shops, isLoading } = useQuery({
    queryKey: ['shops'],
    queryFn: async () => (await api.get('/shops')).data
  });

  const { data: routes } = useQuery({
    queryKey: ['routes'],
    queryFn: async () => (await api.get('/routes')).data
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => api.post('/shops', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shops'] });
      setShowAdd(false);
      setFormData({ name: '', address: '', routeId: '' });
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Manage Shops</h1>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Shop
        </button>
      </div>

      {showAdd && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-blue-100 animate-in fade-in slide-in-from-top-4">
          <h2 className="text-lg font-bold mb-4">Add New Shop</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase">Shop Name</label>
              <input
                className="mt-1 w-full p-2 border rounded-md"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase">Route</label>
              <select
                className="mt-1 w-full p-2 border rounded-md"
                value={formData.routeId}
                onChange={(e) => setFormData({ ...formData, routeId: e.target.value })}
              >
                <option value="">Select Route</option>
                {routes?.map((r: any) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase">Address</label>
              <input
                className="mt-1 w-full p-2 border rounded-md"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end space-x-3">
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm font-medium text-gray-500">Cancel</button>
            <button
              onClick={() => mutation.mutate({ ...formData, routeId: parseInt(formData.routeId) })}
              disabled={!formData.name || !formData.routeId || mutation.isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              Save Shop
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          [1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-lg animate-pulse" />)
        ) : (
          shops?.map((shop: any) => (
            <div key={shop.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:border-blue-300 transition group">
              <div className="flex items-start justify-between">
                <div className="flex items-center">
                  <div className="bg-blue-50 p-2 rounded-lg group-hover:bg-blue-100 transition">
                    <Store className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-bold text-gray-900">{shop.name}</h3>
                    <div className="flex items-center text-xs text-gray-500 mt-1">
                      <MapPin className="w-3 h-3 mr-1" />
                      {shop.route_name}
                    </div>
                  </div>
                </div>
              </div>
              {shop.address && (
                <div className="mt-3 pt-3 border-t border-gray-50 text-xs text-gray-400">
                  {shop.address}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
