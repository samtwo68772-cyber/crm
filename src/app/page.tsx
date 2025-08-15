
"use client";

import { useAuth } from '@/context/auth-context';
import { useData } from '@/context/data-context';
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
} from 'lucide-react';
import type { Case, Task, Meeting, Email } from '@/lib/types';
import { format, parseISO, formatDistanceToNow, subDays, isAfter } from 'date-fns';
import React, { useMemo, useState } from 'react';
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

function KpiCard({ title, value, change, icon: Icon, onClick }: { title: string, value: string | number, change: string, icon: React.ElementType, onClick?: () => void }) {
    const cardProps = onClick ? { onClick, className: "cursor-pointer hover:shadow-lg transition-shadow duration-200" } : {};
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

function RecentCases() {
    const router = useRouter();
    const { cases, users } = useData();
    const [isExpanded, setIsExpanded] = useState(false);

    const recentCases = useMemo(() => {
        const twoWeeksAgo = subDays(new Date(), 14);
        return cases
            .filter(c => isAfter(parseISO(c.createdAt), twoWeeksAgo))
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [cases]);

    const visibleCases = isExpanded ? recentCases : recentCases.slice(0, 5);

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Recent Cases</CardTitle>
                    <CardDescription>Cases updated in the last 14 days.</CardDescription>
                </div>
                 <Button variant="outline" size="sm" onClick={() => router.push('/cases')}>View All</Button>
            </CardHeader>
            <CardContent>
                {visibleCases.length > 0 ? (
                    <div className="space-y-4">
                        {visibleCases.map(caseItem => (
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
                ) : (
                     <p className="text-center text-muted-foreground py-8">No recent cases</p>
                )}
            </CardContent>
             {recentCases.length > 5 && (
                <CardFooter className="justify-center">
                    <Button variant="link" onClick={() => setIsExpanded(!isExpanded)}>
                        {isExpanded ? 'Show less' : 'Show more...'}
                    </Button>
                </CardFooter>
            )}
        </Card>
    );
}

function RecentActivity() {
    const { users, cases, tasks, meetings } = useData();
    const router = useRouter();
    const [isExpanded, setIsExpanded] = useState(false);

    const activities = useMemo(() => {
        const twoWeeksAgo = subDays(new Date(), 14);

        const caseActivities = cases
            .filter(c => isAfter(parseISO(c.createdAt), twoWeeksAgo))
            .map(c => ({
                id: `case-${c.id}`,
                type: 'case',
                description: `New case created: "${c.subject}"`,
                timestamp: c.createdAt,
                user: users.find(u => u.name === c.assignedTo) || { name: c.assignedTo }
            }));

        const taskActivities = tasks
            .filter(t => isAfter(new Date(t.dueDate), twoWeeksAgo))
            .map(t => ({
                id: `task-${t.id}`,
                type: 'task',
                description: `${t.status === 'Done' ? 'Task completed' : 'New task'}: "${t.title}"`,
                timestamp: t.dueDate, 
                user: users.find(u => u.id === t.assignedTo)
            }));

        const meetingActivities = meetings
            .filter(m => isAfter(new Date(m.date), twoWeeksAgo))
            .map(m => ({
                id: `meeting-${m.id}`,
                type: 'meeting',
                description: `${m.status === 'Upcoming' ? 'Meeting scheduled' : 'Meeting'}: "${m.title}"`,
                timestamp: m.date,
                user: users.find(u => m.participants.includes(u.id))
            }));

        return [...caseActivities, ...taskActivities, ...meetingActivities]
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    }, [cases, tasks, meetings, users]);
    
    const visibleActivities = isExpanded ? activities : activities.slice(0, 5);


    const getActivityDot = (type: string) => {
        switch (type) {
            case 'case': return <div className="h-2 w-2 rounded-full bg-blue-500" />;
            case 'task': return <div className="h-2 w-2 rounded-full bg-green-500" />;
            case 'meeting': return <div className="h-2 w-2 rounded-full bg-purple-500" />;
            case 'email': return <div className="h-2 w-2 rounded-full bg-orange-500" />;
            default: return <div className="h-2 w-2 rounded-full bg-gray-400" />;
        }
    };
    

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>Latest system activities from the last 14 days.</CardDescription>
                </div>
                 <Button variant="outline" size="sm" onClick={() => router.push('/settings?tab=audit')}>View All</Button>
            </CardHeader>
            <CardContent>
                {visibleActivities.length > 0 ? (
                    <div className="space-y-6">
                         {visibleActivities.map(activity => (
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
             {activities.length > 5 && (
                <CardFooter className="justify-center">
                    <Button variant="link" onClick={() => setIsExpanded(!isExpanded)}>
                        {isExpanded ? 'Show less' : 'Show more...'}
                    </Button>
                </CardFooter>
            )}
        </Card>
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

    if (!user) return null;

    return (
        <div className="flex-1 space-y-6">
            <div className="flex flex-col md:flex-row items-start justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight font-headline">Dashboard</h2>
                    <p className="text-muted-foreground">Welcome back, {user.name}. Here's your overview.</p>
                </div>
                 <div className="flex items-center gap-2">
                    <Button onClick={() => router.push('/cases')}><PlusCircle /> New Case</Button>
                    <Button variant="outline" onClick={() => router.push('/tasks')}><PlusCircle /> New Task</Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <KpiCard title="Active Cases" value={stats.activeCases} change="+2 this week" icon={Briefcase} onClick={() => router.push('/cases?status=active')} />
                <KpiCard title="Pending Tasks" value={stats.pendingTasks} change="+5 this week" icon={ListTodo} onClick={() => router.push('/tasks?status=pending')} />
                <KpiCard title="Unread Emails" value={stats.unreadEmails} change="+12 today" icon={Mail} onClick={() => router.push('/emails?filter=unread')} />
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
                    <RecentCases />
                </div>
                <div className="lg:col-span-2">
                    <RecentActivity />
                </div>
            </div>
        </div>
    );
}
