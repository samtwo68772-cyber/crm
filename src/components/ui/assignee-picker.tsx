
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import type { User, Team } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { X, ChevronsUpDown, User as UserIcon, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AssigneePickerProps {
  users: User[];
  teams: Team[];
  selectedAssignees: string[];
  onChange: (assignees: string[]) => void;
  className?: string;
}

export function AssigneePicker({ users, teams, selectedAssignees, onChange, className }: AssigneePickerProps) {
  const [open, setOpen] = useState(false);

  const teamOptions = useMemo(() => teams.map(team => ({
    value: `team-${team.id}`,
    label: team.name,
    type: 'Team'
  })), [teams]);

  const userOptions = useMemo(() => users.map(user => ({
    value: `user-${user.id}`,
    label: user.name,
    type: 'User'
  })), [users]);

  const allOptions = [...teamOptions, ...userOptions];

  const handleUnselect = (item: string) => {
    onChange(selectedAssignees.filter((i) => i !== item));
  };
  
  const getLabel = (value: string) => {
    const option = allOptions.find(opt => opt.value === value);
    return option ? option.label : value;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(`w-full justify-between`, selectedAssignees.length > 1 ? 'h-full' : 'h-10', className)}
          onClick={(e) => { e.preventDefault(); setOpen(!open); }}
        >
          <div className="flex gap-1 flex-wrap">
            {selectedAssignees.length > 0 ? (
              selectedAssignees.map((assignee) => (
                <Badge
                  variant="secondary"
                  key={assignee}
                  className="mr-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUnselect(assignee);
                  }}
                >
                  {getLabel(assignee)}
                  <span
                    role="button"
                    tabIndex={0}
                    className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    onKeyDown={(e) => { if (e.key === "Enter") { handleUnselect(assignee); } }}
                    onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onClick={(e) => { e.stopPropagation(); handleUnselect(assignee); }}
                  >
                    <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                  </span>
                </Badge>
              ))
            ) : (
              <span className="text-muted-foreground">Select staff and/or teams...</span>
            )}
          </div>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0 z-50">
        <Command>
          <CommandInput placeholder="Search..." />
          <CommandList>
            <CommandEmpty>No item found.</CommandEmpty>
            <CommandGroup heading="Teams">
              {teamOptions.map((option) => (
                <CommandItem
                  key={option.value}
                  onSelect={() => {
                    onChange(
                      selectedAssignees.includes(option.value)
                        ? selectedAssignees.filter((item) => item !== option.value)
                        : [...selectedAssignees, option.value]
                    );
                    setOpen(true);
                  }}
                >
                  <Users className={cn("mr-2 h-4 w-4", selectedAssignees.includes(option.value) ? "opacity-100" : "opacity-40")} />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
             <CommandGroup heading="Users">
              {userOptions.map((option) => (
                <CommandItem
                  key={option.value}
                  onSelect={() => {
                    onChange(
                      selectedAssignees.includes(option.value)
                        ? selectedAssignees.filter((item) => item !== option.value)
                        : [...selectedAssignees, option.value]
                    );
                    setOpen(true);
                  }}
                >
                  <UserIcon className={cn("mr-2 h-4 w-4", selectedAssignees.includes(option.value) ? "opacity-100" : "opacity-40")} />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
