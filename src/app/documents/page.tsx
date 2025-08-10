
"use client";

import React from 'react';
import { documents as mockDocuments } from '@/lib/data.tsx';
import type { Document } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MoreHorizontal, PlusCircle, File, FileText, FileSpreadsheet, Image } from 'lucide-react';

function getFileIcon(type: Document['type']) {
    switch (type) {
        case 'PDF': return <FileText className="h-5 w-5 text-destructive" />;
        case 'Document': return <File className="h-5 w-5 text-primary" />;
        case 'Spreadsheet': return <FileSpreadsheet className="h-5 w-5 text-green-600" />;
        case 'Image': return <Image className="h-5 w-5 text-accent" />;
        default: return <File className="h-5 w-5" />;
    }
}

export default function DocumentsPage() {
  const [documents, setDocuments] = React.useState<Document[]>(mockDocuments);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight font-headline">Documents</h2>
        <Button><PlusCircle className="mr-2 h-4 w-4" /> Upload Document</Button>
      </div>
      <div className="flex items-center justify-between">
        <Input placeholder="Filter documents..." className="max-w-sm" />
      </div>
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Uploaded At</TableHead>
              <TableHead>Linked To</TableHead>
              <TableHead><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.map((doc) => (
              <TableRow key={doc.id}>
                <TableCell className="font-medium flex items-center gap-2">
                    {getFileIcon(doc.type)}
                    {doc.name}
                </TableCell>
                <TableCell>{doc.type}</TableCell>
                <TableCell>{doc.size}</TableCell>
                <TableCell>{doc.uploadedAt}</TableCell>
                <TableCell>{doc.linkedTo}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Download</DropdownMenuItem>
                      <DropdownMenuItem>View details</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
