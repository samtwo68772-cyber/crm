

"use client";

import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { DateRange } from "react-day-picker"
import { getCases, createCase, updateCase, addCommunicationToCase, deleteCase, deleteCommunicationFromCase } from './actions';
import { updateTask as updateTaskAction } from '../tasks/actions';
import { getUsers, getTeams } from '../admin/actions';
import { getTasks } from '../tasks/actions';
import { getWorkflows } from '../settings/actions';
import type { Case, User, Communication, Task, Notification, Workflow, Team, Document, PermissionSet } from '@/lib/types';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuPortal, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetClose, SheetFooter } from '@/components/ui/sheet';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, PlusCircle, FileText, Clock, User as UserIcon, MessageSquare, Upload, Send, CheckCircle, XCircle, Undo, Check, ShieldQuestion, PenSquare, Shield, AlertTriangle, ListTodo, Paperclip, Search, X, ArrowLeft, ArrowRight, Trash2, Settings, ChevronsUpDown, Download, Image as ImageIcon, File } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from "@/hooks/use-toast"
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { format, isWithinInterval, subDays, addDays, startOfDay, endOfDay, formatDistanceToNow, isValid } from 'date-fns';
import { useSearchParams } from 'next/navigation';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { AssigneePicker } from '@/components/ui/assignee-picker';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AssigneePickerDialog } from '@/components/ui/assignee-picker-dialog';


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

// Define Admin and Staff status options outside of the component
const adminStatusOptions: Case['status'][] = ['New', 'Under Review', 'In Progress', 'Investigated', 'Resolved', 'Completed', 'Declined', 'Closed'];
const staffStatusOptions: Case['status'][] = ['New', 'In Progress', 'Investigated'];


interface CasesClientProps {
    permissions: PermissionSet;
}

