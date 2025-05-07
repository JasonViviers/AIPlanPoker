import * as React from 'react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, BarChart2, LogOut, Sun, Moon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';

export function Layout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  // Check system preference on mount
  useEffect(() => {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {user && (
        <motion.nav 
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          className="bg-white dark:bg-gray-800 shadow-sm"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  className="flex-shrink-0 flex items-center"
                >
                  <Users className="h-8 w-8 text-primary-600 dark:text-primary-400" />
                  <span className="ml-2 text-xl font-bold text-gray-900 dark:text-white">
                    Scrum Estimator
                  </span>
                </motion.div>
                <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                  <motion.button
                    whileHover={{ y: -2 }}
                    onClick={() => navigate('/')}
                    className="border-transparent text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white hover:border-gray-300 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    Dashboard
                  </motion.button>
                  <motion.button
                    whileHover={{ y: -2 }}
                    onClick={() => navigate('/analytics')}
                    className="border-transparent text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white hover:border-gray-300 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    <BarChart2 className="h-5 w-5 mr-1" />
                    Analytics
                  </motion.button>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <motion.button
                  whileHover={{ rotate: 180 }}
                  transition={{ duration: 0.3 }}
                  onClick={toggleTheme}
                  className="p-2 rounded-full text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  onClick={() => signOut()}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 transition-colors duration-200"
                >
                  <LogOut className="h-5 w-5 mr-1" />
                  Sign Out
                </motion.button>
              </div>
            </div>
          </div>
        </motion.nav>
      )}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}