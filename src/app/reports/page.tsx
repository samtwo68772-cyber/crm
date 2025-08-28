
import { getCases } from '../cases/actions';
import { getTasks } from '../tasks/actions';
import { getUsers } from '../admin/actions';
import { getMeetings } from '../meetings/actions';
import { getTeams } from '../admin/actions';
import { getAuditLogs } from '../settings/actions';
import type { Case, Task, Meeting, User, Team, AuditLog } from '@/lib/types';
import { ReportsClient } from './reports-client';

export default async function ReportsPage() {
    
    // Fetch all required data on the server for faster initial load
    const cases: Case[] = await getCases();
    const tasks: Task[] = await getTasks();
    const users: User[] = await getUsers();
    const meetings: Meeting[] = await getMeetings();
    const teams: Team[] = await getTeams();
    const auditLogs: AuditLog[] = await getAuditLogs();

    return (
        <ReportsClient
            initialCases={cases}
            initialTasks={tasks}
            initialUsers={users}
            initialMeetings={meetings}
            initialTeams={teams}
            initialAuditLogs={auditLogs}
        />
    );
}
