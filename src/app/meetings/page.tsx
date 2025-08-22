

"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { getMeetings, createMeeting, updateMeeting, deleteMeeting } from './actions';
import { getCases } from '../cases/actions';
import { getUsers } from '../admin/actions';
import type { Meeting, Case, User } from '@/lib/types';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ParticipantsPicker } from '@/components/ui/participants-picker';
import { Calendar as CalendarIcon, Clock, Users, Video, PlusCircle, Search, FileText, Link as LinkIcon, Edit, Trash2, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useToast } from "@/hooks/use-toast"
import { format, isValid, isSameDay, addMonths, subMonths, startOfMonth, getMonth, getYear } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useSearchParams } from 'next/navigation';
import { useIsMobile } from '@/hooks/use-mobile';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';


function getStatusVariant(status: Meeting['status']) {
    switch (status) {
        case 'Upcoming': return 'default';
        case 'Completed': return 'success';
        case 'Canceled': return 'secondary';
        default: return 'outline';
    }
}

function getStatusColor(status: Meeting['status']) {
     switch (status) {
        case 'Upcoming': return 'bg-blue-500';
        case 'Completed': return 'bg-green-500';
        case 'Canceled': return 'bg-gray-400';
        default: return 'bg-gray-400';
    }
}

const safeFormat = (date: string | Date, formatString: string) => {
    try {
        const d = new Date(date);
        if (!isValid(d)) {
            throw new Error('Invalid Date');
        }
        return format(d, formatString);
    } catch (error) {
        return "Invalid Date";
    }
}

