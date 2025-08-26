
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
    // We will call processIncomingEmails from the UI directly to avoid running it on every page load.
    return await prisma.email.findMany({
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

        const defaultUser = await prisma.user.findFirst({ where: { role: 'admin' } });
        if (!defaultUser) {
            console.error("No default admin user found to assign cases to.");
            throw new Error("No default admin user found to assign cases to.");
        }

        let processedCount = 0;
        let failedCount = 0;

        for (const item of results) {
            const emailUID = item.attributes.uid;
            try {
                const all = item.parts.find(part => part.which === '');
                if (!all) {
                    console.warn(`Skipping email UID ${emailUID}: No body part found.`);
                    continue;
                }

                const mail = await simpleParser(all.body);
                const subject = mail.subject || '(No Subject)';
                const fromAddress = mail.from?.value[0]?.address;

                console.log(`Processing email UID ${emailUID} from: ${fromAddress || 'Unknown'}, Subject: ${subject}`);

                if (!fromAddress) {
                    console.warn(`Skipping email UID ${emailUID} with no from address.`);
                    failedCount++;
                    continue;
                }

                if (fromAddress === emailSettings.imapUser) {
                    console.log(`Skipping email UID ${emailUID} from self: ${fromAddress}`);
                    continue;
                }
                
                const existingEmail = await prisma.email.findFirst({
                   where: {
                       OR: [
                           { messageId: mail.messageId },
                           { AND: [ { subject: subject }, { 'from.email': fromAddress }] }
                       ]
                   }
                });
                
                if (existingEmail) {
                    console.log(`Skipping already existing email UID ${emailUID}, Subject: ${subject}`);
                    continue;
                }

                const fromName = mail.from?.value[0]?.name || fromAddress;
                const toName = mail.to?.value[0]?.name || 'Me';
                const toAddress = mail.to?.value[0]?.address || '';

                let contact = await prisma.contact.findUnique({ where: { email: fromAddress } });
                if (!contact) {
                    contact = await prisma.contact.create({
                        data: {
                            name: fromName,
                            email: fromAddress,
                            company: 'Unknown',
                            role: 'Unknown',
                            avatar: `https://placehold.co/40x40.png?text=${fromName.charAt(0)}`,
                        }
                    });
                    console.log(`Created new contact: ${contact.name}`);
                }

                const newEmail = await prisma.email.create({
                    data: {
                        from: { name: fromName, email: fromAddress },
                        to: { name: toName, email: toAddress },
                        subject: subject,
                        body: mail.html || mail.text || '',
                        date: mail.date || new Date(),
                        type: 'inbox',
                        read: false,
                        messageId: mail.messageId,
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
                        description: mail.text || '(No Content)',
                        contactId: contact.id,
                        communications: {
                            push: { id: `comm-${Date.now()}`, type: 'Email', content: `Original email from ${contact.name}:\n\n${mail.text || ''}`, author: contact.name, authorId: contact.id, authorRole: 'staff', timestamp: (mail.date || new Date()).toISOString() }
                        }
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
                // Continue to the next email
            }
        }

        connection.end();
        console.log(`Email processing finished. Successfully processed: ${processedCount}, Failed: ${failedCount}`);
        revalidatePath('/emails');
        revalidatePath('/cases');
        revalidatePath('/accounts');
        return { count: processedCount };

    } catch (err) {
        console.error('A critical error occurred during email processing:', err);
        if (connection) {
            connection.end();
        }
        throw new Error('Failed to process emails. Check server logs for details.');
    }
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
        secure: smtpPort === 465, // For TLS with STARTTLS
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
        
        // Save sent email to our database
        await prisma.email.create({
            data: {
                from: { name: 'Me', email: smtpUser },
                to: { name: to, email: to },
                subject,
                body,
                date: new Date(),
                type: 'sent',
                read: true,
                messageId: info.messageId,
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
    
    const defaultUser = await prisma.user.findFirst({ where: { role: 'admin' } });
    if (!defaultUser) {
        throw new Error("No default admin user found to assign cases to.");
    }

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
