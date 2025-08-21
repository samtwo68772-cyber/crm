
"use client";

import { useAuth } from '@/context/auth-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useRouter } from 'next/navigation';
import {
    Briefcase,
    ListTodo,
    Mail,
    Calendar,
    Contact,
    Building,
    Users,
    FileText,
    ArrowUpRight,
    PlusCircle,
    ChevronDown,
} from 'lucide-react';
import type { Case, Task, Meeting, Email, AuditLog, User, Account, Document } from '@/lib/types';
import { format, parseISO, formatDistanceToNow, subDays, isAfter } from 'date-fns';
import React, { useMemo, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useQuery } from '@tanstack/react-query';
import { getCases } from './cases/actions';
import { getTasks } from './tasks/actions';
import { getEmails } from './emails/actions';
import { getMeetings } from './meetings/actions';
import { getContacts } from './accounts/actions';
import { getAccounts } from './accounts/actions';
import { getUsers } from './admin/actions';
import { getDocuments } from './documents/actions';
import { getAuditLogs } from './settings/actions';
import { Skeleton } from '@/components/ui/skeleton';


function getStatusVariant(status: Case['status']) {
    switch (status) {
        case 'New': return 'blue';
        case 'In Progress': case 'Under Review': return 'teal';
        case 'Resolved': case 'Completed': case 'Closed': return 'green';
        case 'Declined': return 'destructive';
        default: return 'outline';
    }
}

function KpiCard({ title, value, change, icon: Icon, onClick, isLoading }: { title: string, value: string | number, change: string, icon: React.ElementType, onClick?: () => void, isLoading: boolean }) {
    const cardProps = onClick ? { onClick, className: "cursor-pointer hover:shadow-lg transition-shadow duration-200" } : {};
    
    if (isLoading) {
        return (
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{title}</CardTitle>
                    <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-8 w-1/2" />
                    <Skeleton className="h-4 w-1/3 mt-2" />
                </CardContent>
            </Card>
        )
    }
    
    return (
        <Card {...cardProps}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <ArrowUpRight className="h-3 w-3 text-green-500" />
                    {change}
                </p>
            </CardContent>
        </Card>
    );
}

