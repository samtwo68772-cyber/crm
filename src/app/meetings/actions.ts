
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
            select: {
                userId: true
            }
        }
    }
  });
}

export async function createMeeting(data: Omit<Meeting, 'id' | 'participants'> & { participants: string[] }) {
  const { participants, ...meetingData } = data;
  const newMeeting = await prisma.meeting.create({
    data: {
        ...meetingData,
        participants: {
            create: participants.map(userId => ({ userId }))
        }
    },
  });

  for (const userId of participants) {
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

export async function updateMeeting(id: string, data: Partial<Omit<Meeting, 'id' | 'participants'>> & { participants?: string[] }) {
  const { participants, ...meetingData } = data;
  const updatedMeeting = await prisma.meeting.update({
    where: { id },
    data: {
        ...meetingData,
        participants: participants ? {
            deleteMany: {},
            create: participants.map(userId => ({ userId }))
        } : undefined
    },
  });

  return updatedMeeting;
}

export async function deleteMeeting(id: string) {
  await prisma.meetingParticipant.deleteMany({ where: { meetingId: id } });
  const deleted = await prisma.meeting.delete({
    where: { id },
  });
  return deleted;
}
