import { HashRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LayoutDashboard, Receipt, Landmark, Store, MapPin, Plus, AlertCircle } from 'lucide-react';
import { cn } from './lib/utils.ts';

// Pages (will create these next)
import Dashboard from './pages/Dashboard.tsx';
import Invoices from './pages/Invoices.tsx';
import NewInvoice from './pages/NewInvoice.tsx';
import InvoiceDetail from './pages/InvoiceDetail.tsx';
import Cheques from './pages/Cheques.tsx';
import Credits from './pages/Credits.tsx';
import Shops from './pages/Shops.tsx';
import RoutesPage from './pages/Routes.tsx';

const queryClient = new QueryClient();

function Navigation() {
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Invoices', path: '/invoices', icon: Receipt },
    { name: 'Cheques', path: '/cheques', icon: Landmark },
    { name: 'Credits', path: '/credits', icon: AlertCircle },
    { name: 'Shops', path: '/shops', icon: Store },
    { name: 'Routes', path: '/routes', icon: MapPin },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex space-x-8">
            <div className="flex-shrink-0 flex items-center font-bold text-xl text-blue-600">
              KELANI_DISTRIBUTION
            </div>
            <div className="hidden sm:flex sm:space-x-4">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = item.path === '/' 
                  ? location.pathname === '/' 
                  : location.pathname.startsWith(item.path);
                
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={cn(
                      "inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors",
                      isActive
                        ? "border-blue-500 text-gray-900"
                        : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                    )}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
          <div className="flex items-center">
            <Link
              to="/invoices/new"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Invoice
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Navigation />
          <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/invoices" element={<Invoices />} />
              <Route path="/invoices/new" element={<NewInvoice />} />
              <Route path="/invoices/:id" element={<InvoiceDetail />} />
              <Route path="/cheques" element={<Cheques />} />
              <Route path="/credits" element={<Credits />} />
              <Route path="/shops" element={<Shops />} />
              <Route path="/routes" element={<RoutesPage />} />
            </Routes>
          </main>
        </div>
      </Router>
    </QueryClientProvider>
  );
}
