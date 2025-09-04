
import type { Case, Task, Meeting, AuditLog, User, Contact, Account, Document } from '@/lib/types';
import { getCases } from './cases/actions';
import { getTasks } from './tasks/actions';
import { getMeetings } from './meetings/actions';
import { getAuditLogs } from './settings/actions';
import { getUsers } from './admin/actions';
import { getContacts, getAccounts } from './accounts/actions';
import { getDocuments } from './documents/actions';
import { getEmails } from './emails/actions';
import { DashboardClient } from './dashboard-client';


export default async function DashboardPage() {
    const cases: Case[] = await getCases();
    const tasks: Task[] = await getTasks();
    const meetings: Meeting[] = await getMeetings();
    const auditLogs: AuditLog[] = await getAuditLogs();
    const users: User[] = await getUsers();
    const contacts: Contact[] = await getContacts();
    const accounts: Account[] = await getAccounts();
    const documents: Document[] = await getDocuments();
    const emails: Email[] = await getEmails();
    
    // Stats calculation can be optimized on the backend in the future
    const stats = {
        activeCases: cases.filter(c => ['New', 'In Progress', 'Under Review', 'Investigated'].includes(c.status)).length,
        pendingTasks: tasks.filter(t => ['To Do', 'In Progress'].includes(t.status)).length,
        unreadEmails: emails.filter(e => !e.read && e.type === 'inbox').length,
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
