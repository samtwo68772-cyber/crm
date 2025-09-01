
import { CasesClient } from './cases-client';
import { getCases } from './actions';
import { getUsers } from '../admin/actions';
import { getWorkflows } from '../settings/actions';
import { getTeams } from '../admin/actions';
import { getTasks } from '../tasks/actions';

export default async function CasesPage() {
    const cases = await getCases();
    const users = await getUsers();
    const teams = await getTeams();
    const tasks = await getTasks();
    const workflows = await getWorkflows();
    
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
