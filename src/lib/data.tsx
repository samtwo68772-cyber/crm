

import type { Case, Task, Contact, User, Team, Account, Document, Meeting, AuditLog, Email, Notification, Workflow } from './types';
import { BarChart, Briefcase, Users, CheckCircle, Clock } from 'lucide-react';
import React from 'react';

export const users: User[] = [
  { id: 'user-1', name: 'Alex Johnson', email: 'alex.j@example.com', role: 'admin', team: 'Management', avatar: '/avatars/01.png', status: 'Active' },
  { id: 'user-2', name: 'Maria Garcia', email: 'maria.g@example.com', role: 'staff', team: 'Support Tier 1', avatar: '/avatars/02.png', status: 'Active' },
  { id: 'user-3', name: 'James Smith', email: 'james.s@example.com', role: 'staff', team: 'Support Tier 2', avatar: '/avatars/03.png', status: 'Active' },
  { id: 'user-4', name: 'Patricia Williams', email: 'patricia.w@example.com', role: 'staff', team: 'Support Tier 1', avatar: '/avatars/04.png', status: 'Inactive' },
];

export const accounts: Account[] = [
    { id: 'acc-1', name: 'Acme Inc.', industry: 'Technology', owner: 'Alex Johnson', createdAt: '2023-01-15', address: '123 Acme St, San Francisco, CA', phone: '123-456-7890', email: 'contact@acme.com', website: 'https://acme.com', primaryContactId: 'contact-1' },
    { id: 'acc-2', name: 'Stark Industries', industry: 'Defense', owner: 'Maria Garcia', createdAt: '2023-02-20', address: '1 Stark Tower, New York, NY', phone: '212-970-4133', email: 'contact@starkindustries.com', website: 'https://starkindustries.com', primaryContactId: 'contact-2' },
    { id: 'acc-3', name: 'Wayne Enterprises', industry: 'Conglomerate', owner: 'James Smith', createdAt: '2023-03-10', address: '1007 Mountain Drive, Gotham City', phone: '555-WAYNE-ENT', email: 'info@wayne-enterprises.com', website: 'https://wayne-enterprises.com', primaryContactId: 'contact-3' },
    { id: 'acc-4', name: 'Cyberdyne Systems', industry: 'Robotics', owner: 'Alex Johnson', createdAt: '2023-04-01', address: '18144 El Camino Real, Sunnyvale, CA', phone: '800-555-CYBR', email: 'inquiries@cyberdyne.com', website: 'https://cyberdyne.com' },
    { id: 'acc-5', name: 'Globex Corporation', industry: 'Energy', owner: 'Maria Garcia', createdAt: '2023-05-22', address: '1 Globex Plaza, Cypress Creek, USA', phone: '800-GLOBEX-1', email: 'ceo@globex.com', website: 'https://globex.com' },
];

export const contacts: Contact[] = [
    { id: 'contact-1', name: 'John Doe', email: 'john.d@customer.com', phone: '123-456-7890', company: 'Acme Inc.', accountId: 'acc-1', role: 'IT Manager', avatar: '/avatars/05.png', notes: 'Primary technical contact. Prefers email communication.' },
    { id: 'contact-2', name: 'Jane Roe', email: 'jane.r@customer.com', phone: '234-567-8901', company: 'Stark Industries', accountId: 'acc-2', role: 'Procurement Officer', avatar: '/avatars/06.png', notes: 'Handles all billing and contract renewals.' },
    { id: 'contact-3', name: 'Peter Jones', email: 'peter.j@customer.com', phone: '345-678-9012', company: 'Wayne Enterprises', accountId: 'acc-3', role: 'Lead Developer', avatar: '/avatars/07.png' },
    { id: 'contact-4', name: 'Susan Miller', email: 'susan.m@customer.com', phone: '456-789-0123', company: 'Acme Inc.', accountId: 'acc-1', role: 'Project Manager', avatar: '/avatars/08.png' },
    { id: 'contact-5', name: 'Miles Dyson', email: 'miles.d@cyberdyne.com', phone: '567-890-1234', company: 'Cyberdyne Systems', accountId: 'acc-4', role: 'Head of Research', avatar: '/avatars/09.png' },
    { id: 'contact-6', name: 'Hank Scorpio', email: 'h.scorpio@globex.com', phone: '678-901-2345', company: 'Globex Corporation', accountId: 'acc-5', role: 'CEO', avatar: '/avatars/10.png' },
];


