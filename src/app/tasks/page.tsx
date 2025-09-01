
import { TasksClient } from './tasks-client';
import { getCases } from '../cases/actions';
import { getTeams, getUsers } from '../admin/actions';
import { getTasks } from './actions';

export default async function TasksPage() {
    
    const tasks = await getTasks();
    const users = await getUsers();
    const cases = await getCases();
    const teams = await getTeams();

    return (
        <TasksClient
            initialTasks={tasks}
            initialUsers={users}
            initialCases={cases}
            initialTeams={teams}
        />
    );
}
