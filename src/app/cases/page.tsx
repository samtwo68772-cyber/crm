
"use client";

import React, { useState } from 'react';
import { cases as mockCases, users as mockUsers } from '@/lib/data.tsx';
import type { Case, User } from '@/lib/types';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger, DropdownMenuPortal } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, PlusCircle, FileText, Clock, User as UserIcon, MessageSquare } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

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

export default function CasesPage() {
  const [cases, setCases] = useState<Case[]>(mockCases);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
  const { user } = useAuth();

  const handleCreateCase = (newCaseData: Omit<Case, 'id' | 'createdAt'>) => {
    const newCase: Case = {
      id: `case-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
      ...newCaseData
    };
    setCases([newCase, ...cases]);
    setCreateDialogOpen(false);
  };
  
  const handleAssignCase = (caseId: string, userId: string) => {
    const assignedUser = mockUsers.find(u => u.id === userId);
    if (!assignedUser) return;
    setCases(cases.map(c => c.id === caseId ? { ...c, assignedTo: assignedUser.name } : c));
  };
  
  const displayedCases = user?.role === 'admin' ? cases : cases.filter(c => c.assignedTo === user?.name);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight font-headline">Cases Management</h2>
        <Button onClick={() => setCreateDialogOpen(true)}><PlusCircle className="mr-2 h-4 w-4" /> Create Case</Button>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex flex-1 items-center space-x-2">
          <Input placeholder="Filter cases..." className="max-w-sm" />
          <Select>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
          <Select>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Subject</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayedCases.map((caseItem) => (
              <TableRow key={caseItem.id} onClick={() => setSelectedCase(caseItem)} className="cursor-pointer">
                <TableCell className="font-medium">{caseItem.subject}</TableCell>
                <TableCell>{caseItem.customer}</TableCell>
                <TableCell><Badge variant={getPriorityVariant(caseItem.priority)}>{caseItem.priority}</Badge></TableCell>
                <TableCell><Badge variant="outline">{caseItem.status}</Badge></TableCell>
                <TableCell>{caseItem.assignedTo}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0" onClick={(e) => e.stopPropagation()}><MoreHorizontal className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => setSelectedCase(caseItem)}>View details</DropdownMenuItem>
                       {user?.role === 'admin' && (
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger>Assign to</DropdownMenuSubTrigger>
                          <DropdownMenuPortal>
                            <DropdownMenuSubContent>
                              {mockUsers.filter(u => u.role === 'staff').map(staff => (
                                <DropdownMenuItem key={staff.id} onClick={() => handleAssignCase(caseItem.id, staff.id)}>
                                  {staff.name}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuSubContent>
                          </DropdownMenuPortal>
                        </DropdownMenuSub>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Sheet open={!!selectedCase} onOpenChange={(open) => !open && setSelectedCase(null)}>
        <SheetContent className="sm:max-w-lg w-[80vw] p-0">
          {selectedCase && <CaseDetailPanel caseItem={selectedCase} />}
        </SheetContent>
      </Sheet>

      <CreateCaseDialog open={isCreateDialogOpen} onOpenChange={setCreateDialogOpen} onCreate={handleCreateCase} />
    </div>
  );
}

function CaseDetailPanel({ caseItem }: { caseItem: Case }) {
  return (
    <div className="flex flex-col h-full">
        <SheetHeader className="p-6 border-b">
        <SheetTitle className="font-headline text-2xl">{caseItem.subject}</SheetTitle>
        <SheetDescription>
            From {caseItem.customer} ({caseItem.email})
        </SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="space-y-4">
                <h4 className="font-semibold">Details</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground"><Clock className="h-4 w-4" /> Created:</div>
                    <div>{caseItem.createdAt}</div>
                    <div className="flex items-center gap-2 text-muted-foreground"><UserIcon className="h-4 w-4" /> Assigned to:</div>
                    <div>{caseItem.assignedTo}</div>
                    <div className="flex items-center gap-2 text-muted-foreground">Status:</div>
                    <div><Badge variant="outline">{caseItem.status}</Badge></div>
                    <div className="flex items-center gap-2 text-muted-foreground">Priority:</div>
                    <div><Badge variant={getPriorityVariant(caseItem.priority)}>{caseItem.priority}</Badge></div>
                </div>
            </div>
            <div className="space-y-4">
                <h4 className="font-semibold">Description</h4>
                <p className="text-sm text-muted-foreground">{caseItem.description}</p>
            </div>
            <div className="space-y-4">
                <h4 className="font-semibold">Timeline & Notes</h4>
                <div className="space-y-4">
                    <div className="flex items-start gap-4">
                        <MessageSquare className="h-5 w-5 text-muted-foreground mt-1" />
                        <div className="w-full">
                            <Textarea placeholder="Add an internal note..." />
                            <Button className="mt-2">Add Note</Button>
                        </div>
                    </div>
                </div>
            </div>
            <div className="space-y-4">
                <h4 className="font-semibold">Attachments</h4>
                <Button variant="outline"><FileText className="mr-2 h-4 w-4" /> Add attachment</Button>
            </div>
        </div>
    </div>
  );
}

function CreateCaseDialog({ open, onOpenChange, onCreate }: { open: boolean, onOpenChange: (open: boolean) => void, onCreate: (data: any) => void }) {
  const [subject, setSubject] = useState('');
  const [customer, setCustomer] = useState('');
  const [email, setEmail] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [status, setStatus] = useState('New');

  const handleSubmit = () => {
    onCreate({ subject, customer, email, description, priority, status, assignedTo: 'Unassigned' });
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-headline">Create New Case</DialogTitle>
          <DialogDescription>Fill in the details for the new support case.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="subject" className="text-right">Subject</Label>
            <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="customer" className="text-right">Customer</Label>
            <Input id="customer" value={customer} onChange={(e) => setCustomer(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">Description</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="col-span-3" />
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="priority" className="text-right">Priority</Label>
             <Select onValueChange={setPriority} defaultValue={priority}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                </SelectContent>
              </Select>
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSubmit}>Create Case</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