export const cases: Case[] = [
  { 
    id: 'case-101', 
    subject: 'Login issue on mobile', 
    customer: 'John Doe', 
    email: 'john.d@customer.com', 
    priority: 'High', 
    type: 'Bug Report',
    status: 'New', 
    assignedTo: ['user-2'], 
    createdAt: '2024-05-20',
    resolvedAt: '2024-05-21',
    description: 'Customer reports being unable to log in via the mobile app. Getting an "Authentication Failed" error despite using correct credentials.', 
    communications: [
        { id: 'comm-1', type: 'Note', content: 'Initial review of the case. Suspecting an issue with the mobile authentication service.', author: 'Maria Garcia', authorRole: 'staff', timestamp: '2024-05-20 10:00:00' }
    ],
    contactId: 'contact-1',
    satisfactionRating: 4,
  },
  { 
    id: 'case-102', 
    subject: 'Billing question', 
    customer: 'Jane Roe', 
    email: 'jane.r@customer.com', 
    priority: 'Medium', 
    type: 'Billing Inquiry',
    status: 'In Progress', 
    assignedTo: ['user-3'], 
    createdAt: '2024-05-19', 
    resolvedAt: undefined,
    description: 'Customer is asking for clarification on their last invoice, specifically the "Service Adjustment" line item.', 
    communications: [],
    contactId: 'contact-2',
    satisfactionRating: undefined,
  },
  { 
    id: 'case-103', 
    subject: 'Feature request: Dark Mode', 
    customer: 'Peter Jones', 
    email: 'peter.j@customer.com', 
    priority: 'Low', 
    type: 'Feature Request',
    status: 'Closed', 
    assignedTo: ['user-1'], 
    createdAt: '2024-05-18', 
    resolvedAt: '2024-05-19',
    description: 'User loves the platform and would like to see a dark mode option for the UI.', 
    communications: [
        { id: 'comm-2', type: 'Note', content: 'Feature has been added to the product backlog. Closing case.', author: 'Alex Johnson', authorRole: 'admin', timestamp: '2024-05-18 14:00:00' }
    ],
    contactId: 'contact-3',
    satisfactionRating: 5,
  },
  { 
    id: 'case-104', 
    subject: 'Cannot export data to CSV', 
    customer: 'Susan Miller', 
    email: 'susan.m@customer.com', 
    priority: 'High', 
    type: 'Bug Report',
    status: 'Investigated', 
    assignedTo: ['user-3'], 
    createdAt: '2024-05-20', 
    resolvedAt: undefined,
    description: 'The export to CSV feature is failing with a server error 500. This is blocking their monthly reporting.', 
    communications: [
        { id: 'comm-3', type: 'Finding', content: 'The CSV export fails due to a timeout on large datasets. The query needs to be optimized.', author: 'James Smith', authorRole: 'staff', timestamp: '2024-05-21 11:30:00' }
    ],
    contactId: 'contact-4',
    satisfactionRating: undefined,
  },
  { 
    id: 'case-105', 
    subject: 'Slow performance on dashboard', 
    customer: 'Robert Brown', 
    email: 'robert.b@customer.com', 
    priority: 'Medium', 
    type: 'General Question',
    status: 'New', 
    assignedTo: [], 
    createdAt: '2024-05-21', 
    resolvedAt: undefined,
    description: 'The main dashboard is taking over 10 seconds to load.', 
    communications: [] ,
    contactId: 'contact-5',
    satisfactionRating: undefined,
  },
  { 
    id: 'case-106', 
    subject: 'Password reset link not working', 
    customer: 'Emily White', 
    email: 'emily.w@customer.com', 
    priority: 'High', 
    type: 'Bug Report',
    status: 'Resolved', 
    assignedTo: ['user-2'], 
    createdAt: '2024-05-22',
    resolvedAt: '2024-05-23',
    description: 'Customer is not receiving the password reset email.', 
    communications: [],
    satisfactionRating: 4,
  },
  { 
    id: 'case-107', 
    subject: 'API access request', 
    customer: 'Michael Green', 
    email: 'michael.g@customer.com', 
    priority: 'Low',
    type: 'General Question', 
    status: 'Declined', 
    assignedTo: ['user-1'], 
    createdAt: '2024-05-21',
    resolvedAt: '2024-05-21',
    description: 'Requesting API access for a custom integration, which is not supported on their current plan.', 
    communications: [
      { id: 'comm-4', type: 'Note', content: 'Customer plan does not include API access. Declined request.', author: 'Alex Johnson', authorRole: 'admin', timestamp: '2024-05-21 16:00:00' }
    ],
    satisfactionRating: 2,
  },
];

