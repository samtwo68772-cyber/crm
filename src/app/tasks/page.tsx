

"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { getTasks, createTask, updateTask, deleteTask } from './actions';
import { getUsers } from '../admin/actions';
import { getCases } from '../cases/actions';
import type { Task, User, Case, Team } from '@/lib/types';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { PlusCircle, Calendar as CalendarIcon, Flag, ListTodo, Activity, CheckCircle, Pencil, Trash2, Search, Link as LinkIcon, MoreHorizontal, XCircle, X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from "@/hooks/use-toast"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, parseISO } from 'date-fns';
import { useSearchParams } from 'next/navigation';
import { useIsMobile } from '@/hooks/use-mobile';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { getTeams } from '../admin/actions';
import { AssigneePicker } from '@/components/ui/assignee-picker';

type TaskStatusFilter = 'To Do' | 'In Progress' | 'Done' | 'Canceled' | 'all' | 'pending';
type TaskPriorityFilter = 'High' | 'Medium' | 'Low' | 'all';

function getPriorityVariant(priority: 'High' | 'Medium' | 'Low') {
  switch (priority) {
    case 'High': return 'high';
    case 'Medium': return 'medium';
    case 'Low': return 'low';
    default: return 'default';
  }
}

function getStatusIcon(status: Task['status']) {
    switch (status) {
        case 'To Do': return <ListTodo className="h-4 w-4 text-muted-foreground" />;
        case 'In Progress': return <Activity className="h-4 w-4 text-muted-foreground" />;
        case 'Done': return <CheckCircle className="h-4 w-4 text-muted-foreground" />;
        case 'Canceled': return <XCircle className="h-4 w-4 text-muted-foreground" />;
    }
}


