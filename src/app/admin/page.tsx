
"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import type { User, Team } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MoreHorizontal, PlusCircle, Search, User as UserIcon, Briefcase, ListTodo, Trash2, Edit, X, ArrowLeft, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetClose } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { MultiSelect } from '@/components/ui/multi-select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger, } from '@/components/ui/alert-dialog';
import { createUser, updateUser, createTeam, updateTeam, archiveTeam } from './actions';
import { useIsClient } from '@/hooks/use-is-client';

function getStatusVariant(status: User['status']) {
    return status === 'Active' ? 'success' : 'secondary';
}

function getRoleVariant(UserRole: User['role']) {
    return UserRole === 'admin' ? 'default' : 'outline';
}

function UserManagement({ users, teams, onUserUpdate, onUserCreate }: { users: User[], teams: Team[], onUserUpdate: (user: User) => void, onUserCreate: (user: User) => void }) {
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const { toast } = useToast();
    
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    const filteredUsers = useMemo(() => {
        setCurrentPage(1); // Reset to first page on filter change
        return users.filter(user => {
            const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) || user.email.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesRole = roleFilter === 'all' || user.role === roleFilter;
            const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
            return matchesSearch && matchesRole && matchesStatus;
        });
    }, [users, searchQuery, roleFilter, statusFilter]);

    const paginatedUsers = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredUsers.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredUsers, currentPage]);

    const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);

    const handleAddUser = async (newUserData: Omit<User, 'id' | 'avatar'> & { password?: string }) => {
        try {
            const newUser = await createUser(newUserData);
            onUserCreate(newUser);
            setIsFormOpen(false);
            toast({ title: "User Created", description: `User "${newUserData.name}" has been added.` });
        } catch(e) {
            toast({ variant: 'destructive', title: "Error creating user", description: (e as Error).message });
        }
    };

    const handleUpdateUser = async (userId: string, data: Partial<User>) => {
        try {
            const updatedUser = await updateUser(userId, data);
            onUserUpdate(updatedUser);
            setEditingUser(null);
            setIsFormOpen(false);
            toast({ title: "User Updated", description: `User "${data.name}" has been updated.` });
        } catch(e) {
            toast({ variant: 'destructive', title: "Error updating user", description: (e as Error).message });
        }
    };
    
    const openCreateForm = () => {
        setEditingUser(null);
        setIsFormOpen(true);
    };

    const openEditForm = (user: User) => {
        setEditingUser(user);
        setIsFormOpen(true);
    };

    const PaginationControls = () => (
     <div className="flex items-center justify-between pt-4">
        <div className="text-sm text-muted-foreground">
            Page {totalPages > 0 ? currentPage : 0} of {totalPages} ({filteredUsers.length} total users)
        </div>
        <div className="flex items-center gap-2">
            <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
            >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Previous
            </Button>
            <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
            >
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
        </div>
    </div>
  );


    return (
        <div className="space-y-4">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div className="flex flex-col md:flex-row md:items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Search users..." className="pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                    </div>
                     <Select value={roleFilter} onValueChange={setRoleFilter}>
                        <SelectTrigger className="w-full md:w-[180px]"><SelectValue placeholder="Filter by role" /></SelectTrigger>
                        <SelectContent><SelectItem value="all">All Roles</SelectItem><SelectItem value="admin">Admin</SelectItem><SelectItem value="staff">Staff</SelectItem></SelectContent>
                    </Select>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-full md:w-[180px]"><SelectValue placeholder="Filter by status" /></SelectTrigger>
                        <SelectContent><SelectItem value="all">All Statuses</SelectItem><SelectItem value="Active">Active</SelectItem><SelectItem value="Inactive">Inactive</SelectItem></SelectContent>
                    </Select>
                </div>
                <Button onClick={openCreateForm}><PlusCircle className="mr-2 h-4 w-4" /> Add User</Button>
            </div>
            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Team</TableHead>
                            <TableHead><span className="sr-only">Actions</span></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedUsers.length > 0 ? paginatedUsers.map((user) => (
                            <TableRow key={user.id}>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={`https://placehold.co/40x40.png?text=${user.name.charAt(0)}`} data-ai-hint="person avatar" alt={user.name} />
                                            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <span className="font-medium">{user.name}</span>
                                    </div>
                                </TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell><Badge variant={getRoleVariant(user.role)}>{user.role}</Badge></TableCell>
                                <TableCell><Badge variant={getStatusVariant(user.status)}>{user.status}</Badge></TableCell>
                                <TableCell>{user.team}</TableCell>
                                <TableCell>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => openEditForm(user)}>Edit User</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    No users found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
                {totalPages > 1 && <div className="p-4 border-t"><PaginationControls /></div>}
            </div>
            <UserFormDialog
                key={editingUser ? editingUser.id : 'create'}
                open={isFormOpen}
                onOpenChange={setIsFormOpen}
                user={editingUser}
                onSave={(data, isEdit) => {
                    if (isEdit && editingUser) {
                        handleUpdateUser(editingUser.id, data);
                    } else {
                        handleAddUser(data as Omit<User, 'id' | 'avatar'>);
                    }
                }}
                teams={teams}
            />
        </div>
    );
}

