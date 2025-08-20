
'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import type { User, NotificationPreferences } from '@/lib/types';

export async function getUserProfile(userId: string) {
    return await prisma.user.findUnique({
        where: { id: userId },
        include: { notificationPreferences: true }
    });
}

export async function updateUserProfile(userId: string, data: Partial<Pick<User, 'name' | 'email' | 'avatar'>>) {
    const updatedUser = await prisma.user.update({
        where: { id: userId },
        data,
    });
    revalidatePath('/profile');
    return updatedUser;
}

export async function updateUserPassword(userId: string, newPasswordHash: string) {
    // In a real app, you would hash the password here.
    // For this prototype, we'll store it as is.
    // This is NOT secure for production.
    await prisma.user.update({
        where: { id: userId },
        data: { passwordHash: newPasswordHash }
    });
    revalidatePath('/profile');
}

export async function updateUserPreferences(userId: string, preferences: NotificationPreferences) {
    const updatedPreferences = await prisma.notificationPreferences.upsert({
        where: { userId: userId },
        update: preferences,
        create: {
            userId: userId,
            ...preferences,
        },
    });
    revalidatePath('/profile');
    return updatedPreferences;
}
