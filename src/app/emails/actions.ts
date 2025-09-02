
'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import type { Email } from '@/lib/types';
import imaps from 'imap-simple';
import { simpleParser } from 'mailparser';
import nodemailer from 'nodemailer';
import { randomBytes } from 'crypto';
import { getEmailSettings } from '../settings/actions';


function generateShortId(prefix: string) {
    return `${prefix.toUpperCase()}-${randomBytes(4).toString('hex').slice(0, 7).toUpperCase()}`;
}

export async function getEmails() {
    const emailSettings = await getEmailSettings();
    if (!emailSettings.configured || !emailSettings.imapUser) {
        return [];
    }

    return await prisma.email.findMany({
        where: {
            ownerEmail: emailSettings.imapUser
        },
        orderBy: {
            date: 'desc'
        }
    });
}

export async function processIncomingEmails() {
    console.log("Starting email processing...");

    const emailSettings = await getEmailSettings();
    if (!emailSettings.configured) {
        console.error("IMAP is not configured.");
        throw new Error("IMAP credentials are not configured in settings.");
    }
    const ownerEmail = emailSettings.imapUser;

    const config = {
      imap: {
        user: emailSettings.imapUser,
        password: emailSettings.imapPass,
        host: emailSettings.imapHost,
        port: emailSettings.imapPort,
        tls: emailSettings.imapEncryption === 'tls' || emailSettings.imapEncryption === 'ssl',
        authTimeout: 10000,
        tlsOptions: { rejectUnauthorized: false, servername: emailSettings.imapHost }
      }
    };
    
    let connection;
    try {
        console.log(`Connecting to IMAP server: ${config.imap.host}...`);
        connection = await imaps.connect(config);
        console.log("IMAP connection successful.");
        
        await connection.openBox('INBOX');
        const searchCriteria = ['ALL'];
        const fetchOptions = { bodies: [''], markSeen: false };

        const results = await connection.search(searchCriteria, fetchOptions);
        console.log(`Found ${results.length} emails in INBOX.`);

        const defaultUser = await prisma.user.findFirst({ where: { role: { name: 'Admin' } } });
        if (!defaultUser) {
            console.error("No default admin user found to assign cases to.");
            throw new Error("No default admin user found to assign cases to.");
        }

        let processedCount = 0;
        let failedCount = 0;

        for (const item of results) {
            const emailUID = item.attributes.uid;
            let subject = '(No Subject)';
            let fromAddress = 'unknown@example.com';
            try {
                const all = item.parts.find(part => part.which === '');
                if (!all) {
                    console.warn(`Skipping email UID ${emailUID}: No body part found.`);
                    continue;
                }

                const mail = await simpleParser(all.body);
                subject = mail.subject || '(No Subject)';
                fromAddress = mail.from?.value[0]?.address || 'unknown@example.com';

                console.log(`Processing email UID ${emailUID} from: ${fromAddress}, Subject: ${subject}`);
                
                if (fromAddress === emailSettings.imapUser) {
                    console.log(`Skipping email UID ${emailUID} from self: ${fromAddress}`);
                    continue;
                }
                
                const existingEmail = await prisma.email.findFirst({
                   where: {
                       ownerEmail,
                       AND: [
                           { subject: subject },
                           { 'from': { path: ['email'], equals: fromAddress } }
                       ]
                   }
                });

                if (existingEmail) {
                    console.log(`Skipping already existing email UID ${emailUID}, Subject: ${subject}`);
                    continue;
                }

                const fromName = mail.from?.value[0]?.name || fromAddress;
                const toValue = mail.to?.value[0];
                const toName = toValue?.name || 'Me';
                const toAddress = toValue?.address || '';
                const body = mail.html || mail.text || '';
                const date = mail.date || new Date();

                let contact = await prisma.contact.findUnique({ where: { email: fromAddress } });
                if (!contact) {
                    contact = await prisma.contact.create({
                        data: {
                            name: fromName,
                            email: fromAddress,
                            phone: '',
                            company: 'Unknown',
                            role: 'Unknown',
                            avatar: `https://placehold.co/40x40.png?text=${fromName.charAt(0)}`,
                        }
                    });
                    console.log(`Created new contact: ${contact.name}`);
                }

                const newEmail = await prisma.email.create({
                    data: {
                        ownerEmail,
                        from: { name: fromName, email: fromAddress },
                        to: { name: toName, email: toAddress },
                        subject: subject,
                        body: body,
                        date: date,
                        type: 'inbox',
                        read: false,
                    }
                });
                console.log(`Saved email #${newEmail.id} to database.`);

                const newCase = await prisma.case.create({
                    data: {
                        id: generateShortId('CASE'),
                        subject: subject,
                        customer: contact.name,
                        email: contact.email,
                        priority: 'Medium',
                        type: 'General Question',
                        status: 'New',
                        createdById: defaultUser.id,
                        description: mail.text || body.substring(0, 500),
                        contactId: contact.id,
                        communications: [{ id: `comm-${Date.now()}`, type: 'Email', content: `Original email from ${contact.name}:\n\n${mail.text || ''}`, author: contact.name, authorId: contact.id, authorRole: 'staff', timestamp: date.toISOString() }]
                    }
                });
                console.log(`Created new case #${newCase.id} from email.`);
                
                await prisma.email.update({
                    where: { id: newEmail.id },
                    data: { linkedCaseId: newCase.id }
                });

                processedCount++;

            } catch (emailError) {
                failedCount++;
                console.error(`Failed to process email UID ${emailUID}. Error:`, emailError);
            }
        }

        connection.end();
        console.log(`Email processing finished. Successfully processed: ${processedCount}, Failed: ${failedCount}`);
        revalidatePath('/emails');
        revalidatePath('/cases');
        return { count: processedCount };

    } catch (err) {
        console.error('A critical error occurred during email processing:', err);
        if (connection) {
            connection.end();
        }
        throw new Error('Failed to process emails. Check server logs for details.');
    }
}


