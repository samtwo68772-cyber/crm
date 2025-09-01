
'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import type { Notification, PermissionSet } from '@/lib/types';
import { getSession } from '@/context/actions';

export async function getNotifications(
    userId: string,
    options: { page: number; limit: number; filter: 'all' | 'unread' }
) {
    const { page, limit, filter } = options;
    const skip = (page - 1) * limit;

    const user = await prisma.user.findUnique({ where: { id: userId }, include: { role: true } });
    if (!user) return { notifications: [], total: 0 };
    
    const userPermissions = user.role.permissions as PermissionSet;
    const canViewAll = userPermissions?.notifications?.viewAll;

    let whereClause: any = {
      userId: userId,
    };
    
    if (canViewAll) {
        whereClause = {
            OR: [
                { userId: userId }, // Notifications for me
                { isSystemWide: true } // All system-wide notifications
            ]
        }
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
  // Create the primary notification for the target user
  await prisma.notification.create({
    data: {
      ...data,
      read: false,
      timestamp: new Date().toISOString(),
      isSystemWide: false,
    },
  });

  // Find all users with the 'viewAll' permission for notifications.
  const adminsWithViewAll = await prisma.user.findMany({
    where: {
      role: {
        permissions: {
          path: ['notifications', 'viewAll'],
          equals: true,
        },
      },
      // Exclude the original recipient to avoid duplicate notifications
      id: { not: data.userId },
    },
  });

  // Create a system-wide copy for each of them.
  for (const admin of adminsWithViewAll) {
    await prisma.notification.create({
      data: {
        ...data,
        userId: admin.id, // Target this specific admin
        read: false,
        timestamp: new Date().toISOString(),
        isSystemWide: true, // Mark it as a system-wide notification
        originalUserId: data.userId, // Optionally store who the original notification was for
      },
    });
  }
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
    
    const userPermissions = user.role.permissions as PermissionSet;
    const canViewAll = userPermissions?.notifications?.viewAll;
    
    let whereClause: any = { userId: userId, read: false };

    if (canViewAll) {
         whereClause = {
            OR: [
                { userId: userId },
                { isSystemWide: true }
            ],
            read: false
        };
    }

    await prisma.notification.updateMany({
        where: whereClause,
        data: { read: true },
    });
}
