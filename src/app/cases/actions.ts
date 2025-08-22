
'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import type { Case, Communication } from '@/lib/types';
import { createNotification } from '../notifications/actions';
import { randomBytes } from 'crypto';

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
                select: {
                    userId: true
                }
            }
        }
    });
}

export async function createCase(data: Omit<Case, 'id' | 'createdAt' | 'communications' | 'assignedTo'> & { assignedTo: string[] }) {
    const { assignedTo, ...caseData } = data;
    
    const newCase = await prisma.case.create({
        data: {
            ...caseData,
            id: generateShortId(),
            createdAt: new Date().toISOString(),
            assignments: {
                create: assignedTo.map(assigneeId => ({
                    userId: assigneeId.replace(/^(user-|team-)/, '')
                }))
            }
        },
        include: {
            assignments: true
        }
    });

    if (assignedTo && assignedTo.length > 0) {
        for (const assigneeId of assignedTo) {
            await createNotification({
                userId: assigneeId.replace(/^(user-|team-)/, ''),
                title: 'New Case Assigned',
                description: `Case #${newCase.id}: "${newCase.subject}" assigned to you/your team.`,
                link: `/cases?id=${newCase.id}`,
                type: 'case'
            });
        }
    }

    return newCase;
}

export async function updateCase(id: string, data: Partial<Omit<Case, 'id' | 'assignedTo'>> & { assignedTo?: string[] }) {
    const { assignedTo, ...caseData } = data;

    const updatedCase = await prisma.case.update({
        where: { id },
        data: {
            ...caseData,
            assignments: assignedTo ? {
                deleteMany: {},
                create: assignedTo.map(assigneeId => ({
                    userId: assigneeId.replace(/^(user-|team-)/, '')
                }))
            } : undefined
        },
        include: {
            assignments: true
        }
    });
    
    if (assignedTo) {
        for (const assigneeId of assignedTo) {
            await createNotification({
                userId: assigneeId.replace(/^(user-|team-)/, ''),
                title: 'Case Reassigned',
                description: `Case #${updatedCase.id}: "${updatedCase.subject}" has been assigned to you/your team.`,
                link: `/cases?id=${updatedCase.id}`,
                type: 'case'
            });
        }
    }
    
    // Simplified status change notification
    if (caseData.status) {
        const currentAssignees = await prisma.caseAssignment.findMany({ where: { caseId: id } });
         for (const assignment of currentAssignees) {
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
        }
    });
    return updatedCase;
}

export async function deleteCase(id: string) {
    await prisma.caseAssignment.deleteMany({ where: { caseId: id } });
    const deletedCase = await prisma.case.delete({
        where: { id },
    });
    return deletedCase;
}