export const tasks: Task[] = [
  { id: 'task-1', title: 'Follow up with John Doe re: login issue', status: 'In Progress', dueDate: '2024-05-22', priority: 'High', linkedCase: 'case-101', assignedTo: 'user-2', contactId: 'contact-1' },
  { id: 'task-2', title: 'Investigate CSV export error', status: 'In Progress', dueDate: '2024-05-21', priority: 'High', linkedCase: 'case-104', assignedTo: 'user-3', contactId: 'contact-4' },
  { id: 'task-3', title: 'Prepare monthly support summary', status: 'To Do', dueDate: '2024-05-30', priority: 'Medium', assignedTo: 'user-1' },
  { id: 'task-4', title: 'Review feature request backlog', status: 'To Do', dueDate: '2024-06-05', priority: 'Low', assignedTo: 'user-1' },
  { id: 'task-5', title: 'Onboard new Tier 1 support agent', status: 'Done', dueDate: '2024-05-15', priority: 'Medium', assignedTo: 'user-1' },
  { id: 'task-6', title: 'Pull invoice for Jane Roe', status: 'To Do', dueDate: '2024-05-23', priority: 'Medium', linkedCase: 'case-102', assignedTo: 'user-3', contactId: 'contact-2' },
  { id: 'task-7', title: 'Deploy patch for mobile auth service', status: 'To Do', dueDate: '2024-05-24', priority: 'High', linkedCase: 'case-101', assignedTo: 'user-2' },
  { id: 'task-8', title: 'Finalize Q2 report', status: 'Done', dueDate: '2024-05-18', priority: 'High', assignedTo: 'user-1' }
];

export const teams: Team[] = [
    { id: 'team-1', name: 'Support Tier 1', description: 'Handles frontline customer support and basic inquiries.', leaderId: 'user-2', memberIds: ['user-2', 'user-4'], status: 'Active' },
    { id: 'team-2', name: 'Support Tier 2', description: 'Handles escalated technical issues and bug fixes.', leaderId: 'user-3', memberIds: ['user-3'], status: 'Active' },
    { id: 'team-3', name: 'Management', description: 'Oversees operations and strategic decisions.', leaderId: 'user-1', memberIds: ['user-1'], status: 'Active' },
    { id: 'team-4', name: 'Sales (Archived)', description: 'Old sales team.', leaderId: 'user-1', memberIds: [], status: 'Archived' },
];

export const documents: Document[] = [
  { id: 'doc-1', name: 'Onboarding Checklist.pdf', type: 'PDF', size: '2.5 MB', uploadedAt: '2024-05-18', uploadedBy: 'Alex Johnson', category: 'Case File', description: 'Initial onboarding checklist for the Acme Inc. account.', linkedToType: 'Case', linkedToId: 'case-101' },
  { id: 'doc-2', name: 'Invoice_Q2_2024.pdf', type: 'PDF', size: '780 KB', uploadedAt: '2024-05-19', uploadedBy: 'Maria Garcia', category: 'Contract', description: 'Q2 2024 invoice for Stark Industries.', linkedToType: 'Account', linkedToId: 'acc-2' },
  { id: 'doc-3', name: 'Usage_Data_May.xlsx', type: 'Spreadsheet', size: '1.2 MB', uploadedAt: '2024-05-20', uploadedBy: 'James Smith', category: 'Report', description: 'Monthly usage data export for analysis.', linkedToType: 'Case', linkedToId: 'case-104' },
  { id: 'doc-4', name: 'login_error_screenshot.png', type: 'Image', size: '350 KB', uploadedAt: '2024-05-20', uploadedBy: 'Maria Garcia', category: 'Case File', description: 'Screenshot provided by the customer showing the login error.', linkedToType: 'Case', linkedToId: 'case-101', previewUrl: 'https://placehold.co/600x400.png' },
  { id: 'doc-6', name: 'Stark_Industries_MSA.pdf', type: 'PDF', size: '5.1 MB', uploadedAt: '2023-02-20', uploadedBy: 'Alex Johnson', category: 'Contract', description: 'Master Service Agreement for Stark Industries.', linkedToType: 'Account', linkedToId: 'acc-2' }
];

