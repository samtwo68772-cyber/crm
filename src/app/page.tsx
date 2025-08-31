
import type { Case, Task, Meeting, AuditLog, User } from '@/lib/types';
import { getCases } from './cases/actions';
import { getTasks } from './tasks/actions';
import { getMeetings } from './meetings/actions';
import { getAuditLogs } from './settings/actions';
import { getUsers } from './admin/actions';
import { DashboardClient } from './dashboard-client';


export default async function DashboardPage() {
    const cases: Case[] = await getCases();
    const tasks: Task[] = await getTasks();
    const meetings: Meeting[] = await getMeetings();
    const auditLogs: AuditLog[] = await getAuditLogs();
    const users: User[] = await getUsers();
    
    // Stats calculation can be optimized on the backend in the future
    const stats = {
        activeCases: cases.filter(c => ['New', 'In Progress', 'Under Review', 'Investigated'].includes(c.status)).length,
        pendingTasks: tasks.filter(t => ['To Do', 'In Progress'].includes(t.status)).length,
        upcomingMeetings: meetings.filter(m => m.status === 'Upcoming').length,
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
