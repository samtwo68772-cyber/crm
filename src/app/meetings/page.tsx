
"use client";

import React, { useState, useMemo } from 'react';
import { meetings as mockMeetings, cases as mockCases, users as mockUsers } from '@/lib/data.tsx';
import type { Meeting, Case, User } from '@/lib/types';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MultiSelect } from '@/components/ui/multi-select';
import { Calendar as CalendarIcon, Clock, Users, Video, PlusCircle, Search, FileText, Link as LinkIcon, Edit, Trash2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast"
import { format, isThisMonth, isSameDay } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


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

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>(mockMeetings);
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [cases, setCases] = useState<Case[]>(mockCases);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const { user } = useAuth();
  const { toast } = useToast();
  const isAdmin = user?.role === 'admin';

  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const handleUpdateMeeting = (updatedMeeting: Meeting) => {
    setMeetings(meetings.map(m => m.id === updatedMeeting.id ? updatedMeeting : m));
    setSelectedMeeting(null);
    toast({ title: 'Meeting Updated', description: `Meeting "${updatedMeeting.title}" has been updated.` });
  };
  
   const handleDeleteMeeting = (meetingId: string) => {
    setMeetings(meetings.filter(m => m.id !== meetingId));
    setSelectedMeeting(null);
    toast({ title: 'Meeting Canceled', description: `The meeting has been canceled.` });
  };

  const handleCreateMeeting = (newMeetingData: Omit<Meeting, 'id'>) => {
    const newMeeting: Meeting = {
      id: `meet-${Date.now()}`,
      ...newMeetingData
    };
    setMeetings([newMeeting, ...meetings]);
    setCreateDialogOpen(false);
    toast({ title: 'Meeting Scheduled', description: `Meeting "${newMeeting.title}" has been scheduled.` });
  };

  const userMeetings = useMemo(() => {
    if (isAdmin) return meetings;
    return meetings.filter(m => m.participants.includes(user?.id || ''));
  }, [meetings, user, isAdmin]);

  const filteredMeetings = useMemo(() => {
    return userMeetings.filter(m => {
        const matchesStatus = statusFilter === 'all' || m.status === statusFilter;
        const matchesSearch = m.title.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesStatus && matchesSearch;
    })
  }, [userMeetings, statusFilter, searchQuery]);
  
  const upcomingMeetings = useMemo(() => {
    return userMeetings.filter(m => m.status === 'Upcoming');
  }, [userMeetings]);


  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">Meetings</h1>
          <p className="text-muted-foreground">Schedule, view, and manage meetings.</p>
        </div>
        {isAdmin && <Button onClick={() => setCreateDialogOpen(true)}><PlusCircle className="mr-2 h-4 w-4" /> Schedule Meeting</Button>}
      </div>

       <Tabs defaultValue="calendar" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-muted/50 rounded-lg p-1">
              <TabsTrigger value="calendar">Calendar View</TabsTrigger>
              <TabsTrigger value="meetings">All Meetings</TabsTrigger>
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          </TabsList>
          <TabsContent value="calendar" className="mt-6">
              <Card>
                <CardContent className="p-0">
                    <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        className="w-full"
                        components={{
                            DayContent: ({ date }) => {
                                const dayMeetings = userMeetings.filter(m => isSameDay(new Date(m.date), date));
                                return (
                                    <div className="relative h-full w-full flex flex-col items-center justify-between p-2">
                                        <span className="self-start">{format(date, 'd')}</span>
                                        {dayMeetings.length > 0 && 
                                            <div className="flex -space-x-1">
                                            {dayMeetings.slice(0, 3).map(m => (
                                                <div key={m.id} onClick={(e) => { e.stopPropagation(); setSelectedMeeting(m); }} 
                                                     className={`h-2 w-2 rounded-full border border-card ${getStatusColor(m.status)} cursor-pointer hover:scale-125 transition-transform`}
                                                     title={m.title}
                                                />
                                            ))}
                                            </div>
                                        }
                                    </div>
                                );
                            }
                        }}
                    />
                  </CardContent>
              </Card>
          </TabsContent>
          <TabsContent value="meetings" className="space-y-6 mt-6">
            <div className="flex items-center gap-4">
                 <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search meetings..." className="pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                </div>
                 <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="Upcoming">Upcoming</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                        <SelectItem value="Canceled">Canceled</SelectItem>
                    </SelectContent>
                 </Select>
                 <Button variant="outline" onClick={() => { setSearchQuery(''); setStatusFilter('all'); setSelectedDate(undefined); }}>Clear</Button>
            </div>
            <div className="space-y-4 h-[60vh] overflow-y-auto pr-4">
                {filteredMeetings.length > 0 ? filteredMeetings.map(meeting => (
                    <Card key={meeting.id} onClick={() => setSelectedMeeting(meeting)} className="cursor-pointer hover:bg-muted/50 transition-colors">
                        <CardContent className="p-4">
                             <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-semibold text-lg">{meeting.title}</h3>
                                    <p className="text-sm text-muted-foreground">{meeting.description}</p>
                                </div>
                                <Badge variant={getStatusVariant(meeting.status)}>{meeting.status}</Badge>
                            </div>
                            <div className="flex items-center gap-6 text-sm text-muted-foreground mt-4">
                                <div className="flex items-center gap-1.5"><CalendarIcon className="h-4 w-4" /> {format(new Date(meeting.date), 'PPP')}</div>
                                <div className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> {format(new Date(meeting.date), 'p')}</div>
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
          </TabsContent>
          <TabsContent value="upcoming" className="mt-6">
            <Card>
                <CardHeader>
                    <CardTitle>Upcoming Meetings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {upcomingMeetings.length > 0 ? upcomingMeetings.map(meeting => (
                        <Card key={meeting.id} onClick={() => setSelectedMeeting(meeting)} className="cursor-pointer hover:bg-muted/50 transition-colors">
                            <CardContent className="p-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-semibold text-lg">{meeting.title}</h3>
                                        <p className="text-sm text-muted-foreground">{meeting.description}</p>
                                    </div>
                                    <Badge variant={getStatusVariant(meeting.status)}>{meeting.status}</Badge>
                                </div>
                                <div className="flex items-center gap-6 text-sm text-muted-foreground mt-4">
                                    <div className="flex items-center gap-1.5"><CalendarIcon className="h-4 w-4" /> {format(new Date(meeting.date), 'PPP')}</div>
                                    <div className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> {format(new Date(meeting.date), 'p')}</div>
                                    <div className="flex items-center gap-1.5"><Users className="h-4 w-4" /> {meeting.participants.length}</div>
                                </div>
                            </CardContent>
                        </Card>
                    )) : (
                        <p className="text-muted-foreground mt-2 text-center py-8">No upcoming meetings scheduled.</p>
                    )}
                </CardContent>
            </Card>
          </TabsContent>
      </Tabs>
      
      {selectedMeeting && <MeetingDetailPanel open={!!selectedMeeting} onOpenChange={() => setSelectedMeeting(null)} meeting={selectedMeeting} onUpdate={handleUpdateMeeting} onDelete={handleDeleteMeeting} />}
      <CreateMeetingDialog open={isCreateDialogOpen} onOpenChange={setCreateDialogOpen} onCreate={handleCreateMeeting} />
    </div>
  );
}

function MeetingDetailPanel({ open, onOpenChange, meeting, onUpdate, onDelete }: { open: boolean, onOpenChange: (open: boolean) => void, meeting: Meeting, onUpdate: (m: Meeting) => void, onDelete: (id: string) => void }) {
  const { user } = useAuth();
  const [cases, setCases] = useState<Case[]>(mockCases);
  const [users, setUsers] = useState<User[]>(mockUsers);
  const isAdmin = user?.role === 'admin';
  const [isEditing, setIsEditing] = useState(false);
  const [editedMeeting, setEditedMeeting] = useState<Meeting>(meeting);

  const linkedCase = useMemo(() => cases.find(c => c.id === meeting.linkedRecord), [meeting, cases]);
  const participantOptions = useMemo(() => users.map(u => ({ value: u.id, label: u.name })), [users]);


  const handleFieldChange = (field: keyof Meeting, value: any) => {
    setEditedMeeting(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    onUpdate(editedMeeting);
    setIsEditing(false);
  };

  return (
     <Dialog open={open} onOpenChange={(val) => { onOpenChange(val); setIsEditing(false); }}>
        <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
                <DialogTitle className="font-headline text-2xl">{meeting.title}</DialogTitle>
                <DialogDescription>{meeting.description}</DialogDescription>
            </DialogHeader>
            
            {isEditing ? (
                 <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="title" className="text-right">Title</Label><Input id="title" value={editedMeeting.title} onChange={(e) => handleFieldChange('title', e.target.value)} className="col-span-3" /></div>
                    <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="date" className="text-right">Date</Label><Input id="date" type="datetime-local" value={format(new Date(editedMeeting.date), "yyyy-MM-dd'T'HH:mm")} onChange={(e) => handleFieldChange('date', e.target.value)} className="col-span-3" /></div>
                    <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="status" className="text-right">Status</Label>
                        <Select onValueChange={(v: Meeting['status']) => handleFieldChange('status', v)} defaultValue={editedMeeting.status}>
                            <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                            <SelectContent><SelectItem value="Upcoming">Upcoming</SelectItem><SelectItem value="Completed">Completed</SelectItem><SelectItem value="Canceled">Canceled</SelectItem></SelectContent>
                        </Select>
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="participants" className="text-right">Participants</Label>
                        <MultiSelect
                            className="col-span-3"
                            options={participantOptions}
                            selected={editedMeeting.participants}
                            onChange={(selected) => handleFieldChange('participants', selected)}
                            placeholder="Select participants"
                        />
                    </div>
                </div>
            ) : (
                <div className="space-y-6 py-4">
                    <div className="flex items-center justify-between">
                         <Badge variant={getStatusVariant(meeting.status)}>{meeting.status}</Badge>
                         <div className="flex items-center gap-2 text-sm text-muted-foreground"><CalendarIcon className="h-4 w-4" /> {format(new Date(meeting.date), 'PPP p')}</div>
                    </div>
                    {linkedCase && 
                        <div className="flex items-center gap-2 text-sm"><LinkIcon className="h-4 w-4 text-muted-foreground" /> <strong>Linked Case:</strong> {linkedCase.subject}</div>
                    }
                    <div>
                        <h4 className="font-semibold mb-2">Participants</h4>
                        <div className="flex flex-wrap gap-2">{meeting.participants.map(pId => {
                            const participant = users.find(u => u.id === pId);
                            return participant ? <Badge key={pId} variant="secondary">{participant.name}</Badge> : null;
                        })}</div>
                    </div>
                     <div>
                        <h4 className="font-semibold mb-2">Notes</h4>
                        <Textarea placeholder="Add meeting notes..." rows={4} />
                        <Button className="mt-2" size="sm">Add Note</Button>
                    </div>
                     <div>
                        <h4 className="font-semibold mb-2">Attachments</h4>
                        <div className="p-4 border-2 border-dashed rounded-lg text-center">
                            <FileText className="mx-auto h-8 w-8 text-muted-foreground" />
                            <Label htmlFor="file-upload" className="relative cursor-pointer text-sm font-medium text-primary hover:text-primary/80"><span>Upload a file</span><input id="file-upload" type="file" className="sr-only" /></Label>
                        </div>
                    </div>
                </div>
            )}
            
            <DialogFooter className="justify-between">
                <div>
                     {isAdmin && isEditing && <Button variant="destructive" onClick={() => onDelete(meeting.id)}><Trash2 className="mr-2 h-4 w-4" />Delete Meeting</Button>}
                </div>
                <div>
                {isAdmin && !isEditing && <Button variant="outline" onClick={() => setIsEditing(true)}><Edit className="mr-2 h-4 w-4" /> Edit</Button>}
                {isAdmin && isEditing && (
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => { setIsEditing(false); setEditedMeeting(meeting); }}>Cancel</Button>
                        <Button onClick={handleSave}>Save Changes</Button>
                    </div>
                )}
                 {!isAdmin && <Button onClick={() => onOpenChange(false)}>Close</Button>}
                 </div>
            </DialogFooter>
        </DialogContent>
    </Dialog>
  )
}

function CreateMeetingDialog({ open, onOpenChange, onCreate }: { open: boolean, onOpenChange: (open: boolean) => void, onCreate: (data: any) => void }) {
  const [cases] = useState<Case[]>(mockCases);
  const [users] = useState<User[]>(mockUsers);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [participants, setParticipants] = useState<string[]>([]);
  const [linkedRecord, setLinkedRecord] = useState('');

  const participantOptions = useMemo(() => users.map(u => ({ value: u.id, label: u.name })), [users]);

  const handleSubmit = () => {
    onCreate({ title, description, date, participants, linkedRecord, status: 'Upcoming' });
    setTitle(''); setDescription(''); setDate(''); setParticipants([]); setLinkedRecord('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle className="font-headline">Schedule New Meeting</DialogTitle><DialogDescription>Fill in the details for the new meeting.</DialogDescription></DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="title" className="text-right">Title</Label><Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="col-span-3" /></div>
          <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="description" className="text-right">Description</Label><Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="col-span-3" /></div>
          <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="date" className="text-right">Date & Time</Label><Input id="date" type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} className="col-span-3" /></div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="participants" className="text-right">Participants</Label>
             <MultiSelect
                className="col-span-3"
                options={participantOptions}
                selected={participants}
                onChange={setParticipants}
                placeholder="Select participants"
            />
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="linkedRecord" className="text-right">Link to Case</Label>
            <Select onValueChange={setLinkedRecord} value={linkedRecord}>
                <SelectTrigger className="col-span-3"><SelectValue placeholder="Select a case (optional)" /></SelectTrigger>
                <SelectContent>{cases.map(c => <SelectItem key={c.id} value={c.id}>{c.subject}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter><Button type="submit" onClick={handleSubmit}>Schedule Meeting</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

    