export const meetings: Meeting[] = [
  { 
    id: 'meet-1', 
    title: 'Q2 Review with Acme Inc.', 
    description: 'Quarterly business review and planning for next quarter.',
    date: new Date(new Date().setDate(new Date().getDate() + 5)).toISOString(), 
    status: 'Upcoming', 
    participants: ['user-1', 'user-2'],
    linkedRecord: 'case-101',
    contactId: 'contact-1'
  },
  { 
    id: 'meet-2', 
    title: 'Internal Project Kickoff', 
    description: 'Kickoff meeting for the new mobile app redesign project.',
    date: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString(), 
    status: 'Completed', 
    participants: ['user-1', 'user-3'],
  },
  { 
    id: 'meet-3', 
    title: 'Support Team Sync', 
    description: 'Weekly sync to discuss high-priority cases.',
    date: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString(), 
    status: 'Completed', 
    participants: ['user-2', 'user-3', 'user-4'],
  },
   { 
    id: 'meet-4', 
    title: 'Client Demo', 
    description: 'Demo of the new features for Stark Industries.',
    date: new Date(new Date().setDate(new Date().getDate() + 10)).toISOString(), 
    status: 'Upcoming', 
    participants: ['user-1'],
    linkedRecord: 'case-102',
    contactId: 'contact-2'
  },
   { 
    id: 'meet-5', 
    title: 'On-site Maintenance', 
    description: 'Scheduled maintenance at the client\'s office.',
    date: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString(), 
    status: 'Canceled', 
    participants: ['user-4'],
  },
];

export const notifications: Notification[] = [
    {
        id: 'notif-1',
        type: 'case',
        title: 'New Case Assigned',
        description: 'Case #case-101: "Login issue on mobile" assigned to you.',
        timestamp: new Date().toISOString(),
        read: false,
        userId: 'user-2',
        link: '/cases?id=case-101',
    },
    {
        id: 'notif-2',
        type: 'meeting',
        title: 'Meeting Reminder',
        description: 'Q2 Review with Acme Inc. is tomorrow.',
        timestamp: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(),
        read: true,
        userId: 'user-1',
        link: '/meetings?id=meet-1',
    },
    {
        id: 'notif-3',
        type: 'task',
        title: 'Task Overdue',
        description: 'Task: "Investigate CSV export error" is overdue.',
        timestamp: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(),
        read: false,
        userId: 'user-3',
        link: '/tasks?id=task-2',
    },
    {
        id: 'notif-4',
        type: 'email',
        title: 'New Email Received',
        description: 'From: New Prospect regarding "Inquiry about Enterprise Plan"',
        timestamp: new Date(new Date().setHours(new Date().getHours() - 2)).toISOString(),
        read: false,
        userId: 'user-1', // For admin/sales lead
        link: '/emails?id=email-3',
    }
];

export const recentActivities = [
  { id: 1, user: 'Maria Garcia', action: 'Updated', details: 'Case #case-102 to "In Progress"', timestamp: '2 hours ago' },
  { id: 2, user: 'System', action: 'Created', details: 'Case #case-105 from email', timestamp: '5 hours ago' },
  { id: 3, user: 'Alex Johnson', action: 'Resolved', details: 'Case #case-103', timestamp: '1 day ago' },
];

export const userCases = cases.slice(0, 3);

export const adminStats: { title: string; value: string; change: string; icon: React.ReactNode; }[] = [
    { title: "Total Open Cases", value: "32", change: "+5 from last week", icon: <Briefcase className="h-4 w-4 text-muted-foreground" /> },
    { title: "Resolved This Month", value: "128", change: "+15% from last month", icon: <CheckCircle className="h-4 w-4 text-muted-foreground" /> },
    { title: "Active Users", value: "4", change: "All users active", icon: <Users className="h-4 w-4 text-muted-foreground" /> },
    { title: "Avg. Resolution Time", value: "2.1 days", change: "-0.2 days from last month", icon: <Clock className="h-4 w-4 text-muted-foreground" /> },
];

export const auditLogs: AuditLog[] = [
  { id: 'log-1', userId: 'user-1', action: 'User Login', details: 'Alex Johnson logged in.', timestamp: '2024-05-23T10:00:00Z' },
  { id: 'log-2', userId: 'user-1', action: 'Update Settings', details: 'Updated General Settings: System Name to "MinT CRM Pro"', timestamp: '2024-05-23T10:05:00Z' },
  { id: 'log-3', userId: 'user-2', action: 'Update Case', details: 'Updated status of Case #case-102 to "In Progress"', timestamp: '2024-05-23T11:20:00Z' },
  { id: 'log-4', userId: 'user-1', action: 'Create User', details: 'Created new user: Patricia Williams (staff)', timestamp: '2024-05-22T14:15:00Z' },
  { id: 'log-5', userId: 'user-3', action: 'Delete Task', details: 'Deleted task: "Review old tickets"', timestamp: '2024-05-22T09:45:00Z' },
  { id: 'log-6', userId: 'user-1', action: 'Revoke API Key', details: 'Revoked API key "sk_...w456"', timestamp: '2024-05-21T18:00:00Z' },
];