function UserFormDialog({ open, onOpenChange, user, onSave, teams }: { open: boolean; onOpenChange: (open: boolean) => void; user: User | null; onSave: (data: any, isEdit: boolean) => void; teams: Team[] }) {
    const isEditMode = !!user;
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [role, setRole] = useState<User['role']>('staff');
    const [status, setStatus] = useState<User['status']>('Active');
    const [team, setTeam] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);


    useEffect(() => {
        if(user) {
            setName(user.name);
            setEmail(user.email);
            setRole(user.role);
            setStatus(user.status);
            setTeam(user.team);
            setPassword('');
        } else {
            setName(''); setEmail(''); setRole('staff'); setStatus('Active'); setTeam(''); setPassword('');
        }
    }, [user, open]);

    const handleSubmit = () => {
        const userData: Partial<User> & { password?: string } = { name, email, role, status, team };
        if (password && !isEditMode) {
            userData.password = password;
        } else if (password) {
            // Note: In a real app, password changes for existing users would have a separate flow.
            // This is simplified for the prototype.
            userData.password = password;
        }
        onSave(userData, isEditMode);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{isEditMode ? 'Edit User' : 'Add New User'}</DialogTitle>
                    <DialogDescription>{isEditMode ? "Update user details and permissions." : "Fill in the details to add a new user to the system."}</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="name" className="text-right">Name</Label><Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" /></div>
                    <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="email" className="text-right">Email</Label><Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="col-span-3" /></div>
                    {!isEditMode && (
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="password"  className="text-right">Password</Label>
                            <div className="col-span-3 relative">
                                <Input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    <span className="sr-only">{showPassword ? 'Hide password' : 'Show password'}</span>
                                </Button>
                            </div>
                        </div>
                    )}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="role" className="text-right">Role</Label>
                        <Select onValueChange={(v: User['role']) => setRole(v)} value={role}><SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="admin">Admin</SelectItem><SelectItem value="staff">Staff</SelectItem></SelectContent></Select>
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="status" className="text-right">Status</Label>
                        <Select onValueChange={(v: User['status']) => setStatus(v)} value={status}><SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Active">Active</SelectItem><SelectItem value="Inactive">Inactive</SelectItem></SelectContent></Select>
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="team" className="text-right">Team</Label>
                        <Select onValueChange={setTeam} value={team}><SelectTrigger className="col-span-3"><SelectValue placeholder="Select a team" /></SelectTrigger><SelectContent>{teams.filter(t => t.status === 'Active').map(t => <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>)}</SelectContent></Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button type="submit" onClick={handleSubmit}>{isEditMode ? 'Save Changes' : 'Add User'}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function TeamManagement({ teams, users, onTeamCreate, onTeamUpdate }: { teams: Team[], users: User[], onTeamCreate: (team: Team) => void, onTeamUpdate: (team: Team) => void }) {
    const { toast } = useToast();
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'Active' | 'Archived'>('Active');
    const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingTeam, setEditingTeam] = useState<Team | null>(null);

    const filteredTeams = useMemo(() => {
        return teams.filter(team =>
            team.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
            team.status === statusFilter
        );
    }, [teams, searchQuery, statusFilter]);

    const handleCreateTeam = async (newTeamData: Omit<Team, 'id'>) => {
        try {
            const newTeam = await createTeam(newTeamData);
            onTeamCreate(newTeam);
            setIsFormOpen(false);
            toast({ title: "Team Created", description: `Team "${newTeamData.name}" created.` });
        } catch(e) {
            toast({ variant: 'destructive', title: "Error creating team", description: (e as Error).message });
        }
    };

    const handleUpdateTeam = async (teamId: string, data: Partial<Team>) => {
        try {
            const updatedTeam = await updateTeam(teamId, data);
            onTeamUpdate(updatedTeam);
            setEditingTeam(null);
            setIsFormOpen(false);
            toast({ title: "Team Updated", description: `Team "${data.name}" updated.` });
        } catch (e) {
            toast({ variant: 'destructive', title: "Error updating team", description: (e as Error).message });
        }
    };

    const handleArchiveTeam = async (teamId: string) => {
         try {
            const teamToArchive = teams.find(t => t.id === teamId);
            if (!teamToArchive) return;
            const archived = await archiveTeam(teamId);
            onTeamUpdate(archived);
            toast({ title: "Team Archived", description: `Team "${teamToArchive.name}" has been archived.` });
        } catch (e) {
            toast({ variant: 'destructive', title: "Error archiving team", description: (e as Error).message });
        }
    };

    const handleSelectTeam = (team: Team) => {
        setSelectedTeam(team);
        setIsSheetOpen(true);
    };
    
    const openCreateForm = () => {
        setEditingTeam(null);
        setIsFormOpen(true);
    };

    const openEditForm = (team: Team) => {
        setEditingTeam(team);
        setIsSheetOpen(false);
        setTimeout(() => setIsFormOpen(true), 150);
    };


    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Search teams..." className="pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                    </div>
                     <Select value={statusFilter} onValueChange={(v: 'Active' | 'Archived') => setStatusFilter(v)}>
                        <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Active">Active Teams</SelectItem>
                            <SelectItem value="Archived">Archived Teams</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <Button onClick={openCreateForm}><PlusCircle className="mr-2 h-4 w-4" /> Create Team</Button>
            </div>
            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Team Name</TableHead>
                            <TableHead>Leader</TableHead>
                            <TableHead>Members</TableHead>
                            <TableHead><span className="sr-only">Actions</span></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredTeams.map((team) => {
                            const leader = users.find(u => u.id === team.leaderId);
                            return (
                                <TableRow key={team.id} onClick={() => handleSelectTeam(team)} className="cursor-pointer">
                                    <TableCell className="font-medium">{team.name}</TableCell>
                                    <TableCell>{leader?.name || 'N/A'}</TableCell>
                                    <TableCell>{team.memberIds.length}</TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0" onClick={e => e.stopPropagation()}><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={(e) => {e.stopPropagation(); handleSelectTeam(team)}}>View</DropdownMenuItem>
                                                <DropdownMenuItem onClick={(e) => {e.stopPropagation(); openEditForm(team)}}>Edit</DropdownMenuItem>
                                                {team.status === 'Active' && <DropdownMenuItem onClick={(e) => {e.stopPropagation(); handleArchiveTeam(team.id)}}>Archive</DropdownMenuItem>}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </div>

            {selectedTeam && (
                <TeamDetailSheet 
                    open={isSheetOpen}
                    onOpenChange={setIsSheetOpen}
                    team={selectedTeam}
                    onEdit={() => openEditForm(selectedTeam)}
                    onDelete={() => handleArchiveTeam(selectedTeam.id)}
                    users={users}
                />
            )}

            <TeamFormDialog 
                key={editingTeam ? editingTeam.id : 'create'}
                open={isFormOpen}
                onOpenChange={setIsFormOpen}
                team={editingTeam}
                onSave={(data, isEdit) => {
                    if (isEdit && editingTeam) {
                        handleUpdateTeam(editingTeam.id, data );
                    } else {
                        handleCreateTeam(data as Omit<Team, 'id'>);
                    }
                }}
                users={users}
            />
        </div>
    );
}

function TeamDetailSheet({ open, onOpenChange, team, users, onEdit, onDelete }: { open: boolean, onOpenChange: (open: boolean) => void, team: Team, users: User[], onEdit: () => void, onDelete: () => void}) {
    const leader = users.find(u => u.id === team.leaderId);
    const members = users.filter(u => team.memberIds.includes(u.id));
    
    // In a real app, cases and tasks would be fetched based on the team.
    // For now, this is a placeholder.
    const teamCases: any[] = [];
    const teamTasks: any[] = [];

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-2xl p-0">
                <div className="flex flex-col h-full">
                    <SheetHeader className="p-6 border-b">
                         <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <SheetTitle className="font-headline text-2xl">{team.name}</SheetTitle>
                                <SheetDescription>{team.description}</SheetDescription>
                                <p className="text-sm text-muted-foreground">Leader: {leader?.name || 'N/A'}</p>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" size="icon" onClick={onEdit}><Edit className="h-4 w-4"/></Button>
                                {team.status === 'Active' && <Button variant="destructive" size="icon" onClick={onDelete}><Trash2 className="h-4 w-4"/></Button>}
                                <SheetClose asChild><Button variant="ghost" size="icon"><X className="h-4 w-4"/></Button></SheetClose>
                            </div>
                        </div>
                    </SheetHeader>
                    <div className="flex-1 overflow-y-auto p-6">
                        <Tabs defaultValue="members">
                            <TabsList>
                                <TabsTrigger value="members">Members ({members.length})</TabsTrigger>
                                <TabsTrigger value="cases">Cases ({teamCases.length})</TabsTrigger>
                                <TabsTrigger value="tasks">Tasks ({teamTasks.length})</TabsTrigger>
                            </TabsList>
                            <TabsContent value="members" className="mt-4">
                                <div className="space-y-2">
                                    {members.map(member => (
                                        <div key={member.id} className="flex items-center gap-3 p-2 rounded-md border">
                                            <Avatar className="h-8 w-8"><AvatarImage src={member.avatar} /><AvatarFallback>{member.name.charAt(0)}</AvatarFallback></Avatar>
                                            <div>
                                                <p className="font-medium">{member.name} {member.id === leader?.id && <Badge variant="secondary" className="ml-2">Leader</Badge>}</p>
                                                <p className="text-sm text-muted-foreground">{member.role}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </TabsContent>
                             <TabsContent value="cases" className="mt-4">
                                {teamCases.map(c => <div key={c.id} className="p-2 border rounded-md mb-2">{c.subject}</div>)}
                                {teamCases.length === 0 && <p className="text-center text-muted-foreground py-4">No cases assigned to this team.</p>}
                            </TabsContent>
                             <TabsContent value="tasks" className="mt-4">
                                {teamTasks.map(t => <div key={t.id} className="p-2 border rounded-md mb-2">{t.title}</div>)}
                                {teamTasks.length === 0 && <p className="text-center text-muted-foreground py-4">No tasks assigned to this team.</p>}
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    )
}

function TeamFormDialog({ open, onOpenChange, team, users, onSave }: { open: boolean, onOpenChange: (open: boolean) => void, team: Team | null, users: User[], onSave: (data: any, isEdit: boolean) => void }) {
    const isEditMode = !!team;
    
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [leaderId, setLeaderId] = useState('');
    const [memberIds, setMemberIds] = useState<string[]>([]);
    const [status, setStatus] = useState<Team['status']>('Active');

    const userOptions = useMemo(() => users.map(u => ({ value: u.id, label: u.name })), [users]);
    const leaderOptions = useMemo(() => users.filter(u => memberIds.includes(u.id)).map(u => ({value: u.id, label: u.name})), [users, memberIds]);

    useEffect(() => {
        if (team) {
            setName(team.name);
            setDescription(team.description);
            setLeaderId(team.leaderId);
            setMemberIds(team.memberIds);
            setStatus(team.status);
        } else {
            setName('');
            setDescription('');
            setLeaderId('');
            setMemberIds([]);
            setStatus('Active');
        }
    }, [team, open]);
    
    useEffect(() => {
        // If the selected leader is no longer in the member list, reset it.
        if (leaderId && !memberIds.includes(leaderId)) {
            setLeaderId('');
        }
    }, [memberIds, leaderId]);

    const handleSubmit = () => {
        onSave({ name, description, leaderId, memberIds, status }, isEditMode);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{isEditMode ? 'Edit Team' : 'Create New Team'}</DialogTitle>
                    <DialogDescription>{isEditMode ? 'Update the details for this team.' : 'Fill in the details for the new team.'}</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Team Name</Label>
                        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="members">Team Members</Label>
                        <MultiSelect options={userOptions} selected={memberIds} onChange={setMemberIds} placeholder="Select team members..."/>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="leader">Team Leader</Label>
                        <Select onValueChange={setLeaderId} value={leaderId} disabled={memberIds.length === 0}>
                            <SelectTrigger><SelectValue placeholder="Select a team leader..." /></SelectTrigger>
                            <SelectContent>{leaderOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    {isEditMode && team &&
                        <div className="space-y-2">
                           <Label htmlFor="status">Team Status</Label>
                            <Select onValueChange={(v: 'Active' | 'Archived') => setStatus(v)} value={status}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Active">Active</SelectItem>
                                    <SelectItem value="Archived">Archived</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    }
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button type="submit" onClick={handleSubmit}>{isEditMode ? 'Save Changes' : 'Create Team'}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default function AdminPageLoader() {
    const { user } = useAuth();
    const router = useRouter();
    const isClient = useIsClient();
    const [users, setUsers] = useState<User[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!isClient || !user) return;

        if (user.role !== 'admin') {
            router.push('/');
        } else {
            const fetchData = async () => {
                setIsLoading(true);
                try {
                    const [usersData, teamsData] = await Promise.all([
                        import('./actions').then(actions => actions.getUsers()),
                        import('./actions').then(actions => actions.getTeams())
                    ]);
                    setUsers(usersData);
                    setTeams(teamsData);
                } catch(e) {
                    // Handle error
                } finally {
                    setIsLoading(false);
                }
            };
            fetchData();
        }
    }, [isClient, user, router]);
    
    const handleUserCreate = (newUser: User) => {
        setUsers(prev => [newUser, ...prev]);
    };

    const handleUserUpdate = (updatedUser: User) => {
        setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    };

    const handleTeamCreate = (newTeam: Team) => {
        setTeams(prev => [newTeam, ...prev]);
    };

    const handleTeamUpdate = (updatedTeam: Team) => {
        setTeams(prev => prev.map(t => t.id === updatedTeam.id ? updatedTeam : t));
    };


    if (!isClient || !user || user.role !== 'admin') {
        return <div className="p-8">Access Denied. You must be an administrator to view this page.</div>;
    }

    if (isLoading) {
        return <div>Loading...</div>
    }
    
    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <h2 className="text-3xl font-bold tracking-tight font-headline">Admin Panel</h2>
            <Tabs defaultValue="users">
                <TabsList>
                    <TabsTrigger value="users">User Management</TabsTrigger>
                    <TabsTrigger value="teams">Team Management</TabsTrigger>
                </TabsList>
                <TabsContent value="users" className="mt-6">
                    <UserManagement users={users} teams={teams} onUserCreate={handleUserCreate} onUserUpdate={handleUserUpdate} />
                </TabsContent>
                <TabsContent value="teams" className="mt-6">
                    <TeamManagement teams={teams} users={users} onTeamCreate={handleTeamCreate} onTeamUpdate={handleTeamUpdate} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
