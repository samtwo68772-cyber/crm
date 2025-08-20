
'use server'

import 'server-only'

import { cookies } from 'next/headers'
import { SignJWT, jwtVerify } from 'jose'
import { SessionPayload } from '@/lib/types'
import { prisma } from '@/lib/prisma';
import type { User } from '@/lib/types';

// In a real app, this would be a secret from an environment variable
const secretKey = process.env.SESSION_SECRET || 'your-super-secret-key-that-is-long-enough'
const key = new TextEncoder().encode(secretKey)

export async function encrypt(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1d') // Session expires in 1 day
    .sign(key)
}

export async function decrypt(input: string): Promise<any> {
  try {
    const { payload } = await jwtVerify(input, key, {
      algorithms: ['HS256'],
    })
    return payload
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null
  }
}

export async function login(email: string, password: string, role: 'admin' | 'staff') {
  // This is a simplified login for the prototype.
  // In a real app, you would:
  // 1. Find the user by email in the database.
  // 2. Use a library like `bcrypt` to compare the provided password with the stored hash.
  const user = await prisma.user.findFirst({
    where: { email, role },
  });

  if (!user || user.passwordHash !== password) { // Replace with bcrypt.compare in production
    throw new Error('Invalid email, password, or role.');
  }

  // Create the session
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
  const session = await encrypt({ userId: user.id, expires })

  // Save the session in a cookie
  cookies().set('session', session, { expires, httpOnly: true })
  return user;
}

export async function logout() {
  // Destroy the session
  cookies().set('session', '', { expires: new Date(0) })
}

export async function getSession() {
  const session = cookies().get('session')?.value
  if (!session) return null
  return await decrypt(session) as SessionPayload | null
}

export async function getUserById(userId: string): Promise<User> {
    const user = await prisma.user.findUnique({ where: { id: userId }});
    if (!user) throw new Error("User not found");
    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword as User;
}
