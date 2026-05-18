import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import api from '../lib/axios.ts';
import { MapPin, Plus, Loader2 } from 'lucide-react';

export default function RoutesPage() {
  const queryClient = useQueryClient();
  const [newRoute, setNewRoute] = useState('');

  const { data: routes, isLoading } = useQuery({
    queryKey: ['routes'],
    queryFn: async () => (await api.get('/routes')).data
  });

  const mutation = useMutation({
    mutationFn: async (name: string) => {
      const trimmedName = name.trim();
      return api.post('/routes', { name: trimmedName });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routes'] });
      setNewRoute('');
    }
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Manage Delivery Routes</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-lg font-bold mb-4">Add New Route</h2>
        <div className="flex space-x-3">
          <input
            className="flex-grow p-2 border rounded-md"
            placeholder="e.g. Colombo South, Kandy Route..."
            value={newRoute}
            onChange={(e) => setNewRoute(e.target.value)}
          />
          <button
            onClick={() => mutation.mutate(newRoute)}
            disabled={!newRoute.trim() || mutation.isPending}
            className="px-6 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 inline-flex items-center"
          >
            {mutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Add
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h2 className="font-bold text-gray-700">Existing Routes</h2>
        </div>
        <ul className="divide-y divide-gray-100">
          {isLoading ? (
            <div className="p-8 space-y-4">
              {[1, 2, 3].map(i => <div key={i} className="h-6 bg-gray-100 animate-pulse rounded" />)}
            </div>
          ) : (
            routes?.map((route: any) => (
              <li key={route.id} className="px-6 py-4 flex items-center hover:bg-gray-50 transition">
                <MapPin className="w-5 h-5 text-blue-500 mr-3" />
                <span className="font-medium text-gray-900">{route.name}</span>
                <span className="ml-auto text-xs text-gray-400">ID: {route.id}</span>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
