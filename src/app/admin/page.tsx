
"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/context/auth-context';
import { useData } from '@/context/data-context';
import { useRouter } from 'next/navigation';
import type { User, Team, Case, Task } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MoreHorizontal, PlusCircle, Search, User as UserIcon, Briefcase, ListTodo, Trash2, Edit, X, ArrowLeft, ArrowRight } from 'lucide-react';
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


function getStatusVariant(status: User['status']) {
    return status === 'Active' ? 'success' : 'secondary';
}

function getRoleVariant(role: User['role']) {
    return role === 'admin' ? 'default' : 'outline';
}


export default function AdminPage() {
    const { user } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (user && user.role !== 'admin') {
            router.push('/');
        }
    }, [user, router]);
    
    if (!user || user.role !== 'admin') {
        return <div className="p-8">Access Denied. You must be an administrator to view this page.</div>;
    }

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <h2 className="text-3xl font-bold tracking-tight font-headline">Admin Panel</h2>
            <Tabs defaultValue="users">
                <TabsList>
                    <TabsTrigger value="users">User Management</TabsTrigger>
                    <TabsTrigger value="teams">Team Management</TabsTrigger>
                </TabsList>
                <TabsContent value="users">
                    <UserManagement />
                </TabsContent>
                <TabsContent value="teams">
                    <TeamManagement />
                </TabsContent>
            </Tabs>
        </div>
    );
}

function UserManagement() {
    const { users, setUsers, teams } = useData();
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

    const handleAddUser = (newUserData: Omit<User, 'id' | 'avatar'>) => {
        const newUser: User = {
            id: `user-${Date.now()}`,
            avatar: `https://placehold.co/40x40.png`,
            ...newUserData
        };
        setUsers([newUser, ...users]);
        setIsFormOpen(false);
        toast({ title: "User Created", description: `User "${newUser.name}" has been added.` });
    };

    const handleUpdateUser = (updatedUser: User) => {
        setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
        setEditingUser(null);
        setIsFormOpen(false);
        toast({ title: "User Updated", description: `User "${updatedUser.name}" has been updated.` });
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
                                            <AvatarImage src={`https://placehold.co/40x40.png`} data-ai-hint="person avatar" alt={user.name} />
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
                                            <DropdownMenuItem>Reset Password</DropdownMenuItem>
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
                        handleUpdateUser({ ...editingUser, ...data });
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

    useEffect(() => {
        if(user) {
            setName(user.name);
            setEmail(user.email);
            setRole(user.role);
            setStatus(user.status);
            setTeam(user.team);
        } else {
            setName(''); setEmail(''); setRole('staff'); setStatus('Active'); setTeam('');
        }
    }, [user, open]);

    const handleSubmit = () => {
        onSave({ name, email, role, status, team }, isEditMode);
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

function TeamManagement() {
    const { teams, setTeams, users, cases, tasks } = useData();
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

    const handleCreateTeam = (newTeamData: Omit<Team, 'id'>) => {
        const newTeam = { id: `team-${Date.now()}`, ...newTeamData };
        setTeams([...teams, newTeam]);
        setIsFormOpen(false);
        toast({ title: "Team Created", description: `Team "${newTeam.name}" created.` });
    };

    const handleUpdateTeam = (updatedTeam: Team) => {
        setTeams(teams.map(t => t.id === updatedTeam.id ? updatedTeam : t));
        setEditingTeam(null);
        setIsFormOpen(false);
        toast({ title: "Team Updated", description: `Team "${updatedTeam.name}" updated.` });
    };

    const handleDeleteTeam = (teamId: string) => {
        const teamToArchive = teams.find(t => t.id === teamId);
        if (!teamToArchive) return;
        setTeams(teams.map(t => t.id === teamId ? { ...t, status: 'Archived' } : t));
        toast({ title: "Team Archived", description: `Team "${teamToArchive.name}" has been archived.` });
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
                                                {team.status === 'Active' && <DropdownMenuItem onClick={(e) => {e.stopPropagation(); handleDeleteTeam(team.id)}}>Archive</DropdownMenuItem>}
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
                    onDelete={() => handleDeleteTeam(selectedTeam.id)}
                />
            )}

            <TeamFormDialog 
                key={editingTeam ? editingTeam.id : 'create'}
                open={isFormOpen}
                onOpenChange={setIsFormOpen}
                team={editingTeam}
                onSave={(data, isEdit) => {
                    if (isEdit && editingTeam) {
                        handleUpdateTeam({ ...editingTeam, ...data });
                    } else {
                        handleCreateTeam(data as Omit<Team, 'id'>);
                    }
                }}
            />
        </div>
    );
}

function TeamDetailSheet({ open, onOpenChange, team, onEdit, onDelete }: { open: boolean, onOpenChange: (open: boolean) => void, team: Team, onEdit: () => void, onDelete: () => void}) {
    const { users, cases, tasks } = useData();
    const leader = users.find(u => u.id === team.leaderId);
    const members = users.filter(u => team.memberIds.includes(u.id));
    const teamCases = cases.filter(c => users.find(u => u.name === c.assignedTo)?.team === team.name);
    const teamTasks = tasks.filter(t => users.find(u => u.id === t.assignedTo)?.team === team.name);

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

function TeamFormDialog({ open, onOpenChange, team, onSave }: { open: boolean, onOpenChange: (open: boolean) => void, team: Team | null, onSave: (data: any, isEdit: boolean) => void }) {
    const { users } = useData();
    const isEditMode = !!team;
    
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [leaderId, setLeaderId] = useState('');
    const [memberIds, setMemberIds] = useState<string[]>([]);

    const userOptions = useMemo(() => users.map(u => ({ value: u.id, label: u.name })), [users]);
    const leaderOptions = useMemo(() => users.filter(u => memberIds.includes(u.id)).map(u => ({value: u.id, label: u.name})), [users, memberIds]);

    useEffect(() => {
        if (team) {
            setName(team.name);
            setDescription(team.description);
            setLeaderId(team.leaderId);
            setMemberIds(team.memberIds);
        } else {
            setName('');
            setDescription('');
            setLeaderId('');
            setMemberIds([]);
        }
    }, [team, open]);
    
    useEffect(() => {
        // If the selected leader is no longer in the member list, reset it.
        if (leaderId && !memberIds.includes(leaderId)) {
            setLeaderId('');
        }
    }, [memberIds, leaderId]);

    const handleSubmit = () => {
        onSave({ name, description, leaderId, memberIds, status: team?.status || 'Active' }, isEditMode);
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
                            <Select onValueChange={(v: 'Active' | 'Archived') => onSave({ ...team, status: v}, true)} value={team.status}>
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
    