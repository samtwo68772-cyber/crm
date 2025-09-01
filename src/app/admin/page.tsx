
import { AdminClient } from './admin-client';
import { getCases } from '../cases/actions';
import { getTeams, getUsers } from './actions';

export default async function AdminPage() {
    return (
        <AdminClient />
    );
}
