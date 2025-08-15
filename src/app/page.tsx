
"use client";

import { useAuth } from '@/context/auth-context';
import { useData } from '@/context/data-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BarChart, Briefcase, Users, CheckCircle, Clock, Mail, ListTodo, Calendar, Activity, AlertTriangle, UserCheck, MessageSquare, ChevronDown } from 'lucide-react';
import type { Case, Task, Meeting, Email } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import React, { useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

function getPriorityVariant(priority: 'High' | 'Medium' | 'Low') {
  switch (priority) {
    case 'High': return 'high';
    case 'Medium': return 'medium';
    case 'Low': return 'low';
    default: return 'default';
  }
}

function getStatusVariant(status: Case['status']) {
    switch (status) {
        case 'New': return 'blue';
        case 'In Progress': case 'Under Review': return 'teal';
        case 'Resolved': case 'Completed': case 'Closed': return 'green';
        case 'Declined': return 'destructive';
        default: return 'outline';
    }
}

export default function DashboardPage() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="flex-1 space-y-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight font-headline">Dashboard</h2>
      </div>
      {user.role === 'admin' ? <AdminDashboard /> : <StaffDashboard />}
    </div>
  );
}

function DashboardCard({ title, value, description, icon: Icon, onClick, isOpen, detailContent, ctaLink, ctaText }: { title: string, value: string | number, description: string, icon: React.ElementType, onClick?: () => void, isOpen: boolean, detailContent: React.ReactNode, ctaLink: string, ctaText: string }) {
    const router = useRouter();
    return (
       <Collapsible open={isOpen} onOpenChange={onClick}>
          <CollapsibleTrigger asChild>
                <Card className="hover:bg-muted/50 cursor-pointer transition-colors rounded-b-none">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{title}</CardTitle>
                        <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4 text-muted-foreground" />
                            <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{value}</div>
                        <p className="text-xs text-muted-foreground">{description}</p>
                    </CardContent>
                </Card>
          </CollapsibleTrigger>
          <CollapsibleContent className="bg-muted/30 rounded-b-lg border border-t-0 p-4 animate-in fade-in-0 zoom-in-95">
                {detailContent}
                <Button variant="outline" size="sm" className="w-full mt-4" onClick={() => router.push(ctaLink)}>{ctaText}</Button>
          </CollapsibleContent>
      </Collapsible>
    );
}

function DashboardDetailList({ items, itemType }: { items: any[], itemType: 'case' | 'task' | 'meeting' | 'email' }) {
    const router = useRouter();
    
    if (items.length === 0) {
        return <p className="text-sm text-muted-foreground text-center py-4">No items to display.</p>;
    }

    return (
        <div className="space-y-2">
            {items.slice(0, 5).map(item => (
                <div key={item.id} className="flex items-center justify-between p-2 rounded-md hover:bg-background/50">
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.title || item.subject}</p>
                        <p className="text-xs text-muted-foreground">{format(parseISO(item.date || item.createdAt || item.dueDate), 'PP')}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => router.push(`/${itemType}s`)}>View</Button>
                </div>
            ))}
        </div>
    );
}


