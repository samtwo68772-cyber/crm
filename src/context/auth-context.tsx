
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import type { User } from '@/lib/types';
import { login as loginAction, logout as logoutAction, getSession, getUserById } from './actions';

// Import all server actions for data fetching
import { getAccounts, getContacts } from '@/app/accounts/actions';
import { getUsers, getTeams } from '@/app/admin/actions';
import { getCases } from '@/app/cases/actions';
import { getDocuments } from '@/app/documents/actions';
import { getEmails } from '@/app/emails/actions';
import { getMeetings } from '@/app/meetings/actions';
import { getNotifications } from '@/app/notifications/actions';
import { getGeneralSettings, getEmailSettings, getGlobalNotificationPreferences, getWorkflows, getAuditLogs } from '@/app/settings/actions';
import { getTasks } from '@/app/tasks/actions';
import { useQueryClient } from '@tanstack/react-query';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();


  const prefetchData = useCallback((userId: string) => {
    // This function is now non-blocking. It kicks off the fetches but doesn't wait for them.
    // Prioritize core data for the dashboard
    Promise.all([
        queryClient.prefetchQuery({ queryKey: ['cases'], queryFn: getCases }),
        queryClient.prefetchQuery({ queryKey: ['tasks'], queryFn: getTasks }),
        queryClient.prefetchQuery({ queryKey: ['meetings'], queryFn: getMeetings }),
        queryClient.prefetchQuery({ queryKey: ['users'], queryFn: getUsers }),
        queryClient.prefetchQuery({ queryKey: ['accounts'], queryFn: getAccounts }),
        queryClient.prefetchQuery({ queryKey: ['contacts'], queryFn: getContacts }),
        queryClient.prefetchQuery({ queryKey: ['notifications', userId], queryFn: () => getNotifications(userId) }),
    ]).then(() => {
        // Pre-fetch less critical data in the background after the essentials are done
        queryClient.prefetchQuery({ queryKey: ['documents'], queryFn: getDocuments });
        queryClient.prefetchQuery({ queryKey: ['emails'], queryFn: getEmails });
        queryClient.prefetchQuery({ queryKey: ['generalSettings'], queryFn: getGeneralSettings });
        queryClient.prefetchQuery({ queryKey: ['emailSettings'], queryFn: getEmailSettings });
        queryClient.prefetchQuery({ queryKey: ['teams'], queryFn: getTeams });
        queryClient.prefetchQuery({ queryKey: ['globalNotificationPreferences'], queryFn: getGlobalNotificationPreferences });
        queryClient.prefetchQuery({ queryKey: ['workflows'], queryFn: getWorkflows });
        queryClient.prefetchQuery({ queryKey: ['auditLogs'], queryFn: getAuditLogs });
    }).catch(error => {
        console.error("Failed to prefetch initial data in the background", error);
    });
  }, [queryClient]);

  useEffect(() => {
    const checkSession = async () => {
      setIsLoading(true);
      try {
        const session = await getSession();
        if (session?.userId) {
          const currentUser = await getUserById(session.userId);
          setUser(currentUser);
          prefetchData(currentUser.id); // Prefetch in the background
        } else {
           if (pathname !== '/login') {
              router.push('/login');
           }
        }
      } catch (error) {
        console.error("Failed to fetch user from session", error);
        setUser(null);
        if (pathname !== '/login') router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };

    if(!user) {
        checkSession();
    }
  }, [pathname, router, prefetchData, user]);

  const login = async (email: string, password: string) => {
    const loggedInUser = await loginAction(email, password);
    setUser(loggedInUser);
    prefetchData(loggedInUser.id); // Prefetch in the background, don't await
  };

  const logout = async () => {
    await logoutAction();
    setUser(null);
    queryClient.clear();
    router.push('/login');
  };

  if (isLoading && pathname !== '/login') {
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
