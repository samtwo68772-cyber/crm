
import { getTasks } from './actions';
import { getUsers } from '../admin/actions';
import { getCases } from '../cases/actions';
import { getTeams } from '../admin/actions';
import type { Task, User, Case, Team } from '@/lib/types';
import { TasksClient } from './tasks-client';

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
