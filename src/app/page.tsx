
"use client";

import { useAuth } from '@/context/auth-context';
import { useData } from '@/context/data-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BarChart, Briefcase, Users, CheckCircle, Clock, Mail, ListTodo, Calendar, Activity, AlertTriangle, UserCheck, MessageSquare } from 'lucide-react';
import type { Case, Task, Meeting, Email } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';

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

function DashboardCard({ title, value, description, icon: Icon, onClick }: { title: string, value: string | number, description: string, icon: React.ElementType, onClick?: () => void }) {
    return (
        <Card onClick={onClick} className="hover:bg-muted/50 cursor-pointer transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                <p className="text-xs text-muted-foreground">{description}</p>
            </CardContent>
        </Card>
    );
}

function AdminDashboard() {
    const { cases, tasks, users, meetings, emails } = useData();
    const router = useRouter();

    const openCasesCount = cases.filter(c => ['New', 'In Progress', 'Under Review', 'Investigated'].includes(c.status)).length;
    const activeTasksCount = tasks.filter(t => ['To Do', 'In Progress'].includes(t.status)).length;
    const unreadEmailsCount = emails.filter(e => e.type === 'inbox' && !e.read).length;
    const upcomingMeetingsCount = meetings.filter(m => m.status === 'Upcoming').length;
    const casesClosedThisMonth = cases.filter(c => c.status === 'Closed' && new Date(c.createdAt).getMonth() === new Date().getMonth()).length;

    const recentActivities = [
        ...cases.map(c => ({ type: 'Case', ...c })),
        ...tasks.map(t => ({ type: 'Task', ...t })),
        ...meetings.map(m => ({ type: 'Meeting', ...m })),
    ]
    .sort((a, b) => new Date(b.createdAt || b.date || b.dueDate).getTime() - new Date(a.createdAt || a.date || a.dueDate).getTime())
    .slice(0, 5);


    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <DashboardCard title="Open Cases" value={openCasesCount} description="Active and pending cases" icon={Briefcase} onClick={() => router.push('/cases')} />
                <DashboardCard title="Active Tasks" value={activeTasksCount} description="To-do and in-progress" icon={ListTodo} onClick={() => router.push('/tasks')} />
                <DashboardCard title="Unread Emails" value={unreadEmailsCount} description="Awaiting response" icon={Mail} onClick={() => router.push('/emails')} />
                <DashboardCard title="Upcoming Meetings" value={upcomingMeetingsCount} description="Scheduled meetings" icon={Calendar} onClick={() => router.push('/meetings')} />
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
                                <p className="text-xl font-bold">{casesClosedThisMonth}</p>
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
  const { cases, tasks, meetings, emails } = useData();
  const router = useRouter();

  if (!user) return null;

  const myOpenCases = cases.filter(c => c.assignedTo === user.name && ['New', 'In Progress', 'Under Review', 'Investigated'].includes(c.status));
  const myActiveTasks = tasks.filter(t => t.assignedTo === user.id && ['To Do', 'In Progress'].includes(t.status));
  const myUpcomingMeetings = meetings.filter(m => m.participants.includes(user.id) && m.status === 'Upcoming');
  const myHighPriorityCases = myOpenCases.filter(c => c.priority === 'High');

  return (
    <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <DashboardCard title="My Open Cases" value={myOpenCases.length} description={`${myHighPriorityCases.length} high priority`} icon={Briefcase} onClick={() => router.push('/cases')} />
            <DashboardCard title="My Active Tasks" value={myActiveTasks.length} description="Tasks requiring action" icon={ListTodo} onClick={() => router.push('/tasks')} />
            <DashboardCard title="My Upcoming Meetings" value={myUpcomingMeetings.length} description="Scheduled meetings" icon={Calendar} onClick={() => router.push('/meetings')} />
            <DashboardCard title="Assigned Investigations" value={cases.filter(c => c.assignedTo === user.name && c.status === 'Investigated').length} description="Cases needing resolution" icon={AlertTriangle} onClick={() => router.push('/cases')} />
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
                            <TableRow key={caseItem.id} onClick={() => router.push('/cases')} className="cursor-pointer">
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
