
import { getUsers, getTeams } from './actions';
import { getCases } from '../cases/actions';
import type { User, Team, Case } from '@/lib/types';
import { AdminClient } from './admin-client';

export default async function AdminPage() {
    
    const users: User[] = await getUsers();
    const teams: Team[] = await getTeams();
    const cases: Case[] = await getCases();

    return (
        <AdminClient
            initialUsers={users}
            initialTeams={teams}
            initialCases={cases}
        />
    );
}
