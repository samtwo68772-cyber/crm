
"use client";

import React from 'react';
import { Calendar as CalendarIcon, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function CalendarPage() {
  const [date, setDate] = React.useState<Date | undefined>(new Date());

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight font-headline">Calendar & Meetings</h2>
         <Button><PlusCircle className="mr-2 h-4 w-4" /> New Event</Button>
      </div>

       <Tabs defaultValue="calendar">
          <TabsList>
              <TabsTrigger value="calendar">Calendar</TabsTrigger>
              <TabsTrigger value="meetings">Meetings</TabsTrigger>
          </TabsList>
          <TabsContent value="calendar">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-[1fr_350px]">
                <Card className="col-span-1 lg:col-span-1">
                    <CardContent className="p-0">
                         <Calendar
                            mode="single"
                            selected={date}
                            onSelect={setDate}
                            className="p-0"
                            classNames={{
                                months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0 p-4",
                                month: "space-y-4",
                                caption_label: "text-lg font-medium",
                                table: "w-full border-collapse",
                                head_row: "flex justify-around",
                                head_cell: "w-full text-muted-foreground rounded-md font-normal text-[0.8rem] justify-center flex",
                                row: "flex w-full mt-2 justify-around",
                                cell: "h-16 w-full text-center text-sm p-1 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                                day: "h-full w-full p-1 font-normal aria-selected:opacity-100 flex items-start justify-end",
                                day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground rounded-full",
                                day_today: "bg-accent text-accent-foreground rounded-full",
                                day_outside: "text-muted-foreground opacity-50",
                             }}
                         />
                    </CardContent>
                </Card>
                <Card className="col-span-1 lg:col-span-1">
                    <CardHeader>
                        <CardTitle>Upcoming Events</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>No events scheduled for this day.</p>
                    </CardContent>
                </Card>
              </div>
          </TabsContent>
          <TabsContent value="meetings">
            <Card>
                <CardHeader>
                    <CardTitle>Meetings</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>No upcoming meetings.</p>
                </CardContent>
            </Card>
          </TabsContent>
      </Tabs>
    </div>
  );
}
