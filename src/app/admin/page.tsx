
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
import { MoreHorizontal, PlusCircle, Search } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';


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
    const { users, setUsers, teams: mockTeams } = useData();
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const { toast } = useToast();

    const filteredUsers = useMemo(() => {
        return users.filter(user => {
            const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) || user.email.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesRole = roleFilter === 'all' || user.role === roleFilter;
            const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
            return matchesSearch && matchesRole && matchesStatus;
        });
    }, [users, searchQuery, roleFilter, statusFilter]);

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
                        {filteredUsers.map((user) => (
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
                        ))}
                    </TableBody>
                </Table>
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
                teams={mockTeams}
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
                        <Select onValueChange={setTeam} value={team}><SelectTrigger className="col-span-3"><SelectValue placeholder="Select a team" /></SelectTrigger><SelectContent>{teams.map(t => <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>)}</SelectContent></Select>
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
    const { teams, users: mockUsers } = useData();
    const usersInTeam = (teamName: string) => mockUsers.filter(u => u.team === teamName).length;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-end">
                <Button><PlusCircle className="mr-2 h-4 w-4" /> Create Team</Button>
            </div>
            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Team Name</TableHead>
                            <TableHead>Members</TableHead>
                            <TableHead><span className="sr-only">Actions</span></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {teams.map((team) => (
                            <TableRow key={team.id}>
                                <TableCell className="font-medium">{team.name}</TableCell>
                                <TableCell>{usersInTeam(team.name)}</TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem>Edit</DropdownMenuItem>
                                            <DropdownMenuItem>Manage members</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
