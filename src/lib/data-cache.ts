
'use client';

import type { Case, Task, Contact, User, Team, Account, Document, Meeting, Email, Workflow, Notification, GeneralSettingsType, EmailSettingsType, NotificationPreferences, AuditLog } from './types';

interface Cache {
  cases: Case[];
  tasks: Task[];
  contacts: Contact[];
  users: User[];
  teams: Team[];
  accounts: Account[];
  documents: Document[];
  meetings: Meeting[];
  emails: Email[];
  workflows: Workflow[];
  notifications: Notification[];
  auditLogs: AuditLog[];
  generalSettings: GeneralSettingsType | null;
  emailSettings: EmailSettingsType | null;
  globalNotificationPreferences: NotificationPreferences | null;
}

const cache: Cache = {
  cases: [],
  tasks: [],
  contacts: [],
  users: [],
  teams: [],
  accounts: [],
  documents: [],
  meetings: [],
  emails: [],
  workflows: [],
  notifications: [],
  auditLogs: [],
  generalSettings: null,
  emailSettings: null,
  globalNotificationPreferences: null,
};

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach(listener => listener());
}

export const dataCache = {
  get: <K extends keyof Cache>(key: K): Cache[K] => {
    return cache[key];
  },
  set: <K extends keyof Cache>(key: K, value: Cache[K]) => {
    cache[key] = value;
    notify();
  },
  update: <T extends { id: string }>(key: keyof Cache, item: T) => {
    const collection = cache[key] as T[] | null;
    if (Array.isArray(collection)) {
      const index = collection.findIndex(i => i.id === item.id);
      if (index > -1) {
        collection[index] = item;
      } else {
        collection.push(item);
      }
      notify();
    }
  },
  add: <T extends { id: string }>(key: keyof Cache, item: T) => {
    const collection = cache[key] as T[] | null;
    if (Array.isArray(collection)) {
      collection.unshift(item);
      notify();
    }
  },
  remove: <T extends { id: string }>(key: keyof Cache, itemId: string) => {
    const collection = cache[key] as T[] | null;
    if (Array.isArray(collection)) {
      // @ts-ignore
      cache[key] = collection.filter(i => i.id !== itemId);
      notify();
    }
  },
  subscribe: (callback: () => void) => {
    listeners.add(callback);
    return () => listeners.delete(callback);
  },
};
