import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Settings, LogOut, UserPlus, LogIn, Menu, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const Navigation: React.FC = () => {
  const location = useLocation();
  const { isAuthenticated, isAdmin, user, logout } = useAuth();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="bg-gray-900 border-b border-gray-800">
      <div className="container mx-auto px-4">
        <div className="relative flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 text-transparent bg-clip-text animate-gradient relative group">
                St.Joseph News
                <span className="absolute inset-0 blur-lg bg-gradient-to-r from-blue-400/40 via-purple-500/40 to-pink-500/40 opacity-50 group-hover:opacity-75 transition-opacity animate-pulse"></span>
              </span>
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-400 hover:text-white"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Desktop navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <Link
              to="/"
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                !isAdminRoute
                  ? 'text-white bg-gray-800'
                  : 'text-gray-300 hover:text-white hover:bg-gray-800'
              }`}
            >
              Home
            </Link>
            
            {isAuthenticated ? (
              <>
                <span className="text-gray-400">
                  Welcome, {user?.name}
                </span>
                
                {isAdmin && (
                  <Link
                    to="/admin"
                    className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium ${
                      isAdminRoute
                        ? 'text-white bg-gray-800'
                        : 'text-gray-300 hover:text-white hover:bg-gray-800'
                    }`}
                  >
                    <Settings className="h-4 w-4" />
                    <span>Admin</span>
                  </Link>
                )}
                
                <button
                  onClick={() => logout()}
                  className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/register"
                  className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>Register</span>
                </Link>
                <Link
                  to="/login"
                  className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800"
                >
                  <LogIn className="h-4 w-4" />
                  <span>Login</span>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden py-2 space-y-1">
            <Link
              to="/"
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                !isAdminRoute
                  ? 'text-white bg-gray-800'
                  : 'text-gray-300 hover:text-white hover:bg-gray-800'
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
            
            {isAuthenticated ? (
              <>
                <div className="px-3 py-2 text-gray-400">
                  Welcome, {user?.name}
                </div>
                
                {isAdmin && (
                  <Link
                    to="/admin"
                    className={`block px-3 py-2 rounded-md text-base font-medium ${
                      isAdminRoute
                        ? 'text-white bg-gray-800'
                        : 'text-gray-300 hover:text-white hover:bg-gray-800'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <div className="flex items-center space-x-2">
                      <Settings className="h-4 w-4" />
                      <span>Admin</span>
                    </div>
                  </Link>
                )}
                
                <button
                  onClick={() => {
                    logout();
                    setIsMenuOpen(false);
                  }}
                  className="w-full text-left flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-800"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/register"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-800"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <div className="flex items-center space-x-2">
                    <UserPlus className="h-4 w-4" />
                    <span>Register</span>
                  </div>
                </Link>
                <Link
                  to="/login"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-800"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <div className="flex items-center space-x-2">
                    <LogIn className="h-4 w-4" />
                    <span>Login</span>
                  </div>
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};