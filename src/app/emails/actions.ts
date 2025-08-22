
'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import type { Email } from '@/lib/types';

export async function getEmails() {
    return await prisma.email.findMany({
        orderBy: {
            date: 'desc'
        }
    });
}

export async function processIncomingEmails() {
    // This is a placeholder for a real email processing job.
    // In a real app, this would be a cron job or a webhook.
    const emailsToProcess = await prisma.email.findMany({
        where: { type: 'inbox', linkedCaseId: null }
    });

    for (const email of emailsToProcess) {
        let contact = await prisma.contact.findUnique({ where: { email: email.from.email } });
        if (!contact) {
            contact = await prisma.contact.create({
                data: {
                    name: email.from.name,
                    email: email.from.email,
                    company: 'Unknown',
                    role: 'Unknown',
                    avatar: `https://placehold.co/40x40.png?text=${email.from.name.charAt(0)}`,
                }
            });
        }

        const newCase = await prisma.case.create({
            data: {
                subject: email.subject,
                customer: contact.name,
                email: contact.email,
                priority: 'Medium',
                type: 'General Question',
                status: 'New',
                assignedTo: [],
                createdAt: new Date().toISOString(),
                description: email.body,
                contactId: contact.id,
                communications: {
                    create: {
                        type: 'Email',
                        content: `Original email from ${email.from.name}:\n\n${email.body}`,
                        author: email.from.name,
                        authorRole: 'staff', // assumption
                        timestamp: new Date(email.date).toLocaleString(),
                    }
                }
            }
        });

        await prisma.email.update({
            where: { id: email.id },
            data: { linkedCaseId: newCase.id }
        });
    }

    revalidatePath('/emails');
    revalidatePath('/cases');
    revalidatePath('/accounts');
}

export async function markEmailAsRead(id: string) {
    await prisma.email.update({
        where: { id },
        data: { read: true }
    });
    revalidatePath('/emails');
}

export async function createCaseFromEmail(emailId: string) {
    const email = await prisma.email.findUnique({ where: { id: emailId } });
    if (!email) throw new Error('Email not found');

    let contact = await prisma.contact.findUnique({ where: { email: email.from.email } });
    if (!contact) {
        contact = await prisma.contact.create({
            data: {
                name: email.from.name,
                email: email.from.email,
                company: 'Unknown',
                role: 'Unknown',
                avatar: `https://placehold.co/40x40.png?text=${email.from.name.charAt(0)}`,
            }
        });
    }

    const newCase = await prisma.case.create({
        data: {
            subject: email.subject,
            customer: contact.name,
            email: contact.email,
            priority: 'Medium',
            type: 'General Question',
            status: 'New',
            assignedTo: [],
            createdAt: new Date().toISOString(),
            description: email.body,
            contactId: contact.id,
        }
    });

    await prisma.email.update({
        where: { id: emailId },
        data: { linkedCaseId: newCase.id }
    });

    revalidatePath('/emails');
    revalidatePath('/cases');
    return newCase;
}

    