
import type { Case, Task, Team, User, Workflow } from '@/lib/types';
import { CasesClient } from './cases-client';
import { getCases } from './actions';
import { getTeams, getUsers } from '../admin/actions';
import { getTasks } from '../tasks/actions';
import { getWorkflows } from '../settings/actions';

export default async function CasesPage() {
    // Fetch all required data on the server
    const cases: Case[] = await getCases();
    const users: User[] = await getUsers();
    const teams: Team[] = await getTeams();
    const tasks: Task[] = await getTasks();
    const workflows: Workflow[] = await getWorkflows();

    // Pass data to the client component
    return (
        <CasesClient
            initialCases={cases}
            initialUsers={users}
            initialTeams={teams}
            initialTasks={tasks}
            initialWorkflows={workflows}
        />
    );
}
