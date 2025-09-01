
'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import type { Case, Communication, User } from '@/lib/types';
import { createNotification } from '../notifications/actions';
import { randomBytes } from 'crypto';
import { getSession } from '@/context/actions';
import { sendEmail } from '../emails/actions';


async function sendAssignmentNotifications(caseData: Case, user: User) {
    const notificationPayload = {
        userId: user.id,
        title: 'New Case Assigned',
        description: `Case #${caseData.id}: "${caseData.subject}" assigned to you.`,
        link: `/cases?id=${caseData.id}`,
        type: 'case' as const
    };

    // 1. Create in-app notification (always)
    await createNotification(notificationPayload);

    // Fetch user preferences for email/SMS
    const userWithPrefs = await prisma.user.findUnique({
        where: { id: user.id },
        include: { notificationPreferences: true }
    });

    // 2. Send email notification if user has opted in
    if (userWithPrefs?.notificationPreferences?.cases.newAssignment.email) {
        try {
            const emailBody = `
                <h1>New Case Assignment</h1>
                <p>Hello ${user.name},</p>
                <p>You have been assigned a new case: <strong>${caseData.subject}</strong>.</p>
                <p><strong>Customer:</strong> ${caseData.customer}</p>
                <p><strong>Priority:</strong> ${caseData.priority}</p>
                <p>You can view the case details here: <a href="${process.env.NEXT_PUBLIC_BASE_URL || ''}${notificationPayload.link}">View Case</a></p>
            `;
            await sendEmail(user.email, `New Case Assigned: ${caseData.subject}`, emailBody);
        } catch (error) {
            console.error(`Failed to send case assignment email to ${user.email}:`, error);
        }
    }

    // 3. Send SMS notification if user has a phone number
    if (user.phone) {
        try {
            const smsMessage = `MinT CRM: New case assigned to you - "${caseData.subject}". Priority: ${caseData.priority}.`;
            const smsEndpoint = `http://172.31.102.19:8000/sendsms?key=WzOvYNX1uh7aJgL4&receiver=${user.phone}&msg=${encodeURIComponent(smsMessage)}`;
            
            // Fire-and-forget the SMS request
            fetch(smsEndpoint).catch(smsError => {
                console.error(`Failed to send SMS to ${user.phone}:`, smsError);
            });

        } catch (error) {
            console.error(`Failed to construct SMS request for ${user.phone}:`, error);
        }
    }
}


function generateShortId() {
    return `CASE-${randomBytes(4).toString('hex').slice(0, 7).toUpperCase()}`;
}

export async function getCases() {
    const session = await getSession();
    if (!session?.userId) {
        // Return empty array or handle unauthenticated access as needed
        return [];
    }

    const user = await prisma.user.findUnique({
        where: { id: session.userId },
        include: { role: true }
    });

    if (!user) {
        console.error("User not found for session:", session.userId);
        return []; // Or throw new Error("User not found");
    }

    let whereClause = {};

    if (user.role.name !== 'Admin') {
        whereClause = {
            OR: [
                { createdById: user.id },
                { assignments: { some: { userId: user.id } } }
            ]
        };
    }

    return await prisma.case.findMany({
        where: whereClause,
        orderBy: {
            createdAt: 'desc',
        },
        include: {
            assignments: {
                include: {
                    user: true
                }
            },
            createdBy: true
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
            const userId = assignee.replace('user-', '');
            if (!userIdsToAssign.includes(userId)) {
                 userIdsToAssign.push(userId);
            }
        } else if (assignee.startsWith('team-')) {
            const teamId = assignee.replace('team-', '');
            const team = await prisma.team.findUnique({
                where: { id: teamId },
                select: { memberIds: true }
            });
            if (team) {
                team.memberIds.forEach(memberId => {
                    if (!userIdsToAssign.includes(memberId)) {
                        userIdsToAssign.push(memberId);
                    }
                });
            }
        }
    }
    
    // Remove duplicates
    userIdsToAssign = [...new Set(userIdsToAssign)];

    const newCase = await prisma.case.create({
        data: {
            id: generateShortId(),
            ...caseData,
            createdAt: new Date(),
            createdBy: {
              connect: { id: session.userId }
            },
            assignments: {
                create: userIdsToAssign.map(id => ({
                    user: { connect: { id } },
                    assignedByUserId: session.userId,
                }))
            }
        },
        include: {
            assignments: { include: { user: true } },
            createdBy: true,
        }
    });

    if (userIdsToAssign.length > 0) {
        const assignedUsers = await prisma.user.findMany({ where: { id: { in: userIdsToAssign } } });
        for (const user of assignedUsers) {
            await sendAssignmentNotifications(newCase as Case, user);
        }
    }
    
    revalidatePath('/cases');
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
                const userId = assignee.replace('user-', '');
                if (!userIdsToAssign.includes(userId)) {
                    userIdsToAssign.push(userId);
                }
            } else if (assignee.startsWith('team-')) {
                const teamId = assignee.replace('team-', '');
                const team = await prisma.team.findUnique({
                    where: { id: teamId },
                    select: { memberIds: true }
                });
                if (team) {
                    team.memberIds.forEach(memberId => {
                        if (!userIdsToAssign.includes(memberId)) {
                            userIdsToAssign.push(memberId);
                        }
                    });
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
            assignments: { include: { user: true } },
            createdBy: true,
        }
    });

    // Simplified notification logic for updates
    if (userIdsToAssign) {
        const originalAssigneeIds = originalCase?.assignments.map(a => a.userId) || [];
        const newAssigneeIds = userIdsToAssign;

        const addedAssignees = newAssigneeIds.filter(uid => !originalAssigneeIds.includes(uid));
        
        if (addedAssignees.length > 0) {
            const assignedUsers = await prisma.user.findMany({ where: { id: { in: addedAssignees } } });
            for (const user of assignedUsers) {
                await sendAssignmentNotifications(updatedCase as Case, user);
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

    revalidatePath('/cases');
    return updatedCase;
}

export async function addCommunicationToCase(caseId: string, comm: Omit<Communication, 'id'>) {
    const session = await getSession();
    if (!session?.userId) throw new Error("Authentication required");

    const user = await prisma.user.findUnique({ where: { id: session.userId }, include: { role: true }});
    if (!user) throw new Error("User not found");

    const updatedCase = await prisma.case.update({
        where: { id: caseId },
        data: {
            communications: {
                push: { ...comm, id: `comm-${Date.now()}`, authorId: user.id, author: user.name, authorRole: user.role.name }
            }
        },
         include: {
            assignments: { include: { user: true } },
            createdBy: true,
        }
    });
    revalidatePath('/cases');
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
            assignments: { include: { user: true } },
            createdBy: true,
        }
    });
    revalidatePath('/cases');
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
    
    revalidatePath('/cases');
    return deletedCase;
}