export function CasesClient({ permissions }: CasesClientProps) {
    const queryClient = useQueryClient();
    const { user } = useAuth();
    
    // Use the initial data from server props
    const { data: cases } = useQuery<any[]>({ 
        queryKey: ['cases', user?.id], 
        queryFn: getCases,
    });
    const { data: users } = useQuery<User[]>({ queryKey: ['users'], queryFn: getUsers });
    const { data: teams } = useQuery<Team[]>({ queryKey: ['teams'], queryFn: getTeams });
    const { data: tasks } = useQuery<Task[]>({ queryKey: ['tasks'], queryFn: getTasks });
    const { data: workflows } = useQuery<Workflow[]>({ queryKey: ['workflows'], queryFn: getWorkflows });

    const [selectedCase, setSelectedCase] = useState<any | null>(null);
    const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
    const { toast } = useToast();
    const searchParams = useSearchParams();
    const isMobile = useIsMobile();

    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [priorityFilter, setPriorityFilter] = useState<string>('all');
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [assignedToFilter, setAssignedToFilter] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [dateRange, setDateRange] = useState<DateRange | undefined>();

    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;
    
    useEffect(() => {
        const status = searchParams.get('status');
        if (status === 'active') {
            setStatusFilter('active');
        }
    }, [searchParams]);
    
    const createCaseMutation = useMutation({
        mutationFn: createCase,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cases', user?.id] });
            toast({ title: "Case Created", description: "A new case has been created." });
            setCreateDialogOpen(false);
        },
        onError: (error) => {
            toast({ variant: "destructive", title: "Error", description: error.message });
        }
    });

    const updateCaseMutation = useMutation({
        mutationFn: (data: { id: string; data: Partial<Case> & { assignedTo?: string[] } }) => updateCase(data.id, data.data),
        onMutate: async (updatedCaseData) => {
            await queryClient.cancelQueries({ queryKey: ['cases', user?.id] });
            const previousCases = queryClient.getQueryData<any[]>(['cases', user?.id]);

            queryClient.setQueryData<any[]>(['cases', user?.id], (oldCases = []) => {
                return oldCases.map(c => {
                    if (c.id === updatedCaseData.id) {
                         const updatedAssignments = (updatedCaseData.data.assignedTo || []).map(id => {
                            const userId = id.replace('user-', '');
                            const existingUser = users?.find(u => u.id === userId);
                             // This structure must match the `CaseAssignment` type from prisma including the `user` object
                            return { 
                                caseId: c.id, 
                                userId: userId, 
                                user: existingUser || { name: 'Loading...', id: userId }, // Fallback to prevent crashes
                                assignedAt: new Date(),
                                assignedByUserId: user?.id
                            };
                        });
                        return { ...c, ...updatedCaseData.data, assignments: updatedAssignments };
                    }
                    return c;
                });
            });

            return { previousCases };
        },
        onError: (_err, _newCase, context) => {
            queryClient.setQueryData(['cases', user?.id], context?.previousCases);
            toast({ variant: "destructive", title: "Error", description: "Failed to update case." });
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['cases', user?.id] });
        },
        onSuccess: (updatedCase) => {
            if (selectedCase && selectedCase.id === updatedCase.id) {
                setSelectedCase(updatedCase);
            }
            if (updatedCase.status === 'Completed' || updatedCase.status === 'Closed' || updatedCase.status === 'Declined' || updatedCase.status === 'Resolved') {
                toast({ title: `Case ${updatedCase.status}`, description: `Case "${updatedCase.subject}" has been marked as ${updatedCase.status.toLowerCase()}.` });
            } else {
                 toast({ title: "Case Updated", description: "The case has been successfully updated." });
            }
        },
    });
    
    const deleteCaseMutation = useMutation({
        mutationFn: deleteCase,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cases', user?.id] });
            toast({ title: "Case Deleted", description: "The case has been deleted." });
            setSelectedCase(null);
        },
        onError: (error) => {
            toast({ variant: "destructive", title: "Error", description: error.message });
        }
    });

    const handleDeleteCase = async (caseId: string) => {
        deleteCaseMutation.mutate(caseId);
    }

    const handleCreateCase = async (newCaseData: Omit<Case, 'id' | 'createdAt' | 'communications'>) => {
        createCaseMutation.mutate(newCaseData as any);
    };
  
    const handleUpdateCase = async (updatedCaseData: Partial<Case> & { id: string, assignedTo?: string[] }) => {
        const { id, ...data } = updatedCaseData;
        updateCaseMutation.mutate({ id, data: data as any });
    };

    const filteredCases = useMemo(() => {
        if (!cases || !users || !teams) return [];
        setCurrentPage(1); // Reset to first page on filter change
        return cases.filter(c => {
            const matchesStatus = statusFilter === 'all' || 
                (statusFilter === 'active' && ['New', 'In Progress', 'Under Review', 'Investigated'].includes(c.status)) ||
                c.status === statusFilter;
            const matchesPriority = priorityFilter === 'all' || c.priority === priorityFilter;
            const matchesType = typeFilter === 'all' || c.type === typeFilter;
            
            const assignedIds = c.assignments.map((a: any) => `user-${a.userId}`);
            const matchesAssignedTo = assignedToFilter === 'all' || assignedIds.includes(assignedToFilter);

            const matchesSearch = c.subject.toLowerCase().includes(searchQuery.toLowerCase()) || c.customer.toLowerCase().includes(searchQuery.toLowerCase());
            const from = dateRange?.from ? startOfDay(dateRange.from) : undefined;
            const to = dateRange?.to ? endOfDay(dateRange.to) : undefined;
            const matchesDate = !from || (isWithinInterval(new Date(c.createdAt), { start: from, end: to || new Date() }));
            return matchesStatus && matchesPriority && matchesType && matchesAssignedTo && matchesSearch && matchesDate;
        });
    }, [cases, statusFilter, priorityFilter, typeFilter, assignedToFilter, searchQuery, dateRange, users, teams]);
  
    const paginatedCases = useMemo(() => {
        if (!filteredCases) return [];
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        return filteredCases.slice(startIndex, endIndex);
    }, [filteredCases, currentPage]);
  
    const totalPages = Math.ceil((filteredCases?.length || 0) / ITEMS_PER_PAGE);

    const getAssigneeNames = (assignments: any[]) => {
        if (!users || !teams || !assignments) return 'Unassigned';
        
        const ids = assignments.map(a => a.userId);
        if (ids.length === 0) return 'Unassigned';

        const names = ids.map(id => {
            return users.find(u => u.id === id)?.name;
        }).filter(Boolean);
        
        if (names.length > 2) {
            return `${names.slice(0, 2).join(', ')} +${names.length - 2} more`;
        }

        return names.join(', ') || 'Unassigned';
    };

    const PaginationControls = () => (
        <div className="flex items-center justify-between pt-4">
            <div className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages} ({filteredCases.length} total cases)
            </div>
            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Previous
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                >
                    Next
                    <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
            </div>
        </div>
    );

  const MainContent = () => (
    <>
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex-1">
          <h2 className="text-3xl font-bold tracking-tight font-headline">Cases Management</h2>
          <p className="text-muted-foreground">Manage and track customer support cases.</p>
        </div>
        {permissions?.cases?.create && <Button onClick={() => setCreateDialogOpen(true)} className="w-full sm:w-auto"><PlusCircle className="mr-2 h-4 w-4" /> Create Case</Button>}
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
          {user?.role.name === 'Admin' && (
            <AssigneePicker
                users={users || []}
                teams={teams || []}
                selectedAssignees={assignedToFilter === 'all' ? [] : [assignedToFilter]}
                onChange={(assignees) => setAssignedToFilter(assignees.length > 0 ? assignees[0] : 'all')}
                className="w-full sm:w-[180px]"
                mode="single"
            />
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
              <TableHead className="hidden lg:table-cell">Assigned To</TableHead>
              <TableHead className="hidden lg:table-cell">Created</TableHead>
              <TableHead><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedCases.map((caseItem) => (
              <TableRow key={caseItem.id} onClick={() => setSelectedCase(caseItem)} className="cursor-pointer">
                <TableCell className="font-mono text-xs">{caseItem.id}</TableCell>
                <TableCell className="font-medium">{caseItem.subject}</TableCell>
                <TableCell className="hidden lg:table-cell"><Badge variant={getPriorityVariant(caseItem.priority)}>{caseItem.priority}</Badge></TableCell>
                <TableCell><Badge variant={getStatusVariant(caseItem.status)}>{caseItem.status}</Badge></TableCell>
                <TableCell className="hidden lg:table-cell">{getAssigneeNames(caseItem.assignments)}</TableCell>
                <TableCell className="hidden lg:table-cell">{format(new Date(caseItem.createdAt), 'yyyy-MM-dd')}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedCase(caseItem)}>View</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {totalPages > 1 && <div className='p-4 border-t'><PaginationControls /></div>}
      </div>
       <div className="md:hidden space-y-4">
        {paginatedCases.map((caseItem) => (
          <Card key={caseItem.id} onClick={() => setSelectedCase(caseItem)} className="cursor-pointer">
            <CardContent className="p-4 space-y-2">
              <div className="flex justify-between items-start">
                  <span className="font-semibold">{caseItem.subject}</span>
                  <Badge variant={getStatusVariant(caseItem.status)}>{caseItem.status}</Badge>
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                  <p>ID: <span className="font-mono text-xs">{caseItem.id}</span></p>
                  <div>Priority: <Badge variant={getPriorityVariant(caseItem.priority)} className="text-xs">{caseItem.priority}</Badge></div>
                  <p>Assigned: {getAssigneeNames(caseItem.assignments)}</p>
                  <p>Created: {format(new Date(caseItem.createdAt), 'yyyy-MM-dd')}</p>
              </div>
            </CardContent>
          </Card>
        ))}
         {totalPages > 1 && <PaginationControls />}
      </div>
    </>
  );

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {isMobile && selectedCase ? null : <MainContent />}

      {selectedCase && (
        <Sheet open={!!selectedCase} onOpenChange={(open) => !open && setSelectedCase(null)}>
            <SheetContent className="w-full sm:max-w-xl md:max-w-2xl lg:max-w-4xl p-0 flex flex-col">
               <CaseDetailPanel 
                    caseItem={selectedCase} 
                    onUpdateCase={handleUpdateCase} 
                    onDeleteCase={handleDeleteCase}
                    onBack={() => setSelectedCase(null)}
                    users={users || []}
                    teams={teams || []}
                    tasks={tasks || []}
                    permissions={permissions}
                />
            </SheetContent>
        </Sheet>
      )}

      <CreateCaseDialog open={isCreateDialogOpen} onOpenChange={setCreateDialogOpen} onCreate={handleCreateCase} users={users || []} cases={cases || []} workflows={workflows || []} teams={teams || []} />
    </div>
  );
}

function CaseDetailPanel({ caseItem, onUpdateCase, onDeleteCase, onBack, users, teams, tasks, permissions }: { caseItem: Case, onUpdateCase: (data: Partial<Case> & {id: string, assignedTo?: string[]}) => void, onDeleteCase: (id: string) => Promise<void>, onBack: () => void, users: User[], teams: Team[], tasks: Task[], permissions: PermissionSet }) {
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const { toast } = useToast();
    const [note, setNote] = useState('');
    const [editingNote, setEditingNote] = useState<Communication | null>(null);
    const [description, setDescription] = useState(caseItem.description);
    const [attachments, setAttachments] = useState<Document[]>([]); // This would be fetched
    const [isResolveDialogOpen, setResolveDialogOpen] = useState(false);
    const [isDeleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [isTaskWarningOpen, setTaskWarningOpen] = useState(false);
    const [resolutionNote, setResolutionNote] = useState('');
    const isAdmin = user?.role.name === 'Admin';
    const isMobile = useIsMobile();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const linkedTasks = useMemo(() => tasks.filter(t => t.linkedCase === caseItem.id), [tasks, caseItem.id]);
    const openTasks = useMemo(() => linkedTasks.filter(t => t.status === 'To Do' || t.status === 'In Progress'), [linkedTasks]);

    const hasDescriptionChanged = description !== caseItem.description;

    const addCommunicationMutation = useMutation({
        mutationFn: (data: { caseId: string, comm: Omit<Communication, 'id'> }) => addCommunicationToCase(data.caseId, data.comm),
        onSuccess: (updatedCase) => {
            queryClient.setQueryData(['cases', caseItem.id], updatedCase);
            queryClient.invalidateQueries({ queryKey: ['cases'] });
        },
        onError: () => {
            toast({ variant: "destructive", title: "Error", description: "Failed to add communication." });
        }
    });
    
    const deleteCommunicationMutation = useMutation({
        mutationFn: (data: { caseId: string; communicationId: string }) => deleteCommunicationFromCase(data.caseId, data.communicationId),
        onSuccess: (updatedCase) => {
            queryClient.setQueryData(['cases', caseItem.id], updatedCase);
            queryClient.invalidateQueries({ queryKey: ['cases']});
            toast({ title: 'Note Deleted' });
        }
    });

    const handleAddNote = async () => {
        if (note.trim() && user) {
            const newComm: Omit<Communication, 'id' | 'authorId'> = { type: 'Note', content: note, author: user.name, authorRole: user.role.name, timestamp: new Date().toISOString() };
            addCommunicationMutation.mutate({ caseId: caseItem.id, comm: newComm as any });
            setNote('');
        }
    };
    
    const handleDeleteNote = (communicationId: string) => {
        deleteCommunicationMutation.mutate({ caseId: caseItem.id, communicationId });
    }

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (files && files.length > 0 && user) {
            const newAttachments: Document[] = Array.from(files).map(file => ({
                id: `doc-${Date.now()}-${Math.random()}`,
                name: file.name,
                type: 'Document', // Simplified
                size: `${(file.size / 1024).toFixed(2)} KB`,
                uploadedAt: new Date().toISOString(),
                uploadedBy: user.name,
                authorId: user.id,
                category: 'Case File',
                caseId: caseItem.id,
            }));
            setAttachments(prev => [...prev, ...newAttachments]);
            toast({ title: `${files.length} file(s) ready to upload.`, description: "Note: This is a simulation. Files are not actually uploaded."})
        }
    };

    const handleDeleteAttachment = (docId: string) => {
        setAttachments(prev => prev.filter(doc => doc.id !== docId));
        toast({ title: "Attachment Removed" });
    }

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
  
    const handleConfirmResolve = async () => {
        if (!resolutionNote.trim()) {
            toast({ variant: 'destructive', title: 'Resolution note is required.' });
            return;
        }
        
        const resolutionTimestamp = new Date();
        const resolutionContent = `Case resolved with note: "${resolutionNote}"`;

        if (user) {
            await addCommunicationMutation.mutateAsync({ caseId: caseItem.id, comm: { type: 'Resolution', content: resolutionContent, author: user.name, authorId: user.id, authorRole: user.role.name, timestamp: resolutionTimestamp.toISOString() } as any });
        }
        
        await onUpdateCase({ 
            id: caseItem.id,
            status: 'Resolved',
            resolvedAt: new Date().toISOString(),
        });
        
        const taskUpdatePromises = openTasks.map(task => 
            updateTaskAction(task.id, { status: 'Canceled' })
        );

        await Promise.all(taskUpdatePromises);

        if (openTasks.length > 0 && user) {
            const taskNote = `Automatically canceled ${openTasks.length} open task(s) due to case resolution.`;
            await addCommunicationMutation.mutateAsync({ caseId: caseItem.id, comm: { type: 'Note', content: taskNote, author: user.name, authorId: user.id, authorRole: user.role.name, timestamp: new Date().toISOString() } as any});
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
        }

        setResolutionNote('');
        setResolveDialogOpen(false);
    };
    
    const handleStatusChange = (newStatus: Case['status']) => {
        if ((newStatus === 'Resolved' || newStatus === 'Completed') && !isAdmin) {
            handleAttemptResolve();
        } else {
            onUpdateCase({ id: caseItem.id, status: newStatus });
        }
    };

    const handleAssigneeChange = (newAssignees: string[]) => {
        onUpdateCase({ id: caseItem.id, assignedTo: newAssignees || [] });
    };

    const isCaseMember = caseItem.assignments?.some((a: any) => a.userId === user?.id) || isAdmin;

    const fileTypeIcons: { [key: string]: React.ReactNode } = {
        'pdf': <FileText className="h-6 w-6 text-red-500" />,
        'doc': <File className="h-6 w-6 text-blue-500" />,
        'docx': <File className="h-6 w-6 text-blue-500" />,
        'xls': <FileText className="h-6 w-6 text-green-500" />,
        'xlsx': <FileText className="h-6 w-6 text-green-500" />,
        'png': <ImageIcon className="h-6 w-6 text-orange-500" />,
        'jpg': <ImageIcon className="h-6 w-6 text-orange-500" />,
        'jpeg': <ImageIcon className="h-6 w-6 text-orange-500" />,
        'default': <File className="h-6 w-6 text-muted-foreground" />,
    };

    const getFileIcon = (fileName: string) => {
        const extension = fileName.split('.').pop()?.toLowerCase();
        return extension && fileTypeIcons[extension] ? fileTypeIcons[extension] : fileTypeIcons['default'];
    }

  return (
    <>
    <div className="flex flex-col h-full max-h-[100vh]">
        <SheetHeader className="p-4 md:p-6 border-b flex-shrink-0">
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                    {isMobile && <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-4 w-4" /></Button>}
                    <div className="flex-1">
                        <SheetTitle className="font-headline text-lg md:text-2xl">{caseItem.subject}</SheetTitle>
                        <SheetDescription className="text-xs md:text-sm">From {caseItem.customer} ({caseItem.email}) | Created on {format(new Date(caseItem.createdAt), 'yyyy-MM-dd')}</SheetDescription>
                    </div>
                </div>
            </div>
        </SheetHeader>
        <div className="grid grid-cols-1 md:grid-cols-3 flex-1 overflow-hidden">
            <div className="col-span-1 border-r p-4 md:p-6 space-y-6 overflow-y-auto">
                <div className="space-y-4">
                    <h4 className="font-semibold">Details</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div><Label className="text-muted-foreground">Status</Label></div>
                        {permissions?.cases?.update ? 
                            (<Select onValueChange={(value: Case['status']) => handleStatusChange(value)} value={caseItem.status}>
                                <SelectTrigger><SelectValue/></SelectTrigger>
                                <SelectContent>{(isAdmin ? adminStatusOptions : staffStatusOptions).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                            </Select>) : 
                            (<Badge variant={getStatusVariant(caseItem.status)}>{caseItem.status}</Badge>)
                        }
                        <div><Label className="text-muted-foreground">Priority</Label></div>
                        <Badge variant={getPriorityVariant(caseItem.priority)}>{caseItem.priority}</Badge>

                        <div className="col-span-2"><Label className="text-muted-foreground">Assigned To</Label></div>
                        <div className="col-span-2">
                           <AssigneePicker
                            users={users}
                            teams={teams}
                            selectedAssignees={caseItem.assignments?.map((a:any) => `user-${a.userId}`) ?? []}
                            onChange={handleAssigneeChange}
                            disabled={!permissions?.cases?.assign}
                          />
                        </div>
                    </div>
                </div>
                 <div className="space-y-2">
                    <h4 className="font-semibold">Description</h4>
                    <Textarea 
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      disabled={!permissions?.cases?.update}
                      className="text-sm text-muted-foreground bg-muted/50 p-4 rounded-md min-h-[120px]"
                    />
                    {hasDescriptionChanged && permissions?.cases?.update && (
                        <Button size="sm" onClick={() => onUpdateCase({ id: caseItem.id, description })}>Save Description</Button>
                    )}
                </div>
                
                {isAdmin && (
                  <div className="space-y-4">
                    <h4 className="font-semibold">Admin Actions</h4>
                    {caseItem.status === 'Investigated' && (
                        <div className="flex gap-2">
                             <Button className="w-full" onClick={() => handleStatusChange('Resolved')}><Check className="mr-2 h-4 w-4" /> Approve Resolution</Button>
                             <Button className="w-full" variant="outline" onClick={() => { if(user) addCommunicationMutation.mutate({ caseId: caseItem.id, comm: {type: 'Note', author: user.name, authorId: user.id, authorRole: user.role.name, content: 'Admin requested more work.', timestamp: new Date().toISOString() } as any })}}><ShieldQuestion className="mr-2 h-4 w-4" /> Request More Work</Button>
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
            </div>
            <div className="col-span-2 overflow-y-auto p-4 md:p-6">
                <Tabs defaultValue="communication">
                    <TabsList className="mb-4">
                        <TabsTrigger value="communication">Internal Communications</TabsTrigger>
                        {isCaseMember && <TabsTrigger value="tasks">Linked Tasks ({linkedTasks.length})</TabsTrigger>}
                        <TabsTrigger value="attachments">Attachments</TabsTrigger>
                    </TabsList>
                    <TabsContent value="communication">
                        <div className="space-y-4">
                            <div className="max-h-96 overflow-y-auto space-y-4 pr-4">
                                {(caseItem.communications || []).map((comm: Communication) => (
                                  <div key={comm.id} className="flex items-start gap-4 group">
                                    <div className="mt-1 shrink-0">
                                      {comm.type === 'Finding' && <FileText className="h-5 w-5 text-muted-foreground" />}
                                      {comm.type === 'Resolution' && <CheckCircle className="h-5 w-5 text-green-500" />}
                                      {comm.type === 'Note' && comm.authorRole === 'Admin' && <Shield className="h-5 w-5 text-muted-foreground" />}
                                      {comm.type === 'Note' && comm.authorRole === 'Staff' && <PenSquare className="h-5 w-5 text-muted-foreground" />}
                                    </div>
                                    <div className="w-full">
                                      <p className="text-sm text-muted-foreground border-l-2 pl-4 py-1">{comm.content}</p>
                                      <div className="flex items-center justify-between">
                                        <p className="text-xs text-muted-foreground/70 pl-4 pt-1">{comm.author} at {formatDistanceToNow(new Date(comm.timestamp), { addSuffix: true })}</p>
                                        {(comm.authorId === user?.id) && (
                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDeleteNote(comm.id)}>
                                                    <Trash2 className="h-4 w-4 text-destructive"/>
                                                </Button>
                                            </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                            </div>
                            <div className="flex items-start gap-4 pt-4 border-t">
                                <MessageSquare className="h-5 w-5 text-muted-foreground mt-1" />
                                <div className="w-full">
                                    <Textarea placeholder="Add an internal note..." value={note} onChange={(e) => setNote(e.target.value)} />
                                    <Button className="mt-2" onClick={handleAddNote} disabled={!note.trim()}>Add Note</Button>
                                </div>
                            </div>
                        </div>
                    </TabsContent>
                    <TabsContent value="tasks">
                        <div className="space-y-4">
                            {linkedTasks.map(task => (
                                <div key={task.id} className="flex items-center justify-between p-2 rounded-md border">
                                    <div>
                                        <p className="font-medium">{task.title}</p>
                                        <p className="text-sm text-muted-foreground">Due: {task.dueDate ? format(new Date(task.dueDate), 'PPP') : 'N/A'}</p>
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
                                <Button variant="link" onClick={() => fileInputRef.current?.click()}>
                                    Upload a file
                                </Button>
                                <input ref={fileInputRef} type="file" className="sr-only" multiple onChange={handleFileChange} />
                                <p className="text-xs text-muted-foreground">or drag and drop</p>
                            </div>
                             {attachments.length > 0 && (
                                <div>
                                    <h4 className="font-semibold text-sm mb-2">Attachments:</h4>
                                    <div className="space-y-2">
                                        {attachments.map((file) => (
                                            <div key={file.id} className="flex items-center justify-between p-2 border rounded-md group">
                                                <div className="flex items-center gap-3">
                                                    {getFileIcon(file.name)}
                                                    <div>
                                                        <p className="font-medium text-sm">{file.name}</p>
                                                        <p className="text-xs text-muted-foreground">{file.size} - Uploaded by {file.uploadedBy} {isValid(new Date(file.uploadedAt)) ? formatDistanceToNow(new Date(file.uploadedAt), {addSuffix: true}) : 'Invalid date'}</p>
                                                    </div>
                                                </div>
                                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button variant="ghost" size="icon" className="h-7 w-7"><Download className="h-4 w-4"/></Button>
                                                    {(isAdmin || file.authorId === user?.id) && 
                                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeleteAttachment(file.id)}><Trash2 className="h-4 w-4"/></Button>
                                                    }
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
        <SheetFooter className="p-4 border-t mt-auto bg-background flex-shrink-0">
             <div className="flex items-center justify-between gap-2 w-full">
                 <Button variant="destructive" size="icon" onClick={() => setDeleteConfirmOpen(true)} disabled={!permissions?.cases?.delete}>
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete Case</span>
                 </Button>
                <div className="flex gap-2">
                    {isAdmin && caseItem.status === 'New' && (
                        <>
                            <Button variant="outline" onClick={() => handleStatusChange('Declined')}>
                                <XCircle className="mr-2 h-4 w-4" /> Decline
                            </Button>
                            <Button onClick={() => handleStatusChange('Under Review')}>
                                <Check className="mr-2 h-4 w-4" /> Accept
                            </Button>
                        </>
                    )}
                     <SheetClose asChild>
                        <Button variant="ghost"><X className="mr-2 h-4 w-4" /> Close</Button>
                    </SheetClose>
                </div>
            </div>
        </SheetFooter>
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
      
      <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                      This will permanently delete the case "{caseItem.subject}". This action cannot be undone.
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onDeleteCase(caseItem.id)}>Delete Case</AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
      </>
  );
}

const defaultCaseTypes = ['Bug Report', 'Feature Request', 'Billing Inquiry', 'General Question'];

function CreateCaseDialog({ open, onOpenChange, onCreate, users, cases, workflows, teams }: { open: boolean, onOpenChange: (open: boolean) => void, onCreate: (data: any) => void, users: User[], cases: Case[], workflows: Workflow[], teams: Team[] }) {
  const [subject, setSubject] = useState('');
  const [customer, setCustomer] = useState('');
  const [email, setEmail] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Case['priority']>('Medium');
  const [type, setType] = useState<Case['type']>('General Question');
  const [status, setStatus] = useState<Case['status']>('New');
  const [assignedTo, setAssignedTo] = useState<string[]>([]);
  const [caseTypes, setCaseTypes] = useState(defaultCaseTypes);
  const [isManageTypesOpen, setManageTypesOpen] = useState(false);
  const [isAssigneePickerOpen, setAssigneePickerOpen] = useState(false);
  const { toast } = useToast();
  
  const staffUsers = useMemo(() => {
    if (!users) return [];
    return users.filter(u => u.role.name === 'Staff' || u.role.name === 'Admin')
  }, [users]);

  const activeTeams = useMemo(() => {
      if (!teams) return [];
      return teams.filter(t => t.status === 'Active');
  }, [teams]);


  const handleSubmit = () => {
    const caseData: Omit<Case, 'id' | 'createdAt' | 'communications' | 'assignments' | 'createdById' | 'createdBy'> & { assignedTo: string[] } = { 
        subject, 
        customer, 
        email, 
        priority, 
        type, 
        status, 
        assignedTo: assignedTo || [],
        description: description,
    };
    
    // This is a simplified workflow simulation that should be handled on the backend in a real app
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
                const team2 = teams.find(t => t.name === 'Support Tier 2');
                if (team2) {
                    caseData.assignedTo.push(`team-${team2.id}`);
                }
                 toast({
                    title: "Workflow Triggered",
                    description: `Case automatically assigned to Tier 2 Support.`,
                });
            }
        }
    });

    onCreate(caseData);
    setSubject(''); setCustomer(''); setEmail(''); setDescription(''); setPriority('Medium'); setType('General Question'); setStatus('New'); setAssignedTo([]);
  };

  const getAssigneeLabel = () => {
      if (!assignedTo || assignedTo.length === 0) return "Select assignees...";
      if (assignedTo.length > 2) return `${assignedTo.length} assignees selected`;
      const labels = assignedTo.map(id => {
          const user = users.find(u => `user-${u.id}` === id);
          if (user) return user.name;
          const team = teams.find(t => `team-${t.id}` === id);
          if (team) return team.name;
          return '';
      }).filter(Boolean);
      return labels.join(', ');
  }
  
  return (
    <>
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
             <Select
                value={type}
                onValueChange={(value) => {
                    if (value === "manage-types") {
                        setManageTypesOpen(true);
                    } else {
                        setType(value as Case['type']);
                    }
                }}
            >
                <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                <SelectContent>
                    {caseTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    <DropdownMenuSeparator />
                     <SelectItem value="manage-types" onSelect={(e) => e.preventDefault()} className="flex items-center gap-2 cursor-pointer focus:bg-accent focus:text-accent-foreground">
                        <Settings className="mr-2 h-4 w-4" />
                        Manage Types
                    </SelectItem>
                </SelectContent>
            </Select>
          </div>
           <div className="grid grid-cols-4 items-start gap-4">
                <Label className="text-right pt-2">Assign To</Label>
                <div className="col-span-3">
                    <Button variant="outline" className="w-full justify-start text-left font-normal" onClick={() => setAssigneePickerOpen(true)}>
                         <span className="truncate">{getAssigneeLabel()}</span>
                    </Button>
                </div>
            </div>
        </div>
        <DialogFooter><Button type="submit" onClick={handleSubmit}>Create Case</Button></DialogFooter>
      </DialogContent>
    </Dialog>

    <AssigneePickerDialog
        open={isAssigneePickerOpen}
        onOpenChange={setAssigneePickerOpen}
        users={staffUsers}
        teams={activeTeams}
        selectedAssignees={assignedTo}
        onApply={setAssignedTo}
    />

    <ManageCaseTypesDialog
        open={isManageTypesOpen}
        onOpenChange={setManageTypesOpen}
        caseTypes={caseTypes}
        onSave={setCaseTypes}
      />
    </>
  );
}

function ManageCaseTypesDialog({ open, onOpenChange, caseTypes, onSave }: { open: boolean; onOpenChange: (open: boolean) => void; caseTypes: string[]; onSave: (types: string[]) => void; }) {
    const [types, setTypes] = useState(caseTypes);
    const [newType, setNewType] = useState('');

    useEffect(() => {
        setTypes(caseTypes);
    }, [caseTypes, open]);

    const handleAdd = () => {
        if (newType && !types.includes(newType)) {
            setTypes([...types, newType]);
            setNewType('');
        }
    };

    const handleDelete = (typeToDelete: string) => {
        setTypes(types.filter(t => t !== typeToDelete));
    };
    
    const handleSave = () => {
        onSave(types);
        onOpenChange(false);
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Manage Case Types</DialogTitle>
                    <DialogDescription>Add, edit, or remove case types available in the dropdown.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        {types.map(type => (
                            <div key={type} className="flex items-center justify-between p-2 border rounded-md">
                                <span>{type}</span>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(type)}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </div>
                        ))}
                    </div>
                     <div className="flex gap-2">
                        <Input value={newType} onChange={(e) => setNewType(e.target.value)} placeholder="New case type name..." />
                        <Button onClick={handleAdd}>Add</Button>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSave}>Save Changes</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