function AdminDashboard() {
    const { cases, tasks, users, meetings, emails } = useData();
    const router = useRouter();
    const [openPanel, setOpenPanel] = useState<string | null>(null);

    const openCases = cases.filter(c => ['New', 'In Progress', 'Under Review', 'Investigated'].includes(c.status));
    const activeTasks = tasks.filter(t => ['To Do', 'In Progress'].includes(t.status));
    const unreadEmails = emails.filter(e => e.type === 'inbox' && !e.read);
    const upcomingMeetings = meetings.filter(m => m.status === 'Upcoming');

    const recentActivities = [
        ...cases.map(c => ({ type: 'Case', ...c })),
        ...tasks.map(t => ({ type: 'Task', ...t })),
        ...meetings.map(m => ({ type: 'Meeting', ...m })),
    ]
    .sort((a, b) => new Date(b.createdAt || b.date || b.dueDate).getTime() - new Date(a.createdAt || a.date || a.dueDate).getTime())
    .slice(0, 5);
    
    const handlePanelToggle = (panel: string) => {
        setOpenPanel(prev => (prev === panel ? null : panel));
    };


    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <DashboardCard 
                    title="Open Cases" 
                    value={openCases.length} 
                    description="Active and pending cases" 
                    icon={Briefcase} 
                    onClick={() => handlePanelToggle('cases')}
                    isOpen={openPanel === 'cases'}
                    detailContent={<DashboardDetailList items={openCases} itemType="case" />}
                    ctaLink="/cases"
                    ctaText="View All Cases"
                />
                <DashboardCard 
                    title="Active Tasks" 
                    value={activeTasks.length} 
                    description="To-do and in-progress" 
                    icon={ListTodo} 
                    onClick={() => handlePanelToggle('tasks')}
                    isOpen={openPanel === 'tasks'}
                    detailContent={<DashboardDetailList items={activeTasks} itemType="task" />}
                    ctaLink="/tasks"
                    ctaText="View All Tasks"
                />
                <DashboardCard 
                    title="Unread Emails" 
                    value={unreadEmails.length} 
                    description="Awaiting response" 
                    icon={Mail} 
                    onClick={() => handlePanelToggle('emails')}
                    isOpen={openPanel === 'emails'}
                    detailContent={<DashboardDetailList items={unreadEmails} itemType="email" />}
                    ctaLink="/emails"
                    ctaText="View All Emails"
                />
                <DashboardCard 
                    title="Upcoming Meetings" 
                    value={upcomingMeetings.length} 
                    description="Scheduled meetings" 
                    icon={Calendar} 
                    onClick={() => handlePanelToggle('meetings')}
                    isOpen={openPanel === 'meetings'}
                    detailContent={<DashboardDetailList items={upcomingMeetings} itemType="meeting" />}
                    ctaLink="/meetings"
                    ctaText="View All Meetings"
                />
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                 <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Recent Activity Stream</CardTitle>
                        <CardDescription>An overview of the latest activities in the system.</CardDescription>
                    </CardHeader>
                    <CardContent>
                       <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Details</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {recentActivities.map((activity: any) => (
                                    <TableRow key={`${activity.type}-${activity.id}`}>
                                        <TableCell><Badge variant="outline">{activity.type}</Badge></TableCell>
                                        <TableCell className="font-medium">{activity.subject || activity.title}</TableCell>
                                        <TableCell className="text-sm text-muted-foreground">{format(parseISO(activity.createdAt || activity.date || activity.dueDate), 'PP')}</TableCell>
                                        <TableCell className="text-right"><Button variant="ghost" size="sm" onClick={() => router.push(`/${activity.type.toLowerCase()}s`)}>View</Button></TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>KPI Summary</CardTitle>
                        <CardDescription>Key performance indicators.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Avg. Resolution Time</p>
                                <p className="text-xl font-bold">2.1 days</p>
                            </div>
                            <Clock className="h-6 w-6 text-muted-foreground" />
                        </div>
                         <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Cases Closed (Month)</p>
                                <p className="text-xl font-bold">{cases.filter(c => c.status === 'Closed' && new Date(c.createdAt).getMonth() === new Date().getMonth()).length}</p>
                            </div>
                            <CheckCircle className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                                <p className="text-xl font-bold">{users.filter(u => u.status === 'Active').length}</p>
                            </div>
                            <UserCheck className="h-6 w-6 text-muted-foreground" />
                        </div>
                         <Button className="w-full mt-2" variant="outline" onClick={() => router.push('/reports')}>
                            <BarChart className="mr-2 h-4 w-4"/> View Full Report
                         </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function StaffDashboard() {
  const { user } = useAuth();
  const { cases, tasks, meetings } = useData();
  const [openPanel, setOpenPanel] = useState<string | null>(null);

  if (!user) return null;

  const myOpenCases = cases.filter(c => c.assignedTo === user.name && ['New', 'In Progress', 'Under Review', 'Investigated'].includes(c.status));
  const myActiveTasks = tasks.filter(t => t.assignedTo === user.id && ['To Do', 'In Progress'].includes(t.status));
  const myUpcomingMeetings = meetings.filter(m => m.participants.includes(user.id) && m.status === 'Upcoming');
  const myHighPriorityCases = myOpenCases.filter(c => c.priority === 'High');
  const myAssignedInvestigations = cases.filter(c => c.assignedTo === user.name && c.status === 'Investigated');
  
  const handlePanelToggle = (panel: string) => {
    setOpenPanel(prev => (prev === panel ? null : panel));
  };


  return (
    <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
             <DashboardCard 
                title="My Open Cases" 
                value={myOpenCases.length} 
                description={`${myHighPriorityCases.length} high priority`} 
                icon={Briefcase} 
                onClick={() => handlePanelToggle('cases')}
                isOpen={openPanel === 'cases'}
                detailContent={<DashboardDetailList items={myOpenCases} itemType="case" />}
                ctaLink="/cases"
                ctaText="View My Cases"
            />
            <DashboardCard 
                title="My Active Tasks" 
                value={myActiveTasks.length} 
                description="Tasks requiring action" 
                icon={ListTodo} 
                onClick={() => handlePanelToggle('tasks')}
                isOpen={openPanel === 'tasks'}
                detailContent={<DashboardDetailList items={myActiveTasks} itemType="task" />}
                ctaLink="/tasks"
                ctaText="View My Tasks"
            />
            <DashboardCard 
                title="My Upcoming Meetings" 
                value={myUpcomingMeetings.length} 
                description="Scheduled meetings" 
                icon={Calendar} 
                onClick={() => handlePanelToggle('meetings')}
                isOpen={openPanel === 'meetings'}
                detailContent={<DashboardDetailList items={myUpcomingMeetings} itemType="meeting" />}
                ctaLink="/meetings"
                ctaText="View My Meetings"
            />
            <DashboardCard 
                title="Assigned Investigations" 
                value={myAssignedInvestigations.length} 
                description="Cases needing resolution" 
                icon={AlertTriangle} 
                onClick={() => handlePanelToggle('investigations')}
                isOpen={openPanel === 'investigations'}
                detailContent={<DashboardDetailList items={myAssignedInvestigations} itemType="case" />}
                ctaLink="/cases"
                ctaText="View My Investigations"
            />
        </div>
        <Card>
            <CardHeader>
                <CardTitle>My High-Priority Cases</CardTitle>
                <CardDescription>These cases require your immediate attention.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Subject</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Priority</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {myHighPriorityCases.map((caseItem: Case) => (
                            <TableRow key={caseItem.id} className="cursor-pointer">
                                <TableCell className="font-medium">{caseItem.subject}</TableCell>
                                <TableCell>{caseItem.customer}</TableCell>
                                <TableCell>
                                    <Badge variant={getStatusVariant(caseItem.status)}>{caseItem.status}</Badge>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={getPriorityVariant(caseItem.priority)}>
                                    {caseItem.priority}
                                    </Badge>
                                </TableCell>
                            </TableRow>
                        ))}
                         {myHighPriorityCases.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center text-muted-foreground">
                                    No high-priority cases assigned.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    </div>
  )
}
