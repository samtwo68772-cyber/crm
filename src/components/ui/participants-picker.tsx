
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import type { User, Team } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { X, User as UserIcon, Users, Search, PlusCircle } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ParticipantsPickerProps {
  allUsers: User[];
  allTeams: Team[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

export function ParticipantsPicker({ allUsers, allTeams, selectedIds, onChange }: ParticipantsPickerProps) {
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [tempSelectedIds, setTempSelectedIds] = useState<string[]>(selectedIds);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setTempSelectedIds(selectedIds);
  }, [selectedIds, isDialogOpen]);

  const teamOptions = useMemo(() => {
      return allTeams.map(team => ({
          value: `team-${team.id}`,
          label: team.name
      }));
  }, [allTeams]);

  const userOptions = useMemo(() => {
      return allUsers.map(user => ({
          value: `user-${user.id}`,
          label: user.name,
          email: user.email,
          avatar: user.avatar,
          role: user.role
      }))
  }, [allUsers]);

  const selectedItems = useMemo(() => {
    return selectedIds.map(id => {
      if (id.startsWith('team-')) {
        return teamOptions.find(t => t.value === id);
      }
      return userOptions.find(u => u.value === id);
    }).filter(Boolean);
  }, [selectedIds, userOptions, teamOptions]);

  const filteredUsers = useMemo(() => {
      return userOptions.filter(user => user.label.toLowerCase().includes(searchQuery.toLowerCase()) || user.email.toLowerCase().includes(searchQuery.toLowerCase()))
  }, [userOptions, searchQuery]);

  const filteredTeams = useMemo(() => {
      return teamOptions.filter(team => team.label.toLowerCase().includes(searchQuery.toLowerCase()))
  }, [teamOptions, searchQuery]);

  const handleApply = () => {
    onChange(tempSelectedIds);
    setDialogOpen(false);
  };

  const handleCancel = () => {
    setDialogOpen(false);
  };
  
  const handleClear = () => {
      setTempSelectedIds([]);
  }

  const handleToggleSelection = (id: string) => {
    setTempSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };
  
  const handleRemoveParticipant = (id: string) => {
    onChange(selectedIds.filter(i => i !== id));
  };

  return (
    <div>
       <div 
        className="flex flex-wrap items-center gap-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-10 cursor-pointer"
        onClick={() => setDialogOpen(true)}
      >
        {selectedItems.length > 0 ? (
            selectedItems.map(item => (
                <Badge key={item!.value} variant="secondary">
                    {item!.label}
                    <button 
                        type="button" 
                        className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveParticipant(item!.value);
                        }}
                    >
                        <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                    </button>
                </Badge>
            ))
        ) : (
            <span className="text-muted-foreground">Select participants...</span>
        )}
        <button type="button" className="ml-auto text-muted-foreground hover:text-foreground" onClick={(e) => {e.stopPropagation(); setDialogOpen(true)}}>
          <PlusCircle className="h-4 w-4" />
        </button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Select Participants</DialogTitle>
            <DialogDescription>Select staff members or teams to invite.</DialogDescription>
          </DialogHeader>
          <div className="relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
             <Input 
                placeholder="Search staff or teams..." 
                className="pl-9"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          
          <ScrollArea className="h-72">
            <div className="space-y-4">
                {filteredTeams.length > 0 && (
                     <div>
                        <h4 className="font-medium text-lg mb-2">Teams</h4>
                        {filteredTeams.map(team => (
                             <div key={team.value} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer" onClick={() => handleToggleSelection(team.value)}>
                                <Checkbox 
                                    id={team.value}
                                    checked={tempSelectedIds.includes(team.value)}
                                    onCheckedChange={() => handleToggleSelection(team.value)}
                                    onClick={(e) => e.stopPropagation()}
                                />
                                <Users className="h-8 w-8 text-muted-foreground" />
                                <div className="flex-1">
                                    <p className="font-medium">{team.label}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                {filteredUsers.length > 0 ? (
                    <div>
                         <h4 className="font-medium text-lg mb-2 pt-4">Staff</h4>
                        {filteredUsers.map(user => (
                             <div key={user.value} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer" onClick={() => handleToggleSelection(user.value)}>
                                <Checkbox 
                                    id={user.value}
                                    checked={tempSelectedIds.includes(user.value)}
                                    onCheckedChange={() => handleToggleSelection(user.value)}
                                    onClick={(e) => e.stopPropagation()}
                                />
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={user.avatar} data-ai-hint="person avatar" alt={user.label}/>
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
                ) : filteredTeams.length === 0 && <p className="text-center text-muted-foreground py-4">No staff or teams found.</p>}
            </div>
          </ScrollArea>
          
          <DialogFooter className="justify-between">
            <div>
                 <Badge variant="secondary">{tempSelectedIds.length} selected</Badge>
            </div>
            <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={handleClear}>Clear</Button>
                <DialogClose asChild>
                    <Button type="button" variant="ghost" onClick={handleCancel}>Cancel</Button>
                </DialogClose>
                <Button type="button" onClick={handleApply}>Apply</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
