
"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { Account, Case, Contact, Document, Email, Meeting, Task, Team, User, EmailSettingsType, AuditLog, Notification, NotificationPreferences, GeneralSettingsType, Workflow } from '@/lib/types';
import { 
    accounts as mockAccounts, 
    cases as mockCases, 
    contacts as mockContacts, 
    documents as mockDocuments, 
    emails as mockEmails,
    meetings as mockMeetings, 
    tasks as mockTasks,
    teams as mockTeams,
    users as mockUsers,
    auditLogs as mockAuditLogs,
    notifications as mockNotifications,
    workflows as initialWorkflows
} from '@/lib/data.tsx';

const initialEmailSettings: EmailSettingsType = {
    smtpHost: 'smtp.example.com',
    smtpPort: 587,
    smtpUser: 'user@example.com',
    smtpPass: 'password',
    smtpEncryption: 'tls',
    imapHost: 'imap.example.com',
    imapPort: 993,
    imapUser: 'user@example.com',
    imapPass: 'password',
    imapEncryption: 'ssl',
    configured: false
};

const initialNotificationPreferences: NotificationPreferences = {
    cases: {
        newAssignment: { inApp: true, email: true, mandatory: true },
        statusChange: { inApp: true, email: false, mandatory: false },
        newComment: { inApp: true, email: false, mandatory: false },
    },
    tasks: {
        newAssignment: { inApp: true, email: true, mandatory: true },
        statusChange: { inApp: false, email: false, mandatory: false },
        dueSoon: { inApp: true, email: true, mandatory: false },
    },
    meetings: {
        newInvite: { inApp: true, email: true, mandatory: true },
        update: { inApp: true, email: true, mandatory: false },
        cancellation: { inApp: true, email: true, mandatory: true },
    }
};

const initialGeneralSettings: GeneralSettingsType = {
  systemName: 'MinT CRM',
  companyName: 'My Company',
  logoUrl: '',
  timeZone: 'UTC-5:00',
  language: 'en-US',
};

interface DataContextType {
  accounts: Account[];
  setAccounts: React.Dispatch<React.SetStateAction<Account[]>>;
  cases: Case[];
  setCases: React.Dispatch<React.SetStateAction<Case[]>>;
  contacts: Contact[];
  setContacts: React.Dispatch<React.SetStateAction<Contact[]>>;
  documents: Document[];
  setDocuments: React.Dispatch<React.SetStateAction<Document[]>>;
  emails: Email[];
  setEmails: React.Dispatch<React.SetStateAction<Email[]>>;
  meetings: Meeting[];
  setMeetings: React.Dispatch<React.SetStateAction<Meeting[]>>;
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  teams: Team[];
  setTeams: React.Dispatch<React.SetStateAction<Team[]>>;
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  emailSettings: EmailSettingsType;
  setEmailSettings: React.Dispatch<React.SetStateAction<EmailSettingsType>>;
  auditLogs: AuditLog[];
  setAuditLogs: React.Dispatch<React.SetStateAction<AuditLog[]>>;
  notifications: Notification[];
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
  notificationPreferences: NotificationPreferences;
  setNotificationPreferences: React.Dispatch<React.SetStateAction<NotificationPreferences>>;
  generalSettings: GeneralSettingsType;
  setGeneralSettings: React.Dispatch<React.SetStateAction<GeneralSettingsType>>;
  workflows: Workflow[];
  setWorkflows: React.Dispatch<React.SetStateAction<Workflow[]>>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [accounts, setAccounts] = useState<Account[]>(mockAccounts);
  const [cases, setCases] = useState<Case[]>(mockCases);
  const [contacts, setContacts] = useState<Contact[]>(mockContacts);
  const [documents, setDocuments] = useState<Document[]>(mockDocuments);
  const [emails, setEmails] = useState<Email[]>(mockEmails);
  const [meetings, setMeetings] = useState<Meeting[]>(mockMeetings);
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [teams, setTeams] = useState<Team[]>(mockTeams);
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [emailSettings, setEmailSettings] = useState<EmailSettingsType>(initialEmailSettings);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(mockAuditLogs);
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreferences>(initialNotificationPreferences);
  const [generalSettings, setGeneralSettings] = useState<GeneralSettingsType>(initialGeneralSettings);
  const [workflows, setWorkflows] = useState<Workflow[]>(initialWorkflows);
  

  const value = {
    accounts, setAccounts,
    cases, setCases,
    contacts, setContacts,
    documents, setDocuments,
    emails, setEmails,
    meetings, setMeetings,
    tasks, setTasks,
    teams, setTeams,
    users, setUsers,
    emailSettings, setEmailSettings,
    auditLogs, setAuditLogs,
    notifications, setNotifications,
    notificationPreferences, setNotificationPreferences,
    generalSettings, setGeneralSettings,
    workflows, setWorkflows
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
