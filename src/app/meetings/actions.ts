
'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import type { Meeting } from '@/lib/types';
import { createNotification } from '../notifications/actions';

export async function getMeetings() {
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
  const { participantIds, ...meetingData } = data;
  
  const newMeeting = await prisma.meeting.create({
    data: {
      ...meetingData,
      participants: {
        create: participantIds.map(userId => ({
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

  for (const userId of participantIds) {
      await createNotification({
          userId,
          title: 'New Meeting Scheduled',
          description: `You have been invited to "${newMeeting.title}".`,
          link: `/meetings?id=${newMeeting.id}`,
          type: 'meeting'
      })
  }

  return newMeeting;
}

export async function updateMeeting(id: string, data: Partial<Omit<Meeting, 'id' | 'participants'>> & { participantIds?: string[] }) {
    const { participantIds, ...meetingData } = data;
  
    const updatedMeeting = await prisma.meeting.update({
        where: { id },
        data: {
            ...meetingData,
            participants: participantIds ? {
                deleteMany: {},
                create: participantIds.map(userId => ({
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

  return updatedMeeting;
}

export async function deleteMeeting(id: string) {
    await prisma.meetingParticipant.deleteMany({
        where: { meetingId: id }
    });

  const deleted = await prisma.meeting.delete({
    where: { id },
  });
  return deleted;
}
