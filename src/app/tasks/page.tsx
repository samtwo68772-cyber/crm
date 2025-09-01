
import { TasksClient } from './tasks-client';
import { getCases } from '../cases/actions';
import { getTeams, getUsers } from '../admin/actions';
import { getTasks } from './actions';
import type { PermissionSet } from '@/lib/types';
import { getSession } from '@/context/actions';
import { prisma } from '@/lib/prisma';


export default async function TasksPage() {
    const session = await getSession();
    let permissions: PermissionSet = {};

    if (session?.userId) {
        const user = await prisma.user.findUnique({
            where: { id: session.userId },
            include: { role: true },
        });
        if (user) {
            permissions = user.role.permissions as PermissionSet;
        }
    }

    return (
        <TasksClient permissions={permissions} />
    );
}
