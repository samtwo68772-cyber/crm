
import { AccountsClient } from './accounts-client';
import type { Account, Case, Contact, Meeting, Task } from '@/lib/types';
import { getAccounts, getContacts } from './actions';
import { getCases } from '../cases/actions';
import { getTasks } from '../tasks/actions';
import { getMeetings } from '../meetings/actions';


export default async function AccountsPage() {
    // Fetch all required data on the server
    const accounts: Account[] = await getAccounts();
    const contacts: Contact[] = await getContacts();
    const cases: Case[] = await getCases();
    const tasks: Task[] = await getTasks();
    const meetings: Meeting[] = await getMeetings();

    // Pass data to the client component
    return (
        <AccountsClient
            initialAccounts={accounts}
            initialContacts={contacts}
            initialCases={cases}
            initialTasks={tasks}
            initialMeetings={meetings}
        />
    );
}
