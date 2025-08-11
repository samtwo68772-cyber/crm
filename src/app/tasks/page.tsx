
"use client";

import React, { useState, useMemo } from 'react';
import { tasks as mockTasks } from '@/lib/data.tsx';
import type { Task } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, PlusCircle, Calendar, Flag } from 'lucide-react';
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
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const handleStatusChange = (taskId: string, newStatus: TaskStatus) => {
    setTasks(tasks.map(task => task.id === taskId ? { ...task, status: newStatus } : task));
  };
  
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
      const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesPriority && matchesSearch;
    });
  }, [tasks, statusFilter, priorityFilter, searchQuery]);

  const groupedTasks = useMemo(() => {
    return statusGroups.map(status => ({
      status,
      tasks: filteredTasks.filter(task => task.status === status)
    })).filter(group => statusFilter === 'all' || group.status === statusFilter);
  }, [filteredTasks, statusFilter]);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight font-headline">Tasks</h2>
        <Button><PlusCircle className="mr-2 h-4 w-4" /> New Task</Button>
      </div>
      <div className="flex items-center justify-between">
         <div className="flex flex-1 items-center space-x-2">
            <Input placeholder="Filter tasks by title..." className="max-w-sm" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
             <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="To Do">To Do</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Done">Done</SelectItem>
                </SelectContent>
            </Select>
             <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => { setStatusFilter('all'); setPriorityFilter('all'); setSearchQuery(''); }}>Clear Filters</Button>
        </div>
      </div>
       <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {groupedTasks.map(group => (
            <Card key={group.status} className="h-fit">
                <CardHeader className="border-b">
                    <CardTitle className="flex items-center justify-between">
                        <span>{group.status}</span>
                        <Badge variant="secondary">{group.tasks.length}</Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                    {group.tasks.length > 0 ? group.tasks.map(task => (
                         <div key={task.id} className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                           <div className="flex justify-between items-start">
                             <p className="font-medium leading-snug pr-4">{task.title}</p>
                             <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-7 w-7 p-0 -mr-2 -mt-1"><MoreHorizontal className="h-4 w-4" /></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                                  <DropdownMenuItem onClick={() => handleStatusChange(task.id, 'To Do')}>To Do</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleStatusChange(task.id, 'In Progress')}>In Progress</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleStatusChange(task.id, 'Done')}>Done</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                           </div>
                           <div className="flex items-center justify-between mt-2 text-sm text-muted-foreground">
                               <div className="flex items-center gap-2">
                                   <Calendar className="h-4 w-4" />
                                   <span>{task.dueDate}</span>
                               </div>
                               <Badge variant={getPriorityVariant(task.priority)} className="flex items-center gap-1">
                                 <Flag className="h-3 w-3" />
                                 {task.priority}
                               </Badge>
                           </div>
                         </div>
                    )) : (
                        <p className="text-sm text-muted-foreground text-center py-4">No tasks in this category.</p>
                    )}
                </CardContent>
            </Card>
        ))}
      </div>
    </div>
  );
}