export default function TasksPage() {
  const queryClient = useQueryClient();
  const { data: tasks, isLoading: tasksLoading } = useQuery<Task[]>({ queryKey: ['tasks'], queryFn: getTasks });
  const { data: users, isLoading: usersLoading } = useQuery<User[]>({ queryKey: ['users'], queryFn: getUsers });
  const { data: teams, isLoading: teamsLoading } = useQuery<Team[]>({ queryKey: ['teams'], queryFn: getTeams });
  const { data: cases, isLoading: casesLoading } = useQuery<Case[]>({ queryKey: ['cases'], queryFn: getCases });
  const isLoading = tasksLoading || usersLoading || casesLoading || teamsLoading;

  const { user } = useAuth();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  
  const [statusFilter, setStatusFilter] = useState<TaskStatusFilter>('all');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriorityFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    const status = searchParams.get('status') as TaskStatusFilter;
    if (status === 'pending') {
      setStatusFilter('pending');
    }
  }, [searchParams]);

  const userTasks = useMemo(() => {
    if (!tasks) return [];
    if (isAdmin) {
      return tasks;
    }
    return tasks.filter(task => task.assignedTo === user?.id);
  }, [tasks, user, isAdmin]);
  
  const createTaskMutation = useMutation({
      mutationFn: createTask,
      onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['tasks'] });
          toast({ title: "Task Created", description: "A new task has been created." });
          setCreateDialogOpen(false);
      },
      onError: (error) => {
          toast({ variant: 'destructive', title: 'Error', description: error.message });
      }
  })

  const updateTaskMutation = useMutation({
      mutationFn: (data: { id: string; data: Partial<Task> }) => updateTask(data.id, data.data),
      onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['tasks'] });
          toast({ title: "Task Updated", description: "The task has been updated." });
          setEditingTask(null);
      },
      onError: (error) => {
          toast({ variant: 'destructive', title: 'Error', description: error.message });
      }
  })

    const deleteTaskMutation = useMutation({
        mutationFn: deleteTask,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            toast({ title: "Task Deleted", description: "The task has been deleted." });
        },
        onError: (error) => {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        }
    })

    const handleDeleteTask = (taskId: string) => {
        deleteTaskMutation.mutate(taskId);
    };

    const handleUpdateTask = (updatedTaskData: Partial<Task> & {id: string}, oldStatus?: Task['status']) => {
        updateTaskMutation.mutate({ id: updatedTaskData.id, data: updatedTaskData });
    };

    const handleCreateTask = (newTaskData: Omit<Task, 'id' | 'status'>) => {
        createTaskMutation.mutate(newTaskData);
    };
  
  const filteredTasks = useMemo(() => {
     if (!userTasks || !cases) return [];
     return userTasks.filter(task => {
        const matchesStatus = statusFilter === 'all' || 
                              (statusFilter === 'pending' && (task.status === 'To Do' || task.status === 'In Progress')) ||
                              task.status === statusFilter;
        const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
        const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              (task.linkedCase && cases.find(c => c.id === task.linkedCase)?.subject.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesStatus && matchesPriority && matchesSearch;
     });
  }, [userTasks, statusFilter, priorityFilter, searchQuery, cases]);

  const summaryStats = useMemo(() => {
    if (!userTasks) return { toDo: 0, inProgress: 0, done: 0 };
    const toDo = userTasks.filter(t => t.status === 'To Do').length;
    const inProgress = userTasks.filter(t => t.status === 'In Progress').length;
    const done = userTasks.filter(t => t.status === 'Done').length;
    return { toDo, inProgress, done };
  }, [userTasks]);

  const statusGroups: Task['status'][] = ['To Do', 'In Progress', 'Done', 'Canceled'];
  
  if (isLoading) {
      return (
        <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
            <Skeleton className="h-10 w-1/3" />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Skeleton className="h-28 w-full" />
                <Skeleton className="h-28 w-full" />
                <Skeleton className="h-28 w-full" />
            </div>
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-64 w-full" />
        </div>
      )
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
            <h2 className="text-3xl font-bold tracking-tight font-headline">Tasks</h2>
            <p className="text-muted-foreground">Manage all assigned tasks and track performance.</p>
        </div>
        {isAdmin && <Button onClick={() => setCreateDialogOpen(true)} className="w-full sm:w-auto"><PlusCircle className="mr-2 h-4 w-4" /> New Task</Button>}
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

       <div className="flex flex-col md:flex-row items-center gap-2">
         <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search tasks or cases..." className="pl-9 w-full" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={(v: TaskStatusFilter) => setStatusFilter(v)}>
          <SelectTrigger className="w-full md:w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="To Do">To Do</SelectItem>
            <SelectItem value="In Progress">In Progress</SelectItem>
            <SelectItem value="Done">Done</SelectItem>
            <SelectItem value="Canceled">Canceled</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={(v: TaskPriorityFilter) => setPriorityFilter(v)}>
          <SelectTrigger className="w-full md:w-[180px]"><SelectValue placeholder="Priority" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="High">High</SelectItem>
            <SelectItem value="Medium">Medium</SelectItem>
            <SelectItem value="Low">Low</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" className="w-full md:w-auto" onClick={() => { setStatusFilter('all'); setPriorityFilter('all'); setSearchQuery('')}}><X className="mr-2 h-4 w-4"/>Clear</Button>
       </div>
       
       <div className="space-y-8">
        {statusGroups.map(status => {
           const tasksInGroup = filteredTasks.filter(t => t.status === status);
           if (statusFilter !== 'all' && statusFilter !== 'pending' && statusFilter !== status ) {
               return null;
           }
           if (statusFilter === 'pending' && (status === 'Done' || status === 'Canceled')) return null;
           if (tasksInGroup.length === 0 && statusFilter !== 'all' && status !== 'all' && filteredTasks.length > 0) return null;
           
           return (
            <div key={status}>
                <h3 className="text-lg font-semibold tracking-tight flex items-center gap-2 mb-4">
                    {getStatusIcon(status)}
                    {status} 
                    <span className="text-sm font-normal text-muted-foreground">({tasksInGroup.length})</span>
                </h3>
                 {tasksInGroup.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {tasksInGroup.map(task => (
                            <TaskItem key={task.id} task={task} onEdit={() => setEditingTask(task)} onDelete={handleDeleteTask} onUpdate={handleUpdateTask} users={users || []} cases={cases || []} />
                        ))}
                    </div>
                 ) : (
                    <div className="text-center py-8 text-muted-foreground text-sm border-2 border-dashed rounded-lg">No tasks in this category.</div>
                 )}
            </div>
           )
        })}
       </div>

       <TaskDialog
          key={editingTask ? editingTask.id : 'create'}
          open={isCreateDialogOpen || !!editingTask}
          onOpenChange={(open) => {
            if (!open) {
              setCreateDialogOpen(false);
              setEditingTask(null);
            }
          }}
          task={editingTask}
          onSave={(taskData, isEdit) => {
            if (isEdit && editingTask) {
              handleUpdateTask({ ...editingTask, ...taskData }, editingTask.status);
            } else {
              handleCreateTask(taskData);
            }
          }}
          users={users || []}
          teams={teams || []}
          cases={cases || []}
       />
    </div>
  );
}

