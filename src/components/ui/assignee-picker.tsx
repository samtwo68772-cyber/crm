
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import type { User, Team } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { X, User as UserIcon, Users, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';


interface AssigneePickerProps {
  users: User[];
  teams: Team[];
  selectedAssignees: string[];
  onChange: (assignees: string[]) => void;
  className?: string;
  mode?: 'single' | 'multiple';
}

export function AssigneePicker({ users, teams, selectedAssignees, onChange, className, mode = 'multiple' }: AssigneePickerProps) {
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [tempSelected, setTempSelected] = useState<string[]>(selectedAssignees);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setTempSelected(selectedAssignees);
  }, [selectedAssignees, isDialogOpen]);

  const teamOptions = useMemo(() => teams.map(team => ({
    value: `team-${team.id}`,
    label: team.name,
    type: 'Team'
  })), [teams]);

  const userOptions = useMemo(() => users.map(user => ({
    value: `user-${user.id}`,
    label: user.name,
    type: 'User',
    email: user.email,
    avatar: user.avatar,
    role: user.role
  })), [users]);

  const filteredTeams = useMemo(() => teamOptions.filter(t => t.label.toLowerCase().includes(searchQuery.toLowerCase())), [teamOptions, searchQuery]);
  const filteredUsers = useMemo(() => userOptions.filter(u => u.label.toLowerCase().includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase())), [userOptions, searchQuery]);

  const allOptions = [...teamOptions, ...userOptions];

  const getLabel = (value: string) => allOptions.find(opt => opt.value === value)?.label || value;

  const handleApplyClick = () => {
    onChange(tempSelected);
    setDialogOpen(false);
  };
  
  const handleClear = () => {
      setTempSelected([]);
  }

  const handleToggleSelection = (id: string) => {
    if (mode === 'single') {
        setTempSelected([id]);
    } else {
        setTempSelected(current => 
            current.includes(id) 
            ? current.filter(item => item !== id) 
            : [...current, id]
        );
    }
  };

  const handleUnselectChip = (e: React.MouseEvent, item: string) => {
    e.stopPropagation();
    onChange(selectedAssignees.filter((i) => i !== item));
  };


  return (
    <>
      <div 
        className={cn("flex flex-wrap items-center gap-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-10 cursor-pointer", className)}
        onClick={() => setDialogOpen(true)}
      >
        {selectedAssignees.length > 0 ? (
          selectedAssignees.map((assignee) => (
            <Badge
              variant="secondary"
              key={assignee}
              className="mr-1"
            >
              {getLabel(assignee)}
              <button
                type="button"
                className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                onClick={(e) => handleUnselectChip(e, assignee)}
              >
                <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
              </button>
            </Badge>
          ))
        ) : (
          <span className="text-muted-foreground">Select assignees...</span>
        )}
      </div>

       <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Assign Staff &amp; Teams</DialogTitle>
                    <DialogDescription>Select one or more staff members or teams to assign this case to.</DialogDescription>
                </DialogHeader>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search by name or email..." className="pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                </div>
                <ScrollArea className="flex-1 -mx-6 px-6">
                    <div className="space-y-4">
                        {filteredTeams.length > 0 && mode === 'multiple' && (
                          <div>
                            <h4 className="font-semibold text-lg mb-2">Teams</h4>
                            {filteredTeams.map(team => (
                                <div key={team.value} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer" onClick={() => handleToggleSelection(team.value)}>
                                    <Checkbox checked={tempSelected.includes(team.value)} onCheckedChange={() => handleToggleSelection(team.value)} onClick={(e) => e.stopPropagation()}/>
                                    <Users className="h-8 w-8 text-muted-foreground"/>
                                    <div className="flex-1">
                                        <p className="font-medium">{team.label}</p>
                                    </div>
                                </div>
                            ))}
                          </div>
                        )}
                         {filteredUsers.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-lg mb-2 pt-4">Staff</h4>
                             {filteredUsers.map(user => (
                                <div key={user.value} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer" onClick={() => handleToggleSelection(user.value)}>
                                    <Checkbox checked={tempSelected.includes(user.value)} onCheckedChange={() => handleToggleSelection(user.value)} onClick={(e) => e.stopPropagation()}/>
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={user.avatar} />
                                        <AvatarFallback>{user.label.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <p className="font-medium">{user.label}</p>
                                        <p className="text-sm text-muted-foreground">{user.email}</p>
                                    </div>
                                    <Badge variant="outline">{user.role}</Badge>
                                </div>
                            ))}
                          </div>
                         )}
                         {filteredTeams.length === 0 && filteredUsers.length === 0 && (
                           <p className="text-center text-muted-foreground py-8">No results found.</p>
                         )}
                    </div>
                </ScrollArea>
                 <DialogFooter className="mt-auto pt-4 border-t !justify-between">
                     <div>
                        <Badge variant="secondary">{tempSelected.length} selected</Badge>
                        <Button variant="link" onClick={handleClear}>Clear</Button>
                    </div>
                    <div className="flex gap-2">
                        <DialogClose asChild>
                            <Button type="button" variant="ghost">Cancel</Button>
                        </DialogClose>
                        <Button type="button" onClick={handleApplyClick}>Apply</Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </>
  );
}
