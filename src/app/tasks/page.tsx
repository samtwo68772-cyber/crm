
"use client";

import React, { useState, useMemo } from 'react';
import { tasks as mockTasks, users as mockUsers, cases as mockCases } from '@/lib/data.tsx';
import type { Task, User, Case } from '@/lib/types';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PlusCircle, Calendar, Flag, ListTodo, Activity, CheckCircle, Pencil, Trash2, Search, Link as LinkIcon } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from "@/hooks/use-toast"

type TaskStatus = 'To Do' | 'In Progress' | 'Done' | 'all';
type TaskPriority = 'High' | 'Medium' | 'Low' | 'all';

function getPriorityVariant(priority: 'High' | 'Medium' | 'Low') {
  switch (priority) {
    case 'High': return 'destructive';
    case 'Medium': return 'yellow';
    case 'Low': return 'green';
    default: return 'default';
  }
}

function getStatusIcon(status: Task['status']) {
    switch (status) {
        case 'To Do': return <ListTodo className="h-4 w-4 text-muted-foreground" />;
        case 'In Progress': return <Activity className="h-4 w-4 text-muted-foreground" />;
        case 'Done': return <CheckCircle className="h-4 w-4 text-muted-foreground" />;
    }
}


export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [statusFilter, setStatusFilter] = useState<TaskStatus>('all');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  
  const handleDeleteTask = (taskId: string) => {
    setTasks(tasks.filter(task => task.id !== taskId));
    toast({
        title: "Task Deleted",
        description: "The task has been successfully deleted.",
    });
  };

  const handleUpdateTask = (updatedTask: Task) => {
    setTasks(tasks.map(task => task.id === updatedTask.id ? updatedTask : task));
    setEditingTask(null);
    toast({
        title: "Task Updated",
        description: `Task "${updatedTask.title}" has been updated.`,
    });
  };
  
  const filteredTasks = useMemo(() => {
     return tasks.filter(task => {
        const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
        const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
        const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              (task.linkedCase && task.linkedCase.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesStatus && matchesPriority && matchesSearch;
     });
  }, [tasks, statusFilter, priorityFilter, searchQuery]);

  const summaryStats = useMemo(() => {
    const toDo = tasks.filter(t => t.status === 'To Do').length;
    const inProgress = tasks.filter(t => t.status === 'In Progress').length;
    const done = tasks.filter(t => t.status === 'Done').length;
    return { toDo, inProgress, done };
  }, [tasks]);

  const statusGroups: Task['status'][] = ['To Do', 'In Progress', 'Done'];

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
        <Card className="cursor-pointer hover:bg-muted/50" onClick={() => setStatusFilter('To Do')}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">To Do</CardTitle>
                <ListTodo className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{summaryStats.toDo}</div>
                <p className="text-xs text-muted-foreground">Tasks not yet started.</p>
            </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50" onClick={() => setStatusFilter('In Progress')}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{summaryStats.inProgress}</div>
                <p className="text-xs text-muted-foreground">Tasks currently being worked on.</p>
            </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50" onClick={() => setStatusFilter('Done')}>
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

       <div className="flex items-center space-x-2">
         <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search tasks or cases..." className="pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={(v: TaskStatus) => setStatusFilter(v)}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="To Do">To Do</SelectItem>
            <SelectItem value="In Progress">In Progress</SelectItem>
            <SelectItem value="Done">Done</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={(v: TaskPriority) => setPriorityFilter(v)}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Priority" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="High">High</SelectItem>
            <SelectItem value="Medium">Medium</SelectItem>
            <SelectItem value="Low">Low</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={() => { setStatusFilter('all'); setPriorityFilter('all'); setSearchQuery('')}}>Clear Filters</Button>
       </div>
       
       <div className="space-y-8">
        {statusGroups.map(status => {
           const tasksInGroup = filteredTasks.filter(t => t.status === status);
           if (tasksInGroup.length === 0 && (statusFilter !== 'all' && statusFilter !== status)) return null;
           
           return (
            <div key={status}>
                <h3 className="text-xl font-semibold tracking-tight mb-4 flex items-center gap-2">
                    {getStatusIcon(status)}
                    {status} 
                    <span className="text-sm font-normal text-muted-foreground">({tasksInGroup.length})</span>
                </h3>
                 {tasksInGroup.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {tasksInGroup.map(task => (
                            <TaskItem key={task.id} task={task} isAdmin={user?.role === 'admin'} onDelete={handleDeleteTask} onEdit={() => setEditingTask(task)} />
                        ))}
                    </div>
                 ) : (
                    <div className="text-center py-8 text-muted-foreground text-sm">No tasks in this category.</div>
                 )}
            </div>
           )
        })}
       </div>

       {editingTask && <EditTaskDialog open={!!editingTask} onOpenChange={() => setEditingTask(null)} task={editingTask} onUpdateTask={handleUpdateTask} />}
    </div>
  );
}

