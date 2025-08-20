
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
  });
}

export async function createMeeting(data: Omit<Meeting, 'id'>) {
  const newMeeting = await prisma.meeting.create({
    data,
  });
  revalidatePath('/meetings');

  for (const userId of newMeeting.participants) {
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

export async function updateMeeting(id: string, data: Partial<Omit<Meeting, 'id'>>) {
  const updatedMeeting = await prisma.meeting.update({
    where: { id },
    data,
  });
  revalidatePath('/meetings');
  return updatedMeeting;
}

export async function deleteMeeting(id: string) {
  await prisma.meeting.delete({
    where: { id },
  });
  revalidatePath('/meetings');
}
