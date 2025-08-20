
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
    await checkAdmin();
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
    revalidatePath('/admin');
    const { passwordHash: _, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
}

export async function updateUser(id: string, data: Partial<Omit<User, 'id' | 'avatar' | 'passwordHash'>>) {
    await checkAdmin();
    const updatedUser = await prisma.user.update({
        where: { id },
        data,
    });
    revalidatePath('/admin');
    const { passwordHash: _, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
}

export async function createTeam(data: Omit<Team, 'id'>) {
    await checkAdmin();
    const newTeam = await prisma.team.create({
        data
    });
    revalidatePath('/admin');
    return newTeam;
}

export async function updateTeam(id: string, data: Partial<Omit<Team, 'id'>>) {
    await checkAdmin();
    const updatedTeam = await prisma.team.update({
        where: { id },
        data
    });
    revalidatePath('/admin');
    return updatedTeam;
}

export async function archiveTeam(id: string) {
    await checkAdmin();
    await prisma.team.update({
        where: { id },
        data: { status: 'Archived' }
    });
    revalidatePath('/admin');
}
