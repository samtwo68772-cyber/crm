
'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import type { Meeting } from '@/lib/types';
import { createNotification } from '../notifications/actions';
import { checkPermission } from '@/lib/permissions';

export async function getMeetings() {
  await checkPermission('meetings:view');
  return await prisma.meeting.findMany({
    orderBy: {
      date: 'desc',
    },
    include: {
        participants: {
            include: {
                user: true
            }
        }
    }
  });
}

export async function createMeeting(data: Omit<Meeting, 'id' | 'participants'> & { participantIds: string[]}) {
  await checkPermission('meetings:create');
  console.log('Received payload to create meeting:', JSON.stringify(data, null, 2));
  try {
    const { participantIds, contactId, ...meetingData } = data;
    
    let finalUserIds: string[] = [];
    for (const id of participantIds) {
      if (id.startsWith('user-')) {
        const userId = id.replace('user-', '');
        if (!finalUserIds.includes(userId)) {
          finalUserIds.push(userId);
        }
      } else if (id.startsWith('team-')) {
        const teamId = id.replace('team-', '');
        const team = await prisma.team.findUnique({
          where: { id: teamId },
          select: { memberIds: true }
        });
        if (team) {
          team.memberIds.forEach(memberId => {
            if (!finalUserIds.includes(memberId)) {
              finalUserIds.push(memberId);
            }
          });
        }
      }
    }
    
    // Remove duplicates
    finalUserIds = [...new Set(finalUserIds)];


    const newMeeting = await prisma.meeting.create({
      data: {
        ...meetingData,
        date: new Date(meetingData.date), // Ensure date is a Date object
        contactId: contactId,
        participants: {
          create: finalUserIds.map(userId => ({
            user: { connect: { id: userId } }
          }))
        }
      },
      include: {
          participants: {
              include: {
                  user: true
              }
          }
      }
    });

    for (const userId of finalUserIds) {
        await createNotification({
            userId,
            title: 'New Meeting Scheduled',
            description: `You have been invited to "${newMeeting.title}".`,
            link: `/meetings?id=${newMeeting.id}`,
            type: 'meeting'
        })
    }
    
    revalidatePath('/meetings');
    return newMeeting;

  } catch (err) {
      console.error("Error creating meeting:", err);
      // Re-throwing the error is important so the client knows something went wrong.
      // In a real production app, you might want to throw a more user-friendly error.
      throw new Error('Failed to create meeting due to a server error.');
  }
}

export async function updateMeeting(id: string, data: Partial<Omit<Meeting, 'id' | 'participants'>> & { participantIds?: string[] }) {
    await checkPermission('meetings:update');
    const { participantIds, ...meetingData } = data;

    let finalUserIds: string[] | undefined = undefined;
    if (participantIds) {
        finalUserIds = [];
        for (const pId of participantIds) {
          if (pId.startsWith('user-')) {
            const userId = pId.replace('user-', '');
            if (!finalUserIds.includes(userId)) {
              finalUserIds.push(userId);
            }
          } else if (pId.startsWith('team-')) {
            const teamId = pId.replace('team-', '');
            const team = await prisma.team.findUnique({
              where: { id: teamId },
              select: { memberIds: true }
            });
            if (team) {
              team.memberIds.forEach(memberId => {
                if (!finalUserIds!.includes(memberId)) {
                  finalUserIds!.push(memberId);
                }
              });
            }
          }
        }
        finalUserIds = [...new Set(finalUserIds)];
    }
  
    const updatedMeeting = await prisma.meeting.update({
        where: { id },
        data: {
            ...meetingData,
            participants: finalUserIds ? {
                deleteMany: {},
                create: finalUserIds.map(userId => ({
                    user: { connect: { id: userId } }
                }))
            } : undefined,
        },
        include: {
            participants: {
                include: {
                    user: true
                }
            }
        }
  });

  revalidatePath('/meetings');
  return updatedMeeting;
}

export async function deleteMeeting(id: string) {
    await checkPermission('meetings:delete');
    await prisma.meetingParticipant.deleteMany({
        where: { meetingId: id }
    });

  const deleted = await prisma.meeting.delete({
    where: { id },
  });

  revalidatePath('/meetings');
  return deleted;
}
