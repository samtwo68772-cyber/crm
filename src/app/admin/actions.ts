
'use server';

import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import type { User, Team, Role, PermissionSet } from '@/lib/types';
import { getSession } from '@/lib/session';
import { defaultPermissions, permissionModules } from '@/lib/permissions';

async function checkAdmin() {
    const session = await getSession();
    if (!session?.userId) throw new Error('Authentication required.');
    const user = await prisma.user.findUnique({ 
        where: { id: session.userId },
        include: { role: true }
    });
    if (!user || user.role.name !== 'Admin') throw new Error('Administrator access required.');
}

// Role Management
export async function getRoles() {
    await checkAdmin();
    return await prisma.role.findMany({
        orderBy: { name: 'asc' },
        include: { users: { select: { id: true } } }
    });
}

export async function createRole(data: { name: string; description?: string; permissions: PermissionSet }) {
    await checkAdmin();
    try {
        const newRole = await prisma.role.create({
            data: {
                name: data.name,
                description: data.description,
                permissions: data.permissions as any,
            }
        });
        return newRole;
    } catch(e) {
         if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
            throw new Error('A role with this name already exists.');
        }
        throw e;
    }
}

export async function updateRole(id: string, data: { name: string; description?: string; permissions: PermissionSet }) {
    await checkAdmin();
    try {
        const updatedRole = await prisma.role.update({
            where: { id },
            data: {
                name: data.name,
                description: data.description,
                permissions: data.permissions as any,
            },
        });
        return updatedRole;
    } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
            throw new Error('A role with this name already exists.');
        }
        throw e;
    }
}

export async function deleteRole(id: string) {
    await checkAdmin();
    const roleInUse = await prisma.user.findFirst({ where: { roleId: id } });
    if (roleInUse) {
        throw new Error('This role is currently in use and cannot be deleted.');
    }
    await prisma.role.delete({ where: { id } });
    return { id };
}


export async function getUsers() {
    const users = await prisma.user.findMany({
        orderBy: {
            name: 'asc'
        },
        include: {
            role: true
        }
    });
    return users.map(({ passwordHash, ...user }) => user) as User[];
}

export async function getTeams() {
    return await prisma.team.findMany({
        orderBy: {
            name: 'asc'
        }
    });
}

export async function createUser(data: Omit<User, 'id' | 'avatar' | 'role' | 'assignments' | 'meetings' | 'notificationPreferences' > & { password?: string, roleId: string }) {
    await checkAdmin();
    const { password, team: teamName, ...userData } = data;
    
    if (!password) {
        throw new Error('Password is required for new users.');
    }
    
    const passwordHash = password;

    return await prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
            data: {
                ...userData,
                team: teamName,
                passwordHash,
                avatar: `https://placehold.co/40x40.png?text=${data.name.charAt(0)}`
            },
        });

        if (teamName) {
            const team = await tx.team.findFirst({ where: { name: teamName } });
            if (team) {
                await tx.team.update({
                    where: { id: team.id },
                    data: {
                        memberIds: {
                            push: newUser.id
                        }
                    }
                });
            }
        }
        
        const { passwordHash: _, ...userWithoutPassword } = newUser;
        return userWithoutPassword;
    });
}

export async function updateUser(id: string, data: Partial<Omit<User, 'id' | 'avatar' | 'passwordHash'>>) {
    await checkAdmin();
    
    return await prisma.$transaction(async (tx) => {
        const originalUser = await tx.user.findUnique({ where: { id } });
        
        if (data.team && originalUser?.team !== data.team) {
            if (originalUser?.team) {
                const oldTeam = await tx.team.findFirst({ where: { name: originalUser.team } });
                if (oldTeam) {
                    await tx.team.update({
                        where: { id: oldTeam.id },
                        data: {
                            memberIds: {
                                set: oldTeam.memberIds.filter(memberId => memberId !== id)
                            }
                        }
                    });
                }
            }
            const newTeam = await tx.team.findFirst({ where: { name: data.team } });
            if (newTeam) {
                await tx.team.update({
                    where: { id: newTeam.id },
                    data: {
                        memberIds: {
                            push: id
                        }
                    }
                });
            }
        }

        const updatedUser = await tx.user.update({
            where: { id },
            data,
        });

        const { passwordHash: _, ...userWithoutPassword } = updatedUser;
        return userWithoutPassword;
    });
}

export async function deleteUser(id: string) {
    await checkAdmin();
    
    try {
        await prisma.$transaction(async (tx) => {
            const userToDelete = await tx.user.findUnique({ where: { id } });
            
            if (userToDelete?.team) {
                const team = await tx.team.findFirst({ where: { name: userToDelete.team } });
                if (team) {
                    await tx.team.update({
                        where: { id: team.id },
                        data: {
                            memberIds: {
                                set: team.memberIds.filter(memberId => memberId !== id)
                            }
                        }
                    });
                }
            }
            
            await tx.auditLog.updateMany({
                where: { userId: id },
                data: { userId: null },
            });
            
            await tx.document.updateMany({
                where: { authorId: id },
                data: { authorId: null },
            });

            await tx.caseAssignment.deleteMany({ where: { userId: id } });
            await tx.meetingParticipant.deleteMany({ where: { userId: id }});
            await tx.notificationPreferences.deleteMany({ where: { userId: id } });
            
            await tx.user.delete({ where: { id } });
        });

        return { id };
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2003') {
                throw new Error('Could not delete user. They may still be linked to other records in the system.');
            }
        }
        console.error("Error deleting user:", error);
        throw new Error('An unexpected error occurred while deleting the user.');
    }
}


export async function createTeam(data: Omit<Team, 'id'>) {
    await checkAdmin();
    try {
        const newTeam = await prisma.team.create({
            data
        });
        return newTeam;
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2002' && (error.meta?.target as string[])?.includes('name')) {
                throw new Error('A team with this name already exists.');
            }
        }
        throw error;
    }
}

export async function updateTeam(id: string, data: Partial<Omit<Team, 'id'>>) {
    await checkAdmin();
    try {
        const updatedTeam = await prisma.team.update({
            where: { id },
            data
        });
        return updatedTeam;
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2002' && (error.meta?.target as string[])?.includes('name')) {
                throw new Error('A team with this name already exists.');
            }
        }
        throw error;
    }
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
    const team = await prisma.team.findUnique({ where: { id } });
    if (!team || team.status !== 'Archived') {
        throw new Error("Team must be archived before it can be deleted.");
    }
    await prisma.team.delete({ where: { id } });
    return { id };
}
