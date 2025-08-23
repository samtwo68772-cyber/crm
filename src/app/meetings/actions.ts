
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
  console.log('Received payload to create meeting:', JSON.stringify(data, null, 2));
  try {
    const { participantIds, contactId, ...meetingData } = data;
    
    const newMeeting = await prisma.meeting.create({
      data: {
        ...meetingData,
        date: new Date(meetingData.date), // Ensure date is a Date object
        contactId: contactId,
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

  revalidatePath('/meetings');
  return updatedMeeting;
}

export async function deleteMeeting(id: string) {
    await prisma.meetingParticipant.deleteMany({
        where: { meetingId: id }
    });

  const deleted = await prisma.meeting.delete({
    where: { id },
  });

  revalidatePath('/meetings');
  return deleted;
}
