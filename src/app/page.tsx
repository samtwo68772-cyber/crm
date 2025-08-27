
import {
    Briefcase,
    ListTodo,
    Mail,
    Calendar,
    Contact,
    Building,
    Users,
    FileText,
} from 'lucide-react';
import type { Case, Task, Meeting, Email, AuditLog, User, Account, Document } from '@/lib/types';
import { getCases } from './cases/actions';
import { getTasks } from './tasks/actions';
import { getEmails } from './emails/actions';
import { getMeetings } from './meetings/actions';
import { getContacts } from './accounts/actions';
import { getAccounts } from './accounts/actions';
import { getUsers } from './admin/actions';
import { getDocuments } from './documents/actions';
import { getAuditLogs } from './settings/actions';

import { DashboardClient } from './dashboard-client';


export default async function DashboardPage() {
    const cases: Case[] = await getCases();
    const tasks: Task[] = await getTasks();
    const emails: Email[] = await getEmails();
    const meetings: Meeting[] = await getMeetings();
    const contacts: Contact[] = await getContacts();
    const accounts: Account[] = await getAccounts();
    const users: User[] = await getUsers();
    const documents: Document[] = await getDocuments();
    const auditLogs: AuditLog[] = await getAuditLogs();
    
    const stats = {
        activeCases: cases.filter(c => ['New', 'In Progress', 'Under Review', 'Investigated'].includes(c.status)).length,
        pendingTasks: tasks.filter(t => ['To Do', 'In Progress'].includes(t.status)).length,
        unreadEmails: emails.filter(e => e.type === 'inbox' && !e.read).length,
        upcomingMeetings: meetings.filter(m => m.status === 'Upcoming').length,
        totalContacts: contacts.length,
        totalCompanies: accounts.length,
        totalUsers: users.length,
        totalDocuments: documents.length,
    };

    return (
        <DashboardClient
            stats={stats}
            initialCases={cases}
            initialTasks={tasks}
            initialMeetings={meetings}
            initialAuditLogs={auditLogs}
            allUsers={users}
        />
    );
}
