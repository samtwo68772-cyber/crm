
"use client";

import React from 'react';
import { Calendar as CalendarIcon, Plus, Share2, Search, Video, Clock, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { meetings } from '@/lib/data.tsx';
import type { Meeting } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

function getStatusVariant(status: Meeting['status']) {
    switch (status) {
      case 'Scheduled':
        return 'default';
      case 'Completed':
        return 'secondary';
      default:
        return 'outline';
    }
}

export default function MeetingsPage() {
  const [date, setDate] = React.useState<Date | undefined>(new Date());

  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between space-y-2">
        <div>
            <h1 className="text-3xl font-bold tracking-tight font-headline">Meeting & Calendar</h1>
            <p className="text-muted-foreground">Schedule meetings and manage calendar events</p>
        </div>
         <div className="flex items-center gap-2">
            <Button variant="outline"><Share2 className="mr-2 h-4 w-4" /> Share Calendar</Button>
            <Button className="bg-foreground text-background hover:bg-foreground/90"><Plus className="mr-2 h-4 w-4" /> Schedule Meeting</Button>
         </div>
      </div>

       <Tabs defaultValue="meetings">
          <TabsList>
              <TabsTrigger value="calendar">Calendar View</TabsTrigger>
              <TabsTrigger value="meetings">All Meetings</TabsTrigger>
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          </TabsList>
          <TabsContent value="calendar">
              <Card>
                  <CardContent className="p-0">
                       <Calendar
                          mode="single"
                          selected={date}
                          onSelect={setDate}
                          className="p-4"
                       />
                  </CardContent>
              </Card>
          </TabsContent>
          <TabsContent value="meetings" className="space-y-6">
            <Card>
                <CardContent className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold">All Meetings</h2>
                         <div className="relative w-full max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Search meetings..." className="pl-9" />
                        </div>
                    </div>
                    <div className="space-y-4">
                        {meetings.map((meeting) => (
                             <Card key={meeting.id}>
                                <CardContent className="p-4 flex items-center justify-between">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3">
                                            <h3 className="font-semibold text-lg">{meeting.title}</h3>
                                            <Badge variant={getStatusVariant(meeting.status)}>{meeting.status}</Badge>
                                            <Badge variant="outline">{meeting.type}</Badge>
                                        </div>
                                        <p className="text-muted-foreground text-sm">{meeting.description}</p>
                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                            <div className="flex items-center gap-1.5"><CalendarIcon className="h-4 w-4" /> {new Date(meeting.date).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })} at {new Date(meeting.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}</div>
                                            <div className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> {meeting.duration} min</div>
                                            <div className="flex items-center gap-1.5"><Video className="h-4 w-4" /> {meeting.location}</div>
                                        </div>
                                         <div className="flex items-center gap-4 text-sm">
                                            <div className="flex items-center gap-1.5"><span className="text-muted-foreground">Organizer:</span> {meeting.organizer}</div>
                                            <div className="flex items-center gap-1.5"><User className="h-4 w-4 text-muted-foreground" /> {meeting.attendees} attendees</div>
                                        </div>
                                    </div>
                                    <Button variant="outline"><Video className="mr-2 h-4 w-4" /> Join</Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="upcoming">
            <Card>
                <CardContent className="p-6">
                    <h2 className="text-xl font-bold">Upcoming Meetings</h2>
                    <p className="text-muted-foreground mt-2">No upcoming meetings scheduled.</p>
                </CardContent>
            </Card>
          </TabsContent>
      </Tabs>
    </div>
  );
}
