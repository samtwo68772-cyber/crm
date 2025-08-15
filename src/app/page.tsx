
"use client";

import { useAuth } from '@/context/auth-context';
import { useData } from '@/context/data-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
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
    UserCheck,
    MessageSquare,
    CheckCircle,
    ChevronDown
} from 'lucide-react';
import type { Case, Task, Meeting, Email, AuditLog } from '@/lib/types';
import { format, parseISO } from 'date-fns';
import React, { useMemo, useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';


function getStatusVariant(status: Case['status']) {
    switch (status) {
        case 'New': return 'blue';
        case 'In Progress': case 'Under Review': return 'teal';
        case 'Resolved': case 'Completed': case 'Closed': return 'green';
        case 'Declined': return 'destructive';
        default: return 'outline';
    }
}

function KpiCard({ title, value, change, icon: Icon, onClick }: { title: string, value: string | number, change: string, icon: React.ElementType, onClick: () => void }) {
    return (
        <Card onClick={onClick} className="cursor-pointer hover:shadow-lg transition-shadow duration-200">
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

function RecentCases({ cases }: { cases: Case[] }) {
    const router = useRouter();
    const { users } = useData();
    const [isOpen, setIsOpen] = useState(true);

    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <Card>
                <CollapsibleTrigger asChild>
                    <div className="flex items-center justify-between p-6 cursor-pointer">
                        <div>
                            <CardTitle>Recent Cases</CardTitle>
                            <CardDescription>The latest cases that have been opened.</CardDescription>
                        </div>
                         <ChevronDown className={cn("h-5 w-5 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
                    </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <CardContent>
                        <div className="space-y-4">
                            {cases.slice(0, 5).map(caseItem => (
                                <div key={caseItem.id} className="flex items-start gap-4">
                                    <Avatar className="h-10 w-10">
                                        <AvatarFallback>{caseItem.customer.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <p className="font-semibold text-sm">{caseItem.subject}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {caseItem.id} &bull; Assigned to {users.find(u => u.name === caseItem.assignedTo)?.name || 'Unassigned'}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <Badge variant={getStatusVariant(caseItem.status)}>{caseItem.status}</Badge>
                                        <p className="text-xs text-muted-foreground mt-1">{format(parseISO(caseItem.createdAt), 'MMM d, yyyy')}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                    <CardFooter>
                         <Button variant="outline" size="sm" onClick={() => router.push('/cases')} className="w-full">View All Cases</Button>
                    </CardFooter>
                </CollapsibleContent>
            </Card>
        </Collapsible>
    );
}

function getActivityIcon(action: string) {
    switch(action.toLowerCase()) {
        case 'user login': return <UserCheck className="h-5 w-5 text-blue-500" />;
        case 'update case': return <Briefcase className="h-5 w-5 text-orange-500" />;
        case 'create user': return <Users className="h-5 w-5 text-green-500" />;
        default: return <MessageSquare className="h-5 w-5 text-muted-foreground" />;
    }
}

function RecentActivity() {
    const { users, auditLogs } = useData();
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(true);

    const activities = useMemo(() => {
        if (!auditLogs) return [];
        return auditLogs.map(log => ({
            ...log,
            user: users.find(u => u.id === log.userId)
        }));
    }, [auditLogs, users]);

    if (!activities) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>A log of the latest system events.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p>Loading activities...</p>
                </CardContent>
            </Card>
        )
    }

    const recentActivities = activities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 7);

    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <Card>
                <CollapsibleTrigger asChild>
                    <div className="flex items-center justify-between p-6 cursor-pointer">
                        <div>
                            <CardTitle>Recent Activity</CardTitle>
                            <CardDescription>A log of the latest system events.</CardDescription>
                        </div>
                        <ChevronDown className={cn("h-5 w-5 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
                    </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <CardContent>
                        <div className="space-y-4">
                             {recentActivities.map(activity => (
                                <div key={activity.id} className="flex items-center gap-4">
                                    <div className="p-2 bg-muted rounded-full">{getActivityIcon(activity.action)}</div>
                                    <div className="flex-1">
                                        <p className="text-sm">{activity.details}</p>
                                        <p className="text-xs text-muted-foreground">By {activity.user?.name || 'System'} &bull; {format(parseISO(activity.timestamp), 'PPpp')}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                    <CardFooter>
                         <Button variant="outline" size="sm" onClick={() => router.push('/settings?tab=audit')} className="w-full">View All Activity</Button>
                    </CardFooter>
                </CollapsibleContent>
            </Card>
        </Collapsible>
    );
}

export default function DashboardPage() {
    const { user } = useAuth();
    const router = useRouter();
    const { cases, tasks, emails, meetings, contacts, accounts, users, documents } = useData();

    const stats = useMemo(() => ({
        activeCases: cases.filter(c => ['New', 'In Progress', 'Under Review', 'Investigated'].includes(c.status)).length,
        pendingTasks: tasks.filter(t => ['To Do', 'In Progress'].includes(t.status)).length,
        unreadEmails: emails.filter(e => e.type === 'inbox' && !e.read).length,
        upcomingMeetings: meetings.filter(m => m.status === 'Upcoming').length,
        totalContacts: contacts.length,
        totalCompanies: accounts.length,
        totalUsers: users.length,
        totalDocuments: documents.length,
    }), [cases, tasks, emails, meetings, contacts, accounts, users, documents]);

    const recentCases = useMemo(() => [...cases].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()), [cases]);

    if (!user) return null;

    return (
        <div className="flex-1 space-y-6">
            <div className="flex flex-col md:flex-row items-start justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight font-headline">Dashboard</h2>
                    <p className="text-muted-foreground">Welcome back, {user.name}. Here's your overview.</p>
                </div>
            </div>

            <Separator />

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <KpiCard title="Active Cases" value={stats.activeCases} change="+2 this week" icon={Briefcase} onClick={() => router.push('/cases')} />
                <KpiCard title="Pending Tasks" value={stats.pendingTasks} change="+5 this week" icon={ListTodo} onClick={() => router.push('/tasks')} />
                <KpiCard title="Unread Emails" value={stats.unreadEmails} change="+12 today" icon={Mail} onClick={() => router.push('/emails')} />
                <KpiCard title="Upcoming Meetings" value={stats.upcomingMeetings} change="2 scheduled today" icon={Calendar} onClick={() => router.push('/meetings')} />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                 <KpiCard title="Total Contacts" value={stats.totalContacts} change="+10 this month" icon={Contact} onClick={() => router.push('/accounts?tab=contacts')} />
                 <KpiCard title="Total Companies" value={stats.totalCompanies} change="+3 this month" icon={Building} onClick={() => router.push('/accounts?tab=accounts')} />
                 <KpiCard title="Total Users" value={stats.totalUsers} change="+1 this month" icon={Users} onClick={() => router.push('/admin')} />
                 <KpiCard title="Total Documents" value={stats.totalDocuments} change="+25 this month" icon={FileText} onClick={() => router.push('/documents')} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3">
                    <RecentCases cases={recentCases} />
                </div>
                <div className="lg:col-span-2">
                    <RecentActivity />
                </div>
            </div>
        </div>
    );
}
