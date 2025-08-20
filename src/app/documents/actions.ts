
'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import type { Document } from '@/lib/types';
import { createNotification } from '../notifications/actions';

export async function getDocuments() {
  return await prisma.document.findMany({
    orderBy: {
      uploadedAt: 'desc',
    },
  });
}

export async function createDocument(data: Omit<Document, 'id' | 'uploadedBy' | 'uploadedAt' | 'caseId' | 'accountId'> & {linkedToId?: string; linkedToType?: 'Case' | 'Account'}, userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  
  const { linkedToId, linkedToType, ...docData } = data;

  const createData: any = {
      ...docData,
      uploadedBy: user?.name || 'System',
      uploadedAt: new Date().toISOString(),
  };

  if (linkedToId && linkedToType) {
      if (linkedToType === 'Case') {
          createData.case = { connect: { id: linkedToId }};
      } else if (linkedToType === 'Account') {
          createData.account = { connect: { id: linkedToId }};
      }
  }

  const newDocument = await prisma.document.create({
    data: createData,
  });

  // revalidatePath('/documents');
  
  // Example notification, could be refined
  await createNotification({
    title: 'New Document Uploaded',
    description: `"${newDocument.name}" was uploaded by ${newDocument.uploadedBy}.`,
    link: '/documents',
    type: 'case' // generic type
  });

  return newDocument;
}

export async function updateDocument(id: string, data: Partial<Omit<Document, 'id'>>) {
  const updatedDocument = await prisma.document.update({
    where: { id },
    data,
  });
  // revalidatePath('/documents');
  return updatedDocument;
}

export async function deleteDocument(id: string) {
  const deleted = await prisma.document.delete({
    where: { id },
  });
  // revalidatePath('/documents');
  return deleted;
}
