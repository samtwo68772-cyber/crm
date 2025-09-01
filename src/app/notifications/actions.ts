
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
    
    if (canViewAll) {
        // Admin with viewAll permission sees all notifications in the system.
        whereClause = {};
    } else {
        // Regular user only sees their own notifications.
        whereClause = { userId: userId };
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

export async function createNotification(data: Omit<Notification, 'id' | 'read' | 'timestamp' | 'originalUserId'>) {
  const { userId, ...restData } = data;
  if (!userId) {
      console.warn("createNotification called without a userId. Notification will not be created.");
      return;
  }
  
  // 1. Create the primary notification for the target user
  await prisma.notification.create({
    data: {
      ...restData,
      userId: userId,
      read: false,
      timestamp: new Date(),
    },
  });

  // 2. Also notify admins with viewAll permission
  const adminsToNotify = await prisma.user.findMany({
      where: {
          id: { not: userId }, // Don't create a duplicate notification
          role: {
              permissions: {
                  path: ['notifications', 'viewAll'],
                  equals: true
              }
          }
      }
  });

  // 3. Create a copy for each admin
  for (const admin of adminsToNotify) {
      await prisma.notification.create({
          data: {
              ...restData,
              userId: admin.id,
              read: false,
              timestamp: new Date(),
              originalUserId: userId, // Track who the original notification was for
          }
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
    
    let whereClause: any = { read: false };

    if (!canViewAll) {
         whereClause.userId = userId;
    }

    await prisma.notification.updateMany({
        where: whereClause,
        data: { read: true },
    });
}
