import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, getCurrentUser, loginUser, logoutUser, registerUser } from '../lib/auth';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const { user: loggedInUser, token } = await loginUser(email, password);
      localStorage.setItem('token', token);
      setUser(loggedInUser);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    await logoutUser();
    setUser(null);
  };

  const register = async (email: string, password: string, name: string) => {
    try {
      console.log('Starting registration process...');
      const { user: newUser, token } = await registerUser(email, password, name);
      localStorage.setItem('token', token);
      setUser(newUser);
      console.log('Registration successful!');
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        isLoading,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'ADMIN',
        login, 
        logout,
        register
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};