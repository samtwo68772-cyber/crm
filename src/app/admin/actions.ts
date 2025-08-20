
'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import type { User, Team } from '@/lib/types';

export async function getUsers() {
    return await prisma.user.findMany({
        orderBy: {
            name: 'asc'
        }
    });
}

export async function getTeams() {
    return await prisma.team.findMany({
        orderBy: {
            name: 'asc'
        }
    });
}

export async function createUser(data: Omit<User, 'id' | 'avatar'>) {
    const newUser = await prisma.user.create({
        data: {
            ...data,
            avatar: `https://placehold.co/40x40.png?text=${data.name.charAt(0)}`
        },
    });
    revalidatePath('/admin');
    return newUser;
}

export async function updateUser(id: string, data: Partial<Omit<User, 'id' | 'avatar'>>) {
    const updatedUser = await prisma.user.update({
        where: { id },
        data,
    });
    revalidatePath('/admin');
    return updatedUser;
}

export async function createTeam(data: Omit<Team, 'id'>) {
    const newTeam = await prisma.team.create({
        data
    });
    revalidatePath('/admin');
    return newTeam;
}

export async function updateTeam(id: string, data: Partial<Omit<Team, 'id'>>) {
    const updatedTeam = await prisma.team.update({
        where: { id },
        data
    });
    revalidatePath('/admin');
    return updatedTeam;
}

export async function archiveTeam(id: string) {
    await prisma.team.update({
        where: { id },
        data: { status: 'Archived' }
    });
    revalidatePath('/admin');
}

