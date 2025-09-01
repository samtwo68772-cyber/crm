
'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import type { Notification } from '@/lib/types';

export async function getNotifications(
    userId: string,
    options: { page: number; limit: number; filter: 'all' | 'unread' }
) {
    const { page, limit, filter } = options;
    const skip = (page - 1) * limit;

    const user = await prisma.user.findUnique({ where: { id: userId }, include: { role: true } });
    if (!user) return { notifications: [], total: 0 };

    let whereClause: any = {
        userId: userId
    };

    // Admins can see system-wide notifications (userId is null)
    if (user.role.name === 'Admin') {
        whereClause = {
            OR: [
                { userId: null },
                { userId: userId },
            ]
        };
    }
    
    if (filter === 'unread') {
        whereClause.read = false;
    }

    const [notifications, total] = await prisma.$transaction([
        prisma.notification.findMany({
            where: whereClause,
            orderBy: {
                timestamp: 'desc',
            },
            take: limit,
            skip: skip,
        }),
        prisma.notification.count({
            where: whereClause
        })
    ]);
    
    return { notifications, total };
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
    return updated;
}

export async function markAllAsRead(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId }, include: { role: true } });
    if (!user) return;
    
    let whereClause: any = { userId: userId, read: false };

    if (user.role.name === 'Admin') {
         whereClause = {
            OR: [
                { userId: null },
                { userId: userId },
            ],
            read: false
        };
    }

    await prisma.notification.updateMany({
        where: whereClause,
        data: { read: true },
    });
}