export async function syncSentEmails() {
    console.log("Starting sent email synchronization...");

    const emailSettings = await getEmailSettings();
    if (!emailSettings.configured) {
        console.error("IMAP is not configured.");
        throw new Error("IMAP credentials are not configured in settings.");
    }
    const ownerEmail = emailSettings.imapUser;


    const config = {
        imap: {
            user: emailSettings.imapUser,
            password: emailSettings.imapPass,
            host: emailSettings.imapHost,
            port: emailSettings.imapPort,
            tls: emailSettings.imapEncryption === 'tls' || emailSettings.imapEncryption === 'ssl',
            authTimeout: 10000,
            tlsOptions: { rejectUnauthorized: false, servername: emailSettings.imapHost }
        }
    };

    let connection;
    try {
        console.log(`Connecting to IMAP server for sent mail: ${config.imap.host}...`);
        connection = await imaps.connect(config);
        console.log("IMAP connection successful for sent mail.");

        const boxes = await connection.getBoxes();
        let sentBoxName = '';
        
        const findSentBoxRecursive = (boxes: any, pathPrefix = ''): string | null => {
            for (const boxName in boxes) {
                const fullPath = pathPrefix ? `${pathPrefix}${boxes[boxName].delimiter}${boxName}` : boxName;
                const box = boxes[boxName];

                if (box.attribs.includes('\\Sent') || boxName.toLowerCase().includes('sent')) {
                    return fullPath;
                }

                if (box.children && Object.keys(box.children).length > 0) {
                    const foundInChild = findSentBoxRecursive(box.children, fullPath);
                    if (foundInChild) return foundInChild;
                }
            }
            return null;
        };
        
        // Prioritize standard names
        if (boxes['[Gmail]']?.children?.['Sent Mail']) {
            sentBoxName = '[Gmail]/Sent Mail';
        } else if (boxes['Sent']) {
            sentBoxName = 'Sent';
        } else {
            // Fallback to recursive search if standard names aren't found
            sentBoxName = findSentBoxRecursive(boxes) || '';
        }

        if (!sentBoxName) {
            console.error("Could not find a sent mail folder. Available folders:", JSON.stringify(boxes, null, 2));
            throw new Error("Could not find the sent mail folder.");
        }
        
        console.log(`Opening sent mail folder: ${sentBoxName}`);
        await connection.openBox(sentBoxName, true); // readOnly = true
        
        const searchCriteria = ['ALL'];
        const fetchOptions = { bodies: [''] };
        const results = await connection.search(searchCriteria, fetchOptions);
        console.log(`Found ${results.length} emails in sent folder.`);

        let newEmailsSynced = 0;
        for (const item of results) {
            try {
                const all = item.parts.find(part => part.which === '');
                if (!all) continue;

                const mail = await simpleParser(all.body);
                const toAddress = mail.to?.value[0]?.address;

                if (!toAddress) continue; // Skip if no recipient

                // Check if this email already exists
                const existingEmail = await prisma.email.findFirst({
                    where: {
                        ownerEmail,
                        AND: [
                            { subject: mail.subject || '(No Subject)' },
                            { 'to': { path: ['email'], equals: toAddress } },
                            { date: mail.date || new Date() }
                        ]
                    }
                });

                if (existingEmail) {
                    continue;
                }

                // Save to DB
                await prisma.email.create({
                    data: {
                        ownerEmail,
                        from: { name: mail.from?.value[0]?.name || 'Me', email: mail.from?.value[0]?.address || emailSettings.imapUser },
                        to: { name: mail.to?.value[0]?.name || toAddress, email: toAddress },
                        subject: mail.subject || '(No Subject)',
                        body: mail.html || mail.text || '',
                        date: mail.date || new Date(),
                        type: 'sent',
                        read: true,
                    }
                });
                newEmailsSynced++;
            } catch (emailError) {
                console.error(`Failed to process a sent email. UID: ${item.attributes.uid}. Error:`, emailError);
            }
        }

        connection.end();
        console.log(`Sent email sync finished. New emails synced: ${newEmailsSynced}`);
        revalidatePath('/emails');
        return { count: newEmailsSynced };

    } catch (err) {
        console.error('A critical error occurred during sent mail sync:', err);
        if (connection) {
            connection.end();
        }
        throw new Error('Failed to sync sent emails. Check server logs for details.');
    }
}

