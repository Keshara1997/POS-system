import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider, useApp } from './context/SupabaseAppContext';
import { ThemeProvider } from './context/ThemeContext';
import { LoadingSpinner } from './components/ui/LoadingComponents';
import { LoginPage } from './components/auth/LoginPage';
import { Header } from './components/layout/Header';
import { POSTerminal } from './components/pos/POSTerminal';
import { TransactionsManager } from './components/transactions/TransactionsManager';
import { InventoryManager } from './components/inventory/InventoryManager';
import { CustomerManager } from './components/customers/CustomerManager';
import { ReportsManager } from './components/reports/ReportsManager';
import { Settings } from './components/settings/Settings';
import { DiscountManager } from './components/discounts/DiscountManager';
import { UserManager } from './components/users/UserManager';

function AppContent() {
  const { user, loading } = useAuth();
  const { state } = useApp();
  const [currentView, setCurrentView] = useState('pos');

  // Show loading spinner while auth is loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-secondary-50 to-primary-50 dark:from-secondary-900 dark:to-secondary-800 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading sekaLabs 2025 POS..." />
      </div>
    );
  }

  // Show login page if no user is authenticated
  if (!user || !state.currentUser) {
    return <LoginPage />;
  }

  const renderCurrentView = () => {
    const userRole = state.currentUser?.role;

    // Restrict cashiers to POS only
    if (userRole === 'cashier' && currentView !== 'pos') {
      setCurrentView('pos');
      return <POSTerminal />;
    }

    switch (currentView) {
      case 'pos':
        return <POSTerminal />;
      case 'transactions':
        // Only allow admin and manager to access transactions
        if (userRole === 'admin' || userRole === 'manager') {
          return <TransactionsManager />;
        }
        setCurrentView('pos');
        return <POSTerminal />;
      case 'inventory':
        // Only allow admin and manager to access inventory
        if (userRole === 'admin' || userRole === 'manager') {
          return <InventoryManager />;
        }
        setCurrentView('pos');
        return <POSTerminal />;
      case 'customers':
        // Only allow admin and manager to access customers
        if (userRole === 'admin' || userRole === 'manager') {
          return <CustomerManager />;
        }
        setCurrentView('pos');
        return <POSTerminal />;
      case 'reports':
        // Only allow admin and manager to access reports
        if (userRole === 'admin' || userRole === 'manager') {
          return <ReportsManager />;
        }
        setCurrentView('pos');
        return <POSTerminal />;
      case 'discounts':
        // Only allow admin and manager to access discounts
        if (userRole === 'admin' || userRole === 'manager') {
          return <DiscountManager />;
        }
        setCurrentView('pos');
        return <POSTerminal />;
      case 'users':
        // Only allow admin to access users
        if (userRole === 'admin') {
          return <UserManager />;
        }
        setCurrentView('pos');
        return <POSTerminal />;
      case 'settings':
        return <Settings />;
      default:
        return <POSTerminal />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary-50 to-primary-50 dark:from-secondary-900 dark:to-secondary-800 flex flex-col">
      <Header currentView={currentView} onViewChange={setCurrentView} />
      <main className="flex-1 overflow-hidden">
        {state.loading ? (
          <div className="flex items-center justify-center h-full">
            <LoadingSpinner size="lg" text="Loading..." />
          </div>
        ) : (
          <div className="animate-fade-in">
            {renderCurrentView()}
          </div>
        )}
      </main>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppProvider>
          <AppContent />
        </AppProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;