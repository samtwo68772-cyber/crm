
'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import type { Case, Communication } from '@/lib/types';
import { createNotification } from '../notifications/actions';
import { randomBytes } from 'crypto';
import { getSession } from '@/context/actions';

function generateShortId() {
    return `CASE-${randomBytes(4).toString('hex').slice(0, 7).toUpperCase()}`;
}

export async function getCases() {
    return await prisma.case.findMany({
        orderBy: {
            createdAt: 'desc',
        },
        include: {
            assignments: {
                include: {
                    user: true
                }
            }
        }
    });
}

export async function createCase(data: Omit<Case, 'id' | 'createdAt' | 'communications' | 'assignments'> & { assignedTo: string[] }) {
    const session = await getSession();
    if (!session?.userId) throw new Error("Authentication required");

    const { assignedTo, ...caseData } = data;

    const newCase = await prisma.case.create({
        data: {
            id: generateShortId(),
            ...caseData,
            createdAt: new Date().toISOString(),
            assignments: {
                create: assignedTo.map(id => ({
                    user: { connect: { id: id.replace('user-', '') } },
                    assignedBy: session.userId,
                }))
            }
        },
        include: {
            assignments: { include: { user: true } }
        }
    });

    if (assignedTo && assignedTo.length > 0) {
        for (const assigneeId of assignedTo) {
             if (assigneeId.startsWith('user-')) {
                await createNotification({
                    userId: assigneeId.replace('user-', ''),
                    title: 'New Case Assigned',
                    description: `Case #${newCase.id}: "${newCase.subject}" assigned to you.`,
                    link: `/cases?id=${newCase.id}`,
                    type: 'case'
                });
             }
        }
    }

    return newCase;
}

export async function updateCase(id: string, data: Partial<Omit<Case, 'id' | 'assignments'>> & { assignedTo?: string[] }) {
    const session = await getSession();
    if (!session?.userId) throw new Error("Authentication required");
    
    const { assignedTo, ...caseData } = data;
    const originalCase = await prisma.case.findUnique({ where: { id }, include: { assignments: true } });

    const updatedCase = await prisma.case.update({
        where: { id },
        data: {
            ...caseData,
            assignments: assignedTo ? {
                deleteMany: {}, // Clear existing assignments
                create: assignedTo.map(id => ({ // Create new ones
                    user: { connect: { id: id.replace('user-', '') } },
                    assignedBy: session.userId,
                }))
            } : undefined,
        },
        include: {
            assignments: { include: { user: true } }
        }
    });

    // Simplified notification logic for updates
    if (data.assignedTo) {
        const originalAssigneeIds = originalCase?.assignments.map(a => `user-${a.userId}`) || [];
        const newAssigneeIds = data.assignedTo;

        const addedAssignees = newAssigneeIds.filter(id => !originalAssigneeIds.includes(id));
        
        for (const assigneeId of addedAssignees) {
            if (assigneeId.startsWith('user-')) {
                await createNotification({
                    userId: assigneeId.replace('user-', ''),
                    title: 'Case Reassigned',
                    description: `Case #${updatedCase.id}: "${updatedCase.subject}" has been assigned to you.`,
                    link: `/cases?id=${updatedCase.id}`,
                    type: 'case'
                });
            }
        }
    }
    
    if (originalCase?.status !== updatedCase.status) {
        // Notify all current assignees about status change
        for (const assignment of updatedCase.assignments) {
           await createNotification({
                userId: assignment.userId,
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
        },
         include: {
            assignments: { include: { user: true } }
        }
    });
    return updatedCase;
}

export async function deleteCase(id: string) {
    // Need to delete assignments first due to relation
    await prisma.caseAssignment.deleteMany({
        where: { caseId: id }
    });

    const deletedCase = await prisma.case.delete({
        where: { id },
    });
    return deletedCase;
}
