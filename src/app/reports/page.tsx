
"use client";

import React, { useState, useMemo } from 'react';
import { useAuth } from '@/context/auth-context';
import { cases as mockCases, tasks as mockTasks, meetings as mockMeetings, users as mockUsers } from '@/lib/data.tsx';
import type { Case, Task, Meeting, User } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, LineChart, PieChart, Bar, Line, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { Download, Calendar as CalendarIcon, Users, Briefcase, ListTodo, CheckCircle, BarChart2, PieChart as PieIcon, LineChart as LineIcon, Settings2, Bell, Clock, Percent, Award, Users2, FileDown } from 'lucide-react';
import type { DateRange } from "react-day-picker";
import { isWithinInterval, startOfDay, endOfDay, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { MultiSelect, OptionType } from '@/components/ui/multi-select';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#dd84d8'];

export default function ReportsPage() {
    const { user } = useAuth();
    if (!user) return <p>Loading...</p>;

    return (
        <div className="flex-1 space-y-6 pt-2">
            <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight font-headline">Analytics Dashboard</h1>
                    <p className="text-muted-foreground">Analyze performance and trends across the system.</p>
                </div>
            </header>
            
            <main>
                {user.role === 'admin' ? <AdminReportsView /> : <StaffReportsView user={user} />}
            </main>
        </div>
    );
}

// #region Staff View
function StaffReportsView({ user }: { user: User }) {
    const userCases = useMemo(() => mockCases.filter(c => c.assignedTo === user.name), [user.name]);
    const userTasks = useMemo(() => mockTasks.filter(t => t.assignedTo === user.id), [user.id]);
    const userMeetings = useMemo(() => mockMeetings.filter(m => m.participants.includes(user.id)), [user.id]);
    
    const now = new Date();
    const meetingsThisWeek = userMeetings.filter(m => isWithinInterval(new Date(m.date), { start: startOfWeek(now), end: endOfWeek(now) })).length;
    const completionRate = userTasks.length > 0 ? (userTasks.filter(t => t.status === 'Done').length / userTasks.length) * 100 : 0;

    const summaryStats = [
        { title: "My Open Cases", value: userCases.filter(c => c.status !== 'Closed').length, icon: Briefcase },
        { title: "Completed Tasks", value: userTasks.filter(t => t.status === 'Done').length, icon: CheckCircle },
        { title: "Meetings This Week", value: meetingsThisWeek, icon: CalendarIcon },
        { title: "Task Completion Rate", value: `${completionRate.toFixed(0)}%`, icon: Percent },
    ];
    
    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {summaryStats.map(stat => <StatCard key={stat.title} title={stat.title} value={stat.value} icon={React.createElement(stat.icon)} />)}
            </div>
            
            <Tabs defaultValue="cases" className="mt-6">
                <TabsList>
                    <TabsTrigger value="cases">Case Reports</TabsTrigger>
                    <TabsTrigger value="tasks">Task Reports</TabsTrigger>
                </TabsList>
                <TabsContent value="cases" className="mt-4">
                    <CaseReportChart data={userCases} />
                </TabsContent>
                <TabsContent value="tasks" className="mt-4">
                    <TaskReportChart data={userTasks} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
// #endregion

// #region Admin View
function AdminReportsView() {
    const [dateRange, setDateRange] = useState<DateRange | undefined>({ from: subDays(new Date(), 30), to: new Date() });
    const [selectedStaff, setSelectedStaff] = useState<string[]>([]);
    
    const staffOptions: OptionType[] = useMemo(() => mockUsers.map(u => ({ value: u.id, label: u.name })), []);

    const filteredCases = useMemo(() => {
        return mockCases.filter(c => {
            const inDate = !dateRange?.from || isWithinInterval(new Date(c.createdAt), { start: startOfDay(dateRange.from), end: endOfDay(dateRange.to || dateRange.from) });
            const inStaff = selectedStaff.length === 0 || selectedStaff.includes(mockUsers.find(u => u.name === c.assignedTo)?.id || '');
            return inDate && inStaff;
        });
    }, [dateRange, selectedStaff]);

    const filteredTasks = useMemo(() => {
        return mockTasks.filter(t => {
            const inDate = !dateRange?.from || isWithinInterval(new Date(t.dueDate), { start: startOfDay(dateRange.from), end: endOfDay(dateRange.to || dateRange.from) });
            const inStaff = selectedStaff.length === 0 || (t.assignedTo && selectedStaff.includes(t.assignedTo));
            return inDate && inStaff;
        });
    }, [dateRange, selectedStaff]);
    
    const kpiData = useMemo(() => {
        const totalOpen = filteredCases.filter(c => c.status !== 'Closed').length;
        const totalCompleted = filteredTasks.filter(t => t.status === 'Done').length;
        const meetingsThisMonth = mockMeetings.filter(m => isWithinInterval(new Date(m.date), { start: startOfMonth(new Date()), end: endOfMonth(new Date()) })).length;
        return { totalOpen, totalCompleted, meetingsThisMonth };
    }, [filteredCases, filteredTasks]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3 space-y-6">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <StatCard title="Total Open Cases" value={kpiData.totalOpen} icon={<Briefcase />} />
                    <StatCard title="Avg. Resolution Time" value="2.1d" icon={<Clock />} />
                    <StatCard title="Total Completed Tasks" value={kpiData.totalCompleted} icon={<CheckCircle />} />
                    <StatCard title="Meetings This Month" value={mockMeetings.filter(m => isWithinInterval(new Date(m.date), { start: startOfMonth(new Date()), end: endOfMonth(new Date()) })).length} icon={<CalendarIcon />} />
                </div>
                
                <Tabs defaultValue="cases" className="mt-6">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <TabsList>
                            <TabsTrigger value="cases">Cases</TabsTrigger>
                            <TabsTrigger value="tasks">Tasks</TabsTrigger>
                            <TabsTrigger value="performance">Staff Performance</TabsTrigger>
                        </TabsList>
                        <div className="flex items-center gap-2">
                            <ScheduleReportDialog />
                            <Button variant="outline"><FileDown className="mr-2 h-4 w-4" /> Export PDF</Button>
                        </div>
                    </div>
                    <TabsContent value="cases" className="mt-4">
                        <CaseReportChart data={filteredCases} />
                        <CaseReportTable data={filteredCases} />
                    </TabsContent>
                    <TabsContent value="tasks" className="mt-4">
                        <TaskReportChart data={filteredTasks} />
                        <TaskReportTable data={filteredTasks} />
                    </TabsContent>
                     <TabsContent value="performance" className="mt-4">
                        <StaffPerformanceChart />
                    </TabsContent>
                </Tabs>
            </div>
            
            <aside className="lg:col-span-1 lg:sticky top-24 h-fit">
                <Card>
                    <CardHeader>
                        <CardTitle>Report Filters</CardTitle>
                        <CardDescription>Refine the data shown in the dashboard.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label>Date Range</Label>
                            <DateRangePicker onDateChange={setDateRange} />
                        </div>
                        <div>
                            <Label>Staff Member(s)</Label>
                            <MultiSelect 
                                options={staffOptions} 
                                selected={selectedStaff} 
                                onChange={setSelectedStaff}
                                placeholder="All Staff"
                            />
                        </div>
                    </CardContent>
                </Card>
            </aside>
        </div>
    );
}

// #endregion

// #region Shared Components

function StatCard({ title, value, icon }: { title: string; value: string | number; icon: React.ReactNode }) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <div className="text-muted-foreground">{icon}</div>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
            </CardContent>
        </Card>
    );
}