function RecentCases({ allUsers }: { allUsers: User[] }) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    
    const { data: initialCases, isLoading } = useQuery<Case[]>({
        queryKey: ['cases'],
        queryFn: getCases,
    });


    const recentCases = useMemo(() => {
        if (!initialCases) return [];
        const twoWeeksAgo = subDays(new Date(), 14);
        return initialCases
            .filter(c => isAfter(parseISO(c.createdAt), twoWeeksAgo))
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [initialCases]);

    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <Card className="shadow-none border-0 bg-transparent">
                <CollapsibleTrigger asChild>
                    <div className="flex items-center justify-between p-6 cursor-pointer">
                        <div>
                            <CardTitle>Recent Cases</CardTitle>
                            <CardDescription>Cases updated in the last 14 days.</CardDescription>
                        </div>
                        <Button variant="ghost" size="icon">
                            <ChevronDown className={cn("h-5 w-5 transition-transform", isOpen && "rotate-180")} />
                        </Button>
                    </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <CardContent>
                        {isLoading ? (
                            <div className="space-y-4">
                                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
                            </div>
                        ) : recentCases.length > 0 ? (
                            <div className="space-y-4">
                                {recentCases.map(caseItem => (
                                    <div key={caseItem.id} className="flex items-start gap-4">
                                        <Avatar className="h-10 w-10">
                                            <AvatarFallback>{caseItem.customer.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1">
                                            <p className="font-semibold text-sm">{caseItem.subject}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {caseItem.id} &bull; Assigned to {allUsers.find(u => u.name === caseItem.assignedTo)?.name || 'Unassigned'}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <Badge variant={getStatusVariant(caseItem.status)}>{caseItem.status}</Badge>
                                            <p className="text-xs text-muted-foreground mt-1">{format(parseISO(caseItem.createdAt), 'MMM d, yyyy')}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                             <p className="text-center text-muted-foreground py-8">No recent cases</p>
                        )}
                    </CardContent>
                    <CardFooter>
                        <Button variant="outline" size="sm" onClick={() => router.push('/cases')}>View All</Button>
                    </CardFooter>
                </CollapsibleContent>
            </Card>
        </Collapsible>
    );
}

function RecentActivity({ allUsers }: { allUsers: User[] }) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    
    const { data: casesData, isLoading: casesLoading } = useQuery<Case[]>({ queryKey: ['cases'], queryFn: getCases });
    const { data: tasksData, isLoading: tasksLoading } = useQuery<Task[]>({ queryKey: ['tasks'], queryFn: getTasks });
    const { data: meetingsData, isLoading: meetingsLoading } = useQuery<Meeting[]>({ queryKey: ['meetings'], queryFn: getMeetings });
    const { data: auditLogsData, isLoading: auditLogsLoading } = useQuery<AuditLog[]>({ queryKey: ['auditLogs'], queryFn: getAuditLogs });


    const activities = useMemo(() => {
        if (!casesData || !tasksData || !meetingsData || !auditLogsData) return [];
        const twoWeeksAgo = subDays(new Date(), 14);

        const caseActivities = casesData
            .filter(c => isAfter(parseISO(c.createdAt), twoWeeksAgo))
            .map(c => ({
                id: `case-${c.id}`,
                type: 'case',
                description: `New case created: "${c.subject}"`,
                timestamp: c.createdAt,
                user: allUsers.find(u => u.name === c.assignedTo) || { name: c.assignedTo }
            }));

        const taskActivities = tasksData
            .filter(t => isAfter(new Date(t.dueDate), twoWeeksAgo))
            .map(t => ({
                id: `task-${t.id}`,
                type: 'task',
                description: `${t.status === 'Done' ? 'Task completed' : 'New task'}: "${t.title}"`,
                timestamp: t.dueDate, 
                user: allUsers.find(u => u.id === t.assignedTo)
            }));

        const meetingActivities = meetingsData
            .filter(m => isAfter(new Date(m.date), twoWeeksAgo))
            .map(m => ({
                id: `meeting-${m.id}`,
                type: 'meeting',
                description: `${m.status === 'Upcoming' ? 'Meeting scheduled' : 'Meeting'}: "${m.title}"`,
                timestamp: m.date,
                user: allUsers.find(u => m.participants.includes(u.id))
            }));
        
        const auditActivities = (auditLogsData || [])
            .filter((log: AuditLog) => isAfter(new Date(log.timestamp), twoWeeksAgo))
            .map((log: AuditLog) => ({
                id: `audit-${log.id}`,
                type: 'audit',
                description: log.details,
                timestamp: log.timestamp,
                user: allUsers.find(u => u.id === log.userId)
            }));


        return [...caseActivities, ...taskActivities, ...meetingActivities, ...auditActivities]
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    }, [casesData, tasksData, meetingsData, allUsers, auditLogsData]);
    
    const isLoading = casesLoading || tasksLoading || meetingsLoading || auditLogsLoading;

    const getActivityDot = (type: string) => {
        switch (type) {
            case 'case': return <div className="h-2 w-2 rounded-full bg-blue-500" />;
            case 'task': return <div className="h-2 w-2 rounded-full bg-green-500" />;
            case 'meeting': return <div className="h-2 w-2 rounded-full bg-purple-500" />;
            case 'audit': return <div className="h-2 w-2 rounded-full bg-gray-400" />;
            default: return <div className="h-2 w-2 rounded-full bg-gray-400" />;
        }
    };
    

    return (
         <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <Card className="shadow-none border-0 bg-transparent">
                <CollapsibleTrigger asChild>
                    <div className="flex items-center justify-between p-6 cursor-pointer">
                        <div>
                            <CardTitle>Recent Activity</CardTitle>
                            <CardDescription>Latest system activities from the last 14 days.</CardDescription>
                        </div>
                        <Button variant="ghost" size="icon">
                            <ChevronDown className={cn("h-5 w-5 transition-transform", isOpen && "rotate-180")} />
                        </Button>
                    </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <CardContent>
                        {isLoading ? (
                             <div className="space-y-4">
                                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                            </div>
                        ) : activities.length > 0 ? (
                            <div className="space-y-6">
                                 {activities.map(activity => (
                                    <div key={activity.id} className="flex items-start gap-3">
                                        <div className="shrink-0 mt-1.5">{getActivityDot(activity.type)}</div>
                                        <div className="flex-1">
                                            <p className="text-sm">{activity.description}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })} &bull; {activity.user?.name || 'System'}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-center text-muted-foreground py-8">No recent activities</p>
                        )}
                    </CardContent>
                     <CardFooter>
                        <Button variant="outline" size="sm" onClick={() => router.push('/settings?tab=audit')}>View All</Button>
                    </CardFooter>
                </CollapsibleContent>
            </Card>
        </Collapsible>
    );
}

export default function DashboardPage() {
    const { user } = useAuth();
    const router = useRouter();

    const { data: cases, isLoading: casesLoading } = useQuery<Case[]>({ queryKey: ['cases'], queryFn: getCases });
    const { data: tasks, isLoading: tasksLoading } = useQuery<Task[]>({ queryKey: ['tasks'], queryFn: getTasks });
    const { data: emails, isLoading: emailsLoading } = useQuery<Email[]>({ queryKey: ['emails'], queryFn: getEmails });
    const { data: meetings, isLoading: meetingsLoading } = useQuery<Meeting[]>({ queryKey: ['meetings'], queryFn: getMeetings });
    const { data: contacts, isLoading: contactsLoading } = useQuery<Contact[]>({ queryKey: ['contacts'], queryFn: getContacts });
    const { data: accounts, isLoading: accountsLoading } = useQuery<Account[]>({ queryKey: ['accounts'], queryFn: getAccounts });
    const { data: users, isLoading: usersLoading } = useQuery<User[]>({ queryKey: ['users'], queryFn: getUsers });
    const { data: documents, isLoading: documentsLoading } = useQuery<Document[]>({ queryKey: ['documents'], queryFn: getDocuments });
    
    const isLoading = casesLoading || tasksLoading || emailsLoading || meetingsLoading || contactsLoading || accountsLoading || usersLoading || documentsLoading;

    const stats = useMemo(() => {
        if (isLoading || !cases || !tasks || !emails || !meetings || !contacts || !accounts || !users || !documents) {
            return {
                activeCases: 0,
                pendingTasks: 0,
                unreadEmails: 0,
                upcomingMeetings: 0,
                totalContacts: 0,
                totalCompanies: 0,
                totalUsers: 0,
                totalDocuments: 0,
            };
        }
        return {
            activeCases: cases.filter(c => ['New', 'In Progress', 'Under Review', 'Investigated'].includes(c.status)).length,
            pendingTasks: tasks.filter(t => ['To Do', 'In Progress'].includes(t.status)).length,
            unreadEmails: emails.filter(e => e.type === 'inbox' && !e.read).length,
            upcomingMeetings: meetings.filter(m => m.status === 'Upcoming').length,
            totalContacts: contacts.length,
            totalCompanies: accounts.length,
            totalUsers: users.length,
            totalDocuments: documents.length,
        }
    }, [cases, tasks, emails, meetings, contacts, accounts, users, documents, isLoading]);

    if (!user) return null;

    return (
        <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
            <div className="flex flex-col md:flex-row items-start justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight font-headline">Dashboard</h2>
                    <p className="text-muted-foreground">Welcome back, {user.name}. Here's your overview.</p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <KpiCard title="Active Cases" value={stats.activeCases} change="+2 this week" icon={Briefcase} onClick={() => router.push('/cases?status=active')} isLoading={isLoading} />
                <KpiCard title="Pending Tasks" value={stats.pendingTasks} change="+5 this week" icon={ListTodo} onClick={() => router.push('/tasks?status=pending')} isLoading={isLoading} />
                <KpiCard title="Unread Emails" value={stats.unreadEmails} change="+12 today" icon={Mail} onClick={() => router.push('/emails?filter=unread')} isLoading={isLoading} />
                <KpiCard title="Upcoming Meetings" value={stats.upcomingMeetings} change="2 scheduled today" icon={Calendar} onClick={() => router.push('/meetings?filter=upcoming')} isLoading={isLoading} />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                 <KpiCard title="Total Contacts" value={stats.totalContacts} change="+10 this month" icon={Contact} onClick={() => router.push('/accounts?tab=contacts')} isLoading={isLoading} />
                 <KpiCard title="Total Companies" value={stats.totalCompanies} change="+3 this month" icon={Building} onClick={() => router.push('/accounts?tab=accounts')} isLoading={isLoading} />
                 <KpiCard title="Total Users" value={stats.totalUsers} change="+1 this month" icon={Users} onClick={() => router.push('/admin')} isLoading={isLoading} />
                 <KpiCard title="Total Documents" value={stats.totalDocuments} change="+25 this month" icon={FileText} onClick={() => router.push('/documents')} isLoading={isLoading} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3">
                    <RecentCases allUsers={users || []} />
                </div>
                <div className="lg:col-span-2">
                    <RecentActivity allUsers={users || []} />
                </div>
            </div>
        </div>
    );
}
