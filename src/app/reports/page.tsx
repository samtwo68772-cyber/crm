

"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import type { Case, Task, Meeting, User, Team, AuditLog } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, LineChart, PieChart, Bar, Line, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, AreaChart, Area } from 'recharts';
import { Download, Calendar as CalendarIcon, Users, Briefcase, ListTodo, CheckCircle, BarChart2, PieChart as PieIcon, LineChart as LineIcon, Settings2, Bell, Clock, Percent, Award, Users2, FileDown, ArrowUpRight, ArrowDownRight, UserCheck, XCircle, Activity, Hourglass, Folder, ChevronsUpDown, Smile, Hand, GanttChartSquare, FileText } from 'lucide-react';
import type { DateRange } from "react-day-picker";
import { isWithinInterval, startOfDay, endOfDay, subDays, format, eachDayOfInterval, startOfWeek, endOfWeek, differenceInDays, parseISO } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useRouter } from 'next/navigation';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { getCases } from '../cases/actions';
import { getTasks } from '../tasks/actions';
import { getUsers } from '../admin/actions';
import { getMeetings } from '../meetings/actions';
import { getTeams } from '../admin/actions';
import { getAuditLogs } from '../settings/actions';
import { useToast } from "@/hooks/use-toast";
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';

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

function KpiCard({ title, value, change, changeType, icon: Icon, onClick, data, positiveChange }: { title: string; value: string; change?: string; changeType?: 'positive' | 'negative'; icon: React.ElementType, onClick?: () => void, data?: any[], positiveChange?: boolean }) {
    return (
        <Card className="shadow-sm hover:shadow-lg transition-shadow cursor-pointer" onClick={onClick}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
                <Icon className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="flex items-end justify-between">
                <div>
                    <div className="text-2xl font-bold">{value}</div>
                    {change && changeType &&
                        <div className="flex items-center text-xs text-muted-foreground">
                            <span className={`flex items-center gap-1 font-medium ${changeType === 'positive' ? 'text-green-600' : 'text-red-600'}`}>
                                {changeType === 'positive' ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                                {change}
                            </span>
                        </div>
                    }
                </div>
                {data && <MiniSparkline data={data} positive={positiveChange ?? false} />}
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

type SortConfig = {
    key: string;
    direction: 'ascending' | 'descending';
} | null;


export default function ReportsPage() {
    const { data: cases, isLoading: casesLoading } = useQuery<Case[]>({ queryKey: ['cases'], queryFn: getCases });
    const { data: tasks, isLoading: tasksLoading } = useQuery<Task[]>({ queryKey: ['tasks'], queryFn: getTasks });
    const { data: users, isLoading: usersLoading } = useQuery<User[]>({ queryKey: ['users'], queryFn: getUsers });
    const { data: meetings, isLoading: meetingsLoading } = useQuery<Meeting[]>({ queryKey: ['meetings'], queryFn: getMeetings });
    const { data: teams, isLoading: teamsLoading } = useQuery<Team[]>({ queryKey: ['teams'], queryFn: getTeams });
    const { data: auditLogs, isLoading: auditLogsLoading } = useQuery<AuditLog[]>({ queryKey: ['auditLogs'], queryFn: getAuditLogs });
    const isLoading = casesLoading || tasksLoading || usersLoading || meetingsLoading || teamsLoading || auditLogsLoading;
    const { toast } = useToast();

    const router = useRouter();
    const isMobile = useIsMobile();
    const [reportType, setReportType] = useState('overview');
    const [dateRange, setDateRange] = useState<DateRange | undefined>({ from: subDays(new Date(), 30), to: new Date() });
    const [userFilter, setUserFilter] = useState('all');
    const [teamFilter, setTeamFilter] = useState('all');
    const [caseCategoryFilter, setCaseCategoryFilter] = useState('all');
    const [sortConfig, setSortConfig] = useState<SortConfig>(null);

    const filteredData = useMemo(() => {
        if (!cases || !tasks || !meetings || !users || !auditLogs) {
            return { cases: [], tasks: [], meetings: [], logs: [] };
        }
        const fromDate = dateRange?.from ? startOfDay(dateRange.from) : new Date(0);
        const toDate = dateRange?.to ? endOfDay(dateRange.to) : new Date();
        
        let userIdsInScope: string[] = [];
        if (teamFilter !== 'all' && teams) {
            userIdsInScope = users.filter(u => u.team === teamFilter).map(u => u.id);
        } else if (userFilter !== 'all') {
            userIdsInScope = [userFilter];
        }

        const filteredCases = cases.filter(c => {
            const assignedUser = users.find(u => c.assignments?.some(a => a.userId === u.id));
            const userMatch = userFilter === 'all' || (assignedUser && assignedUser.id === userFilter);
            const teamMatch = teamFilter === 'all' || (assignedUser && assignedUser.team === teamFilter);

            return isWithinInterval(c.createdAt, { start: fromDate, end: toDate }) &&
            (caseCategoryFilter === 'all' || c.type === caseCategoryFilter) &&
            (userFilter === 'all' ? teamMatch : userMatch)
        });

        const filteredTasks = tasks.filter(t => {
             const userMatch = userFilter === 'all' || t.assignedTo === userFilter;
             const teamMatch = teamFilter === 'all' || users.find(u => u.id === t.assignedTo)?.team === teamFilter;
             return isWithinInterval(t.dueDate, { start: fromDate, end: toDate }) &&
             (userFilter === 'all' ? teamMatch : userMatch)
        });

        const filteredMeetings = meetings.filter(m => 
            isWithinInterval(m.date, { start: fromDate, end: toDate }) &&
            (userFilter === 'all' || m.participants.some(p => p.userId === userFilter)) &&
            (teamFilter === 'all' || m.participants.some(p => users.find(u => u.id === p.userId)?.team === teamFilter))
        );
        
        const filteredLogs = auditLogs.filter(log => {
             const userMatch = userFilter === 'all' || log.userId === userFilter;
             const teamMatch = teamFilter === 'all' || users.find(u => u.id === log.userId)?.team === teamFilter;
             return isWithinInterval(log.timestamp, { start: fromDate, end: toDate }) &&
             (userFilter === 'all' ? teamMatch : userMatch)
        });

        return { cases: filteredCases, tasks: filteredTasks, meetings: filteredMeetings, logs: filteredLogs };
    }, [dateRange, userFilter, teamFilter, caseCategoryFilter, cases, tasks, meetings, users, auditLogs, teams]);

    const kpiData = useMemo(() => {
        if (!cases || !tasks || !meetings) return {
            totalCases: { value: '0', change: 'N/A', type: 'positive', data: [], positiveChange: true },
            avgResolutionTime: { value: 'N/A', change: 'N/A', type: 'positive', data: [], positiveChange: true },
            tasksCompleted: { value: '0', change: 'N/A', type: 'positive', data: [], positiveChange: true },
            meetingsHeld: { value: '0', change: 'N/A', type: 'negative', data: [], positiveChange: false },
        };
        const resolvedCases = cases.filter(c => c.resolvedAt); // Use all cases for overall KPIs
        const resolutionTimes = resolvedCases.map(c => differenceInDays(c.resolvedAt!, c.createdAt));
        const avgResolutionTime = resolutionTimes.length > 0 ? (resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length).toFixed(1) : 'N/A';
        const trendData = [{value: 5}, {value: 7}, {value: 6}, {value: 8}, {value: 7}];
        const negTrendData = [{value: 8}, {value: 7}, {value: 6}, {value: 5}, {value: 4}];


        return {
            totalCases: { value: filteredData.cases.length.toString(), change: '+12.5%', type: 'positive' as const, data: trendData, positiveChange: true },
            avgResolutionTime: { value: `${avgResolutionTime}d`, change: '-5.2%', type: 'positive' as const, data: trendData, positiveChange: true },
            tasksCompleted: { value: filteredData.tasks.filter(t => t.status === 'Done').length.toString(), change: '+8%', type: 'positive' as const, data: trendData, positiveChange: true },
            meetingsHeld: { value: filteredData.meetings.filter(m => m.status === 'Completed').length.toString(), change: '-2', type: 'negative' as const, data: negTrendData, positiveChange: false },
        }
    }, [filteredData, cases, tasks, meetings]);
    
    const teamPerformanceData = useMemo(() => {
        if (!teams || !users || !cases || !tasks) return [];
        let teamsToDisplay = teams;
        if (userFilter !== 'all') {
            const userTeam = users.find(u => u.id === userFilter)?.team;
            teamsToDisplay = teams.filter(t => t.name === userTeam);
        } else if (teamFilter !== 'all') {
             teamsToDisplay = teams.filter(t => t.name === teamFilter);
        }

        return teamsToDisplay.map(team => {
            const teamMembers = users.filter(u => u.team === team.name);
            const memberIds = teamMembers.map(u => u.id);

            const casesHandled = cases.filter(c => c.assignments.some(a => memberIds.includes(a.userId)));
            const tasksCompleted = tasks.filter(t => memberIds.includes(t.assignedTo || '') && t.status === 'Done');

            const resolvedCases = casesHandled.filter(c => c.resolvedAt);
            const resolutionTimes = resolvedCases.map(c => differenceInDays(c.resolvedAt!, c.createdAt));
            const avgResolutionTime = resolutionTimes.length > 0 ? (resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length) : 0;
            
            const ratedCases = casesHandled.filter(c => c.satisfactionRating);
            const satisfactionScore = ratedCases.length > 0 ? (ratedCases.reduce((a,b) => a + b.satisfactionRating!, 0) / ratedCases.length) : 0;

            return {
                id: team.id,
                name: team.name,
                casesHandled: casesHandled.length,
                tasksCompleted: tasksCompleted.length,
                avgResolutionTime: avgResolutionTime.toFixed(1),
                satisfactionScore: satisfactionScore.toFixed(1),
            };
        });
    }, [cases, tasks, users, teams, userFilter, teamFilter]);


    const individualPerformanceData = useMemo(() => {
        if (!users) return [];
       let usersToList = users.filter(u => u.role === 'staff');

       if (userFilter !== 'all') {
           usersToList = usersToList.filter(u => u.id === userFilter);
       } else if (teamFilter !== 'all') {
           usersToList = usersToList.filter(u => u.team === teamFilter);
       }

       const data = usersToList.map(user => {
            const casesHandled = filteredData.cases.filter(c => c.assignments.some(a => a.userId === user.id));
            const resolvedCases = casesHandled.filter(c => c.resolvedAt);
            const resolutionTimes = resolvedCases.map(c => differenceInDays(c.resolvedAt!, c.createdAt));
            const avgResolutionTime = resolutionTimes.length > 0 ? (resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length) : 0;
            
            const ratedCases = casesHandled.filter(c => c.satisfactionRating);
            const satisfactionScore = ratedCases.length > 0 ? (ratedCases.reduce((a,b) => a + b.satisfactionRating!, 0) / ratedCases.length) : 0;
            
            const tasksCompleted = filteredData.tasks.filter(t => t.assignedTo === user.id && t.status === 'Done').length;

            return {
                id: user.id,
                name: user.name,
                team: user.team,
                resolvedCases: resolvedCases.length,
                tasksCompleted: tasksCompleted,
                avgResolutionTime: parseFloat(avgResolutionTime.toFixed(1)),
                satisfactionScore: parseFloat(satisfactionScore.toFixed(1)),
            };
        });
        
        if (sortConfig !== null) {
            data.sort((a, b) => {
                const aValue = a[sortConfig.key as keyof typeof a];
                const bValue = b[sortConfig.key as keyof typeof a];

                if (typeof aValue === 'number' && typeof bValue === 'number') {
                    if (aValue < bValue) {
                        return sortConfig.direction === 'ascending' ? -1 : 1;
                    }
                    if (aValue > bValue) {
                        return sortConfig.direction === 'ascending' ? 1 : -1;
                    }
                } else if (typeof aValue === 'string' && typeof bValue === 'string') {
                     if (aValue < bValue) {
                        return sortConfig.direction === 'ascending' ? -1 : 1;
                    }
                    if (aValue > bValue) {
                        return sortConfig.direction === 'ascending' ? 1 : -1;
                    }
                }
                return 0;
            });
        }
        return data;
    }, [filteredData, users, sortConfig, userFilter, teamFilter]);

    const requestSort = (key: string) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const getSortIcon = (key: string) => {
        if (!sortConfig || sortConfig.key !== key) {
            return <ChevronsUpDown className="h-4 w-4 ml-2 opacity-50" />;
        }
        return sortConfig.direction === 'ascending' ? 
            <ArrowUpRight className="h-4 w-4 ml-2" /> : 
            <ArrowDownRight className="h-4 w-4 ml-2" />;
    };
    
    const caseCategories = useMemo(() => {
        if (!cases || !users) return [];
        const allCasesInRange = cases.filter(c => {
             const fromDate = dateRange?.from ? startOfDay(dateRange.from) : new Date(0);
             const toDate = dateRange?.to ? endOfDay(dateRange.to) : new Date();
             const assignedUser = users.find(u => c.assignments.some(a => a.userId === u.id));
             const userMatch = userFilter === 'all' || (assignedUser && assignedUser.id === userFilter);
             const teamMatch = teamFilter === 'all' || (assignedUser && assignedUser.team === teamFilter);
             return isWithinInterval(c.createdAt, { start: fromDate, end: toDate }) && userMatch && teamMatch;
        });

        if (allCasesInRange.length === 0) return [];
        
        const counts = allCasesInRange.reduce((acc, curr) => {
            const category = curr.type || 'Uncategorized';
            acc[category] = (acc[category] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(counts).map(([name, value]) => ({ 
            name: name,
            count: value,
            percentage: (value / allCasesInRange.length * 100)
        })).sort((a,b) => b.count - a.count);
    }, [cases, dateRange, userFilter, teamFilter, users]);


    const casesByStatusData = useMemo(() => {
        if (!filteredData.cases) return [];
        const counts = filteredData.cases.reduce((acc, curr) => {
            acc[curr.status] = (acc[curr.status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [filteredData.cases]);
    
    const handleExport = (formatType: 'pdf' | 'excel', reportName: string) => {
        const safeReportName = reportName.toLowerCase().replace(/ /g, '-');
        const fileName = `${safeReportName}-report-${format(new Date(), 'yyyy-MM-dd')}`;

        if (formatType === 'pdf') {
            const doc = new jsPDF();
            doc.setFontSize(18);
            doc.text(`${reportName} Report`, 14, 22);
            doc.setFontSize(11);
            doc.setTextColor(100);

            const dateRangeStr = dateRange?.from ? `${format(dateRange.from, 'PPP')} - ${dateRange.to ? format(dateRange.to, 'PPP') : ''}` : 'All time';
            doc.text(`Date Range: ${dateRangeStr}`, 14, 30);
            doc.text(`Team: ${teamFilter === 'all' ? 'All Teams' : teams?.find(t => t.name === teamFilter)?.name}`, 14, 36);
            doc.text(`User: ${userFilter === 'all' ? 'All Users' : users?.find(u => u.id === userFilter)?.name}`, 14, 42);

            let startY = 50;

            if (reportName === 'Case Summary') {
                if (filteredData.cases.length === 0) { alert("No data available for export."); return; }
                autoTable(doc, {
                    startY,
                    head: [['Case ID', 'Subject', 'Status', 'Priority', 'Assigned To', 'Created At']],
                    body: filteredData.cases.map(c => [c.id, c.subject, c.status, c.priority, c.assignments.map(a => a.user.name).join(', '), format(c.createdAt, 'yyyy-MM-dd')]),
                    headStyles: { fillColor: [38, 43, 60] },
                });
            } else if (reportName === 'Performance') {
                if (teamPerformanceData.length === 0) { alert("No data available for export."); return; }
                doc.setFontSize(14);
                doc.text('Team Performance', 14, startY);
                startY += 7;
                autoTable(doc, {
                    startY,
                    head: [['Team', 'Cases Handled', 'Tasks Completed', 'Avg. Resolution (Days)', 'Satisfaction']],
                    body: teamPerformanceData.map(t => [t.name, t.casesHandled, t.tasksCompleted, t.avgResolutionTime, `${t.satisfactionScore} / 5.0`]),
                });
                startY = (doc as any).lastAutoTable.finalY + 15;
                doc.setFontSize(14);
                doc.text('Individual Performance', 14, startY);
                startY += 7;
                autoTable(doc, {
                    startY,
                    head: [['User', 'Team', 'Resolved Cases', 'Completed Tasks', 'Avg. Resolution (Days)', 'Satisfaction']],
                    body: individualPerformanceData.map(p => [p.name, p.team, p.resolvedCases, p.tasksCompleted, p.avgResolutionTime, `${p.satisfactionScore} / 5.0`]),
                });
            } else if (reportName === 'Activity Log') {
                if (filteredData.logs.length === 0) { alert("No data available for export."); return; }
                 autoTable(doc, {
                    startY,
                    head: [['Timestamp', 'User', 'Action', 'Details']],
                    body: filteredData.logs.map(log => [
                        new Date(log.timestamp).toLocaleString(),
                        users?.find(u => u.id === log.userId)?.name || 'System',
                        log.action,
                        log.details,
                    ]),
                });
            }
            doc.save(`${fileName}.pdf`);
        } else if (formatType === 'excel') {
             const wb = XLSX.utils.book_new();

             if (reportName === 'Case Summary') {
                if (filteredData.cases.length === 0) { alert("No data available for export."); return; }
                const ws = XLSX.utils.json_to_sheet(filteredData.cases.map(c => ({...c, assignments: c.assignments.map(a => a.user.name).join(', ')})));
                XLSX.utils.book_append_sheet(wb, ws, "Case Summary");
             } else if (reportName === 'Performance') {
                if (teamPerformanceData.length === 0 && individualPerformanceData.length === 0) { alert("No data available for export."); return; }
                const teamWs = XLSX.utils.json_to_sheet(teamPerformanceData);
                XLSX.utils.book_append_sheet(wb, teamWs, "Team Performance");
                const individualWs = XLSX.utils.json_to_sheet(individualPerformanceData);
                XLSX.utils.book_append_sheet(wb, individualWs, "Individual Performance");
             } else if (reportName === 'Activity Log') {
                 if (filteredData.logs.length === 0) { alert("No data available for export."); return; }
                 const logData = filteredData.logs.map(log => ({
                     Timestamp: new Date(log.timestamp).toLocaleString(),
                     User: users?.find(u => u.id === log.userId)?.name || 'System',
                     Action: log.action,
                     Details: log.details,
                 }));
                 const ws = XLSX.utils.json_to_sheet(logData);
                 XLSX.utils.book_append_sheet(wb, ws, "Activity Log");
             }

             XLSX.writeFile(wb, `${fileName}.xlsx`);
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
    
    const reportCards = [
        {
            title: 'Case Summary Report',
            description: 'Includes all cases within the selected date range, their statuses, categories, and resolution times.',
            icon: Briefcase,
            dataAvailable: filteredData.cases.length > 0,
        },
        {
            title: 'Performance Report',
            description: 'Includes team and individual performance metrics, resolution times, and satisfaction scores.',
            icon: BarChart2,
            dataAvailable: teamPerformanceData.length > 0 || individualPerformanceData.length > 0,
        },
        {
            title: 'Activity Log Report',
            description: 'A chronological list of system activities like case updates, task completions, and email responses.',
            icon: FileText,
            dataAvailable: filteredData.logs.length > 0,
        },
    ];

    const renderTeamPerformance = () => {
        if (isMobile) {
            return (
                <div className="space-y-4">
                    {teamPerformanceData.map(team => (
                        <Card key={team.id} onClick={() => { setTeamFilter(team.name); setUserFilter('all'); }}>
                            <CardHeader>
                                <CardTitle>{team.name}</CardTitle>
                            </CardHeader>
                            <CardContent className="grid grid-cols-2 gap-4 text-sm">
                                <div><p className="text-muted-foreground">Cases Handled</p><p className="font-medium">{team.casesHandled}</p></div>
                                <div><p className="text-muted-foreground">Tasks Completed</p><p className="font-medium">{team.tasksCompleted}</p></div>
                                <div><p className="text-muted-foreground">Avg. Resolution</p><p className="font-medium">{team.avgResolutionTime} days</p></div>
                                <div><p className="text-muted-foreground">Satisfaction</p><p className="font-medium">{team.satisfactionScore} / 5.0</p></div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )
        }
        return (
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Team</TableHead>
                        <TableHead>Cases Handled</TableHead>
                        <TableHead>Completed Tasks</TableHead>
                        <TableHead>Avg. Resolution Time (Days)</TableHead>
                        <TableHead>Satisfaction Score</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {teamPerformanceData.map(team => 
                        <TableRow key={team.id} onClick={() => {setTeamFilter(team.name); setUserFilter('all');}} className="cursor-pointer">
                            <TableCell className="font-medium">{team.name}</TableCell>
                            <TableCell>{team.casesHandled}</TableCell>
                            <TableCell>{team.tasksCompleted}</TableCell>
                            <TableCell>{team.avgResolutionTime}</TableCell>
                            <TableCell>
                                <span className={cn(
                                    parseFloat(team.satisfactionScore) >= 4.0 ? "text-green-600" :
                                    parseFloat(team.satisfactionScore) < 3.0 ? "text-red-600" :
                                    "text-muted-foreground"
                                )}>
                                    {team.satisfactionScore} / 5.0
                                </span>
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        );
    }
    
    const renderIndividualPerformance = () => {
        if (isMobile) {
            return (
                <div className="space-y-4">
                    {individualPerformanceData.map(p => (
                        <Card key={p.id} onClick={() => setUserFilter(p.id)}>
                            <CardHeader>
                                <CardTitle>{p.name}</CardTitle>
                                <CardDescription>{p.team}</CardDescription>
                            </CardHeader>
                             <CardContent className="grid grid-cols-2 gap-4 text-sm">
                                <div><p className="text-muted-foreground">Resolved Cases</p><p className="font-medium">{p.resolvedCases}</p></div>
                                <div><p className="text-muted-foreground">Completed Tasks</p><p className="font-medium">{p.tasksCompleted}</p></div>
                                <div><p className="text-muted-foreground">Avg. Resolution</p><p className="font-medium">{p.avgResolutionTime} days</p></div>
                                <div><p className="text-muted-foreground">Satisfaction</p><p className="font-medium">{p.satisfactionScore} / 5.0</p></div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )
        }
        return (
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="cursor-pointer" onClick={() => requestSort('name')}>
                            <div className="flex items-center">Staff Member {getSortIcon('name')}</div>
                        </TableHead>
                        <TableHead className="cursor-pointer" onClick={() => requestSort('team')}>
                             <div className="flex items-center">Team {getSortIcon('team')}</div>
                        </TableHead>
                        <TableHead className="cursor-pointer" onClick={() => requestSort('resolvedCases')}>
                             <div className="flex items-center">Resolved Cases {getSortIcon('resolvedCases')}</div>
                        </TableHead>
                        <TableHead className="cursor-pointer" onClick={() => requestSort('tasksCompleted')}>
                             <div className="flex items-center">Completed Tasks {getSortIcon('tasksCompleted')}</div>
                        </TableHead>
                        <TableHead className="cursor-pointer" onClick={() => requestSort('avgResolutionTime')}>
                             <div className="flex items-center">Avg. Resolution (Days) {getSortIcon('avgResolutionTime')}</div>
                        </TableHead>
                        <TableHead className="cursor-pointer" onClick={() => requestSort('satisfactionScore')}>
                            <div className="flex items-center">Satisfaction {getSortIcon('satisfactionScore')}</div>
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {individualPerformanceData.map(p => 
                        <TableRow key={p.id} onClick={() => setUserFilter(p.id)} className="cursor-pointer">
                            <TableCell className="font-medium">{p.name}</TableCell>
                            <TableCell>{p.team}</TableCell>
                            <TableCell>{p.resolvedCases}</TableCell>
                            <TableCell>{p.tasksCompleted}</TableCell>
                            <TableCell>{p.avgResolutionTime}</TableCell>
                            <TableCell>
                                <span className={cn(
                                    p.satisfactionScore >= 4.0 ? "text-green-600" :
                                    p.satisfactionScore < 3.0 ? "text-red-600" :
                                    "text-muted-foreground"
                                )}>
                                    {p.satisfactionScore} / 5.0
                                </span>
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        )
    }
    
    if (isLoading) return (
        <div className="flex-1 space-y-6 bg-muted/30 p-4 md:p-8 pt-6 rounded-lg">
            <Skeleton className="h-16 w-1/2" />
            <Skeleton className="h-10 w-full" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                <Skeleton className="h-28 w-full" />
                <Skeleton className="h-28 w-full" />
                <Skeleton className="h-28 w-full" />
                <Skeleton className="h-28 w-full" />
            </div>
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-96 w-full" />
        </div>
    );

    return (
        <div className="flex-1 space-y-6 bg-muted/30 p-4 md:p-8 pt-6 rounded-lg">
            <header className="pb-6 border-b">
                <h1 className="text-3xl font-bold tracking-tight font-headline">Reports & Analytics</h1>
                <p className="text-muted-foreground">Gain insights into your team's performance and customer interactions.</p>
            </header>

            <div className="flex flex-col sm:flex-row items-center gap-2 pt-4">
                <DateRangePicker onDateChange={setDateRange} />
                <Select value={teamFilter} onValueChange={setTeamFilter}>
                    <SelectTrigger className="w-full sm:w-[180px] bg-background">
                        <SelectValue placeholder="Select team" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Teams</SelectItem>
                        {teams?.map(t => <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>)}
                    </SelectContent>
                </Select>
                 <Select value={userFilter} onValueChange={setUserFilter}>
                    <SelectTrigger className="w-full sm:w-[180px] bg-background">
                        <SelectValue placeholder="Select user" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Users</SelectItem>
                        {users?.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
                    </SelectContent>
                </Select>
                 <Button variant="outline" onClick={() => { setUserFilter('all'); setTeamFilter('all'); }}>Clear Filters</Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                <KpiCard title="Total Cases" value={kpiData.totalCases.value} change={kpiData.totalCases.change} changeType={kpiData.totalCases.type} icon={Briefcase} onClick={() => router.push(buildNavUrl('/cases', { status: 'all' }))} data={kpiData.totalCases.data} positiveChange={kpiData.totalCases.positiveChange} />
                <KpiCard title="Avg. Resolution Time" value={kpiData.avgResolutionTime.value} change={kpiData.avgResolutionTime.change} changeType={kpiData.avgResolutionTime.type} icon={Clock} data={kpiData.avgResolutionTime.data} positiveChange={kpiData.avgResolutionTime.positiveChange} />
                <KpiCard title="Tasks Completed" value={kpiData.tasksCompleted.value} change={kpiData.tasksCompleted.change} changeType={kpiData.tasksCompleted.type} icon={CheckCircle} onClick={() => router.push(buildNavUrl('/tasks', { status: 'Done' }))} data={kpiData.tasksCompleted.data} positiveChange={kpiData.tasksCompleted.positiveChange} />
                <KpiCard title="Meetings Held" value={kpiData.meetingsHeld.value} change={kpiData.meetingsHeld.change} changeType={kpiData.meetingsHeld.type} icon={CalendarIcon} onClick={() => router.push(buildNavUrl('/meetings', { status: 'Completed' }))} data={kpiData.meetingsHeld.data} positiveChange={kpiData.meetingsHeld.positiveChange} />
            </div>

            <main className="mt-8">
                <Tabs defaultValue="overview" value={reportType} onValueChange={setReportType}>
                    <TabsList className="grid w-full grid-cols-1 md:grid-cols-2 lg:grid-cols-4 h-auto md:h-10">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="cases">Case Reports</TabsTrigger>
                        <TabsTrigger value="performance">Performance</TabsTrigger>
                        <TabsTrigger value="export">Export & Share</TabsTrigger>
                    </TabsList>
                    <TabsContent value="overview" className="mt-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                             <Card>
                                <CardHeader>
                                    <CardTitle>Cases by Status</CardTitle>
                                    <CardDescription>Breakdown of all active cases by their current status.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <PieChart>
                                            <Pie 
                                                data={casesByStatusData} 
                                                dataKey="value" 
                                                nameKey="name" 
                                                cx="50%" 
                                                cy="50%" 
                                                outerRadius={100} 
                                                labelLine={false} 
                                                label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                                                    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                                                    const x  = cx + radius * Math.cos(-midAngle * Math.PI / 180);
                                                    const y = cy  + radius * Math.sin(-midAngle * Math.PI / 180);
                                                    return <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central">{(percent * 100).toFixed(0)}%</text>;
                                                }}>
                                                {casesByStatusData.map((entry, index) => (
                                                    <Cell 
                                                        key={`cell-${index}`} 
                                                        fill={COLORS[index % COLORS.length]} 
                                                        onClick={() => router.push(buildNavUrl('/cases', { status: entry.name }))}
                                                        className="cursor-pointer"
                                                    />
                                                ))}
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
                                                                onClick={() => setCaseCategoryFilter(cat.name === 'Uncategorized' ? 'all' : cat.name)}
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
                             <div className="lg:col-span-1 space-y-6">
                                <KpiCard title="Cases Resolved" value={filteredData.cases.filter(c => ['Resolved', 'Closed', 'Completed'].includes(c.status)).length.toString()} icon={CheckCircle} onClick={() => router.push(buildNavUrl('/cases', {status: 'Resolved'}))}/>
                                <KpiCard title="In Progress" value={filteredData.cases.filter(c => c.status === 'In Progress').length.toString()} icon={Activity} onClick={() => router.push(buildNavUrl('/cases', {status: 'In Progress'}))} />
                                <KpiCard title="Pending Review" value={filteredData.cases.filter(c => ['New', 'Under Review'].includes(c.status)).length.toString()} icon={Hourglass} onClick={() => router.push(buildNavUrl('/cases', {status: 'New'}))}/>
                            </div>
                        </div>
                    </TabsContent>
                    <TabsContent value="performance" className="mt-6 space-y-6">
                         <Card>
                            <CardHeader>
                                <CardTitle>Team Performance</CardTitle>
                                <CardDescription>Productivity metrics for each team.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {renderTeamPerformance()}
                            </CardContent>
                        </Card>
                        
                        <Card>
                            <CardHeader>
                                <CardTitle>Individual Performance</CardTitle>
                                <CardDescription>Productivity metrics for each staff member.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {renderIndividualPerformance()}
                            </CardContent>
                        </Card>
                    </TabsContent>
                    <TabsContent value="export" className="mt-6">
                        <div className="space-y-6">
                             <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {reportCards.map((report) => (
                                    <Card key={report.title} className="flex flex-col">
                                        <CardHeader className="flex-1">
                                            <div className="flex items-start gap-4">
                                                <div className="p-3 bg-muted rounded-full">
                                                    <report.icon className="h-6 w-6 text-muted-foreground" />
                                                </div>
                                                <div>
                                                    <CardTitle>{report.title}</CardTitle>
                                                    <CardDescription className="mt-2">{report.description}</CardDescription>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                             {report.dataAvailable ? (
                                                <div className="flex gap-2">
                                                    <Button 
                                                        className="w-full" 
                                                        onClick={() => handleExport('pdf', report.title.replace(' Report', ''))}
                                                    >
                                                        <FileDown className="mr-2 h-4 w-4" /> PDF
                                                    </Button>
                                                    <Button 
                                                        className="w-full" 
                                                        variant="secondary"
                                                        onClick={() => handleExport('excel', report.title.replace(' Report', ''))}
                                                    >
                                                        <FileDown className="mr-2 h-4 w-4" /> Excel
                                                    </Button>
                                                </div>
                                            ) : (
                                                <p className="text-sm text-center text-muted-foreground bg-muted/50 p-4 rounded-md">No data available for export.</p>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))}
                             </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
}
