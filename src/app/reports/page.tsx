
"use client";

import React, { useState, useMemo } from 'react';
import { useAuth } from '@/context/auth-context';
import { useData } from '@/context/data-context';
import type { Case, Task, Meeting, User } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, LineChart, PieChart, Bar, Line, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, AreaChart, Area } from 'recharts';
import { Download, Calendar as CalendarIcon, Users, Briefcase, ListTodo, CheckCircle, BarChart2, PieChart as PieIcon, LineChart as LineIcon, Settings2, Bell, Clock, Percent, Award, Users2, FileDown, ArrowUpRight, ArrowDownRight, UserCheck } from 'lucide-react';
import type { DateRange } from "react-day-picker";
import { isWithinInterval, startOfDay, endOfDay, subDays, format, eachDayOfInterval, startOfWeek, endOfWeek } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';


const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

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
        case 'In Progress': return 'teal';
        case 'Resolved': return 'green';
        case 'Closed': return 'destructive';
        default: return 'outline';
    }
}

function KpiCard({ title, value, change, changeType, icon: Icon }: { title: string; value: string; change: string; changeType: 'positive' | 'negative'; icon: React.ElementType }) {
    const isPositive = changeType === 'positive';
    return (
        <Card className="shadow-sm hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
                <Icon className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                <div className="flex items-center text-xs text-muted-foreground">
                    <span className={`flex items-center gap-1 font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                        {isPositive ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                        {change}
                    </span>
                    <MiniSparkline data={[{value: 10}, {value: 15}, {value: 8}, {value: 20}, {value: 18}]} positive={isPositive} />
                </div>
            </CardContent>
        </Card>
    );
}

const MiniSparkline = ({data, positive}: {data: any[], positive: boolean}) => (
    <div className="w-20 h-8 ml-auto">
        <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                <defs>
                    <linearGradient id={positive ? "positiveGradient" : "negativeGradient"} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={positive ? "#10b981" : "#ef4444"} stopOpacity={0.4}/>
                    <stop offset="95%" stopColor={positive ? "#10b981" : "#ef4444"} stopOpacity={0}/>
                    </linearGradient>
                </defs>
                <Area type="monotone" dataKey="value" stroke={positive ? "#10b981" : "#ef4444"} strokeWidth={2} fillOpacity={1} fill={`url(#${positive ? "positiveGradient" : "negativeGradient"})`} />
            </AreaChart>
        </ResponsiveContainer>
    </div>
)

export default function ReportsPage() {
    const { cases: mockCases, tasks: mockTasks, users: mockUsers, meetings: mockMeetings } = useData();
    const [reportType, setReportType] = useState('overview');
    const [dateRange, setDateRange] = useState<DateRange | undefined>({ from: subDays(new Date(), 30), to: new Date() });
    const [userFilter, setUserFilter] = useState('all');

    const filteredData = useMemo(() => {
        const fromDate = dateRange?.from ? startOfDay(dateRange.from) : new Date(0);
        const toDate = dateRange?.to ? endOfDay(dateRange.to) : new Date();

        const cases = mockCases.filter(c => 
            isWithinInterval(new Date(c.createdAt), { start: fromDate, end: toDate }) &&
            (userFilter === 'all' || c.assignedTo === userFilter)
        );
        const tasks = mockTasks.filter(t => 
            isWithinInterval(new Date(t.dueDate), { start: fromDate, end: toDate }) &&
            (userFilter === 'all' || t.assignedTo === userFilter)
        );
        const meetings = mockMeetings.filter(m => 
            isWithinInterval(new Date(m.date), { start: fromDate, end: toDate }) &&
            (userFilter === 'all' || m.participants.includes(userFilter))
        );
        return { cases, tasks, meetings };
    }, [dateRange, userFilter, mockCases, mockTasks, mockMeetings]);

    const kpiData = useMemo(() => {
        return {
            totalCases: { value: filteredData.cases.length.toString(), change: '+12.5%', type: 'positive' },
            avgResolutionTime: { value: '2.1d', change: '-5.2%', type: 'positive' },
            tasksCompleted: { value: filteredData.tasks.filter(t => t.status === 'Done').length.toString(), change: '+8%', type: 'positive' },
            meetingsHeld: { value: filteredData.meetings.filter(m => m.status === 'Completed').length.toString(), change: '-2', type: 'negative' },
        }
    }, [filteredData]);
    
    const casesByStatusData = useMemo(() => {
        const counts = filteredData.cases.reduce((acc, curr) => {
            acc[curr.status] = (acc[curr.status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [filteredData.cases]);

    const tasksByPriorityData = useMemo(() => {
        const counts = filteredData.tasks.reduce((acc, curr) => {
            acc[curr.priority] = (acc[curr.priority] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [filteredData.tasks]);

    const performanceData = useMemo(() => {
        return mockUsers.map(user => {
            const cases = filteredData.cases.filter(c => c.assignedTo === user.name);
            const tasks = filteredData.tasks.filter(t => t.assignedTo === user.id);
            return {
                name: user.name,
                resolvedCases: cases.filter(c => c.status === 'Resolved' || c.status === 'Closed').length,
                completedTasks: tasks.filter(t => t.status === 'Done').length,
                avgResolution: (Math.random() * 5).toFixed(1) + 'd', // mock data
            };
        }).sort((a,b) => b.resolvedCases - a.resolvedCases);
    }, [filteredData, mockUsers]);

    const activityHeatmapData = useMemo(() => {
        if (!dateRange?.from || !dateRange?.to) return {};
        const days = eachDayOfInterval({ start: startOfWeek(dateRange.from), end: endOfWeek(dateRange.to) });
        const activityByDay: Record<string, number> = {};

        days.forEach(day => {
            const dayStr = format(day, 'yyyy-MM-dd');
            const cases = filteredData.cases.filter(c => format(new Date(c.createdAt), 'yyyy-MM-dd') === dayStr).length;
            const tasks = filteredData.tasks.filter(t => format(new Date(t.dueDate), 'yyyy-MM-dd') === dayStr).length;
            const meetings = filteredData.meetings.filter(m => format(new Date(m.date), 'yyyy-MM-dd') === dayStr).length;
            activityByDay[dayStr] = cases + tasks + meetings;
        });

        return activityByDay;
    }, [filteredData, dateRange]);
    
    const handleExport = (format: 'pdf' | 'excel') => {
        alert(`Exporting as ${format}... Check console for data.`);
    };

    return (
        <div className="flex-1 space-y-6 bg-muted/30 p-4 md:p-8 pt-6 rounded-lg">
            <header className="pb-6 border-b">
                <h1 className="text-3xl font-bold tracking-tight font-headline">Reports & Analytics</h1>
                <p className="text-muted-foreground">Gain insights into your team's performance and customer interactions.</p>
            </header>

            <div className="flex flex-col sm:flex-row items-center gap-2 pt-4">
                <DateRangePicker onDateChange={setDateRange} />
                 <Select value={userFilter} onValueChange={setUserFilter}>
                    <SelectTrigger className="w-full sm:w-[180px] bg-background">
                        <SelectValue placeholder="Select user" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Users</SelectItem>
                        {mockUsers.map(u => <SelectItem key={u.id} value={u.name}>{u.name}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mt-6">
                <KpiCard title="Total Cases" value={kpiData.totalCases.value} change={kpiData.totalCases.change} changeType="positive" icon={Briefcase} />
                <KpiCard title="Avg. Resolution Time" value={kpiData.avgResolutionTime.value} change={kpiData.avgResolutionTime.change} changeType="positive" icon={Clock} />
                <KpiCard title="Tasks Completed" value={kpiData.tasksCompleted.value} change={kpiData.tasksCompleted.change} changeType="positive" icon={CheckCircle} />
                <KpiCard title="Meetings Held" value={kpiData.meetingsHeld.value} change={kpiData.meetingsHeld.change} changeType="negative" icon={CalendarIcon} />
            </div>

            <main className="mt-8">
                <Tabs defaultValue="overview" value={reportType} onValueChange={setReportType}>
                    <TabsList>
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="cases">Case Reports</TabsTrigger>
                        <TabsTrigger value="performance">Performance</TabsTrigger>
                        <TabsTrigger value="heatmap">Activity Heatmap</TabsTrigger>
                        <TabsTrigger value="export">Export & Share</TabsTrigger>
                    </TabsList>
                    <TabsContent value="overview" className="mt-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <Card>
                                <CardHeader><CardTitle>Cases by Status</CardTitle></CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={casesByStatusData}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                            <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                                            <YAxis fontSize={12} tickLine={false} axisLine={false} />
                                            <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} />
                                            <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                             <Card>
                                <CardHeader><CardTitle>Tasks by Priority</CardTitle></CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <PieChart>
                                            <Pie data={tasksByPriorityData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} labelLine={false} label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                                                const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                                                const x  = cx + radius * Math.cos(-midAngle * Math.PI / 180);
                                                const y = cy  + radius * Math.sin(-midAngle * Math.PI / 180);
                                                return <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central">{(percent * 100).toFixed(0)}%</text>;
                                            }}>
                                                {tasksByPriorityData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                            </Pie>
                                            <Tooltip />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>
                    <TabsContent value="cases" className="mt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Detailed Case Report</CardTitle>
                                <CardDescription>A full list of cases within the selected date range.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader><TableRow><TableHead>Case ID</TableHead><TableHead>Subject</TableHead><TableHead>Status</TableHead><TableHead>Priority</TableHead><TableHead>Assigned To</TableHead><TableHead>Created At</TableHead></TableRow></TableHeader>
                                    <TableBody>
                                        {filteredData.cases.map(c => 
                                            <TableRow key={c.id}>
                                                <TableCell className="font-mono text-xs">{c.id}</TableCell>
                                                <TableCell className="font-medium">{c.subject}</TableCell>
                                                <TableCell><Badge variant={getStatusVariant(c.status)}>{c.status}</Badge></TableCell>
                                                <TableCell><Badge variant={getPriorityVariant(c.priority)}>{c.priority}</Badge></TableCell>
                                                <TableCell>{c.assignedTo}</TableCell>
                                                <TableCell>{new Date(c.createdAt).toLocaleDateString()}</TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>
                    <TabsContent value="performance" className="mt-6">
                         <Card>
                            <CardHeader>
                                <CardTitle>Team Performance</CardTitle>
                                <CardDescription>Productivity metrics for each staff member.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader><TableRow><TableHead>Staff Member</TableHead><TableHead>Resolved Cases</TableHead><TableHead>Completed Tasks</TableHead><TableHead>Avg. Resolution Time</TableHead></TableRow></TableHeader>
                                    <TableBody>
                                        {performanceData.map(p => 
                                            <TableRow key={p.name}>
                                                <TableCell className="font-medium">{p.name}</TableCell>
                                                <TableCell>{p.resolvedCases}</TableCell>
                                                <TableCell>{p.completedTasks}</TableCell>
                                                <TableCell>{p.avgResolution}</TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>
                     <TabsContent value="heatmap" className="mt-6">
                        <Card>
                            <CardHeader><CardTitle>Activity Heatmap</CardTitle></CardHeader>
                            <CardContent>
                                <Calendar
                                    mode="single"
                                    month={dateRange?.from}
                                    className="p-0"
                                    components={{
                                        DayContent: ({ date }) => {
                                            const dayStr = format(date, 'yyyy-MM-dd');
                                            const count = activityHeatmapData[dayStr] || 0;
                                            const opacity = count > 0 ? Math.min(count / 10 + 0.1, 1) : 0;
                                            return (
                                                <TooltipProvider>
                                                    <UITooltip>
                                                        <TooltipTrigger asChild>
                                                            <div className="relative w-full h-full flex items-center justify-center">
                                                                <div className="absolute inset-0 bg-primary transition-opacity" style={{ opacity }} />
                                                                <span className="relative text-xs">{format(date, 'd')}</span>
                                                            </div>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>{format(date, 'PPP')}</p>
                                                            <p>{count} activities</p>
                                                        </TooltipContent>
                                                    </UITooltip>
                                                </TooltipProvider>
                                            )
                                        }
                                    }}
                                />
                            </CardContent>
                        </Card>
                    </TabsContent>
                    <TabsContent value="export" className="mt-6">
                        <div className="grid md:grid-cols-2 gap-6">
                            <Card className="flex flex-col justify-between">
                                <CardHeader>
                                    <CardTitle>Export as PDF</CardTitle>
                                    <CardDescription>Generate a comprehensive PDF document of the current report view.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Button className="w-full" onClick={() => handleExport('pdf')}><FileDown className="mr-2 h-4 w-4" /> Export PDF</Button>
                                </CardContent>
                            </Card>
                            <Card className="flex flex-col justify-between">
                                <CardHeader>
                                    <CardTitle>Export as Excel</CardTitle>
                                    <CardDescription>Download the raw data in an Excel-compatible format for further analysis.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Button className="w-full" onClick={() => handleExport('excel')}><FileDown className="mr-2 h-4 w-4" /> Export Excel</Button>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );

    