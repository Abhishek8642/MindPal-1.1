import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  Home, 
  CheckSquare, 
  Heart, 
  Mic, 
  Video,
  Settings,
  LogOut,
  Wifi,
  WifiOff,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import toast from 'react-hot-toast';

export function Layout() {
  const { user, signOut } = useAuth();
  const { isOnline, isConnectedToSupabase, retryConnection } = useNetworkStatus();
  const location = useLocation();

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast.error('Error signing out');
    } else {
      toast.success('Signed out successfully');
    }
  };

  const handleRetryConnection = async () => {
    toast.loading('Checking connection...', { id: 'retry-connection' });
    const status = await retryConnection();
    
    if (status.isOnline && status.isConnectedToSupabase) {
      toast.success('Connection restored!', { id: 'retry-connection' });
    } else {
      toast.error('Still having connection issues', { id: 'retry-connection' });
    }
  };

  const navItems = [
    { icon: Home, label: 'Dashboard', path: '/dashboard' },
    { icon: CheckSquare, label: 'Tasks', path: '/tasks' },
    { icon: Heart, label: 'Mood', path: '/mood' },
    { icon: Mic, label: 'Voice AI', path: '/voice' },
    { icon: Video, label: 'Video', path: '/video' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  const showNetworkBanner = !isOnline || !isConnectedToSupabase;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      {/* Network Status Banner */}
      <AnimatePresence>
        {showNetworkBanner && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className={`${
              !isOnline 
                ? 'bg-red-600' 
                : 'bg-yellow-600'
            } text-white px-4 py-2 text-center text-sm font-medium`}
          >
            <div className="flex items-center justify-center space-x-2">
              {!isOnline ? (
                <WifiOff className="h-4 w-4" />
              ) : (
                <Wifi className="h-4 w-4" />
              )}
              <span>
                {!isOnline 
                  ? 'No internet connection - Some features may not work'
                  : 'Connection issues with server - Data may not sync properly'
                }
              </span>
              <button
                onClick={handleRetryConnection}
                className="ml-2 bg-white/20 hover:bg-white/30 px-2 py-1 rounded text-xs transition-colors duration-200 flex items-center space-x-1"
              >
                <RefreshCw className="h-3 w-3" />
                <span>Retry</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-purple-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/dashboard" className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-2 rounded-xl">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                MindPal
              </span>
            </Link>

            <nav className="hidden md:flex space-x-8">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-purple-100 text-purple-700'
                        : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                Welcome, {user?.email?.split('@')[0]}
              </div>
              <button
                onClick={handleSignOut}
                className="p-2 text-gray-400 hover:text-red-500 transition-colors duration-200"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Outlet />
        </motion.div>
      </main>

      {/* Mobile Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-purple-100">
        <div className="flex justify-around py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center p-2 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'text-purple-600'
                    : 'text-gray-500 hover:text-purple-600'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs mt-1">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}