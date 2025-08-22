
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

    if (data.assignedTo && data.assignedTo.length > 0) {
        const assignedUsers = await prisma.user.findMany({
            where: {
                OR: data.assignedTo.map(assignee => {
                    if (assignee.startsWith('user-')) {
                        return { id: assignee.replace('user-', '') };
                    }
                    return { team: assignee.replace('team-', '') };
                }).filter(Boolean) as any[]
            }
        });

        for (const assignedUser of assignedUsers) {
            await createNotification({
                userId: assignedUser.id,
                title: 'New Case Assigned',
                description: `Case #${newCase.id}: "${newCase.subject}" assigned to you/your team.`,
                link: `/cases?id=${newCase.id}`,
                type: 'case'
            });
        }
    }

    return newCase;
}

export async function updateCase(id: string, data: Partial<Omit<Case, 'id'>>) {
    const originalCase = await prisma.case.findUnique({ where: { id } });

    const updatedCase = await prisma.case.update({
        where: { id },
        data,
    });

    // Simplified notification logic for updates
    if (data.assignedTo && originalCase?.assignedTo.join(',') !== data.assignedTo.join(',')) {
        const assignedUsers = await prisma.user.findMany({
            where: {
                OR: data.assignedTo.map(assignee => {
                    if (assignee.startsWith('user-')) {
                        return { id: assignee.replace('user-', '') };
                    }
                    return { team: assignee.replace('team-', '') };
                }).filter(Boolean) as any[]
            }
        });
        for (const assignedUser of assignedUsers) {
            await createNotification({
                userId: assignedUser.id,
                title: 'Case Reassigned',
                description: `Case #${updatedCase.id}: "${updatedCase.subject}" has been assigned to you/your team.`,
                link: `/cases?id=${updatedCase.id}`,
                type: 'case'
            });
        }
    }
    
    if (originalCase?.status !== updatedCase.status) {
        // Notify all current assignees about status change
        const currentAssignees = await prisma.user.findMany({
             where: {
                OR: updatedCase.assignedTo.map(assignee => {
                    if (assignee.startsWith('user-')) {
                        return { id: assignee.replace('user-', '') };
                    }
                    return { team: assignee.replace('team-', '') };
                }).filter(Boolean) as any[]
            }
        });
         for (const assignedUser of currentAssignees) {
            await createNotification({
                userId: assignedUser.id,
                title: 'Case Status Updated',
                description: `Case #${updatedCase.id} status changed to ${updatedCase.status}.`,
                link: `/cases?id=${updatedCase.id}`,
                type: 'case'
            });
        }
    }

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
    return updatedCase;
}

export async function deleteCase(id: string) {
    const deletedCase = await prisma.case.delete({
        where: { id },
    });
    return deletedCase;
}