function TaskItem({ task, isAdmin, onDelete, onEdit }: { task: Task; isAdmin: boolean, onDelete: (id: string) => void, onEdit: () => void }) {
    const assignedUser = mockUsers.find(u => u.id === task.assignedTo);
    return (
        <Card className="group relative flex flex-col justify-between">
            <CardHeader>
                <CardTitle className="text-base font-semibold">{task.title}</CardTitle>
            </CardHeader>
            <CardContent>
                 {task.linkedCase && 
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                        <LinkIcon className="h-4 w-4" />
                        <span>Case: {task.linkedCase}</span>
                    </div>
                }
                {assignedUser &&
                     <p className="text-sm text-muted-foreground">Assigned to: {assignedUser.name}</p>
                }
            </CardContent>
            <CardFooter className="flex justify-between items-center">
                 <div className="flex items-center gap-4">
                    <Badge variant={getPriorityVariant(task.priority)} className="flex items-center gap-1">
                        <Flag className="h-3 w-3" />
                        {task.priority}
                    </Badge>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>{task.dueDate}</span>
                    </div>
                </div>
                 {isAdmin && (
                    <div className="absolute right-2 top-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive" onClick={() => onDelete(task.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                )}
            </CardFooter>
        </Card>
    );
}

function EditTaskDialog({ open, onOpenChange, task, onUpdateTask }: { open: boolean, onOpenChange: (open: boolean) => void, task: Task, onUpdateTask: (task: Task) => void }) {
    const [title, setTitle] = useState(task.title);
    const [assignedTo, setAssignedTo] = useState(task.assignedTo || '');
    const [priority, setPriority] = useState<Task['priority']>(task.priority);
    const [linkedCase, setLinkedCase] = useState(task.linkedCase || '');
    const [status, setStatus] = useState<Task['status']>(task.status);
    
    const handleSubmit = () => {
        const updatedTask = { ...task, title, assignedTo, priority, linkedCase, status };
        onUpdateTask(updatedTask);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader><DialogTitle className="font-headline">Edit Task</DialogTitle><DialogDescription>Update the details for this task.</DialogDescription></DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="title" className="text-right">Title</Label><Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="col-span-3" /></div>
                    
                    <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="status" className="text-right">Status</Label>
                        <Select onValueChange={(v: Task['status']) => setStatus(v)} defaultValue={status}><SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="To Do">To Do</SelectItem><SelectItem value="In Progress">In Progress</SelectItem><SelectItem value="Done">Done</SelectItem></SelectContent></Select>
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="priority" className="text-right">Priority</Label>
                        <Select onValueChange={(v: Task['priority']) => setPriority(v)} defaultValue={priority}><SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="High">High</SelectItem><SelectItem value="Medium">Medium</SelectItem><SelectItem value="Low">Low</SelectItem></SelectContent></Select>
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="assignedTo" className="text-right">Assigned To</Label>
                        <Select onValueChange={setAssignedTo} defaultValue={assignedTo}>
                            <SelectTrigger className="col-span-3"><SelectValue placeholder="Select a user" /></SelectTrigger>
                            <SelectContent>{mockUsers.map(user => <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="linkedCase" className="text-right">Linked Case</Label>
                        <Select onValueChange={setLinkedCase} defaultValue={linkedCase}>
                            <SelectTrigger className="col-span-3"><SelectValue placeholder="Select a case" /></SelectTrigger>
                            <SelectContent>{mockCases.map(c => <SelectItem key={c.id} value={c.id}>{c.id} - {c.subject}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter><Button type="submit" onClick={handleSubmit}>Update Task</Button></DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
