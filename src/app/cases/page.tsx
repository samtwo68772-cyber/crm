
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import type { DateRange } from "react-day-picker"
import { useData } from '@/context/data-context';
import type { Case, User, Communication, Task, Notification } from '@/lib/types';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuPortal, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetClose } from '@/components/ui/sheet';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, PlusCircle, FileText, Clock, User as UserIcon, MessageSquare, Upload, Send, CheckCircle, XCircle, Undo, Check, ShieldQuestion, PenSquare, Shield, AlertTriangle, ListTodo, Paperclip, Search, X, ArrowLeft } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from "@/hooks/use-toast"
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { format, isWithinInterval, subDays, addDays } from 'date-fns';
import { useSearchParams } from 'next/navigation';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

function getPriorityVariant(priority: 'High' | 'Medium' | 'Low') {
  switch (priority) {
    case 'High': return 'high';
    case 'Medium': return 'medium';
    case 'Low': return 'low';
    default: return 'default';
  }
}

function getStatusVariant(status: Case['status']) {
    switch (status) {
        case 'New': return 'blue';
        case 'In Progress': case 'Under Review': return 'teal';
        case 'Resolved': case 'Completed': case 'Closed': return 'green';
        case 'Declined': return 'destructive';
        default: return 'outline';
    }
}


