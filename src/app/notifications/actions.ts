
'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import type { Notification } from '@/lib/types';

export async function getNotifications(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return [];

    if (user.role === 'admin') {
        return await prisma.notification.findMany({
            orderBy: {
                timestamp: 'desc',
            },
        });
    }

    return await prisma.notification.findMany({
        where: {
            OR: [
                { userId: null }, // System-wide notifications
                { userId: userId },
            ]
        },
        orderBy: {
            timestamp: 'desc',
        },
    });
}

export async function createNotification(data: Omit<Notification, 'id' | 'read' | 'timestamp'>) {
    const newNotification = await prisma.notification.create({
        data: {
            ...data,
            read: false,
            timestamp: new Date().toISOString(),
        }
    });
    // This revalidation is tricky because it's for the layout, not a specific page.
    // A more advanced solution might use websockets. For now, we rely on polling/re-fetching.
    // revalidatePath('/'); 
    return newNotification;
}

export async function markAsRead(notificationId: string) {
    const updated = await prisma.notification.update({
        where: { id: notificationId },
        data: { read: true },
    });
    // revalidatePath('/notifications');
    return updated;
}

export async function markAllAsRead(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return;

    if (user.role === 'admin') {
        await prisma.notification.updateMany({
            data: { read: true },
        });
    } else {
        await prisma.notification.updateMany({
            where: {
                 OR: [
                    { userId: null },
                    { userId: userId },
                ]
            },
            data: { read: true },
        });
    }
    // revalidatePath('/notifications');
}
