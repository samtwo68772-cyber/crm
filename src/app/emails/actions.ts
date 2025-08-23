
'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import type { Email } from '@/lib/types';
import imaps from 'imap-simple';
import { simpleParser } from 'mailparser';

export async function getEmails() {
    return await prisma.email.findMany({
        orderBy: {
            date: 'desc'
        }
    });
}

export async function processIncomingEmails() {
    console.log("Starting email processing...");

    const config = {
        imap: {
            user: process.env.IMAP_USER!,
            password: process.env.IMAP_PASS!,
            host: process.env.IMAP_HOST!,
            port: parseInt(process.env.IMAP_PORT || '993', 10),
            tls: true,
            authTimeout: 3000,
            tlsOptions: {
                rejectUnauthorized: false
            }
        }
    };
    
    if (!config.imap.user || !config.imap.password || !config.imap.host) {
        console.error("IMAP credentials are not fully set in .env file.");
        throw new Error("IMAP credentials not configured.");
    }

    try {
        const connection = await imaps.connect(config);
        console.log("IMAP connection successful.");
        await connection.openBox('INBOX');
        const searchCriteria = ['UNSEEN'];
        const fetchOptions = {
            bodies: [''],
            markSeen: true
        };

        const results = await connection.search(searchCriteria, fetchOptions);
        console.log(`Found ${results.length} new emails.`);

        for (const item of results) {
            const all = item.parts.find(part => part.which === '');
            if (all) {
                const mail = await simpleParser(all.body);
                console.log(`Processing email from: ${mail.from?.text}, Subject: ${mail.subject}`);

                let contact = await prisma.contact.findUnique({ where: { email: mail.from?.value[0].address! } });
                if (!contact) {
                    contact = await prisma.contact.create({
                        data: {
                            name: mail.from?.value[0].name || mail.from?.value[0].address!,
                            email: mail.from?.value[0].address!,
                            company: 'Unknown',
                            role: 'Unknown',
                            avatar: `https://placehold.co/40x40.png?text=${(mail.from?.value[0].name || mail.from?.value[0].address!).charAt(0)}`,
                        }
                    });
                     console.log(`Created new contact: ${contact.name}`);
                }

                const newCase = await prisma.case.create({
                    data: {
                        subject: mail.subject || '(No Subject)',
                        customer: contact.name,
                        email: contact.email,
                        priority: 'Medium',
                        type: 'General Question',
                        status: 'New',
                        createdById: 'user-1', // Default to admin for system-created cases
                        description: mail.text || mail.html || '(No Content)',
                        contactId: contact.id,
                        communications: {
                            push: { id: `comm-${Date.now()}`, type: 'Email', content: `Original email from ${contact.name}:\n\n${mail.text}`, author: contact.name, authorId: contact.id, authorRole: 'staff', timestamp: mail.date?.toISOString() || new Date().toISOString() }
                        }
                    }
                });
                console.log(`Created new case #${newCase.id} from email.`);
            }
        }

        connection.end();
        console.log("Email processing finished.");
        revalidatePath('/emails');
        revalidatePath('/cases');
        revalidatePath('/accounts');

    } catch (err) {
        console.error('An error occurred while processing emails:', err);
        throw new Error('Failed to process emails. Check server logs for details.');
    }
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
            createdById: 'user-1', // Default creator
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