export default function CasesPage() {
  const { cases, setCases, users: mockUsers, tasks, setTasks, setNotifications, workflows } = useData();
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const isMobile = useIsMobile();

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [assignedToFilter, setAssignedToFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  useEffect(() => {
    const status = searchParams.get('status');
    if (status === 'active') {
        setStatusFilter('active');
    }
  }, [searchParams]);

  const handleCreateCase = (newCaseData: Omit<Case, 'id' | 'createdAt' | 'communications'>) => {
    const caseNumbers = cases.map(c => parseInt(c.id.split('-')[1], 10));
    const newCaseNumber = Math.max(0, ...caseNumbers) + 1;
    
    let newCase: Case = {
      id: `case-${newCaseNumber}`,
      createdAt: new Date().toISOString().split('T')[0],
      communications: [],
      ...newCaseData
    };
    
    setCases(prevCases => [newCase, ...prevCases]);
    setCreateDialogOpen(false);
    toast({
        title: "Case Created",
        description: `New case "${newCase.subject}" has been created.`,
    });
  };
  
  const handleAssignCase = (caseId: string, userId: string) => {
    const assignedUser = mockUsers.find(u => u.id === userId);
    if (!assignedUser) return;
    setCases(cases.map(c => c.id === caseId ? { ...c, assignedTo: assignedUser.name } : c));
  };
  
  const handleUpdateCase = (updatedCase: Case) => {
    setCases(cases.map(c => c.id === updatedCase.id ? updatedCase : c));
    setSelectedCase(updatedCase);
    if (updatedCase.status === 'Completed' || updatedCase.status === 'Closed' || updatedCase.status === 'Declined' || updatedCase.status === 'Resolved') {
       toast({
        title: `Case ${updatedCase.status}`,
        description: `Case "${updatedCase.subject}" has been marked as ${updatedCase.status.toLowerCase()}.`,
      })
    }
  };
  
  const userCases = useMemo(() => {
    const sortedCases = [...cases].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return user?.role === 'admin' ? sortedCases : sortedCases.filter(c => c.assignedTo === user?.name);
  }, [cases, user]);

  const filteredCases = useMemo(() => {
    return userCases.filter(c => {
        const matchesStatus = statusFilter === 'all' || 
            (statusFilter === 'active' && ['New', 'In Progress', 'Under Review', 'Investigated'].includes(c.status)) ||
            c.status === statusFilter;
        const matchesPriority = priorityFilter === 'all' || c.priority === priorityFilter;
        const matchesType = typeFilter === 'all' || c.type === typeFilter;
        const matchesAssignedTo = assignedToFilter === 'all' || c.assignedTo === c.assignedTo || (assignedToFilter === 'Unassigned' && c.assignedTo === 'Unassigned');
        const matchesSearch = c.subject.toLowerCase().includes(searchQuery.toLowerCase()) || c.customer.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesDate = !dateRange?.from || (isWithinInterval(new Date(c.createdAt), { start: dateRange.from, end: dateRange.to || new Date() }));
        return matchesStatus && matchesPriority && matchesType && matchesAssignedTo && matchesSearch && matchesDate;
    });
  }, [userCases, statusFilter, priorityFilter, typeFilter, assignedToFilter, searchQuery, dateRange]);


  const MainContent = () => (
    <>
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex-1">
          <h2 className="text-3xl font-bold tracking-tight font-headline">Cases Management</h2>
          <p className="text-muted-foreground">Manage and track customer support cases.</p>
        </div>
        {user?.role === 'admin' && <Button onClick={() => setCreateDialogOpen(true)} className="w-full sm:w-auto"><PlusCircle className="mr-2 h-4 w-4" /> Create Case</Button>}
      </div>
      <div className="flex flex-col space-y-4">
         <div className="flex flex-col sm:flex-row items-center gap-2">
           <div className="relative w-full sm:flex-1">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
               <Input placeholder="Filter by keyword..." className="pl-9 w-full" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
           </div>
           {!isMobile && <DateRangePicker onDateChange={setDateRange} />}
           <Button variant="outline" className="w-full sm:w-auto" onClick={() => { setStatusFilter('all'); setPriorityFilter('all'); setTypeFilter('all'); setSearchQuery(''); setAssignedToFilter('all'); setDateRange(undefined)}}>Clear Filters</Button>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">All Active</SelectItem>
              <SelectItem value="New">New</SelectItem><SelectItem value="Under Review">Under Review</SelectItem><SelectItem value="In Progress">In Progress</SelectItem><SelectItem value="Investigated">Investigated</SelectItem><SelectItem value="Resolved">Resolved</SelectItem><SelectItem value="Completed">Completed</SelectItem><SelectItem value="Declined">Declined</SelectItem><SelectItem value="Closed">Closed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Priority" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="High">High</SelectItem><SelectItem value="Medium">Medium</SelectItem><SelectItem value="Low">Low</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Case Type" /></SelectTrigger>
            <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Bug Report">Bug Report</SelectItem><SelectItem value="Feature Request">Feature Request</SelectItem><SelectItem value="Billing Inquiry">Billing Inquiry</SelectItem><SelectItem value="General Question">General Question</SelectItem>
            </SelectContent>
          </Select>
          {user?.role === 'admin' && (
            <Select value={assignedToFilter} onValueChange={setAssignedToFilter}>
                <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Assigned To" /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="Unassigned">Unassigned</SelectItem>
                    {mockUsers.map(u => <SelectItem key={u.id} value={u.name}>{u.name}</SelectItem>)}
                </SelectContent>
            </Select>
          )}
        </div>
      </div>
      <div className="rounded-md border bg-card hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">Case ID</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead className="hidden lg:table-cell">Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden lg:table-cell">Assigned Staff</TableHead>
              <TableHead className="hidden lg:table-cell">Created</TableHead>
              <TableHead><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCases.map((caseItem) => (
              <TableRow key={caseItem.id} onClick={() => setSelectedCase(caseItem)} className="cursor-pointer">
                <TableCell className="font-mono text-xs">{caseItem.id}</TableCell>
                <TableCell className="font-medium">{caseItem.subject}</TableCell>
                <TableCell className="hidden lg:table-cell"><Badge variant={getPriorityVariant(caseItem.priority)}>{caseItem.priority}</Badge></TableCell>
                <TableCell><Badge variant={getStatusVariant(caseItem.status)}>{caseItem.status}</Badge></TableCell>
                <TableCell className="hidden lg:table-cell">{caseItem.assignedTo}</TableCell>
                <TableCell className="hidden lg:table-cell">{caseItem.createdAt}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedCase(caseItem)}>View</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
       <div className="md:hidden space-y-4">
        {filteredCases.map((caseItem) => (
          <Card key={caseItem.id} onClick={() => setSelectedCase(caseItem)} className="cursor-pointer">
            <CardContent className="p-4 space-y-2">
              <div className="flex justify-between items-start">
                  <span className="font-semibold">{caseItem.subject}</span>
                  <Badge variant={getStatusVariant(caseItem.status)}>{caseItem.status}</Badge>
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                  <p>ID: <span className="font-mono text-xs">{caseItem.id}</span></p>
                  <div>Priority: <Badge variant={getPriorityVariant(caseItem.priority)} className="text-xs">{caseItem.priority}</Badge></div>
                  <p>Assigned: {caseItem.assignedTo}</p>
                  <p>Created: {caseItem.createdAt}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {isMobile && selectedCase ? null : <MainContent />}

      {selectedCase && (
        <Sheet open={!!selectedCase} onOpenChange={(open) => !open && setSelectedCase(null)}>
            <SheetContent className="w-full sm:max-w-xl md:max-w-2xl lg:max-w-4xl p-0">
               <CaseDetailPanel 
                    caseItem={selectedCase} 
                    onUpdateCase={handleUpdateCase} 
                    onBack={() => setSelectedCase(null)}
                />
            </SheetContent>
        </Sheet>
      )}

      <CreateCaseDialog open={isCreateDialogOpen} onOpenChange={setCreateDialogOpen} onCreate={handleCreateCase} />
    </div>
  );
}

function CaseDetailPanel({ caseItem, onUpdateCase, onBack }: { caseItem: Case, onUpdateCase: (caseItem: Case) => void, onBack: () => void }) {
  const { users: mockUsers, tasks, setTasks } = useData();
  const [finding, setFinding] = useState('');
  const [note, setNote] = useState('');
  const [communications, setCommunications] = useState(caseItem.communications || []);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [replyMessage, setReplyMessage] = useState('');
  const [isResolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [isTaskWarningOpen, setTaskWarningOpen] = useState(false);
  const [resolutionNote, setResolutionNote] = useState('');
  
  const { user } = useAuth();
  const { toast } = useToast();
  const isAdmin = user?.role === 'admin';
  const isMobile = useIsMobile();

  const linkedTasks = useMemo(() => tasks.filter(t => t.linkedCase === caseItem.id), [tasks, caseItem.id]);
  const openTasks = useMemo(() => linkedTasks.filter(t => t.status === 'To Do' || t.status === 'In Progress'), [linkedTasks]);

  const handleAddCommunication = (type: 'Finding' | 'Note' | 'Email' | 'Resolution', content: string) => {
    if (content.trim()) {
      const newComm: Communication = {
        id: `comm-${Date.now()}`, type, content, author: user?.name || 'System', authorRole: user?.role || 'staff', timestamp: new Date().toLocaleString(),
      };
      const updatedComms = [...communications, newComm];
      setCommunications(updatedComms);
      onUpdateCase({ ...caseItem, communications: updatedComms });
      if(type === 'Finding') setFinding('');
      if(type === 'Note') setNote('');
    }
  };
  
  const handleAttemptResolve = () => {
      if (openTasks.length > 0) {
          setTaskWarningOpen(true);
      } else {
          setResolveDialogOpen(true);
      }
  };

  const handleForceResolve = () => {
    setTaskWarningOpen(false);
    setResolveDialogOpen(true);
  };
  
  const handleConfirmResolve = () => {
      if (!resolutionNote.trim()) {
          toast({ variant: 'destructive', title: 'Resolution note is required.' });
          return;
      }
      
      const resolutionTimestamp = new Date();
      const resolutionContent = `Case resolved with note: "${resolutionNote}"`;

      // Log resolution note
      handleAddCommunication('Resolution', resolutionContent);
      
      // Update the case
      onUpdateCase({ 
        ...caseItem, 
        status: 'Resolved',
        resolvedAt: resolutionTimestamp.toISOString().split('T')[0],
      });
      
      // Cancel open tasks
      const updatedTasks = tasks.map(t => {
          if (t.linkedCase === caseItem.id && (t.status === 'To Do' || t.status === 'In Progress')) {
              return { ...t, status: 'Canceled' as Task['status'] };
          }
          return t;
      });
      setTasks(updatedTasks);
      
      // Add a single communication about task closure
      if (openTasks.length > 0) {
        const taskNote = `Automatically canceled ${openTasks.length} open task(s) due to case resolution.`;
        const newComm: Communication = {
            id: `comm-${Date.now() + 1}`,
            type: 'Note',
            content: taskNote,
            author: 'System',
            authorRole: 'admin',
            timestamp: resolutionTimestamp.toLocaleString(),
        };
        setCommunications(prev => [...prev, newComm]);
        onUpdateCase({ ...caseItem, communications: [...communications, newComm] });
      }

      setResolutionNote('');
      setResolveDialogOpen(false);
  };
  
  const handleStatusChange = (newStatus: Case['status']) => {
    if (newStatus === 'Resolved' || newStatus === 'Completed') {
        handleAttemptResolve();
    } else {
        onUpdateCase({ ...caseItem, status: newStatus });
    }
  };

  const handleAssigneeChange = (newAssignee: string) => onUpdateCase({ ...caseItem, assignedTo: newAssignee });
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) setAttachments(prev => [...prev, ...Array.from(event.target.files as FileList)]);
  };

  const handleSendReply = () => {
    if(replyMessage.trim()){ handleAddCommunication('Email', replyMessage); setReplyMessage(''); }
  };
  
  const staffStatusOptions: Case['status'][] = ['In Progress', 'Resolved', 'Investigated', 'Completed'];
  const adminStatusOptions: Case['status'][] = ['New', 'Under Review', 'In Progress', 'Investigated', 'Resolved', 'Completed', 'Declined', 'Closed'];

  return (
    <>
    <div className="flex flex-col h-full max-h-[100vh]">
        <SheetHeader className="p-4 md:p-6 border-b flex-shrink-0">
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                    {isMobile && <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-4 w-4" /></Button>}
                    <div className="flex-1">
                        <SheetTitle className="font-headline text-lg md:text-2xl">{caseItem.subject}</SheetTitle>
                        <SheetDescription className="text-xs md:text-sm">From {caseItem.customer} ({caseItem.email}) | Created on {caseItem.createdAt}</SheetDescription>
                    </div>
                </div>
                 <div className="flex items-center gap-2">
                    {isAdmin && caseItem.status === 'New' && (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button size="icon" onClick={() => handleStatusChange('Under Review')} className="h-8 w-8">
                                        <Check className="h-4 w-4" />
                                        <span className="sr-only">Accept Case</span>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Accept Case</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button size="icon" variant="destructive" onClick={() => handleStatusChange('Declined')} className="h-8 w-8">
                                        <XCircle className="h-4 w-4" />
                                        <span className="sr-only">Decline Case</span>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Decline Case</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}
                </div>
            </div>
        </SheetHeader>
        <div className="grid grid-cols-1 md:grid-cols-3 flex-1 overflow-hidden">
            <div className="col-span-1 border-r p-4 md:p-6 space-y-6 overflow-y-auto">
                <div className="space-y-4">
                    <h4 className="font-semibold">Details</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div><Label className="text-muted-foreground">Status</Label></div>
                        {isAdmin ? 
                            (<Select onValueChange={(value: Case['status']) => handleStatusChange(value)} defaultValue={caseItem.status}>
                                <SelectTrigger><SelectValue/></SelectTrigger>
                                <SelectContent>{adminStatusOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                            </Select>) : 
                            (<Badge variant={getStatusVariant(caseItem.status)}>{caseItem.status}</Badge>)
                        }
                        <div><Label className="text-muted-foreground">Priority</Label></div>
                        <Badge variant={getPriorityVariant(caseItem.priority)}>{caseItem.priority}</Badge>

                        <div><Label className="text-muted-foreground">Assigned To</Label></div>
                        {isAdmin ? 
                            (<Select onValueChange={handleAssigneeChange} defaultValue={caseItem.assignedTo}>
                                <SelectTrigger><SelectValue/></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Unassigned">Unassigned</SelectItem>
                                    {mockUsers.filter(u => u.role === 'staff').map(u => <SelectItem key={u.id} value={u.name}>{u.name}</SelectItem>)}
                                </SelectContent>
                            </Select>) : 
                            (<div>{caseItem.assignedTo}</div>)
                        }
                    </div>
                </div>
                 <div className="space-y-2">
                    <h4 className="font-semibold">Description</h4>
                    <p className="text-sm text-muted-foreground bg-muted/50 p-4 rounded-md">{caseItem.description}</p>
                </div>
                
                {isAdmin && (
                  <div className="space-y-4">
                    <h4 className="font-semibold">Admin Actions</h4>
                    {caseItem.status === 'Investigated' && (
                        <div className="flex gap-2">
                             <Button className="w-full" onClick={() => handleStatusChange('Resolved')}><Check className="mr-2 h-4 w-4" /> Approve Resolution</Button>
                             <Button className="w-full" variant="outline" onClick={() => handleAddCommunication('Note', 'Admin requested more work.')}><ShieldQuestion className="mr-2 h-4 w-4" /> Request More Work</Button>
                        </div>
                    )}
                    {(caseItem.status === 'Resolved' || caseItem.status === 'Completed') && (
                        <Button className="w-full" onClick={() => handleStatusChange('Closed')}><XCircle className="mr-2 h-4 w-4" /> Close Case</Button>
                    )}
                    {caseItem.status === 'Closed' && (
                        <Button className="w-full" variant="outline" onClick={() => handleStatusChange('Under Review')}><Undo className="mr-2 h-4 w-4" /> Reopen Case</Button>
                    )}
                  </div>
                )}

                 {user?.role === 'staff' && (
                    <Button className="w-full" onClick={() => handleStatusChange('Completed')} disabled={!staffStatusOptions.includes(caseItem.status)}>
                        <CheckCircle className="mr-2 h-4 w-4" /> Mark Case as Completed
                    </Button>
                )}
            </div>
            <div className="col-span-2 overflow-y-auto p-4 md:p-6">
                <Tabs defaultValue="communication">
                    <TabsList className="mb-4">
                        <TabsTrigger value="communication">Internal Communications</TabsTrigger>
                        <TabsTrigger value="tasks">Linked Tasks ({linkedTasks.length})</TabsTrigger>
                        <TabsTrigger value="attachments">Attachments</TabsTrigger>
                        <TabsTrigger value="customer">Customer Communication</TabsTrigger>
                    </TabsList>
                    <TabsContent value="communication">
                        <div className="space-y-4">
                            <div className="max-h-96 overflow-y-auto space-y-4 pr-4">
                                {communications.map((comm) => (
                                  <div key={comm.id} className="flex items-start gap-4">
                                    <div className="mt-1 shrink-0">
                                      {comm.type === 'Finding' && <FileText className="h-5 w-5 text-muted-foreground" />}
                                      {comm.type === 'Resolution' && <CheckCircle className="h-5 w-5 text-green-500" />}
                                      {comm.type === 'Note' && comm.authorRole === 'admin' && <Shield className="h-5 w-5 text-muted-foreground" />}
                                      {comm.type === 'Note' && comm.authorRole === 'staff' && <PenSquare className="h-5 w-5 text-muted-foreground" />}
                                    </div>
                                    <div className="w-full">
                                      <p className="text-sm text-muted-foreground border-l-2 pl-4 py-1">{comm.content}</p>
                                      <p className="text-xs text-muted-foreground/70 pl-4 pt-1">{comm.author} at {comm.timestamp}</p>
                                    </div>
                                  </div>
                                ))}
                            </div>
                            <div className="flex items-start gap-4 pt-4 border-t">
                                <MessageSquare className="h-5 w-5 text-muted-foreground mt-1" />
                                <div className="w-full">
                                    <Textarea placeholder="Add an internal note..." value={note} onChange={(e) => setNote(e.target.value)} />
                                    <Button className="mt-2" onClick={() => handleAddCommunication('Note', note)}>Add Note</Button>
                                </div>
                            </div>
                            {user?.role === 'staff' && (
                            <div className="flex items-start gap-4 pt-4 border-t">
                                <FileText className="h-5 w-5 text-muted-foreground mt-1" />
                                <div className="w-full">
                                    <Textarea placeholder="Add a key finding..." value={finding} onChange={(e) => setFinding(e.target.value)} />
                                    <Button className="mt-2" onClick={() => handleAddCommunication('Finding', finding)}>Add Finding</Button>
                                </div>
                            </div>
                            )}
                        </div>
                    </TabsContent>
                    <TabsContent value="tasks">
                        <div className="space-y-4">
                            {linkedTasks.map(task => (
                                <div key={task.id} className="flex items-center justify-between p-2 rounded-md border">
                                    <div>
                                        <p className="font-medium">{task.title}</p>
                                        <p className="text-sm text-muted-foreground">Due: {task.dueDate}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant={getPriorityVariant(task.priority)}>{task.priority}</Badge>
                                        <Badge variant="outline">{task.status}</Badge>
                                    </div>
                                </div>
                            ))}
                            {linkedTasks.length === 0 && (
                                <p className="text-sm text-muted-foreground text-center p-4">No tasks linked to this case.</p>
                            )}
                        </div>
                    </TabsContent>
                    <TabsContent value="attachments">
                        <div className="space-y-4">
                             <div className="p-6 border-2 border-dashed rounded-lg text-center">
                                <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                                <Label htmlFor="file-upload" className="relative cursor-pointer rounded-md font-medium text-primary hover:text-primary/80">
                                    <span>Upload a file</span>
                                    <input id="file-upload" name="file-upload" type="file" className="sr-only" multiple onChange={handleFileChange} />
                                </Label>
                                <p className="text-xs text-muted-foreground">or drag and drop</p>
                            </div>
                             {attachments.length > 0 && (
                                <div>
                                    <h4 className="font-semibold text-sm mb-2">Selected files:</h4>
                                    <ul className="list-disc list-inside space-y-1">
                                        {attachments.map((file, i) => (
                                            <li key={i} className="text-sm text-muted-foreground">{file.name} ({ (file.size / 1024).toFixed(2) } KB)</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </TabsContent>
                    <TabsContent value="customer">
                         <div className="space-y-4">
                            <div className="max-h-96 overflow-y-auto space-y-4 pr-4">
                                {communications.filter(c => c.type === 'Email').map((n, i) => (
                                  <div key={i} className="flex items-start gap-4">
                                    <Send className="h-5 w-5 text-muted-foreground mt-1 shrink-0" />
                                    <div className="w-full">
                                      <p className="text-sm text-muted-foreground border-l-2 pl-4 py-1">{n.content}</p>
                                      <p className="text-xs text-muted-foreground/70 pl-4 pt-1">{n.author} at {n.timestamp}</p>
                                    </div>
                                  </div>
                                ))}
                            </div>
                            <div className="flex items-start gap-4 pt-4 border-t">
                                <Send className="h-5 w-5 text-muted-foreground mt-1" />
                                <div className="w-full">
                                    <Textarea placeholder={`Reply to ${caseItem.customer}...`} value={replyMessage} onChange={(e) => setReplyMessage(e.target.value)} disabled={user?.role !== 'staff'} />
                                    <Button className="mt-2" onClick={handleSendReply} disabled={user?.role !== 'staff'}>Send Email</Button>
                                </div>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    </div>
    
    <Dialog open={isResolveDialogOpen} onOpenChange={setResolveDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Resolve Case</DialogTitle>
                <DialogDescription>Please provide a resolution note before closing this case.</DialogDescription>
            </DialogHeader>
            <div className="py-4">
                <Label htmlFor="resolution-note">Resolution Note</Label>
                <Textarea id="resolution-note" value={resolutionNote} onChange={(e) => setResolutionNote(e.target.value)} placeholder="Enter details of how this case was resolved..." />
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setResolveDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleConfirmResolve}>Confirm Resolution</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>

    <AlertDialog open={isTaskWarningOpen} onOpenChange={setTaskWarningOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Case Has Open Tasks</AlertDialogTitle>
                <AlertDialogDescription>
                    This case has {openTasks.length} open task(s). All tasks should be completed before resolving the case.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                {isAdmin && <AlertDialogAction onClick={handleForceResolve}>Force Resolve</AlertDialogAction>}
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}

function CreateCaseDialog({ open, onOpenChange, onCreate }: { open: boolean, onOpenChange: (open: boolean) => void, onCreate: (data: any) => void }) {
  const { workflows, teams, users, setCases, setTasks, setNotifications } = useData();
  const [subject, setSubject] = useState('');
  const [customer, setCustomer] = useState('');
  const [email, setEmail] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Case['priority']>('Medium');
  const [type, setType] = useState<Case['type']>('General Question');
  const [status, setStatus] = useState<Case['status']>('New');
  const { toast } = useToast();

  const handleSubmit = () => {
    const caseData: Omit<Case, 'id' | 'createdAt' | 'communications'> & { id?: string } = { 
        subject, 
        customer, 
        email, 
        priority, 
        type, 
        status, 
        assignedTo: 'Unassigned',
        description: description,
    };
    
    // Process workflows
    workflows.forEach(workflow => {
        let conditionMet = false;
        if (workflow.trigger === 'case-created') {
            if (workflow.condition === 'priority-high' && caseData.priority === 'High') {
                conditionMet = true;
            }
        }

        if (conditionMet) {
            // Team Assignment Action
            if (workflow.action === 'assign-team-t2') {
                const tier2Team = teams.find(t => t.name === 'Support Tier 2');
                if (tier2Team) {
                    const teamMembers = users.filter(u => u.team === tier2Team.name);
                    if (teamMembers.length > 0) {
                        caseData.assignedTo = teamMembers[0].name;
                         toast({
                            title: "Workflow Triggered",
                            description: `Case automatically assigned to ${teamMembers[0].name} in Tier 2 Support.`,
                        });
                    }
                }
            }
            // Create Task Action
            if (workflow.action === 'create-followup-task') {
                const caseNumbers = cases.map(c => parseInt(c.id.split('-')[1], 10));
                const newCaseNumber = Math.max(0, ...caseNumbers) + 1;
                const tempCaseId = `case-${newCaseNumber}`;

                const assignedUser = users.find(u => u.name === caseData.assignedTo);
                const newTask: Task = {
                    id: `task-${Date.now()}`,
                    title: `Follow up on high-priority case: "${caseData.subject}"`,
                    status: 'To Do',
                    dueDate: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
                    priority: 'High',
                    linkedCase: tempCaseId, // Link to the case being created
                    assignedTo: assignedUser?.id || undefined,
                };
                setTasks(prev => [...prev, newTask]);

                if (assignedUser) {
                    const newNotification: Notification = {
                        id: `notif-${Date.now()}`,
                        type: 'task',
                        title: 'New Task Assigned by Workflow',
                        description: `A new task "${newTask.title}" was automatically assigned to you.`,
                        timestamp: new Date().toISOString(),
                        read: false,
                        userId: assignedUser.id,
                        link: `/tasks?id=${newTask.id}`,
                    };
                    setNotifications(prev => [newNotification, ...prev]);
                }
                 toast({
                    title: "Workflow Triggered",
                    description: `A follow-up task has been automatically created.`,
                });
            }
        }
    });

    onCreate(caseData);
    setSubject(''); setCustomer(''); setEmail(''); setDescription(''); setPriority('Medium'); setType('General Question'); setStatus('New');
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle className="font-headline">Create New Case</DialogTitle><DialogDescription>Fill in the details for the new support case.</DialogDescription></DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="subject" className="text-right">Subject</Label><Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} className="col-span-3" /></div>
          <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="customer" className="text-right">Customer</Label><Input id="customer" value={customer} onChange={(e) => setCustomer(e.target.value)} className="col-span-3" /></div>
          <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="email" className="text-right">Email</Label><Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="col-span-3" /></div>
          <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="description" className="text-right">Description</Label><Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="col-span-3" /></div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="priority" className="text-right">Priority</Label>
            <Select onValueChange={(v: Case['priority']) => setPriority(v)} defaultValue={priority}><SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="High">High</SelectItem><SelectItem value="Medium">Medium</SelectItem><SelectItem value="Low">Low</SelectItem></SelectContent></Select>
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="type" className="text-right">Case Type</Label>
            <Select onValueChange={(v: Case['type']) => setType(v)} defaultValue={type}><SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Bug Report">Bug Report</SelectItem><SelectItem value="Feature Request">Feature Request</SelectItem><SelectItem value="Billing Inquiry">Billing Inquiry</SelectItem><SelectItem value="General Question">General Question</SelectItem></SelectContent></Select>
          </div>
        </div>
        <DialogFooter><Button type="submit" onClick={handleSubmit}>Create Case</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