function AllMeetingsView({ meetings, onMeetingClick }: { meetings: Meeting[], onMeetingClick: (meeting: Meeting) => void }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const filteredMeetings = useMemo(() => {
        return meetings.filter(m => {
            const matchesStatus = statusFilter === 'all' || m.status === statusFilter;
            const matchesSearch = m.title.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesStatus && matchesSearch;
        });
    }, [meetings, statusFilter, searchQuery]);

    return (
        <div className="space-y-6 mt-6">
            <div className="flex items-center gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search meetings..." className="pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                </div>
                <Select value={statusFilter} onValueChange={(v: "all" | "Upcoming" | "Completed" | "Canceled") => setStatusFilter(v)}>
                    <SelectTrigger className="w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="Upcoming">Upcoming</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                        <SelectItem value="Canceled">Canceled</SelectItem>
                    </SelectContent>
                </Select>
                <Button variant="outline" onClick={() => { setSearchQuery(''); setStatusFilter('all'); }}>Clear</Button>
            </div>
            <div className="space-y-4 h-[60vh] overflow-y-auto pr-4">
                {filteredMeetings.length > 0 ? filteredMeetings.map(meeting => (
                    <Card key={meeting.id} onClick={() => onMeetingClick(meeting)} className="cursor-pointer hover:bg-muted/50 transition-colors">
                        <CardContent className="p-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-semibold text-lg">{meeting.title}</h3>
                                    <p className="text-sm text-muted-foreground">{meeting.description}</p>
                                </div>
                                <Badge variant={getStatusVariant(meeting.status)}>{meeting.status}</Badge>
                            </div>
                            <div className="flex items-center gap-6 text-sm text-muted-foreground mt-4">
                                <div className="flex items-center gap-1.5"><CalendarIcon className="h-4 w-4" /> {safeFormat(meeting.date, 'PPP')}</div>
                                <div className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> {safeFormat(meeting.date, 'p')}</div>
                                <div className="flex items-center gap-1.5"><Users className="h-4 w-4" /> {meeting.participants.length}</div>
                            </div>
                        </CardContent>
                    </Card>
                )) : (
                    <div className="text-center py-16 text-muted-foreground">
                        <p>No meetings found for the selected criteria.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

function UpcomingMeetingsView({ meetings, onMeetingClick }: { meetings: Meeting[], onMeetingClick: (meeting: Meeting) => void }) {
    return (
        <Card className="mt-6">
            <CardHeader>
                <CardTitle>Upcoming Meetings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {meetings.length > 0 ? meetings.map(meeting => (
                    <Card key={meeting.id} onClick={() => onMeetingClick(meeting)} className="cursor-pointer hover:bg-muted/50 transition-colors">
                        <CardContent className="p-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-semibold text-lg">{meeting.title}</h3>
                                    <p className="text-sm text-muted-foreground">{meeting.description}</p>
                                </div>
                                <Badge variant={getStatusVariant(meeting.status)}>{meeting.status}</Badge>
                            </div>
                            <div className="flex items-center gap-6 text-sm text-muted-foreground mt-4">
                                <div className="flex items-center gap-1.5"><CalendarIcon className="h-4 w-4" /> {safeFormat(meeting.date, 'PPP')}</div>
                                <div className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> {safeFormat(meeting.date, 'p')}</div>
                                <div className="flex items-center gap-1.5"><Users className="h-4 w-4" /> {meeting.participants.length}</div>
                            </div>
                        </CardContent>
                    </Card>
                )) : (
                    <p className="text-muted-foreground mt-2 text-center py-8">No upcoming meetings scheduled.</p>
                )}
            </CardContent>
        </Card>
    );
}


export default function MeetingsPage() {
  const queryClient = useQueryClient();
  const { data: meetings, isLoading: meetingsLoading } = useQuery<Meeting[]>({ queryKey: ['meetings'], queryFn: getMeetings });
  const { data: cases, isLoading: casesLoading } = useQuery<Case[]>({ queryKey: ['cases'], queryFn: getCases });
  const { data: users, isLoading: usersLoading } = useQuery<User[]>({ queryKey: ['users'], queryFn: getUsers });
  const isLoading = meetingsLoading || casesLoading || usersLoading;

  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setEditDialogOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [activeTab, setActiveTab] = useState('calendar');
  const searchParams = useSearchParams();
  const isMobile = useIsMobile();
  
  const { user } = useAuth();
  const { toast } = useToast();
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (searchParams.get('filter') === 'upcoming') {
        setActiveTab('upcoming');
    }
  }, [searchParams]);

  const updateMeetingMutation = useMutation({
      mutationFn: (data: Partial<Meeting> & { id: string }) => updateMeeting(data.id, data as any),
      onSuccess: (updatedMeeting) => {
          queryClient.invalidateQueries({ queryKey: ['meetings'] });
          setSelectedMeeting(updatedMeeting);
          setEditDialogOpen(false);
          toast({ title: 'Meeting Updated', description: `Meeting "${updatedMeeting.title}" has been updated.` });
      },
      onError: () => {
          toast({ variant: "destructive", title: "Error", description: "Failed to update meeting." });
      }
  });

  const deleteMeetingMutation = useMutation({
      mutationFn: deleteMeeting,
      onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['meetings'] });
          setEditDialogOpen(false);
          setIsSheetOpen(false);
          setSelectedMeeting(null);
          toast({ title: 'Meeting Canceled', description: `The meeting has been canceled.` });
      },
      onError: () => {
          toast({ variant: "destructive", title: "Error", description: "Failed to delete meeting." });
      }
  });

  const createMeetingMutation = useMutation({
      mutationFn: createMeeting,
      onSuccess: (newMeeting) => {
          queryClient.invalidateQueries({ queryKey: ['meetings'] });
          setCreateDialogOpen(false);
          toast({ title: 'Meeting Scheduled', description: `Meeting "${newMeeting.title}" has been scheduled.` });
      },
      onError: () => {
          toast({ variant: "destructive", title: "Error", description: "Failed to create meeting." });
      }
  });

  const handleUpdateMeeting = async (updatedMeetingData: Partial<Meeting> & { id: string }) => {
    updateMeetingMutation.mutate(updatedMeetingData);
  };
  
  const handleDeleteMeeting = async (meetingId: string) => {
    deleteMeetingMutation.mutate(meetingId);
  };

  const handleCreateMeeting = async (newMeetingData: Omit<Meeting, 'id' | 'participants'> & { participantIds: string[] }) => {
    createMeetingMutation.mutate(newMeetingData);
  };

  const userMeetings = useMemo(() => {
    if (!user || !meetings) return [];
    if (isAdmin) return meetings;
    return meetings.filter(m => m.participants.some(p => p.userId === user.id));
  }, [meetings, user, isAdmin]);
  
  const upcomingMeetings = useMemo(() => {
    if (!userMeetings) return [];
    return userMeetings.filter(m => m.status === 'Upcoming');
  }, [userMeetings]);
  
  const handleMeetingClick = (meeting: Meeting) => {
      setSelectedMeeting(meeting);
      setIsSheetOpen(true);
  }

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  if (isLoading) return (
        <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between">
                <Skeleton className="h-12 w-64" />
                <Skeleton className="h-10 w-48" />
            </div>
            <Skeleton className="h-10 w-96" />
            <Skeleton className="h-[50vh] w-full" />
        </div>
  );

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">Meetings</h1>
          <p className="text-muted-foreground">Schedule, view, and manage meetings.</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}><PlusCircle className="mr-2 h-4 w-4" /> Schedule Meeting</Button>
      </div>

       <Tabs defaultValue="calendar" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-muted/50 rounded-lg p-1">
              <TabsTrigger value="calendar">Calendar View</TabsTrigger>
              <TabsTrigger value="meetings">All Meetings</TabsTrigger>
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          </TabsList>
          <TabsContent value="calendar" className="mt-6">
                   <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="font-headline text-xl">{format(currentMonth, 'MMMM yyyy')}</CardTitle>
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="icon" onClick={prevMonth}><ChevronLeft className="h-4 w-4" /></Button>
                                <Button variant="outline" size="icon" onClick={nextMonth}><ChevronRight className="h-4 w-4" /></Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-2">
                           <Calendar
                                month={currentMonth}
                                onMonthChange={setCurrentMonth}
                                mode="single"
                                className="w-full meeting-calendar-wrapper"
                                components={{
                                    DayContent: ({ date, ...props }) => {
                                        const dayMeetings = userMeetings.filter(m => isSameDay(new Date(m.date), date));
                                        return (
                                            <div className="h-full w-full">
                                                <div className="w-full text-right p-1 text-sm">{format(date, 'd')}</div>
                                                <div className={cn("flex flex-col gap-1 px-1", isMobile && "flex-row flex-wrap justify-start items-start")}>
                                                    {dayMeetings.map(m => (
                                                        <TooltipProvider key={m.id}>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                     <div onClick={(e) => { e.stopPropagation(); handleMeetingClick(m); }}
                                                                         className={cn(
                                                                            "w-full text-left text-xs px-1.5 py-0.5 rounded-sm truncate cursor-pointer text-white",
                                                                            getStatusColor(m.status),
                                                                            isMobile && "w-2 h-2 p-0 rounded-full"
                                                                         )}
                                                                         title={m.title}
                                                                    >
                                                                        {!isMobile && m.title}
                                                                    </div>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p className="font-bold">{m.title}</p>
                                                                    <p>{safeFormat(m.date, 'p')}</p>
                                                                    <p>{m.participants.length} participants</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    }
                                }}
                            />
                        </CardContent>
                    </Card>
          </TabsContent>
          <TabsContent value="meetings">
            <AllMeetingsView meetings={userMeetings} onMeetingClick={handleMeetingClick} />
          </TabsContent>
          <TabsContent value="upcoming">
            <UpcomingMeetingsView meetings={upcomingMeetings} onMeetingClick={handleMeetingClick} />
          </TabsContent>
      </Tabs>
      
      {selectedMeeting && (
        <>
            <MeetingDetailSheet 
                open={isSheetOpen} 
                onOpenChange={setIsSheetOpen} 
                meeting={selectedMeeting} 
                onEdit={() => { setIsSheetOpen(false); setTimeout(() => setEditDialogOpen(true), 150); }} 
                cases={cases || []}
            />
            <EditMeetingDialog 
                open={isEditDialogOpen} 
                onOpenChange={setEditDialogOpen} 
                meeting={selectedMeeting} 
                onUpdate={handleUpdateMeeting} 
                onDelete={handleDeleteMeeting}
                users={users || []}
                cases={cases || []}
            />
        </>
      )}
      <CreateMeetingDialog 
        open={isCreateDialogOpen} 
        onOpenChange={setCreateDialogOpen} 
        onCreate={handleCreateMeeting} 
        users={users || []}
        cases={cases || []}
      />
    </div>
  );
}

function MeetingDetailSheet({ open, onOpenChange, meeting, onEdit, cases }: { open: boolean, onOpenChange: (open: boolean) => void, meeting: Meeting, onEdit: () => void, cases: Case[] }) {
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';
    const linkedCase = useMemo(() => cases.find(c => c.id === meeting.linkedRecord), [meeting, cases]);

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-md p-0 flex flex-col">
                <SheetHeader className="p-6 border-b">
                    <div className="flex items-start justify-between">
                        <div className="pr-4">
                            <SheetTitle className="font-headline text-2xl">{meeting.title}</SheetTitle>
                            <SheetDescription>{meeting.description}</SheetDescription>
                        </div>
                    </div>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                        <Badge variant={getStatusVariant(meeting.status)}>{meeting.status}</Badge>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground"><CalendarIcon className="h-4 w-4" /> {safeFormat(meeting.date, 'PPP p')}</div>
                    </div>
                    {linkedCase &&
                        <div className="flex items-center gap-2 text-sm"><LinkIcon className="h-4 w-4 text-muted-foreground" /> <strong>Linked Case:</strong> {linkedCase.subject}</div>
                    }
                    <div>
                        <h4 className="font-semibold mb-2">Participants</h4>
                        <div className="flex flex-wrap gap-2">{meeting.participants.map(p => {
                            return <Badge key={p.userId} variant="secondary">{p.user.name}</Badge>;
                        })}</div>
                    </div>
                </div>
                <SheetFooter className="p-6 border-t mt-auto">
                    {isAdmin && <Button onClick={onEdit} className="w-full"><Edit className="mr-2 h-4 w-4" /> Edit Meeting Details</Button>}
                </SheetFooter>
            </SheetContent>
        </Sheet>
    )
}


function EditMeetingDialog({ open, onOpenChange, meeting, onUpdate, onDelete, users, cases }: { open: boolean, onOpenChange: (open: boolean) => void, meeting: Meeting, onUpdate: (m: Partial<Meeting> & {id: string, participantIds: string[]}) => void, onDelete: (id: string) => void, users: User[], cases: Case[] }) {
  const caseOptions = useMemo(() => cases.map(c => ({value: c.id, label: c.subject})), [cases]);
  
  const [editedMeeting, setEditedMeeting] = useState<Omit<Meeting, 'participants'> & { participantIds: string[] }>({ ...meeting, participantIds: meeting.participants.map(p => p.userId) });

  const handleFieldChange = (field: keyof typeof editedMeeting, value: any) => {
    setEditedMeeting(prev => ({ ...prev, [field]: value }));
  };
  
  const handleSave = () => onUpdate({
      id: editedMeeting.id,
      title: editedMeeting.title,
      description: editedMeeting.description,
      date: editedMeeting.date,
      status: editedMeeting.status,
      linkedRecord: editedMeeting.linkedRecord,
      participantIds: editedMeeting.participantIds
  });
  
  useEffect(() => {
    if (open) {
      setEditedMeeting({ ...meeting, participantIds: meeting.participants.map(p => p.userId) });
    }
  }, [meeting, open]);


  return (
     <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
            <DialogHeader>
                <DialogTitle className="font-headline text-xl">Edit Meeting</DialogTitle>
                <DialogDescription>Update the details for this meeting.</DialogDescription>
            </DialogHeader>
             <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="title" className="text-right">Title</Label><Input id="title" value={editedMeeting.title} onChange={(e) => handleFieldChange('title', e.target.value)} className="col-span-3" /></div>
                <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="description" className="text-right">Description</Label><Textarea id="description" value={editedMeeting.description} onChange={(e) => handleFieldChange('description', e.target.value)} className="col-span-3" /></div>
                <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="date" className="text-right">Date</Label><Input id="date" type="datetime-local" value={safeFormat(editedMeeting.date, "yyyy-MM-dd'T'HH:mm")} onChange={(e) => handleFieldChange('date', e.target.value)} className="col-span-3" /></div>
                <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="status" className="text-right">Status</Label>
                    <Select onValueChange={(v: Meeting['status']) => handleFieldChange('status', v)} value={editedMeeting.status}>
                        <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="Upcoming">Upcoming</SelectItem><SelectItem value="Completed">Completed</SelectItem><SelectItem value="Canceled">Canceled</SelectItem></SelectContent>
                    </Select>
                </div>
                 <div className="grid grid-cols-4 items-start gap-4">
                    <Label htmlFor="participants" className="text-right pt-2">Participants</Label>
                    <div className="col-span-3">
                        <ParticipantsPicker
                            allUsers={users}
                            selectedUserIds={editedMeeting.participantIds}
                            onChange={(ids) => handleFieldChange('participantIds', ids)}
                        />
                    </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="linkedRecord" className="text-right">Link to Case</Label>
                    <Select onValueChange={(value) => handleFieldChange('linkedRecord', value)} value={editedMeeting.linkedRecord}>
                        <SelectTrigger className="col-span-3"><SelectValue placeholder="Select a case (optional)" /></SelectTrigger>
                        <SelectContent>{caseOptions.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                    </Select>
                </div>
            </div>
            <DialogFooter className="flex-row justify-between items-center">
                <div>
                    <Button variant="destructive" onClick={() => onDelete(meeting.id)} size="sm" className="sm:hidden">
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete Meeting</span>
                    </Button>
                     <Button variant="destructive" onClick={() => onDelete(meeting.id)} className="hidden sm:inline-flex">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Meeting
                    </Button>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSave}>Save Changes</Button>
                </div>
            </DialogFooter>
        </DialogContent>
    </Dialog>
  )
}

function CreateMeetingDialog({ open, onOpenChange, onCreate, users, cases }: { open: boolean, onOpenChange: (open: boolean) => void, onCreate: (data: any) => void, users: User[], cases: Case[] }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [participantIds, setParticipantIds] = useState<string[]>([]);
  const [linkedRecord, setLinkedRecord] = useState('');
  const [errors, setErrors] = useState<{ title?: string; date?: string; participants?: string }>({});

  const caseOptions = useMemo(() => cases.map(c => ({value: c.id, label: c.subject})), [cases]);


  const validate = () => {
    const newErrors: { title?: string; date?: string; participants?: string } = {};
    if (!title.trim()) {
      newErrors.title = 'Meeting title is required.';
    }
    if (!date) {
      newErrors.date = 'Please select a date and time.';
    }
    if (participantIds.length === 0) {
      newErrors.participants = 'Select at least one participant.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };


  const handleSubmit = () => {
    if (!validate()) {
        return;
    }
    onCreate({ title, description, date, participantIds, linkedRecord, status: 'Upcoming' });
    setTitle(''); setDescription(''); setDate(''); setParticipantIds([]); setLinkedRecord(''); setErrors({});
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
        onOpenChange(isOpen);
        if (!isOpen) {
            setErrors({});
            setTitle(''); setDescription(''); setDate(''); setParticipantIds([]); setLinkedRecord('');
        }
    }}>
      <DialogContent>
        <DialogHeader><DialogTitle className="font-headline">Schedule New Meeting</DialogTitle><DialogDescription>Fill in the details for the new meeting.</DialogDescription></DialogHeader>
        <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="title" className="text-right">Title</Label>
                <div className="col-span-3">
                    <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} className={cn(errors.title && 'border-destructive')} />
                    {errors.title && <p className="text-sm text-destructive mt-1">{errors.title}</p>}
                </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="description" className="text-right">Description</Label><Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="col-span-3" /></div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="date" className="text-right">Date & Time</Label>
                <div className="col-span-3">
                    <Input id="date" type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} className={cn(errors.date && 'border-destructive')} />
                    {errors.date && <p className="text-sm text-destructive mt-1">{errors.date}</p>}
                </div>
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="participants" className="text-right pt-2">Participants</Label>
                <div className="col-span-3">
                    <ParticipantsPicker
                        allUsers={users}
                        selectedUserIds={participantIds}
                        onChange={setParticipantIds}
                    />
                     {errors.participants && <p className="text-sm text-destructive mt-1">{errors.participants}</p>}
                </div>
            </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="linkedRecord" className="text-right">Link to Case</Label>
            <Select onValueChange={setLinkedRecord} value={linkedRecord}>
                <SelectTrigger className="col-span-3"><SelectValue placeholder="Select a case (optional)" /></SelectTrigger>
                <SelectContent>{caseOptions.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter><Button type="submit" onClick={handleSubmit}>Schedule Meeting</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
