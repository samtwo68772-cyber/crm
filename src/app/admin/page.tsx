
import { AdminClient } from './admin-client';
import type { Case, Team, User } from '@/lib/types';
import { getCases } from '../cases/actions';
import { getTeams, getUsers } from './actions';

export default async function AdminPage() {
    // Fetch all required data on the server
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
