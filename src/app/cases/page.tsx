
"use client";

import React, { useState, useMemo } from 'react';
import type { DateRange } from "react-day-picker"
import { useData } from '@/context/data-context';
import type { Case, User, Communication, Task } from '@/lib/types';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger, DropdownMenuPortal, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, PlusCircle, FileText, Clock, User as UserIcon, MessageSquare, Upload, Send, CheckCircle, XCircle, Undo, Check, ShieldQuestion, PenSquare, Shield, AlertTriangle, ListTodo, Paperclip } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from "@/hooks/use-toast"
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { format, isWithinInterval } from 'date-fns';

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
  const { cases, setCases, users: mockUsers, tasks: mockTasks } = useData();
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [assignedToFilter, setAssignedToFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const handleCreateCase = (newCaseData: Omit<Case, 'id' | 'createdAt' | 'description' | 'communications'>) => {
    const newCase: Case = {
      id: `case-${Date.now()}-${Math.random()}`,
      createdAt: new Date().toISOString().split('T')[0],
      description: "Initial case description.",
      communications: [],
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
  
  const handleUpdateCase = (updatedCase: Case) => {
    setCases(cases.map(c => c.id === updatedCase.id ? updatedCase : c));
    setSelectedCase(updatedCase);
    if (updatedCase.status === 'Completed' || updatedCase.status === 'Closed' || updatedCase.status === 'Declined') {
       toast({
        title: `Case ${updatedCase.status}`,
        description: `Case "${updatedCase.subject}" has been marked as ${updatedCase.status.toLowerCase()}.`,
      })
    }
  };
  
  const userCases = useMemo(() => {
    return user?.role === 'admin' ? cases : cases.filter(c => c.assignedTo === user?.name);
  }, [cases, user]);

  const filteredCases = useMemo(() => {
    return userCases.filter(c => {
        const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
        const matchesPriority = priorityFilter === 'all' || c.priority === priorityFilter;
        const matchesType = typeFilter === 'all' || c.type === typeFilter;
        const matchesAssignedTo = assignedToFilter === 'all' || c.assignedTo === c.assignedTo || (assignedToFilter === 'Unassigned' && c.assignedTo === 'Unassigned');
        const matchesSearch = c.subject.toLowerCase().includes(searchQuery.toLowerCase()) || c.customer.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesDate = !dateRange?.from || (isWithinInterval(new Date(c.createdAt), { start: dateRange.from, end: dateRange.to || new Date() }));
        return matchesStatus && matchesPriority && matchesType && matchesAssignedTo && matchesSearch && matchesDate;
    });
  }, [userCases, statusFilter, priorityFilter, typeFilter, assignedToFilter, searchQuery, dateRange]);


  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight font-headline">Cases Management</h2>
        {user?.role === 'admin' && <Button onClick={() => setCreateDialogOpen(true)}><PlusCircle className="mr-2 h-4 w-4" /> Create Case</Button>}
      </div>
      <div className="flex flex-col space-y-4">
        <div className="flex items-center space-x-2">
           <Input placeholder="Filter by keyword..." className="max-w-sm" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
           <DateRangePicker onDateChange={setDateRange} />
        </div>
        <div className="flex items-center space-x-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="New">New</SelectItem><SelectItem value="Under Review">Under Review</SelectItem><SelectItem value="In Progress">In Progress</SelectItem><SelectItem value="Investigated">Investigated</SelectItem><SelectItem value="Resolved">Resolved</SelectItem><SelectItem value="Completed">Completed</SelectItem><SelectItem value="Declined">Declined</SelectItem><SelectItem value="Closed">Closed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Priority" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="High">High</SelectItem><SelectItem value="Medium">Medium</SelectItem><SelectItem value="Low">Low</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Case Type" /></SelectTrigger>
            <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Bug Report">Bug Report</SelectItem><SelectItem value="Feature Request">Feature Request</SelectItem><SelectItem value="Billing Inquiry">Billing Inquiry</SelectItem><SelectItem value="General Question">General Question</SelectItem>
            </SelectContent>
          </Select>
          {user?.role === 'admin' && (
            <Select value={assignedToFilter} onValueChange={setAssignedToFilter}>
                <SelectTrigger className="w-[180px]"><SelectValue placeholder="Assigned To" /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="Unassigned">Unassigned</SelectItem>
                    {mockUsers.map(u => <SelectItem key={u.id} value={u.name}>{u.name}</SelectItem>)}
                </SelectContent>
            </Select>
          )}
          <Button variant="outline" onClick={() => { setStatusFilter('all'); setPriorityFilter('all'); setTypeFilter('all'); setSearchQuery(''); setAssignedToFilter('all'); setDateRange(undefined)}}>Clear Filters</Button>
        </div>
      </div>
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Case ID</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Assigned Staff</TableHead>
              <TableHead>Created</TableHead>
              <TableHead><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCases.map((caseItem) => (
              <TableRow key={caseItem.id} onClick={() => setSelectedCase(caseItem)} className="cursor-pointer">
                <TableCell className="font-mono text-xs">{caseItem.id}</TableCell>
                <TableCell className="font-medium">{caseItem.subject}</TableCell>
                <TableCell><Badge variant={getPriorityVariant(caseItem.priority)}>{caseItem.priority}</Badge></TableCell>
                <TableCell><Badge variant={getStatusVariant(caseItem.status)}>{caseItem.status}</Badge></TableCell>
                <TableCell>{caseItem.assignedTo}</TableCell>
                <TableCell>{caseItem.createdAt}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedCase(caseItem)}>View</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!selectedCase} onOpenChange={(open) => !open && setSelectedCase(null)}>
        <DialogContent className="sm:max-w-4xl md:max-w-5xl lg:max-w-6xl">
           <VisuallyHidden>
            <DialogTitle>Case Details</DialogTitle>
            <DialogDescription>Detailed view of a customer case.</DialogDescription>
          </VisuallyHidden>
          {selectedCase && <CaseDetailPanel caseItem={selectedCase} onUpdateCase={handleUpdateCase} />}
        </DialogContent>
      </Dialog>

      <CreateCaseDialog open={isCreateDialogOpen} onOpenChange={setCreateDialogOpen} onCreate={handleCreateCase} />
    </div>
  );
}

function CaseDetailPanel({ caseItem, onUpdateCase }: { caseItem: Case, onUpdateCase: (caseItem: Case) => void }) {
  const { users: mockUsers, tasks: mockTasks } = useData();
  const [finding, setFinding] = useState('');
  const [note, setNote] = useState('');
  const [communications, setCommunications] = useState(caseItem.communications || []);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [replyMessage, setReplyMessage] = useState('');
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const handleAddCommunication = (type: 'Finding' | 'Note' | 'Email', content: string) => {
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
  
  const handleStatusChange = (newStatus: Case['status']) => onUpdateCase({ ...caseItem, status: newStatus });
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
    <div className="flex flex-col h-full max-h-[85vh]">
        <DialogHeader className="p-6 border-b">
            <div className="flex justify-between items-start">
                <div>
                    <DialogTitle className="font-headline text-2xl">{caseItem.subject}</DialogTitle>
                    <DialogDescription>From {caseItem.customer} ({caseItem.email}) | Created on {caseItem.createdAt}</DialogDescription>
                </div>
                {isAdmin && caseItem.status === 'New' && (
                    <div className="flex gap-2">
                        <Button onClick={() => handleStatusChange('Under Review')}><Check className="mr-2 h-4 w-4" /> Accept Case</Button>
                        <Button variant="destructive" onClick={() => handleStatusChange('Declined')}><XCircle className="mr-2 h-4 w-4" /> Decline Case</Button>
                    </div>
                )}
            </div>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-3 flex-1 overflow-hidden">
            <div className="col-span-1 border-r p-6 space-y-6 overflow-y-auto">
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
            <div className="col-span-2 overflow-y-auto p-6">
                <Tabs defaultValue="communication">
                    <TabsList className="mb-4">
                        <TabsTrigger value="communication">Internal Communications</TabsTrigger>
                        <TabsTrigger value="tasks">Linked Tasks</TabsTrigger>
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
                            {mockTasks.filter(t => t.linkedCase === caseItem.id).map(task => (
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
                            {mockTasks.filter(t => t.linkedCase === caseItem.id).length === 0 && (
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
  );
}

function CreateCaseDialog({ open, onOpenChange, onCreate }: { open: boolean, onOpenChange: (open: boolean) => void, onCreate: (data: any) => void }) {
  const [subject, setSubject] = useState('');
  const [customer, setCustomer] = useState('');
  const [email, setEmail] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Case['priority']>('Medium');
  const [type, setType] = useState<Case['type']>('General Question');
  const [status, setStatus] = useState<Case['status']>('New');

  const handleSubmit = () => {
    onCreate({ subject, customer, email, description, priority, type, status, assignedTo: 'Unassigned' });
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
