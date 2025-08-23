
import { PrismaClient } from '@prisma/client';
import {
  users,
  teams,
  accounts,
  contacts,
  cases,
  tasks,
  meetings,
  documents,
  emails,
  workflows,
  auditLogs,
} from '../src/lib/data';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // Seed Users and their Notification Preferences
  for (const user of users) {
    const { id, ...rest } = user;
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        ...rest,
        passwordHash: user.name, // In a real app, this would be a proper hash
      },
      create: {
        id,
        ...rest,
        passwordHash: user.name,
        notificationPreferences: {
          create: {
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
        }
      },
    });
  }
  console.log('Users seeded.');

  // Seed Teams
  for (const team of teams) {
    await prisma.team.upsert({
      where: { name: team.name },
      update: team,
      create: team,
    });
  }
  console.log('Teams seeded.');

  // Seed Accounts
  for (const account of accounts) {
    const { primaryContactId, createdAt, ...rest } = account;
    await prisma.account.upsert({
      where: { name: account.name },
      update: { ...rest, createdAt: new Date(createdAt) },
      create: { ...rest, createdAt: new Date(createdAt) },
    });
  }
  console.log('Accounts seeded.');

  // Seed Contacts
  for (const contact of contacts) {
    await prisma.contact.upsert({
      where: { email: contact.email },
      update: contact,
      create: contact,
    });
  }
  console.log('Contacts seeded.');
  
  // Seed Cases
  for (const caseItem of cases) {
    const { communications, assignedTo, ...rest } = caseItem;
    const newCase = await prisma.case.upsert({
        where: { id: caseItem.id },
        update: {
            ...rest,
            createdAt: new Date(caseItem.createdAt),
            resolvedAt: caseItem.resolvedAt ? new Date(caseItem.resolvedAt) : null,
            createdById: 'user-1', // Default creator
        },
        create: {
            ...rest,
            createdAt: new Date(caseItem.createdAt),
            resolvedAt: caseItem.resolvedAt ? new Date(caseItem.resolvedAt) : null,
            createdById: 'user-1', // Default creator
        }
    });

    // Now create assignments
    if (assignedTo && assignedTo.length > 0) {
      for (const userId of assignedTo) {
        // Ensure assignment does not already exist to avoid errors on re-seeding
        const existingAssignment = await prisma.caseAssignment.findFirst({
            where: {
                caseId: newCase.id,
                userId: userId,
            }
        });
        if (!existingAssignment) {
             await prisma.caseAssignment.create({
                data: {
                    caseId: newCase.id,
                    userId: userId,
                    assignedByUserId: 'user-1' // default to admin
                }
            })
        }
      }
    }
  }
   console.log('Cases seeded.');

  // Seed Tasks
  for (const task of tasks) {
    await prisma.task.upsert({
      where: { id: task.id },
      update: {
          ...task,
          dueDate: task.dueDate ? new Date(task.dueDate) : null
      },
      create: {
          ...task,
          dueDate: task.dueDate ? new Date(task.dueDate) : null
      },
    });
  }
  console.log('Tasks seeded.');

  // Seed Meetings
  for (const meeting of meetings) {
    const { participants, ...meetingData } = meeting;
    const newMeeting = await prisma.meeting.upsert({
      where: { id: meeting.id },
      update: {...meetingData, date: new Date(meeting.date)},
      create: {...meetingData, date: new Date(meeting.date)},
    });
    // Create meeting participants
    const participantIds = ['user-1', 'user-2']; // Example participants
    for (const userId of participantIds) {
        const existingParticipant = await prisma.meetingParticipant.findFirst({
            where: {
                meetingId: newMeeting.id,
                userId: userId,
            }
        });
        if (!existingParticipant) {
            await prisma.meetingParticipant.create({
                data: {
                    meetingId: newMeeting.id,
                    userId: userId
                }
            });
        }
    }
  }
  console.log('Meetings seeded.');
  
  // Seed Documents
  for (const doc of documents) {
      await prisma.document.upsert({
          where: {id: doc.id},
          update: {
              ...doc,
              uploadedAt: new Date(doc.uploadedAt),
          },
          create: {
              ...doc,
              uploadedAt: new Date(doc.uploadedAt),
          },
      })
  }
  console.log('Documents seeded.');
  
  // Seed Emails
  for (const email of emails) {
    await prisma.email.upsert({
        where: {id: email.id},
        update: {...email, date: new Date(email.date)},
        create: {...email, date: new Date(email.date)}
    })
  }
  console.log('Emails seeded.');
  
  // Seed Workflows
  for (const workflow of workflows) {
      await prisma.workflow.upsert({
          where: {id: workflow.id},
          update: workflow,
          create: workflow
      })
  }
  console.log('Workflows seeded.');
  
  // Seed Audit Logs
  for (const log of auditLogs) {
    await prisma.auditLog.upsert({
      where: { id: log.id },
      update: {...log, timestamp: new Date(log.timestamp)},
      create: {...log, timestamp: new Date(log.timestamp)}
    })
  }
  console.log('Audit Logs seeded.');
  
  // Seed General & Global Notification Settings
  const generalSettingsId = 'clwyllpqs000008l41g18b6er';
  await prisma.generalSettings.upsert({
      where: { id: generalSettingsId },
      update: {},
      create: {
        id: generalSettingsId,
        systemName: 'MinT CRM',
        companyName: 'My Company',
        logoUrl: '',
        timeZone: 'UTC-5:00',
        language: 'en-US',
      }
  })

  const emailSettingsId = 'clwylpycw000208l46v1z44kf';
   await prisma.emailSettings.upsert({
      where: { id: emailSettingsId },
      update: {},
      create: {
        id: emailSettingsId,
        configured: false,
        smtpHost: '', smtpPort: 587, smtpUser: '', smtpPass: '', smtpEncryption: 'tls',
        imapHost: '', imapPort: 993, imapUser: '', imapPass: '', imapEncryption: 'ssl',
      }
   })

  const globalNotificationId = 'clwylrfwu000408l4czj034pr';
  await prisma.globalNotificationPreferences.upsert({
      where: { id: globalNotificationId },
      update: {},
      create: {
          id: globalNotificationId,
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
  })

  console.log('Settings seeded.');

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
