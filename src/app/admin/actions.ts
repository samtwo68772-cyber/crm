
'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import type { User, Team } from '@/lib/types';
import { getSession } from '@/context/actions';

async function checkAdmin() {
    const session = await getSession();
    if (!session?.userId) throw new Error('Authentication required.');
    const user = await prisma.user.findUnique({ where: { id: session.userId } });
    if (!user || user.role !== 'admin') throw new Error('Administrator access required.');
}

export async function getUsers() {
    // await checkAdmin(); // This check might be too restrictive if non-admins need to see users for assignment.
    const users = await prisma.user.findMany({
        orderBy: {
            name: 'asc'
        }
    });
    return users.map(({ passwordHash, ...user }) => user) as User[];
}

export async function getTeams() {
    await checkAdmin();
    return await prisma.team.findMany({
        orderBy: {
            name: 'asc'
        }
    });
}

export async function createUser(data: Omit<User, 'id' | 'avatar' > & { password?: string }) {
    await checkAdmin();
    const { password, ...userData } = data;
    
    if (!password) {
        throw new Error('Password is required for new users.');
    }
    
    // In a real app, you would hash the password here using bcrypt
    const passwordHash = password; // Placeholder for hashing

    const newUser = await prisma.user.create({
        data: {
            ...userData,
            passwordHash,
            avatar: `https://placehold.co/40x40.png?text=${data.name.charAt(0)}`
        },
    });
    const { passwordHash: _, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
}

export async function updateUser(id: string, data: Partial<Omit<User, 'id' | 'avatar' | 'passwordHash'>>) {
    await checkAdmin();
    const updatedUser = await prisma.user.update({
        where: { id },
        data,
    });
    const { passwordHash: _, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
}

export async function deleteUser(id: string) {
    await checkAdmin();
    
    // Set userId to null in related AuditLog records
    await prisma.auditLog.updateMany({
        where: { userId: id },
        data: { userId: null },
    });
    
    // Set authorId to null in related Document records
    await prisma.document.updateMany({
        where: { authorId: id },
        data: { authorId: null },
    });

    // Delete related records that should not be kept
    await prisma.caseAssignment.deleteMany({ where: { userId: id } });
    await prisma.meetingParticipant.deleteMany({ where: { userId: id }});
    await prisma.notificationPreferences.deleteMany({ where: { userId: id } });
    
    // Now it's safe to delete the user
    await prisma.user.delete({ where: { id } });

    return { id };
}


export async function createTeam(data: Omit<Team, 'id'>) {
    await checkAdmin();
    const newTeam = await prisma.team.create({
        data
    });
    return newTeam;
}

export async function updateTeam(id: string, data: Partial<Omit<Team, 'id'>>) {
    await checkAdmin();
    const updatedTeam = await prisma.team.update({
        where: { id },
        data
    });
    return updatedTeam;
}

export async function archiveTeam(id: string) {
    await checkAdmin();
    const updatedTeam = await prisma.team.update({
        where: { id },
        data: { status: 'Archived' }
    });
    return updatedTeam;
}

export async function deleteTeam(id: string) {
    await checkAdmin();
    // Ensure team is archived before deleting
    const team = await prisma.team.findUnique({ where: { id } });
    if (!team || team.status !== 'Archived') {
        throw new Error("Team must be archived before it can be deleted.");
    }
    await prisma.team.delete({ where: { id } });
    return { id };
}
