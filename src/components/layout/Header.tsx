import { useState } from 'react';
import {
  User, Settings, LogOut, ShoppingCart, Monitor, Smartphone, Bell, Menu, X, Percent,
  Receipt, Package, Users, BarChart3, Sun, Moon
} from 'lucide-react';
import { useApp } from '../../context/SupabaseAppContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { swalConfig } from '../../lib/sweetAlert';

interface HeaderProps {
  currentView: string;
  onViewChange: (view: string) => void;
}

export function Header({ currentView, onViewChange }: HeaderProps) {
  const { state, dispatch } = useApp();
  const { signOut } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const toggleInterfaceMode = () => {
    const newMode = state.settings.interfaceMode === 'touch' ? 'traditional' : 'touch';
    dispatch({ type: 'SET_SETTINGS', payload: { interfaceMode: newMode } });
  };

  const handleLogout = async () => {
    const result = await swalConfig.confirm(
      'Sign Out Confirmation',
      'Are you sure you want to sign out? You will be logged out of the system.',
      'Sign Out'
    );

    if (result.isConfirmed) {
      try {
        await signOut();
      } catch (error) {
        console.error('Error signing out:', error);
        swalConfig.error('Failed to sign out. Please try again.');
      }
    }
  };

  const cartItemCount = state.cart.reduce((sum, item) => sum + item.quantity, 0);

  // Role-based navigation with proper permissions
  const getNavigationItems = () => {
    const role = state.currentUser?.role;
    const items = [];

    // POS - All roles can access
    items.push({ id: 'pos', label: 'POS', icon: ShoppingCart, color: 'text-blue-600' });

    // Sales/Transactions - Manager and Admin only (Cashiers should only have POS access)
    if (role === 'admin' || role === 'manager') {
      items.push({ id: 'transactions', label: 'Sales', icon: Receipt, color: 'text-green-600' });
    }

    // Inventory - Manager and Admin can access
    if (role === 'admin' || role === 'manager') {
      items.push({ id: 'inventory', label: 'Inventory', icon: Package, color: 'text-purple-600' });
    }

    // Customers - Manager and Admin can access
    if (role === 'admin' || role === 'manager') {
      items.push({ id: 'customers', label: 'Customers', icon: Users, color: 'text-orange-600' });
    }

    // Discounts - Manager and Admin can access
    if (role === 'admin' || role === 'manager') {
      items.push({ id: 'discounts', label: 'Discounts', icon: Percent, color: 'text-pink-600' });
    }

    // Reports - Manager and Admin can access
    if (role === 'admin' || role === 'manager') {
      items.push({ id: 'reports', label: 'Reports', icon: BarChart3, color: 'text-red-600' });
    }

    // Users - Admin only
    if (role === 'admin') {
      items.push({ id: 'users', label: 'Users', icon: User, color: 'text-indigo-600' });
    }

    return items;
  };

  const navigationItems = getNavigationItems();

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-secondary-200/50 dark:bg-secondary-800/80 dark:border-secondary-700/50 sticky top-0 z-40 shadow-soft">
      <div className="px-4 lg:px-6">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo and Store Name */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              {state.settings.storeLogo ? (
                <img
                  src={state.settings.storeLogo}
                  alt="Store Logo"
                  className="h-8 w-8 lg:h-10 lg:w-10 object-contain rounded-lg"
                />
              ) : (
                <div className="h-8 w-8 lg:h-10 lg:w-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center shadow-medium">
                  <ShoppingCart className="h-4 w-4 lg:h-5 lg:w-5 text-white" />
                </div>
              )}
              <div className="hidden sm:block">
                <h1 className="text-lg lg:text-xl font-bold text-secondary-900 dark:text-secondary-100 truncate max-w-48">
                  {state.settings.storeName}
                </h1>
                <p className="text-xs text-secondary-500 dark:text-secondary-400 hidden lg:block">sekaLabs 2025 POS System</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden xl:flex space-x-1 ml-8">
              {navigationItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onViewChange(item.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-2xl text-sm font-semibold transition-all duration-300 ${currentView === item.id
                    ? 'bg-primary-50 text-primary-700 shadow-soft dark:bg-primary-900/30 dark:text-primary-300'
                    : 'text-secondary-600 hover:text-secondary-900 hover:bg-secondary-100/50 dark:text-secondary-400 dark:hover:text-secondary-200 dark:hover:bg-secondary-700/50'
                    }`}
                >
                  <item.icon className={`h-4 w-4 ${currentView === item.id ? 'text-primary-600' : item.color}`} />
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Right Side Controls */}
          <div className="flex items-center space-x-2 lg:space-x-4">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="hidden md:flex items-center space-x-2 px-3 py-2 rounded-2xl bg-secondary-100/50 hover:bg-secondary-200/50 transition-all duration-300 text-sm font-medium"
              title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
            >
              {isDark ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
              <span className="hidden lg:block">
                {isDark ? 'Light' : 'Dark'}
              </span>
            </button>

            {/* Interface Mode Toggle - Hidden on mobile */}
            <button
              onClick={toggleInterfaceMode}
              className="hidden md:flex items-center space-x-2 px-3 py-2 rounded-2xl bg-secondary-100/50 hover:bg-secondary-200/50 transition-all duration-300 text-sm font-medium"
              title={`Switch to ${state.settings.interfaceMode === 'touch' ? 'Traditional' : 'Touch'} Mode`}
            >
              {state.settings.interfaceMode === 'touch' ? (
                <Monitor className="h-4 w-4" />
              ) : (
                <Smartphone className="h-4 w-4" />
              )}
              <span className="hidden lg:block">
                {state.settings.interfaceMode === 'touch' ? 'Touch' : 'Traditional'}
              </span>
            </button>

            {/* Cart Indicator */}
            {currentView === 'pos' && cartItemCount > 0 && (
              <div className="flex items-center space-x-2 px-3 py-2 rounded-2xl bg-primary-50 text-primary-700 shadow-soft animate-pulse-gentle">
                <ShoppingCart className="h-4 w-4" />
                <span className="font-semibold text-sm">{cartItemCount}</span>
              </div>
            )}

            {/* Notifications */}
            <button className="p-2 rounded-2xl text-secondary-500 hover:text-secondary-700 hover:bg-secondary-100/50 transition-all duration-300 relative">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-3 w-3 bg-danger-500 rounded-full animate-pulse"></span>
            </button>

            {/* User Menu */}
            <div className="flex items-center space-x-3">
              <div className="hidden lg:block text-right">
                <p className="text-sm font-semibold text-secondary-900 truncate max-w-32">
                  {state.currentUser?.name}
                </p>
                <p className="text-xs text-secondary-500 capitalize">
                  {state.currentUser?.role}
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 lg:h-9 lg:w-9 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl flex items-center justify-center shadow-medium">
                  <User className="h-4 w-4 lg:h-5 lg:w-5 text-white" />
                </div>

                <div className="hidden md:flex items-center space-x-1">
                  <button
                    onClick={() => onViewChange('settings')}
                    className="p-2 rounded-2xl text-secondary-500 hover:text-secondary-700 hover:bg-secondary-100/50 transition-all duration-300"
                  >
                    <Settings className="h-4 w-4" />
                  </button>

                  <button
                    onClick={handleLogout}
                    className="p-2 rounded-2xl text-secondary-500 hover:text-danger-600 hover:bg-danger-50 transition-all duration-300"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="xl:hidden p-2 rounded-2xl text-secondary-500 hover:text-secondary-700 hover:bg-secondary-100/50 transition-all duration-300"
            >
              {showMobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {showMobileMenu && (
          <div className="xl:hidden border-t border-secondary-200/50 py-4 animate-slide-down">
            <nav className="space-y-2">
              {navigationItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    onViewChange(item.id);
                    setShowMobileMenu(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-300 ${currentView === item.id
                    ? 'bg-primary-50 text-primary-700 shadow-soft'
                    : 'text-secondary-600 hover:text-secondary-900 hover:bg-secondary-100/50'
                    }`}
                >
                  <item.icon className={`h-5 w-5 ${currentView === item.id ? 'text-primary-600' : item.color}`} />
                  <span>{item.label}</span>
                </button>
              ))}

              <div className="border-t border-secondary-200/50 pt-4 mt-4 space-y-2">
                <button
                  onClick={() => {
                    onViewChange('settings');
                    setShowMobileMenu(false);
                  }}
                  className="w-full flex items-center space-x-3 px-4 py-3 rounded-2xl text-sm font-semibold text-secondary-600 hover:text-secondary-900 hover:bg-secondary-100/50 transition-all duration-300"
                >
                  <Settings className="h-5 w-5 text-secondary-500" />
                  <span>Settings</span>
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-3 px-4 py-3 rounded-2xl text-sm font-semibold text-danger-600 hover:bg-danger-50 transition-all duration-300"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Logout</span>
                </button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}