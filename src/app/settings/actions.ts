
'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import type { GeneralSettingsType, EmailSettingsType, Workflow, NotificationPreferences } from '@/lib/types';


// General Settings
export async function getGeneralSettings() {
    let settings = await prisma.generalSettings.findFirst();
    if (!settings) {
        settings = await prisma.generalSettings.create({
            data: {
                systemName: 'MinT CRM',
                companyName: 'My Company',
                logoUrl: '',
                timeZone: 'UTC-5:00',
                language: 'en-US',
            }
        });
    }
    return settings;
}

export async function updateGeneralSettings(data: GeneralSettingsType) {
    const settings = await getGeneralSettings();
    const updatedSettings = await prisma.generalSettings.update({
        where: { id: settings.id },
        data,
    });
    // revalidatePath('/settings');
    return updatedSettings;
}

// Email Settings
export async function getEmailSettings() {
    let settings = await prisma.emailSettings.findFirst();
    if (!settings) {
        settings = await prisma.emailSettings.create({
            data: {
                smtpHost: '', smtpPort: 587, smtpUser: '', smtpPass: '', smtpEncryption: 'tls',
                imapHost: '', imapPort: 993, imapUser: '', imapPass: '', imapEncryption: 'ssl',
                configured: false
            }
        });
    }
    return settings;
}

export async function updateEmailSettings(data: EmailSettingsType) {
    const settings = await getEmailSettings();
    const updatedSettings = await prisma.emailSettings.update({
        where: { id: settings.id },
        data,
    });
    // revalidatePath('/settings');
    return updatedSettings;
}

// Notification Preferences (Global)
export async function getGlobalNotificationPreferences() {
    let prefs = await prisma.globalNotificationPreferences.findFirst();
     if (!prefs) {
        prefs = await prisma.globalNotificationPreferences.create({
            data: {
                cases: {
                    newAssignment: { inApp: true, email: true, mandatory: true },
                    statusChange: { inApp: true, email: false, mandatory: false },
                    newComment: { inApp: true, email: false, mandatory: false },
                },
                tasks: {
                    newAssignment: { inApp: true, email: true, mandatory: true },
                    statusChange: { inApp: false, email: false, mandatory: false },
                    dueSoon: { inApp: true, email: true, mandatory: false },
                },
                meetings: {
                    newInvite: { inApp: true, email: true, mandatory: true },
                    update: { inApp: true, email: true, mandatory: false },
                    cancellation: { inApp: true, email: true, mandatory: true },
                }
            }
        });
    }
    return prefs;
}

export async function updateGlobalNotificationPreferences(data: NotificationPreferences) {
    const prefs = await getGlobalNotificationPreferences();
    const updatedPrefs = await prisma.globalNotificationPreferences.update({
        where: { id: prefs.id },
        data: {
            cases: data.cases,
            tasks: data.tasks,
            meetings: data.meetings,
        },
    });
    // revalidatePath('/settings');
    return updatedPrefs;
}


// Workflows
export async function getWorkflows() {
    return await prisma.workflow.findMany();
}

export async function createWorkflow(data: Omit<Workflow, 'id'>) {
    const newWorkflow = await prisma.workflow.create({ data });
    // revalidatePath('/settings');
    return newWorkflow;
}

export async function updateWorkflow(id: string, data: Partial<Omit<Workflow, 'id'>>) {
    const updatedWorkflow = await prisma.workflow.update({
        where: { id },
        data,
    });
    // revalidatePath('/settings');
    return updatedWorkflow;
}

export async function deleteWorkflow(id: string) {
    const deleted = await prisma.workflow.delete({ where: { id } });
    // revalidatePath('/settings');
    return deleted;
}

// Audit Logs
export async function getAuditLogs() {
    return await prisma.auditLog.findMany({
        orderBy: {
            timestamp: 'desc'
        }
    });
}
