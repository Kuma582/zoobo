import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { fetchMe, loginUser, registerUser, sendHeartbeat } from '../api/client';
import { useNavigate } from 'react-router-dom';

interface User {
  id: string;
  username: string;
  avatar: string;
  level: number;
  vip: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (u: string, p: string) => Promise<void>;
  register: (u: string, p: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // On app start — restore session from localStorage
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('zoobo_token');
      if (token) {
        try {
          const userData = await fetchMe();
          setUser(userData);
          sendHeartbeat().catch(() => {});
        } catch (err) {
          // Session expired or backend down — clear token silently
          console.warn('Session restore failed:', err);
          localStorage.removeItem('zoobo_token');
        }
      }
      setIsLoading(false);
    };
    initAuth();
  }, []);

  // Heartbeat every 30s while user is logged in
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      sendHeartbeat().catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const login = async (username: string, password: string) => {
    const data = await loginUser(username, password);
    if (!data?.user?.id) throw new Error('Invalid response from server. Please try again.');
    localStorage.setItem('zoobo_token', data.user.id);
    setUser(data.user);
    navigate('/');
  };

  const register = async (username: string, password: string) => {
    const data = await registerUser(username, password);
    if (!data?.user?.id) throw new Error('Invalid response from server. Please try again.');
    localStorage.setItem('zoobo_token', data.user.id);
    setUser(data.user);
    navigate('/');
  };

  const logout = () => {
    localStorage.removeItem('zoobo_token');
    setUser(null);
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
