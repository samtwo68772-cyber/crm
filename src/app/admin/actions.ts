
'use server';

import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
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
    const { password, team: teamName, ...userData } = data;
    
    if (!password) {
        throw new Error('Password is required for new users.');
    }
    
    // In a real app, you would hash the password here using bcrypt
    const passwordHash = password; // Placeholder for hashing

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
        
        // If the team is changing
        if (data.team && originalUser?.team !== data.team) {
            // Remove user from the old team
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
            // Add user to the new team
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
        // Use a transaction to ensure all operations succeed or none do.
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
            
            // Set related records to null where history should be preserved
            await tx.auditLog.updateMany({
                where: { userId: id },
                data: { userId: null },
            });
            
            await tx.document.updateMany({
                where: { authorId: id },
                data: { authorId: null },
            });

            // Delete dependent records that should not be kept
            await tx.caseAssignment.deleteMany({ where: { userId: id } });
            await tx.meetingParticipant.deleteMany({ where: { userId: id }});
            await tx.notificationPreferences.deleteMany({ where: { userId: id } });
            
            // Finally, delete the user
            await tx.user.delete({ where: { id } });
        });

        return { id };
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            // P2003 is the foreign key constraint violation error code
            if (error.code === 'P2003') {
                throw new Error('Could not delete user. They may still be linked to other records in the system.');
            }
        }
        // For any other errors, re-throw a generic message.
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
            // P2002 is the error code for a unique constraint violation
            if (error.code === 'P2002' && (error.meta?.target as string[])?.includes('name')) {
                throw new Error('A team with this name already exists.');
            }
        }
        // Re-throw other errors
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
    // Ensure team is archived before deleting
    const team = await prisma.team.findUnique({ where: { id } });
    if (!team || team.status !== 'Archived') {
        throw new Error("Team must be archived before it can be deleted.");
    }
    await prisma.team.delete({ where: { id } });
    return { id };
}
