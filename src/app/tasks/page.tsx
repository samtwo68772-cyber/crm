
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { useData } from '@/context/data-context';
import type { Task, User, Case } from '@/lib/types';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { PlusCircle, Calendar as CalendarIcon, Flag, ListTodo, Activity, CheckCircle, Pencil, Trash2, Search, Link as LinkIcon, MoreHorizontal } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from "@/hooks/use-toast"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';


type TaskStatusFilter = 'To Do' | 'In Progress' | 'Done' | 'all';
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
    }
}


export default function TasksPage() {
  const { tasks, setTasks, users: mockUsers, cases: mockCases } = useData();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [statusFilter, setStatusFilter] = useState<TaskStatusFilter>('all');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriorityFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
  const isAdmin = user?.role === 'admin';

  const userTasks = useMemo(() => {
    if (isAdmin) {
      return tasks;
    }
    return tasks.filter(task => task.assignedTo === user?.id);
  }, [tasks, user, isAdmin]);
  
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
  
  const handleCreateTask = (newTaskData: Omit<Task, 'id' | 'status'>) => {
    const newTask: Task = {
        id: `task-${Date.now()}`,
        status: 'To Do',
        ...newTaskData,
    };
    setTasks([newTask, ...tasks]);
    setCreateDialogOpen(false);
    toast({
        title: "Task Created",
        description: `Task "${newTask.title}" has been successfully created.`,
    });
  };
  
  const filteredTasks = useMemo(() => {
     return userTasks.filter(task => {
        const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
        const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
        const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              (task.linkedCase && mockCases.find(c => c.id === task.linkedCase)?.subject.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesStatus && matchesPriority && matchesSearch;
     });
  }, [userTasks, statusFilter, priorityFilter, searchQuery, mockCases]);

  const summaryStats = useMemo(() => {
    const toDo = userTasks.filter(t => t.status === 'To Do').length;
    const inProgress = userTasks.filter(t => t.status === 'In Progress').length;
    const done = userTasks.filter(t => t.status === 'Done').length;
    return { toDo, inProgress, done };
  }, [userTasks]);

  const statusGroups: Task['status'][] = ['To Do', 'In Progress', 'Done'];

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
            <h2 className="text-3xl font-bold tracking-tight font-headline">Tasks</h2>
            <p className="text-muted-foreground">Manage all assigned tasks and track performance.</p>
        </div>
        {isAdmin && <Button onClick={() => setCreateDialogOpen(true)}><PlusCircle className="mr-2 h-4 w-4" /> New Task</Button>}
      </div>
      
      <div className="grid gap-4 md:grid-cols-3">
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
        <Select value={statusFilter} onValueChange={(v: TaskStatusFilter) => setStatusFilter(v)}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="To Do">To Do</SelectItem>
            <SelectItem value="In Progress">In Progress</SelectItem>
            <SelectItem value="Done">Done</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={(v: TaskPriorityFilter) => setPriorityFilter(v)}>
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
           if (statusFilter !== 'all' && statusFilter !== status && tasksInGroup.length === 0) return null;
           
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
                            <TaskItem key={task.id} task={task} onEdit={() => setEditingTask(task)} onDelete={handleDeleteTask} onUpdate={handleUpdateTask} />
                        ))}
                    </div>
                 ) : (
                    <div className="text-center py-8 text-muted-foreground text-sm">No tasks in this category.</div>
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
              handleUpdateTask({ ...editingTask, ...taskData });
            } else {
              handleCreateTask(taskData);
            }
          }}
       />
    </div>
  );
}

function TaskItem({ task, onDelete, onEdit, onUpdate }: { task: Task; onDelete: (id: string) => void; onEdit: () => void; onUpdate: (task: Task) => void; }) {
    const { user } = useAuth();
    const { users: mockUsers, cases: mockCases } = useData();
    const assignedUser = mockUsers.find(u => u.id === task.assignedTo);
    const linkedCase = mockCases.find(c => c.id === task.linkedCase);
    const isAdmin = user?.role === 'admin';

    const handleStatusChange = (newStatus: Task['status']) => {
        onUpdate({ ...task, status: newStatus });
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
                        <span>{task.dueDate}</span>
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
}

function TaskDialog({ open, onOpenChange, task, onSave }: TaskDialogProps) {
    const { users: mockUsers, cases: mockCases } = useData();
    const isEditMode = task !== null;
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState<Task['priority']>('Medium');
    const [dueDate, setDueDate] = useState<Date | undefined>();
    const [assignedTo, setAssignedTo] = useState<string | undefined>();
    const [linkedCase, setLinkedCase] = useState<string | undefined>();
    
    const staffOptions = useMemo(() => mockUsers.filter(u => u.role === 'staff' || u.role === 'admin').map(u => ({ label: u.name, value: u.id })), [mockUsers]);
    const caseOptions = useMemo(() => mockCases.map(c => ({ label: `${c.id} - ${c.subject}`, value: c.id })), [mockCases]);

    useEffect(() => {
        if (isEditMode && task) {
            setTitle(task.title);
            setDescription(task.description || '');
            setPriority(task.priority);
            setDueDate(task.dueDate ? new Date(task.dueDate) : undefined);
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
        setDueDate(undefined);
        setAssignedTo(undefined);
        setLinkedCase(undefined);
    };

    const handleSubmit = () => {
        if (!title) {
            // Basic validation
            alert("Title is required.");
            return;
        }
        onSave({ 
            title, 
            description, 
            priority, 
            dueDate: dueDate ? format(dueDate, 'yyyy-MM-dd') : '', 
            assignedTo, 
            linkedCase 
        }, isEditMode);
        
        if (!isEditMode) {
            resetForm();
        }
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle className="font-headline">{isEditMode ? 'Edit Task' : 'Create New Task'}</DialogTitle>
                    <DialogDescription>{isEditMode ? 'Update the details for this task.' : 'Fill in the details for the new task below.'}</DialogDescription>
                </DialogHeader>
                <div className="grid gap-6 py-4">
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
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="assignedTo">Assigned Staff</Label>
                        <Select onValueChange={setAssignedTo} value={assignedTo}>
                            <SelectTrigger><SelectValue placeholder="Select staff..." /></SelectTrigger>
                            <SelectContent>
                                {staffOptions.map(u => <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="linkedCase">Linked Case (Optional)</Label>
                        <Select onValueChange={setLinkedCase} value={linkedCase}>
                            <SelectTrigger><SelectValue placeholder="Select a case to link" /></SelectTrigger>
                            <SelectContent>
                                {caseOptions.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button type="submit" onClick={handleSubmit}>{isEditMode ? 'Save Changes' : 'Create Task'}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
