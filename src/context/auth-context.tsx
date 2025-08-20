
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import type { User } from '@/lib/types';
import { login as loginAction, logout as logoutAction, getSession, getUserById } from './actions';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, role: 'admin' | 'staff') => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkSession = async () => {
      setIsLoading(true);
      const session = await getSession();
      if (session?.userId) {
        try {
          const currentUser = await getUserById(session.userId);
          setUser(currentUser);
        } catch (error) {
          console.error("Failed to fetch user from session", error);
          setUser(null);
          router.push('/login');
        }
      } else {
        setUser(null);
        if (pathname !== '/login') {
            router.push('/login');
        }
      }
      setIsLoading(false);
    };

    checkSession();
  }, [pathname, router]);

  const login = async (email: string, password: string, role: 'admin' | 'staff') => {
    const loggedInUser = await loginAction(email, password, role);
    setUser(loggedInUser);
  };

  const logout = async () => {
    await logoutAction();
    setUser(null);
    router.push('/login');
  };

  if (isLoading) {
      return (
          <div className="flex h-screen w-full items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
      )
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
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