function CaseReportChart({ data }: { data: Case[] }) {
    const dataByStatus = useMemo(() => {
        const counts = data.reduce((acc, curr) => {
            acc[curr.status] = (acc[curr.status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [data]);

    const dataByPriority = useMemo(() => {
        const counts = data.reduce((acc, curr) => {
            acc[curr.priority] = (acc[curr.priority] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [data]);

    return (
        <div className="grid md:grid-cols-2 gap-6 mb-6">
            <Card>
                <CardHeader><CardTitle>Cases by Status</CardTitle></CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={dataByStatus}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip />
                            <Bar dataKey="value" fill="var(--color-cases)" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle>Cases by Priority</CardTitle></CardHeader>
                <CardContent>
                     <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie data={dataByPriority} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                                {dataByPriority.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    )
}

function TaskReportChart({ data }: { data: Task[] }) {
     const dataByStatus = useMemo(() => {
        const counts = data.reduce((acc, curr) => {
            acc[curr.status] = (acc[curr.status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [data]);
    
    return (
         <Card className="mb-6">
            <CardHeader><CardTitle>Tasks by Status</CardTitle></CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={dataByStatus}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false}/>
                        <YAxis fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip />
                        <Bar dataKey="value" fill="var(--color-tasks)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}

function StaffPerformanceChart() {
    const performanceData = useMemo(() => {
        return mockUsers.map(user => {
            const cases = mockCases.filter(c => c.assignedTo === user.name);
            const tasks = mockTasks.filter(t => t.assignedTo === user.id);
            return {
                name: user.name,
                resolvedCases: cases.filter(c => c.status === 'Resolved' || c.status === 'Closed').length,
                completedTasks: tasks.filter(t => t.status === 'Done').length
            }
        });
    }, []);

    return (
        <Card className="mb-6">
            <CardHeader><CardTitle>Performance Snapshot</CardTitle></CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={performanceData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="resolvedCases" name="Resolved Cases" fill="var(--color-cases)" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="completedTasks" name="Completed Tasks" fill="var(--color-tasks)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}

function CaseReportTable({ data }: { data: Case[] }) {
    return (
        <Card>
            <CardHeader><CardTitle>Detailed Case Report</CardTitle></CardHeader>
            <CardContent>
                <Table>
                    <TableHeader><TableRow><TableHead>Case ID</TableHead><TableHead>Subject</TableHead><TableHead>Status</TableHead><TableHead>Priority</TableHead><TableHead>Assigned To</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {data.map(c => <TableRow key={c.id}><TableCell>{c.id}</TableCell><TableCell>{c.subject}</TableCell><TableCell>{c.status}</TableCell><TableCell>{c.priority}</TableCell><TableCell>{c.assignedTo}</TableCell></TableRow>)}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}

function TaskReportTable({ data }: { data: Task[] }) {
    return (
        <Card>
            <CardHeader><CardTitle>Detailed Task Report</CardTitle></CardHeader>
            <CardContent>
                <Table>
                    <TableHeader><TableRow><TableHead>Task ID</TableHead><TableHead>Title</TableHead><TableHead>Status</TableHead><TableHead>Priority</TableHead><TableHead>Due Date</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {data.map(t => <TableRow key={t.id}><TableCell>{t.id}</TableCell><TableCell>{t.title}</TableCell><TableCell>{t.status}</TableCell><TableCell>{t.priority}</TableCell><TableCell>{t.dueDate}</TableCell></TableRow>)}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}

function ScheduleReportDialog() {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline"><Bell className="mr-2 h-4 w-4" /> Schedule</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Schedule Automated Report</DialogTitle>
                    <DialogDescription>Configure automated delivery of this report.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="frequency" className="text-right">Frequency</Label>
                        <Select defaultValue="weekly">
                            <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="daily">Daily</SelectItem>
                                <SelectItem value="weekly">Weekly</SelectItem>
                                <SelectItem value="monthly">Monthly</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="recipients" className="text-right">Recipients</Label>
                        <Select>
                             <SelectTrigger className="col-span-3"><SelectValue placeholder="Select recipients..." /></SelectTrigger>
                             <SelectContent>
                                {mockUsers.filter(u => u.role === 'admin').map(u => <SelectItem key={u.id} value={u.email}>{u.name}</SelectItem>)}
                             </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                    <Button>Save Schedule</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// #endregion
        
<style jsx>{`
    :root {
        --color-cases: hsl(var(--chart-1));
        --color-tasks: hsl(var(--chart-2));
    }
`}</style>
    