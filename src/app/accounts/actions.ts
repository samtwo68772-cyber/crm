
'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getAccounts() {
  return await prisma.account.findMany({
    orderBy: {
      createdAt: 'desc',
    },
  });
}

export async function getContacts() {
    return await prisma.contact.findMany({
        orderBy: {
            name: 'asc'
        }
    });
}

export async function createAccount(data: { name: string; industry: string; address?: string; phone?: string; email?: string; website?: string; }) {
  const newAccount = await prisma.account.create({
    data: {
        ...data,
        owner: "Admin" // Placeholder for owner
    },
  });
  revalidatePath('/accounts');
  return newAccount;
}

export async function updateAccount(id: string, data: { name: string; industry: string; address?: string; phone?: string; email?: string; website?: string; }) {
  const updatedAccount = await prisma.account.update({
    where: { id },
    data,
  });
  revalidatePath('/accounts');
  return updatedAccount;
}

export async function deleteAccount(id: string) {
  await prisma.account.delete({
    where: { id },
  });
  revalidatePath('/accounts');
}


export async function createContact(data: { name: string; email: string; phone: string; company: string; role: string; notes?: string; accountId?: string; }) {
    const { company, ...restData } = data;
    const account = await prisma.account.findFirst({
        where: { name: company }
    });

    const newContact = await prisma.contact.create({
        data: {
            ...restData,
            company: company,
            accountId: account?.id,
            avatar: `https://placehold.co/40x40.png?text=${data.name.charAt(0)}`,
        },
    });
    revalidatePath('/accounts');
    return newContact;
}

export async function updateContact(id: string, data: { name: string; email: string; phone: string; company: string; role: string; notes?: string; accountId?: string; }) {
    const { company, ...restData } = data;
    const account = await prisma.account.findFirst({
        where: { name: company }
    });

    const updatedContact = await prisma.contact.update({
        where: { id },
        data: {
            ...restData,
            company: company,
            accountId: account?.id,
        },
    });
    revalidatePath('/accounts');
    return updatedContact;
}

export async function deleteContact(id: string) {
    await prisma.contact.delete({
        where: { id },
    });
    revalidatePath('/accounts');
}
