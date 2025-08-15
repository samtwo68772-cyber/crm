
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
import { Download, Calendar as CalendarIcon, Users, Briefcase, ListTodo, CheckCircle, BarChart2, PieChart as PieIcon, LineChart as LineIcon, Settings2, Bell, Clock, Percent, Award, Users2, FileDown, ArrowUpRight, ArrowDownRight, UserCheck, XCircle, Activity, Hourglass, Folder } from 'lucide-react';
import type { DateRange } from "react-day-picker";
import { isWithinInterval, startOfDay, endOfDay, subDays, format, eachDayOfInterval, startOfWeek, endOfWeek } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useRouter } from 'next/navigation';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Progress } from '@/components/ui/progress';


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

function KpiCard({ title, value, change, changeType, icon: Icon, onClick }: { title: string; value: string; change?: string; changeType?: 'positive' | 'negative'; icon: React.ElementType, onClick?: () => void }) {
    const isPositive = changeType === 'positive';
    return (
        <Card className="shadow-sm hover:shadow-lg transition-shadow cursor-pointer" onClick={onClick}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
                <Icon className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                {change && changeType &&
                    <div className="flex items-center text-xs text-muted-foreground">
                        <span className={`flex items-center gap-1 font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                            {isPositive ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                            {change}
                        </span>
                        <MiniSparkline data={[{value: 10}, {value: 15}, {value: 8}, {value: 20}, {value: 18}]} positive={isPositive} />
                    </div>
                }
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
    const router = useRouter();
    const [reportType, setReportType] = useState('overview');
    const [dateRange, setDateRange] = useState<DateRange | undefined>({ from: subDays(new Date(), 30), to: new Date() });
    const [userFilter, setUserFilter] = useState('all');
    const [caseCategoryFilter, setCaseCategoryFilter] = useState('all');


    const filteredData = useMemo(() => {
        const fromDate = dateRange?.from ? startOfDay(dateRange.from) : new Date(0);
        const toDate = dateRange?.to ? endOfDay(dateRange.to) : new Date();

        const cases = mockCases.filter(c => 
            isWithinInterval(new Date(c.createdAt), { start: fromDate, end: toDate }) &&
            (userFilter === 'all' || c.assignedTo === userFilter) &&
            (caseCategoryFilter === 'all' || c.type === caseCategoryFilter)
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
    }, [dateRange, userFilter, caseCategoryFilter, mockCases, mockTasks, mockMeetings]);

    const kpiData = useMemo(() => {
        return {
            totalCases: { value: filteredData.cases.length.toString(), change: '+12.5%', type: 'positive' },
            avgResolutionTime: { value: '2.1d', change: '-5.2%', type: 'positive' },
            tasksCompleted: { value: filteredData.tasks.filter(t => t.status === 'Done').length.toString(), change: '+8%', type: 'positive' },
            meetingsHeld: { value: filteredData.meetings.filter(m => m.status === 'Completed').length.toString(), change: '-2', type: 'negative' },
            casesResolved: filteredData.cases.filter(c => ['Resolved', 'Closed'].includes(c.status)).length,
            casesInProgress: filteredData.cases.filter(c => c.status === 'In Progress').length,
            casesPendingReview: filteredData.cases.filter(c => ['New', 'Under Review'].includes(c.status)).length,
        }
    }, [filteredData]);
    
    const caseCategories = useMemo(() => {
        const totalCases = mockCases.filter(c => {
             const fromDate = dateRange?.from ? startOfDay(dateRange.from) : new Date(0);
             const toDate = dateRange?.to ? endOfDay(dateRange.to) : new Date();
             return isWithinInterval(new Date(c.createdAt), { start: fromDate, end: toDate }) && (userFilter === 'all' || c.assignedTo === userFilter)
        }).length;

        if (totalCases === 0) return [];
        
        const counts = mockCases.reduce((acc, curr) => {
            acc[curr.type] = (acc[curr.type] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(counts).map(([name, value]) => ({ 
            name: name as Case['type'], 
            count: value,
            percentage: (value / totalCases * 100)
        })).sort((a,b) => b.count - a.count);
    }, [mockCases, dateRange, userFilter]);


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
    
    const handleExport = (formatType: 'pdf' | 'excel') => {
        if (formatType === 'pdf') {
            const doc = new jsPDF();
            
            doc.setFontSize(18);
            doc.text('Caseflow CRM Report', 14, 22);
            doc.setFontSize(11);
            doc.setTextColor(100);

            const dateRangeStr = dateRange?.from ? `${format(dateRange.from, 'PPP')} - ${dateRange.to ? format(dateRange.to, 'PPP') : ''}` : 'All time';
            doc.text(`Date Range: ${dateRangeStr}`, 14, 30);
            doc.text(`User: ${userFilter === 'all' ? 'All Users' : mockUsers.find(u => u.id === userFilter)?.name}`, 14, 36);

            // Cases Table
            autoTable(doc, {
                startY: 50,
                head: [['Case ID', 'Subject', 'Status', 'Priority', 'Assigned To', 'Created At']],
                body: filteredData.cases.map(c => [c.id, c.subject, c.status, c.priority, c.assignedTo, c.createdAt]),
                headStyles: { fillColor: [38, 43, 60] },
                didDrawPage: (data) => {
                  if (data.pageNumber === 1) {
                     doc.setFontSize(14);
                     doc.text('Cases Report', 14, 45);
                  }
                }
            });

            // Tasks Table
            const lastTable = (doc as any).lastAutoTable;
            autoTable(doc, {
                 startY: lastTable.finalY + 15,
                head: [['Task Title', 'Status', 'Priority', 'Due Date', 'Assigned To']],
                body: filteredData.tasks.map(t => [t.title, t.status, t.priority, t.dueDate, mockUsers.find(u=>u.id === t.assignedTo)?.name || 'N/A']),
                headStyles: { fillColor: [38, 43, 60] },
                didDrawPage: (data) => {
                     doc.setFontSize(14);
                     doc.text('Tasks Report', 14, lastTable.finalY + 10);
                }
            });

            doc.save(`report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
        } else {
             alert(`Exporting as ${formatType}... (Filtered data would be used here)`);
        }
    };

    const buildNavUrl = (pathname: string, filters: Record<string, string>) => {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => params.set(key, value));
        if (dateRange?.from) params.set('from', format(dateRange.from, 'yyyy-MM-dd'));
        if (dateRange?.to) params.set('to', format(dateRange.to, 'yyyy-MM-dd'));
        if (userFilter !== 'all') params.set('user', userFilter);
        return `${pathname}?${params.toString()}`;
    }
    
    const handleChartClick = (path: string, filterKey: string, payload: any) => {
        if (payload && payload.name) {
            router.push(buildNavUrl(path, { [filterKey]: payload.name }));
        }
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
                <KpiCard title="Total Cases" value={kpiData.totalCases.value} change={kpiData.totalCases.change} changeType="positive" icon={Briefcase} onClick={() => router.push(buildNavUrl('/cases', { status: 'all' }))} />
                <KpiCard title="Avg. Resolution Time" value={kpiData.avgResolutionTime.value} change={kpiData.avgResolutionTime.change} changeType="positive" icon={Clock} />
                <KpiCard title="Tasks Completed" value={kpiData.tasksCompleted.value} change={kpiData.tasksCompleted.change} changeType="positive" icon={CheckCircle} onClick={() => router.push(buildNavUrl('/tasks', { status: 'Done' }))} />
                <KpiCard title="Meetings Held" value={kpiData.meetingsHeld.value} change={kpiData.meetingsHeld.change} changeType="negative" icon={CalendarIcon} onClick={() => router.push(buildNavUrl('/meetings', { status: 'Completed' }))} />
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
                                        <BarChart data={casesByStatusData} onClick={(data) => handleChartClick('/cases', 'status', data.activePayload?.[0]?.payload)}>
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
                                                {tasksByPriorityData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} onClick={() => router.push(buildNavUrl('/tasks', { priority: entry.name }))}/>)}
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
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-1 space-y-6">
                                <KpiCard title="Cases Resolved" value={kpiData.casesResolved.toString()} icon={CheckCircle} onClick={() => router.push(buildNavUrl('/cases', {status: 'Resolved'}))}/>
                                <KpiCard title="In Progress" value={kpiData.casesInProgress.toString()} icon={Activity} onClick={() => router.push(buildNavUrl('/cases', {status: 'In Progress'}))} />
                                <KpiCard title="Pending Review" value={kpiData.casesPendingReview.toString()} icon={Hourglass} onClick={() => router.push(buildNavUrl('/cases', {status: 'New'}))}/>
                            </div>
                            <div className="lg:col-span-2">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Case Categories</CardTitle>
                                        <CardDescription>Breakdown of cases by type within the selected filters.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            {caseCategories.map(cat => (
                                                <TooltipProvider key={cat.name}>
                                                    <UITooltip>
                                                        <TooltipTrigger asChild>
                                                            <div 
                                                                className="flex items-center cursor-pointer group"
                                                                onClick={() => setCaseCategoryFilter(cat.name)}
                                                            >
                                                                <div className="flex items-center gap-3 flex-1">
                                                                    <Folder className="h-5 w-5 text-muted-foreground"/>
                                                                    <span className="font-medium group-hover:text-primary">{cat.name}</span>
                                                                </div>
                                                                <div className="w-24 text-right text-muted-foreground">{cat.percentage.toFixed(1)}%</div>
                                                                <Progress value={cat.percentage} className="w-1/3 h-2 ml-4 group-hover:[&>div]:bg-primary" />
                                                            </div>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>{cat.count} cases</p>
                                                        </TooltipContent>
                                                    </UITooltip>
                                                </TooltipProvider>
                                            ))}
                                            {caseCategoryFilter !== 'all' && (
                                                <Button variant="link" onClick={() => setCaseCategoryFilter('all')}>Clear category filter</Button>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
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
                                            <TableRow key={p.name} onClick={() => router.push('/admin')} className="cursor-pointer">
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
                                    onDayClick={(day) => alert(`Filtering to ${format(day, 'PPP')}`)}
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
}

    