
import { CasesClient } from './cases-client';
import type { PermissionSet } from '@/lib/types';
import { getSession } from '@/context/actions';
import { prisma } from '@/lib/prisma';

export default async function CasesPage() {
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
        <CasesClient permissions={permissions} />
    );
}
