
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import type { User } from '@/lib/types';
import { login as loginAction, logout as logoutAction, getSession, getUserById } from './actions';
import { useQueryClient } from '@tanstack/react-query';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  
  const logout = useCallback(async () => {
    setUser(null); // Optimistically log out on the client
    await logoutAction();
    queryClient.clear();
    router.push('/login');
  }, [router, queryClient]);

  const checkSession = useCallback(async () => {
    try {
      const session = await getSession();
      if (session?.userId) {
        const currentUser = await getUserById(session.userId);
        setUser(currentUser);
      } else {
        setUser(null);
        if (pathname !== '/login') {
          router.push('/login');
        }
      }
    } catch (error) {
      console.error("Session check failed, logging out:", error);
      // This is the key change: if getUserById fails (user not found), we must log out.
      await logout();
    } finally {
      setIsLoading(false);
    }
  }, [pathname, router, logout]);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const login = async (email: string, password: string) => {
    const loggedInUser = await loginAction(email, password);
    setUser(loggedInUser);
    queryClient.invalidateQueries(); // Invalidate all queries on new login
    router.push('/');
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
