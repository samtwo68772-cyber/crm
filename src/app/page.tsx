"use client";

import { useAuth } from '@/context/auth-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BarChart, Briefcase, Users, CheckCircle, Clock } from 'lucide-react';
import { recentActivities, userCases, adminStats } from '@/lib/data.tsx';
import type { Case } from '@/lib/types';


function getPriorityVariant(priority: 'High' | 'Medium' | 'Low') {
  switch (priority) {
    case 'High':
      return 'high';
    case 'Medium':
      return 'medium';
    case 'Low':
      return 'low';
    default:
      return 'default';
  }
}

export default function DashboardPage() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight font-headline">Dashboard</h2>
      </div>
      {user.role === 'admin' ? <AdminDashboard /> : <StaffDashboard />}
    </div>
  );
}

function AdminDashboard() {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {adminStats.map((stat, index) => (
            <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                    {stat.icon}
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <p className="text-xs text-muted-foreground">{stat.change}</p>
                </CardContent>
            </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Recent System Activity</CardTitle>
          <CardDescription>An overview of the latest activities in the system.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentActivities.map((activity) => (
                <TableRow key={activity.id}>
                  <TableCell>{activity.user}</TableCell>
                  <TableCell>
                    <Badge variant={activity.action === 'Created' ? 'default' : 'secondary'} className={activity.action === 'Updated' ? 'bg-accent text-accent-foreground' : ''}>{activity.action}</Badge>
                  </TableCell>
                  <TableCell>{activity.details}</TableCell>
                  <TableCell>{activity.timestamp}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}


function StaffDashboard() {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Open Cases</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">3 high priority</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasks Due Today</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground">2 overdue</p>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>My Assigned Cases</CardTitle>
          <CardDescription>Here are the cases that require your attention.</CardDescription>
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
              {userCases.map((caseItem: Case) => (
                <TableRow key={caseItem.id}>
                  <TableCell className="font-medium">{caseItem.subject}</TableCell>
                  <TableCell>{caseItem.customer}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{caseItem.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getPriorityVariant(caseItem.priority)}>
                      {caseItem.priority}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  )
}
