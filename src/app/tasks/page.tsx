
import { TasksClient } from './tasks-client';
import type { Case, Task, Team, User } from '@/lib/types';
import { getCases } from '../cases/actions';
import { getTeams, getUsers } from '../admin/actions';
import { getTasks } from './actions';

export default async function TasksPage() {
    
    const tasks: Task[] = await getTasks();
    const users: User[] = await getUsers();
    const cases: Case[] = await getCases();
    const teams: Team[] = await getTeams();

    return (
        <TasksClient
            initialTasks={tasks}
            initialUsers={users}
            initialCases={cases}
            initialTeams={teams}
        />
    );
}
