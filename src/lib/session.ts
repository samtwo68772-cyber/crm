
'use server'

import 'server-only'

import { SignJWT, jwtVerify } from 'jose'
import { SessionPayload } from '@/lib/types'

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
