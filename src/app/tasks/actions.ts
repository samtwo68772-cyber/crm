
'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import type { Task } from '@/lib/types';
import { createNotification } from '../notifications/actions';
import { getSession } from '@/context/actions';

export async function getTasks() {
  const session = await getSession();
  if (!session?.userId) return [];
  
  const user = await prisma.user.findUnique({ where: { id: session.userId }, include: { role: true } });
  if (!user) return [];

  let whereClause = {};
  if (user.role.name !== 'Admin') {
      whereClause = { assignedTo: user.id };
  }

  return await prisma.task.findMany({
    where: whereClause,
    orderBy: {
      dueDate: 'asc',
    },
  });
}

export async function createTask(data: Omit<Task, 'id' | 'status'>) {
  const newTask = await prisma.task.create({
    data: {
      ...data,
      status: 'To Do',
    },
  });

  if (newTask.assignedTo) {
      await createNotification({
          userId: newTask.assignedTo,
          title: 'New Task Assigned',
          description: `You have been assigned a new task: "${newTask.title}".`,
          link: `/tasks?id=${newTask.id}`,
          type: 'task'
      })
  }

  return newTask;
}

export async function updateTask(id: string, data: Partial<Omit<Task, 'id'>>) {
  const updatedTask = await prisma.task.update({
    where: { id },
    data,
  });

  if (updatedTask.assignedTo && updatedTask.status === 'Done') {
       await createNotification({
          userId: updatedTask.assignedTo,
          title: 'Task Completed',
          description: `The task "${updatedTask.title}" has been completed.`,
          link: `/tasks?id=${updatedTask.id}`,
          type: 'task'
      })
  }
  
  return updatedTask;
}

export async function deleteTask(id: string) {
  const deleted = await prisma.task.delete({
    where: { id },
  });
  return deleted;
}
