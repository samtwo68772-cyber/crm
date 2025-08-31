

import { TasksClient } from '../tasks/tasks-client';
import { MeetingsPage } from './meetings-client';
import type { Case, Meeting, Task, Team, User } from '@/lib/types';
import { getCases } from '../cases/actions';
import { getTeams, getUsers } from '../admin/actions';
import { getMeetings } from './actions';


export default async function Meetings() {
    
    const meetings: Meeting[] = await getMeetings();
    const users: User[] = await getUsers();
    const cases: Case[] = await getCases();
    const teams: Team[] = await getTeams();

    return (
        <MeetingsPage
            initialMeetings={meetings}
            initialUsers={users}
            initialCases={cases}
            initialTeams={teams}
        />
    );
}
