
"use client";

import React, { useState, useMemo } from 'react';
import { tasks as mockTasks } from '@/lib/data.tsx';
import type { Task } from '@/lib/types';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { MoreHorizontal, PlusCircle, Calendar, Flag, ListTodo, Activity, CheckCircle, Pencil, Trash2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type TaskStatus = 'To Do' | 'In Progress' | 'Done';

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

const statusGroups: TaskStatus[] = ['To Do', 'In Progress', 'Done'];

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const { user } = useAuth();
  
  const handleStatusChange = (taskId: string, newStatus: TaskStatus) => {
    setTasks(tasks.map(task => task.id === taskId ? { ...task, status: newStatus } : task));
  };
  
  const summaryStats = useMemo(() => {
    const toDo = tasks.filter(t => t.status === 'To Do').length;
    const inProgress = tasks.filter(t => t.status === 'In Progress').length;
    const done = tasks.filter(t => t.status === 'Done').length;
    return { toDo, inProgress, done };
  }, [tasks]);

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
            <h2 className="text-3xl font-bold tracking-tight font-headline">Tasks</h2>
            <p className="text-muted-foreground">Manage all assigned tasks and track performance.</p>
        </div>
        <Button><PlusCircle className="mr-2 h-4 w-4" /> New Task</Button>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">To Do</CardTitle>
                <ListTodo className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{summaryStats.toDo}</div>
                <p className="text-xs text-muted-foreground">Tasks not yet started.</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{summaryStats.inProgress}</div>
                <p className="text-xs text-muted-foreground">Tasks currently being worked on.</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Done</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{summaryStats.done}</div>
                <p className="text-xs text-muted-foreground">Tasks completed.</p>
            </CardContent>
        </Card>
      </div>

       <div className="space-y-4">
        {statusGroups.map(status => (
            <div key={status}>
                <h3 className="text-xl font-semibold tracking-tight mb-3">{status} ({tasks.filter(t => t.status === status).length})</h3>
                <Accordion type="single" collapsible className="w-full space-y-2">
                    {tasks.filter(t => t.status === status).map(task => (
                        <TaskItem key={task.id} task={task} isAdmin={user?.role === 'admin'} />
                    ))}
                </Accordion>
            </div>
        ))}
       </div>
    </div>
  );
}

function TaskItem({ task, isAdmin }: { task: Task; isAdmin: boolean }) {
    return (
        <Card className="group relative">
            <AccordionItem value={task.id} className="border-0">
                <AccordionTrigger className="p-4 hover:no-underline">
                     <div className="flex items-center justify-between w-full">
                        <div className="text-left">
                            <p className="font-semibold">{task.title}</p>
                            {task.linkedCase && <p className="text-sm text-muted-foreground mt-1">Case: {task.linkedCase}</p>}
                        </div>
                        <div className="flex items-center gap-4 pr-12">
                            <Badge variant={getPriorityVariant(task.priority)} className="flex items-center gap-1">
                                <Flag className="h-3 w-3" />
                                {task.priority}
                            </Badge>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Calendar className="h-4 w-4" />
                                <span>{task.dueDate}</span>
                            </div>
                        </div>
                    </div>
                </AccordionTrigger>
                <AccordionContent>
                    <div className="p-4 pt-0 border-t">
                        <p className="text-muted-foreground">Task details and attachments would be displayed here.</p>
                    </div>
                </AccordionContent>
            </AccordionItem>
             {isAdmin && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-8 w-8"><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                </div>
            )}
        </Card>
    );
}
