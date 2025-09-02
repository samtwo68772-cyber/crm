
'use server';

import { prisma } from '@/lib/prisma';
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

    let whereClause: any = {};
    
    if (!canViewAll) {
        // Regular user only sees their own notifications.
        whereClause.userId = userId;
    }
    
    if (filter === 'unread') {
        if (whereClause.AND) {
            whereClause.AND.push({ read: false });
        } else {
            whereClause.read = false;
        }
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
  const { userId, ...restData } = data;
  if (!userId) {
      console.warn("createNotification called without a userId. Notification will not be created.");
      return;
  }
  
  await prisma.notification.create({
    data: {
      ...restData,
      userId: userId,
      read: false,
      timestamp: new Date(),
    },
  });
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
    
    let whereClause: any = { read: false };

    if (!canViewAll) {
         whereClause.userId = userId;
    }

    await prisma.notification.updateMany({
        where: whereClause,
        data: { read: true },
    });
}
