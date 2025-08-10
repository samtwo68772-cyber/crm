import type { Case, Task, Contact, User, Team } from './types';
import { BarChart, Briefcase, Users, CheckCircle, Clock } from 'lucide-react';
import React from 'react';

export const users: User[] = [
  { id: 'user-1', name: 'Alex Johnson', email: 'alex.j@example.com', role: 'admin', team: 'Management', avatar: '/avatars/01.png' },
  { id: 'user-2', name: 'Maria Garcia', email: 'maria.g@example.com', role: 'staff', team: 'Support Tier 1', avatar: '/avatars/02.png' },
  { id: 'user-3', name: 'James Smith', email: 'james.s@example.com', role: 'staff', team: 'Support Tier 2', avatar: '/avatars/03.png' },
  { id: 'user-4', name: 'Patricia Williams', email: 'patricia.w@example.com', role: 'staff', team: 'Support Tier 1', avatar: '/avatars/04.png' },
];

export const cases: Case[] = [
  { id: 'case-101', subject: 'Login issue on mobile', customer: 'John Doe', email: 'john.d@customer.com', priority: 'High', status: 'New', assignedTo: 'Maria Garcia', createdAt: '2024-05-20', description: 'Customer reports being unable to log in via the mobile app. Getting an "Authentication Failed" error despite using correct credentials.' },
  { id: 'case-102', subject: 'Billing question', customer: 'Jane Roe', email: 'jane.r@customer.com', priority: 'Medium', status: 'In Progress', assignedTo: 'James Smith', createdAt: '2024-05-19', description: 'Customer is asking for clarification on their last invoice, specifically the "Service Adjustment" line item.' },
  { id: 'case-103', subject: 'Feature request: Dark Mode', customer: 'Peter Jones', email: 'peter.j@customer.com', priority: 'Low', status: 'Resolved', assignedTo: 'Alex Johnson', createdAt: '2024-05-18', description: 'User loves the platform and would like to see a dark mode option for the UI.' },
  { id: 'case-104', subject: 'Cannot export data to CSV', customer: 'Susan Miller', email: 'susan.m@customer.com', priority: 'High', status: 'In Progress', assignedTo: 'James Smith', createdAt: '2024-05-20', description: 'The export to CSV feature is failing with a server error 500. This is blocking their monthly reporting.' },
  { id: 'case-105', subject: 'Slow performance on dashboard', customer: 'Robert Brown', email: 'robert.b@customer.com', priority: 'Medium', status: 'New', assignedTo: 'Unassigned', createdAt: '2024-05-21', description: 'The main dashboard is taking over 10 seconds to load.' },
];

export const tasks: Task[] = [
  { id: 'task-1', title: 'Follow up with John Doe re: login issue', status: 'In Progress', dueDate: '2024-05-22', priority: 'High' },
  { id: 'task-2', title: 'Investigate CSV export error', status: 'In Progress', dueDate: '2024-05-21', priority: 'High' },
  { id: 'task-3', title: 'Prepare monthly support summary', status: 'To Do', dueDate: '2024-05-30', priority: 'Medium' },
  { id: 'task-4', title: 'Review feature request backlog', status: 'To Do', dueDate: '2024-06-05', priority: 'Low' },
  { id: 'task-5', title: 'Onboard new Tier 1 support agent', status: 'Done', dueDate: '2024-05-15', priority: 'Medium' },
];

export const contacts: Contact[] = [
    { id: 'contact-1', name: 'John Doe', email: 'john.d@customer.com', phone: '123-456-7890', company: 'Acme Inc.', avatar: '/avatars/05.png' },
    { id: 'contact-2', name: 'Jane Roe', email: 'jane.r@customer.com', phone: '234-567-8901', company: 'Stark Industries', avatar: '/avatars/06.png' },
    { id: 'contact-3', name: 'Peter Jones', email: 'peter.j@customer.com', phone: '345-678-9012', company: 'Wayne Enterprises', avatar: '/avatars/07.png' },
];

export const teams: Team[] = [
    { id: 'team-1', name: 'Support Tier 1', memberCount: 2 },
    { id: 'team-2', name: 'Support Tier 2', memberCount: 1 },
    { id: 'team-3', name: 'Management', memberCount: 1 },
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
