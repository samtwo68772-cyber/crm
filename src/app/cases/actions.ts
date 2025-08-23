
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
    
    let userIdsToAssign: string[] = [];

    for (const assignee of assignedTo) {
        if (assignee.startsWith('user-')) {
            userIdsToAssign.push(assignee.replace('user-', ''));
        } else if (assignee.startsWith('team-')) {
            const teamId = assignee.replace('team-', '');
            const team = await prisma.team.findUnique({
                where: { id: teamId },
                select: { memberIds: true }
            });
            if (team) {
                userIdsToAssign.push(...team.memberIds);
            }
        }
    }
    
    // Remove duplicates
    userIdsToAssign = [...new Set(userIdsToAssign)];

    const newCase = await prisma.case.create({
        data: {
            id: generateShortId(),
            ...caseData,
            createdAt: new Date().toISOString(),
            assignments: {
                create: userIdsToAssign.map(id => ({
                    user: { connect: { id } },
                    assignedByUserId: session.userId,
                }))
            }
        },
        include: {
            assignments: { include: { user: true } }
        }
    });

    if (userIdsToAssign.length > 0) {
        for (const assigneeId of userIdsToAssign) {
            await createNotification({
                userId: assigneeId,
                title: 'New Case Assigned',
                description: `Case #${newCase.id}: "${newCase.subject}" assigned to you.`,
                link: `/cases?id=${newCase.id}`,
                type: 'case'
            });
        }
    }

    return newCase;
}

export async function updateCase(id: string, data: Partial<Omit<Case, 'id' | 'assignments'>> & { assignedTo?: string[] }) {
    const session = await getSession();
    if (!session?.userId) throw new Error("Authentication required");
    
    const { assignedTo, ...caseData } = data;
    const originalCase = await prisma.case.findUnique({ where: { id }, include: { assignments: true } });
    
    let userIdsToAssign: string[] | undefined = undefined;
    if (assignedTo) {
        userIdsToAssign = [];
        for (const assignee of assignedTo) {
            if (assignee.startsWith('user-')) {
                userIdsToAssign.push(assignee.replace('user-', ''));
            } else if (assignee.startsWith('team-')) {
                const teamId = assignee.replace('team-', '');
                const team = await prisma.team.findUnique({
                    where: { id: teamId },
                    select: { memberIds: true }
                });
                if (team) {
                    userIdsToAssign.push(...team.memberIds);
                }
            }
        }
        userIdsToAssign = [...new Set(userIdsToAssign)];
    }

    const updatedCase = await prisma.case.update({
        where: { id },
        data: {
            ...caseData,
            assignments: userIdsToAssign ? {
                deleteMany: {}, // Clear existing assignments
                create: userIdsToAssign.map(uid => ({ // Create new ones
                    user: { connect: { id: uid } },
                    assignedByUserId: session.userId,
                }))
            } : undefined,
        },
        include: {
            assignments: { include: { user: true } }
        }
    });

    // Simplified notification logic for updates
    if (userIdsToAssign) {
        const originalAssigneeIds = originalCase?.assignments.map(a => a.userId) || [];
        const newAssigneeIds = userIdsToAssign;

        const addedAssignees = newAssigneeIds.filter(uid => !originalAssigneeIds.includes(uid));
        
        for (const assigneeId of addedAssignees) {
            await createNotification({
                userId: assigneeId,
                title: 'Case Reassigned',
                description: `Case #${updatedCase.id}: "${updatedCase.subject}" has been assigned to you.`,
                link: `/cases?id=${updatedCase.id}`,
                type: 'case'
            });
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
    const session = await getSession();
    if (!session?.userId) throw new Error("Authentication required");

    const user = await prisma.user.findUnique({ where: { id: session.userId }});
    if (!user) throw new Error("User not found");

    const updatedCase = await prisma.case.update({
        where: { id: caseId },
        data: {
            communications: {
                push: { ...comm, id: `comm-${Date.now()}`, authorId: user.id, author: user.name, authorRole: user.role }
            }
        },
         include: {
            assignments: { include: { user: true } }
        }
    });
    return updatedCase;
}

export async function deleteCommunicationFromCase(caseId: string, communicationId: string) {
    const targetCase = await prisma.case.findUnique({ where: { id: caseId } });
    if (!targetCase) throw new Error('Case not found');

    const updatedCommunications = (targetCase.communications as Communication[] || []).filter(c => c.id !== communicationId);
    
    const updatedCase = await prisma.case.update({
        where: { id: caseId },
        data: {
            communications: updatedCommunications,
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
