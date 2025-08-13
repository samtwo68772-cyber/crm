
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
import { Download, Calendar as CalendarIcon, Users, Briefcase, ListTodo, CheckCircle, BarChart2, PieChart as PieIcon, LineChart as LineIcon, Settings2, Bell } from 'lucide-react';
import type { DateRange } from "react-day-picker";
import { isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function ReportsPage() {
    const { user } = useAuth();
    if (!user) return <p>Loading...</p>;

    return (
        <div className="flex-1 space-y-6 pt-6">
            <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight font-headline">Reports</h1>
                    <p className="text-muted-foreground">Analyze performance and trends across the system.</p>
                </div>
            </header>
            
            <main>
                {user.role === 'admin' ? <AdminReportsView /> : <StaffReportsView user={user} />}
            </main>
        </div>
    );
}

function StaffReportsView({ user }: { user: User }) {
    const userCases = useMemo(() => mockCases.filter(c => c.assignedTo === user.name), [user.name]);
    const userTasks = useMemo(() => mockTasks.filter(t => t.assignedTo === user.id), [user.id]);
    const userMeetings = useMemo(() => mockMeetings.filter(m => m.participants.includes(user.id)), [user.id]);

    const summaryStats = {
        totalCases: userCases.length,
        completedTasks: userTasks.filter(t => t.status === 'Done').length,
        upcomingMeetings: userMeetings.filter(m => m.status === 'Upcoming').length,
    };
    
    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
                <StatCard title="My Open Cases" value={summaryStats.totalCases} icon={<Briefcase />} />
                <StatCard title="My Completed Tasks" value={summaryStats.completedTasks} icon={<CheckCircle />} />
                <StatCard title="My Upcoming Meetings" value={summaryStats.upcomingMeetings} icon={<CalendarIcon />} />
            </div>
            
            <Tabs defaultValue="cases">
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

function AdminReportsView() {
    const [dateRange, setDateRange] = useState<DateRange | undefined>();
    const [selectedStaff, setSelectedStaff] = useState('all');
    const [reportType, setReportType] = useState('cases');

    const filteredData = useMemo(() => {
        let data: (Case | Task | Meeting)[] = [];
        if (reportType === 'cases') data = mockCases;
        else if (reportType === 'tasks') data = mockTasks;
        else if (reportType === 'meetings') data = mockMeetings;

        if (selectedStaff !== 'all') {
            if (reportType === 'cases') {
                const staffUser = mockUsers.find(u => u.id === selectedStaff);
                data = (data as Case[]).filter(item => item.assignedTo === staffUser?.name);
            } else if (reportType === 'tasks') {
                data = (data as Task[]).filter(item => item.assignedTo === selectedStaff);
            } else if (reportType === 'meetings') {
                data = (data as Meeting[]).filter(item => item.participants.includes(selectedStaff));
            }
        }
        
        if (dateRange?.from) {
             data = data.filter(item => {
                const itemDate = new Date('createdAt' in item ? item.createdAt : item.date);
                return isWithinInterval(itemDate, { start: startOfDay(dateRange.from!), end: endOfDay(dateRange.to || dateRange.from!) });
            });
        }
        
        return data;
    }, [dateRange, selectedStaff, reportType]);
    
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Organization-Wide Reports</CardTitle>
                    <CardDescription>Use the filters to generate reports for the entire organization.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col md:flex-row items-center gap-4">
                    <DateRangePicker onDateChange={setDateRange} />
                    <Select value={selectedStaff} onValueChange={setSelectedStaff}>
                        <SelectTrigger className="w-full md:w-[200px]"><SelectValue placeholder="Select Staff" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Staff</SelectItem>
                            {mockUsers.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Select value={reportType} onValueChange={setReportType}>
                         <SelectTrigger className="w-full md:w-[200px]"><SelectValue placeholder="Report Type" /></SelectTrigger>
                         <SelectContent>
                            <SelectItem value="cases">Cases</SelectItem>
                            <SelectItem value="tasks">Tasks</SelectItem>
                            <SelectItem value="meetings">Meetings</SelectItem>
                         </SelectContent>
                    </Select>
                    <div className="flex-grow" />
                    <div className="flex items-center gap-2">
                         <ScheduleReportDialog />
                         <Button variant="outline"><Download className="mr-2" /> Export</Button>
                    </div>
                </CardContent>
            </Card>

            <Tabs defaultValue="chart">
                <div className="flex items-center justify-between">
                    <TabsList>
                        <TabsTrigger value="chart">Chart View</TabsTrigger>
                        <TabsTrigger value="table">Table View</TabsTrigger>
                    </TabsList>
                </div>
                <TabsContent value="chart" className="mt-4">
                    {reportType === 'cases' && <CaseReportChart data={filteredData as Case[]} />}
                    {reportType === 'tasks' && <TaskReportChart data={filteredData as Task[]} />}
                    {reportType === 'meetings' && <p className="text-center text-muted-foreground p-8">Meeting charts coming soon.</p>}
                </TabsContent>
                 <TabsContent value="table" className="mt-4">
                    {reportType === 'cases' && <CaseReportTable data={filteredData as Case[]} />}
                    {reportType === 'tasks' && <TaskReportTable data={filteredData as Task[]} />}
                    {reportType === 'meetings' && <p className="text-center text-muted-foreground p-8">Meeting tables coming soon.</p>}
                </TabsContent>
            </Tabs>

        </div>
    );
}


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
        <div className="grid md:grid-cols-2 gap-6">
            <Card>
                <CardHeader><CardTitle>Cases by Status</CardTitle></CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={dataByStatus}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="value" fill="#8884d8" />
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
         <Card>
            <CardHeader><CardTitle>Tasks by Status</CardTitle></CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={dataByStatus}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="value" fill="#82ca9d" />
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
                <Button variant="outline"><Bell className="mr-2" /> Schedule</Button>
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


    