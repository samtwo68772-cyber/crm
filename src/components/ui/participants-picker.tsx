
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import type { User } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { X, User as UserIcon, Users, Search } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ParticipantsPickerProps {
  allUsers: User[];
  selectedUserIds: string[];
  onChange: (ids: string[]) => void;
}

export function ParticipantsPicker({ allUsers, selectedUserIds, onChange }: ParticipantsPickerProps) {
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [tempSelectedIds, setTempSelectedIds] = useState<string[]>(selectedUserIds);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setTempSelectedIds(selectedUserIds);
  }, [selectedUserIds, isDialogOpen]);

  const selectedUsers = useMemo(() => {
    return allUsers.filter(user => selectedUserIds.includes(user.id));
  }, [allUsers, selectedUserIds]);
  
  const filteredUsers = useMemo(() => {
      return allUsers.filter(user => user.name.toLowerCase().includes(searchQuery.toLowerCase()) || user.email.toLowerCase().includes(searchQuery.toLowerCase()))
  }, [allUsers, searchQuery]);

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

  const handleToggleSelection = (userId: string) => {
    setTempSelectedIds(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };
  
  const handleRemoveParticipant = (userId: string) => {
    onChange(selectedUserIds.filter(id => id !== userId));
  };

  return (
    <div>
       <div 
        className="flex flex-wrap items-center gap-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-10"
        onClick={() => setDialogOpen(true)}
      >
        {selectedUsers.length > 0 ? (
            selectedUsers.map(user => (
                <Badge key={user.id} variant="secondary">
                    {user.name}
                    <button 
                        type="button" 
                        className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveParticipant(user.id);
                        }}
                    >
                        <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                    </button>
                </Badge>
            ))
        ) : (
            <span className="text-muted-foreground">No participants selected.</span>
        )}
      </div>
      <Button type="button" variant="outline" size="sm" onClick={() => setDialogOpen(true)} className="mt-2">
        <Users className="mr-2 h-4 w-4" />
        Select Participants
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Select Participants</DialogTitle>
            <DialogDescription>Select staff members to invite to the meeting.</DialogDescription>
          </DialogHeader>
          <div className="relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
             <Input 
                placeholder="Search staff..." 
                className="pl-9"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          
          <ScrollArea className="h-72">
            <div className="space-y-2">
                {filteredUsers.length > 0 ? filteredUsers.map(user => (
                     <div key={user.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer" onClick={() => handleToggleSelection(user.id)}>
                        <Checkbox 
                            id={`user-${user.id}`}
                            checked={tempSelectedIds.includes(user.id)}
                            onCheckedChange={() => handleToggleSelection(user.id)}
                            onClick={(e) => e.stopPropagation()}
                        />
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={user.avatar} data-ai-hint="person avatar" alt={user.name}/>
                            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <p className="font-medium">{user.name}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                        <Badge variant="outline">{user.role}</Badge>
                    </div>
                )) : <p className="text-center text-muted-foreground py-4">No staff found.</p>}
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