export const emails: Email[] = [
    {
        id: 'email-1',
        from: { name: 'John Doe', email: 'john.d@customer.com' },
        to: { name: 'Support Team', email: 'support@mint-crm.com' },
        subject: 'Re: Login issue on mobile',
        body: 'Thanks for looking into this. Here is the screenshot of the error message I mentioned.',
        date: '2024-05-21T14:30:00Z',
        type: 'inbox',
        read: false,
        linkedCaseId: 'case-101',
        attachments: [
            { name: 'error_screenshot.png', size: '350 KB', type: 'Image' }
        ]
    },
    {
        id: 'email-2',
        from: { name: 'Maria Garcia', email: 'maria.g@example.com' },
        to: { name: 'John Doe', email: 'john.d@customer.com' },
        subject: 'Re: Login issue on mobile',
        body: 'Hi John, thanks for sending that over. We have identified the issue and are working on a fix. We will notify you once it is resolved.',
        date: '2024-05-22T09:15:00Z',
        type: 'sent',
        read: true,
        linkedCaseId: 'case-101'
    },
    {
        id: 'email-3',
        from: { name: 'New Prospect', email: 'new.prospect@company.com' },
        to: { name: 'Sales Team', email: 'sales@mint-crm.com' },
        subject: 'Inquiry about Enterprise Plan',
        body: 'Hello, my team is interested in learning more about your Enterprise plan features and pricing. Can someone from your sales team reach out to me?',
        date: '2024-05-22T11:00:00Z',
        type: 'inbox',
        read: true,
    },
    {
        id: 'email-4',
        from: { name: 'Jane Roe', email: 'jane.r@customer.com' },
        to: { name: 'Support Team', email: 'support@mint-crm.com' },
        subject: 'Follow-up on billing question',
        body: 'Hi, just wanted to follow up on my previous email about the invoice. Have you had a chance to look at it?',
        date: '2024-05-22T15:00:00Z',
        type: 'inbox',
        read: false,
        linkedCaseId: 'case-102'
    },
    {
        id: 'email-5',
        from: { name: 'Alex Johnson', email: 'alex.j@example.com' },
        to: { name: 'All Staff', email: 'staff@mint-crm.com' },
        subject: 'Q3 All-Hands Meeting',
        body: 'Team, a friendly reminder that our Q3 all-hands meeting is scheduled for next Friday. Please be sure to add it to your calendars.',
        date: '2024-05-20T10:00:00Z',
        type: 'sent',
        read: true,
    },
    {
        id: 'email-6',
        from: { name: 'Potential Customer', email: 'potential.customer@email.com' },
        to: { name: 'Support Team', email: 'support@mint-crm.com' },
        subject: 'Urgent: Server is down',
        body: 'Our main application server seems to be down. We are unable to access any of our services. Please investigate immediately.',
        date: new Date().toISOString(),
        type: 'inbox',
        read: false,
    },
    {
        id: 'email-7',
        from: { name: 'Another Inquiry', email: 'another.inquiry@email.com' },
        to: { name: 'Support Team', email: 'support@mint-crm.com' },
        subject: 'Question about your API',
        body: 'I was looking at your API documentation and had a question about the authentication method. Can you provide more details?',
        date: new Date().toISOString(),
        type: 'inbox',
        read: false,
    }
];

export const workflows: Workflow[] = [
    { id: 'wf-1', name: 'Assign High-Priority Cases', trigger: 'case-created', condition: 'priority-high', action: 'assign-team-t2' },
    { id: 'wf-2', name: 'Notify Customer on Resolution', trigger: 'case-status-changed', condition: 'status-resolved', action: 'send-email-customer' },
    { id: 'wf-3', name: 'Escalate Unattended New Cases', trigger: 'case-unattended', condition: 'status-is-new-for-24h', action: 'change-priority-high' },
    { id: 'wf-4', name: 'Manager Follow-up for Overdue Task', trigger: 'task-status-changed', condition: 'task-overdue', action: 'assign-to-manager' },

];
