"use client";

import React, { useState } from 'react';
import { tasks as mockTasks } from '@/lib/data.tsx';
import type { Task } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, MoreHorizontal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

type TaskStatus = 'To Do' | 'In Progress' | 'Done';
const columns: TaskStatus[] = ['To Do', 'In Progress', 'Done'];

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

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>(mockTasks);

  const moveTask = (taskId: string, newStatus: TaskStatus) => {
    setTasks(tasks.map(task => task.id === taskId ? { ...task, status: newStatus } : task));
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight font-headline">Tasks</h2>
        <Button><PlusCircle className="mr-2 h-4 w-4" /> New Task</Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {columns.map(status => (
          <div key={status} className="flex flex-col gap-4">
            <h3 className="text-lg font-semibold text-foreground font-headline">{status}</h3>
            <div className="bg-muted/50 rounded-lg p-4 space-y-4 min-h-[300px]">
              {tasks
                .filter(task => task.status === status)
                .map(task => (
                  <TaskCard key={task.id} task={task} onMove={moveTask} />
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TaskCard({ task, onMove }: { task: Task; onMove: (taskId: string, newStatus: TaskStatus) => void }) {
  return (
    <Card className="bg-card shadow-sm hover:shadow-lg transition-shadow cursor-grab">
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <p className="font-semibold text-base flex-1 pr-2">{task.title}</p>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => onMove(task.id, 'To Do')}>To Do</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onMove(task.id, 'In Progress')}>In Progress</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onMove(task.id, 'Done')}>Done</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex items-center justify-between mt-2 text-sm text-muted-foreground">
          <span>Due: {task.dueDate}</span>
          <Badge variant={getPriorityVariant(task.priority)}>
            {task.priority}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
