
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import type { User } from '@/lib/types';
import { login as loginAction, logout as logoutAction, getSession, getUserById } from './actions';
import { dataCache } from '@/lib/data-cache';

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

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  isDataLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const loadInitialData = useCallback(async (userId: string) => {
    setIsDataLoading(true);
    try {
        const [
            accounts, contacts, users, teams, cases, documents, emails,
            meetings, notifications, generalSettings, emailSettings,
            globalNotificationPreferences, workflows, auditLogs, tasks
        ] = await Promise.all([
            getAccounts(), getContacts(), getUsers(), getTeams(), getCases(),
            getDocuments(), getEmails(), getMeetings(), getNotifications(userId),
            getGeneralSettings(), getEmailSettings(), getGlobalNotificationPreferences(),
            getWorkflows(), getAuditLogs(), getTasks()
        ]);

        dataCache.set('accounts', accounts);
        dataCache.set('contacts', contacts);
        dataCache.set('users', users);
        dataCache.set('teams', teams);
        dataCache.set('cases', cases);
        dataCache.set('documents', documents);
        dataCache.set('emails', emails);
        dataCache.set('meetings', meetings);
        dataCache.set('notifications', notifications);
        dataCache.set('generalSettings', generalSettings);
        dataCache.set('emailSettings', emailSettings);
        dataCache.set('globalNotificationPreferences', globalNotificationPreferences);
        dataCache.set('workflows', workflows);
        dataCache.set('auditLogs', auditLogs);
        dataCache.set('tasks', tasks);

    } catch (error) {
        console.error("Failed to load initial data into cache", error);
    } finally {
        setIsDataLoading(false);
    }
  }, []);

  useEffect(() => {
    const checkSession = async () => {
      setIsLoading(true);
      const session = await getSession();
      if (session?.userId) {
        try {
          const currentUser = await getUserById(session.userId);
          setUser(currentUser);
          await loadInitialData(currentUser.id);
        } catch (error) {
          console.error("Failed to fetch user from session", error);
          setUser(null);
          if (pathname !== '/login') router.push('/login');
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
  }, [pathname, router, loadInitialData]);

  const login = async (email: string, password: string) => {
    const loggedInUser = await loginAction(email, password);
    setUser(loggedInUser);
    await loadInitialData(loggedInUser.id);
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
    <AuthContext.Provider value={{ user, login, logout, isLoading, isDataLoading }}>
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
