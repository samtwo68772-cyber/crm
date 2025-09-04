
'use server'

import { cookies } from 'next/headers'
import { SessionPayload } from '@/lib/types'
import { prisma } from '@/lib/prisma';
import type { User } from '@/lib/types';
import { encrypt, decrypt } from '@/lib/session';


export async function login(email: string, password: string) {
  // This is a simplified login for the prototype.
  // In a real app, you would:
  // 1. Find the user by email in the database.
  // 2. Use a library like `bcrypt` to compare the provided password with the stored hash.
  const user = await prisma.user.findFirst({
    where: { email },
    include: { role: true }
  });

  if (!user || user.passwordHash !== password) { // Replace with bcrypt.compare in production
    throw new Error('Invalid email or password.');
  }

  // Create the session
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
  const session = await encrypt({ userId: user.id, expires })

  // Save the session in a cookie
  ;(await cookies()).set('session', session, { expires, httpOnly: true })
  
  const { passwordHash, ...userWithoutPassword } = user;
  return userWithoutPassword as User;
}

export async function logout() {
  // Destroy the session
  ;(await cookies()).set('session', '', { expires: new Date(0) })
}

export async function getSession() {
  const session = (await cookies()).get('session')?.value
  if (!session) return null
  return await decrypt(session) as SessionPayload | null
}

export async function getUserById(userId: string): Promise<User> {
    const user = await prisma.user.findUnique({ where: { id: userId }, include: { role: true }});
    if (!user) throw new Error("User not found");
    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword as User;
}