function TaskItem({ task, onDelete, onEdit, onUpdate, users, cases }: { task: Task; onDelete: (id: string) => void; onEdit: () => void; onUpdate: (task: Partial<Task> & {id: string}, oldStatus?: Task['status']) => void; users: User[], cases: Case[] }) {
    const { user } = useAuth();
    const assignedUser = users.find(u => u.id === task.assignedTo);
    const linkedCase = cases.find(c => c.id === task.linkedCase);
    const isAdmin = user?.role === 'admin';

    const handleStatusChange = (newStatus: Task['status']) => {
        onUpdate({ id: task.id, status: newStatus }, task.status);
    };

    return (
        <Card className="group relative flex flex-col justify-between">
            <CardHeader>
                <CardTitle className="text-base font-semibold">{task.title}</CardTitle>
            </CardHeader>
            <CardContent>
                 {linkedCase && 
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                        <LinkIcon className="h-4 w-4" />
                        <span>Case: {linkedCase.subject}</span>
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
                        <CalendarIcon className="h-4 w-4" />
                        <span>{format(parseISO(task.dueDate), "PPP")}</span>
                    </div>
                </div>
                 <div className="absolute right-2 top-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {isAdmin ? (
                        <>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}><Pencil className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive" onClick={() => onDelete(task.id)}><Trash2 className="h-4 w-4" /></Button>
                        </>
                    ) : (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleStatusChange('To Do')}>To Do</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleStatusChange('In Progress')}>In Progress</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleStatusChange('Done')}>Done</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                 </div>
            </CardFooter>
        </Card>
    );
}

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null;
  onSave: (data: any, isEdit: boolean) => void;
  users: User[];
  teams: Team[];
  cases: Case[];
}

function TaskDialog({ open, onOpenChange, task, onSave, users, teams, cases }: TaskDialogProps) {
    const isEditMode = task !== null;
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState<Task['priority']>('Medium');
    const [status, setStatus] = useState<Task['status']>('To Do');
    const [dueDate, setDueDate] = useState<Date | undefined>();
    const [assignedTo, setAssignedTo] = useState<string | undefined>();
    const [linkedCase, setLinkedCase] = useState<string | undefined>();
    
    const caseOptions = useMemo(() => cases.map(c => ({ label: `${c.id} - ${c.subject}`, value: c.id, disabled: ['Resolved', 'Closed', 'Completed'].includes(c.status) })), [cases]);

    useEffect(() => {
        if (isEditMode && task) {
            setTitle(task.title);
            setDescription(task.description || '');
            setPriority(task.priority);
            setStatus(task.status);
            setDueDate(task.dueDate ? parseISO(task.dueDate) : undefined);
            setAssignedTo(task.assignedTo || undefined);
            setLinkedCase(task.linkedCase || undefined);
        } else {
            resetForm();
        }
    }, [task, isEditMode, open]);

    const resetForm = () => {
        setTitle('');
        setDescription('');
        setPriority('Medium');
        setStatus('To Do');
        setDueDate(undefined);
        setAssignedTo(undefined);
        setLinkedCase(undefined);
    };

    const handleSubmit = () => {
        if (!title) {
            alert("Title is required.");
            return;
        }
        onSave({ 
            title, 
            description, 
            priority, 
            status,
            dueDate: dueDate ? format(dueDate, 'yyyy-MM-dd') : '', 
            assignedTo, 
            linkedCase 
        }, isEditMode);
        
        if (!isEditMode) {
            resetForm();
        }
    };

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px] flex flex-col max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="font-headline">{isEditMode ? 'Edit Task' : 'Create New Task'}</DialogTitle>
            <DialogDescription>{isEditMode ? 'Update the details for this task.' : 'Fill in the details for the new task below.'}</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto pr-6 -mr-6">
            <div className="grid gap-6 py-4 ">
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Follow up with client" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Add a detailed description..." />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select onValueChange={(v: Task['priority']) => setPriority(v)} value={priority}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Low">Low</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="status">Status</Label>
                  <Select onValueChange={(v: Task['status']) => setStatus(v)} value={status}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="To Do">To Do</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="Done">Done</SelectItem>
                      <SelectItem value="Canceled">Canceled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={`w-full justify-start text-left font-normal ${!dueDate && "text-muted-foreground"}`}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dueDate ? format(dueDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={dueDate}
                        onSelect={setDueDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="assignedTo">Assigned Staff</Label>
                  <AssigneePicker
                    users={users}
                    teams={teams}
                    selectedAssignees={assignedTo ? [`user-${assignedTo}`] : []}
                    onChange={(assignees) => setAssignedTo(assignees.length > 0 ? assignees[0].replace('user-','') : undefined)}
                    mode="single"
                   />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="linkedCase">Linked Case (Optional)</Label>
                <Select onValueChange={setLinkedCase} value={linkedCase} disabled={isEditMode && !!task?.linkedCase}>
                  <SelectTrigger><SelectValue placeholder="Select a case to link" /></SelectTrigger>
                  <SelectContent>
                    {caseOptions.map(c => <SelectItem key={c.value} value={c.value} disabled={c.disabled}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter className="mt-auto pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" onClick={handleSubmit}>{isEditMode ? 'Save Changes' : 'Create Task'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
}