export async function syncAllEmails() {
    const results = {
        inbox: { count: 0, error: null as string | null },
        sent: { count: 0, error: null as string | null }
    };
    
    try {
        const inboxResult = await processIncomingEmails();
        results.inbox.count = inboxResult.count;
    } catch(e: any) {
        results.inbox.error = e.message;
        console.error("Error processing inbox:", e);
    }
    
    try {
        const sentResult = await syncSentEmails();
        results.sent.count = sentResult.count;
    } catch(e: any) {
        results.sent.error = e.message;
        console.error("Error syncing sent mail:", e);
    }

    return results;
}


export async function sendEmail(to: string, subject: string, body: string) {
    const emailSettings = await getEmailSettings();
    const smtpUser = emailSettings.smtpUser;
    const smtpPass = emailSettings.smtpPass;
    const smtpHost = emailSettings.smtpHost;
    const smtpPort = emailSettings.smtpPort;


     if (!smtpUser || !smtpPass || !smtpHost) {
        console.error("SMTP credentials are not configured in settings or .env file.");
        throw new Error("SMTP credentials not configured.");
    }
    
    const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
            user: smtpUser,
            pass: smtpPass,
        },
        tls: {
            ciphers: emailSettings.smtpEncryption === 'ssl' ? 'SSLv3' : undefined,
            rejectUnauthorized: false
        }
    });

    try {
        console.log(`Attempting to send email to ${to}...`);
        const info = await transporter.sendMail({
            from: `"MinT CRM" <${smtpUser}>`,
            to: to,
            subject: subject,
            html: body,
        });

        console.log("Message sent: %s", info.messageId);
        
        await prisma.email.create({
            data: {
                ownerEmail: smtpUser,
                from: { name: 'Me', email: smtpUser },
                to: { name: to, email: to },
                subject,
                body,
                date: new Date(),
                type: 'sent',
                read: true,
            }
        });
        
        revalidatePath('/emails');
        return { success: true, messageId: info.messageId };
    } catch(err) {
        console.error("Error sending email: ", err);
        throw new Error("Failed to send email.");
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
    
    const defaultUser = await prisma.user.findFirst({ where: { role: { name: 'Admin' } } });
    if (!defaultUser) {
        throw new Error("No default admin user found to assign cases to.");
    }

    let contact = await prisma.contact.findUnique({ where: { email: email.from.email } });
    if (!contact) {
        contact = await prisma.contact.create({
            data: {
                name: email.from.name,
                email: email.from.email,
                phone: '',
                company: 'Unknown',
                role: 'Unknown',
                avatar: `https://placehold.co/40x40.png?text=${email.from.name.charAt(0)}`,
            }
        });
    }

    const newCase = await prisma.case.create({
        data: {
            id: generateShortId('CASE'),
            subject: email.subject,
            customer: contact.name,
            email: contact.email,
            priority: 'Medium',
            type: 'General Question',
            status: 'New',
            createdById: defaultUser.id,
            description: email.body,
            contactId: contact.id,
            communications: [{
                id: `comm-${Date.now()}`, type: 'Email', content: `Original email from ${contact.name}:\n\n${email.body}`, author: contact.name, authorId: contact.id, authorRole: 'staff', timestamp: new Date(email.date).toISOString()
            }]
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
