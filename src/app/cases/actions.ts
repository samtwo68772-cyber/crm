
'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import type { Case, Communication } from '@/lib/types';
import { createNotification } from '../notifications/actions';

export async function getCases() {
    return await prisma.case.findMany({
        orderBy: {
            createdAt: 'desc',
        },
    });
}

export async function createCase(data: Omit<Case, 'id' | 'createdAt' | 'communications'>) {
    const newCase = await prisma.case.create({
        data: {
            ...data,
            createdAt: new Date().toISOString(),
        }
    });

    const assignedUser = await prisma.user.findFirst({ where: { name: newCase.assignedTo }});
    if (assignedUser) {
        await createNotification({
            userId: assignedUser.id,
            title: 'New Case Assigned',
            description: `Case #${newCase.id}: "${newCase.subject}" assigned to you.`,
            link: `/cases?id=${newCase.id}`,
            type: 'case'
        });
    }

    // revalidatePath('/cases');
    return newCase;
}

export async function updateCase(id: string, data: Partial<Omit<Case, 'id'>>) {
    const originalCase = await prisma.case.findUnique({ where: { id } });

    const updatedCase = await prisma.case.update({
        where: { id },
        data,
    });

    const assignedUser = await prisma.user.findFirst({ where: { name: updatedCase.assignedTo } });

    if (originalCase?.assignedTo !== updatedCase.assignedTo && assignedUser) {
         await createNotification({
            userId: assignedUser.id,
            title: 'Case Reassigned',
            description: `Case #${updatedCase.id}: "${updatedCase.subject}" has been assigned to you.`,
            link: `/cases?id=${updatedCase.id}`,
            type: 'case'
        });
    }
    
    if (originalCase?.status !== updatedCase.status && assignedUser) {
         await createNotification({
            userId: assignedUser.id,
            title: 'Case Status Updated',
            description: `Case #${updatedCase.id} status changed to ${updatedCase.status}.`,
            link: `/cases?id=${updatedCase.id}`,
            type: 'case'
        });
    }

    // revalidatePath('/cases');
    return updatedCase;
}

export async function addCommunicationToCase(caseId: string, comm: Omit<Communication, 'id'>) {
    const updatedCase = await prisma.case.update({
        where: { id: caseId },
        data: {
            communications: {
                push: { ...comm, id: `comm-${Date.now()}` }
            }
        }
    });
    // revalidatePath('/cases');
    return updatedCase;
}
