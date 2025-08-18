
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/auth-context';
import { useData } from '@/context/data-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Upload, Shield, Bell, Users, Settings, Database, Building, KeyRound, Globe, Palette, Mail, UserCheck, FileText, Bot, Search, PlusCircle, MoreHorizontal, Trash2, CheckCircle, AlertCircle, Copy, ArrowRight, X } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { users as mockUsers, teams as mockTeams, auditLogs as mockAuditLogs } from '@/lib/data.tsx';
import type { User, Team, AuditLog as AuditLogType, EmailSettingsType, NotificationPreferences } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import type { DateRange } from "react-day-picker";
import { isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { useSearchParams } from 'next/navigation'


const initialSettings = {
  general: {
    systemName: 'MinT CRM',
    companyName: 'My Company',
    logoUrl: '',
    timeZone: 'UTC-5:00',
    language: 'en-US',
  },
  security: {
    passwordMinLength: 8,
    passwordRequireSpecialChars: true,
    passwordRequireNumbers: true,
    enable2FA: false,
    sessionTimeout: 30, // in minutes
    ipWhitelist: '192.168.1.1\n127.0.0.1',
  },
};

type SettingsType = typeof initialSettings;
type GeneralSettingsType = SettingsType['general'];
type SecuritySettingsType = SettingsType['security'];


const initialApiKeys = [
    { id: 'key-1', key: 'sk_live_abc123xyz789', displayName: 'sk_...789', createdAt: '2024-01-15', lastUsed: '2024-05-20' },
    { id: 'key-2', key: 'sk_live_def456uvw456', displayName: 'sk_...456', createdAt: '2024-03-10', lastUsed: '2024-04-12' },
];
const initialApiLogs = [
    { id: 'log-1', endpoint: '/api/v1/cases', status: 'Success', timestamp: '2024-05-22 10:30 AM' },
    { id: 'log-2', endpoint: '/api/v1/users', status: 'Success', timestamp: '2024-05-22 10:28 AM' },
    { id: 'log-3', endpoint: '/api/v1/cases/case-101', status: 'Error', timestamp: '2024-05-22 10:25 AM' },
];
type ApiKey = typeof initialApiKeys[0];
type ApiLog = typeof initialApiLogs[0];

const initialWorkflows = [
    { id: 'wf-1', name: 'Assign High-Priority Cases', trigger: 'case-created', condition: 'priority-high', action: 'assign-team-t2' },
    { id: 'wf-2', name: 'Notify Customer on Resolution', trigger: 'case-status-changed', condition: 'status-resolved', action: 'send-email-customer' },
];
type Workflow = typeof initialWorkflows[0];

export default function SettingsPage() {
    const { user } = useAuth();
    const { emailSettings, setEmailSettings, notificationPreferences, setNotificationPreferences } = useData();
    const { toast } = useToast();
    const [settings, setSettings] = useState<SettingsType>(initialSettings);
    const isAdmin = user?.role === 'admin';
    const searchParams = useSearchParams()
    const defaultTab = searchParams.get('tab') || "general";

    const handleSettingChange = (section: keyof SettingsType, newSettings: Partial<SettingsType[keyof SettingsType]>) => {
        setSettings(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                ...newSettings
            }
        }));
    };
    
    if (!isAdmin) {
        return (
            <div className="p-8">
                <h2 className="text-3xl font-bold tracking-tight font-headline">System Settings</h2>
                <p className="text-muted-foreground">You do not have permission to view or edit system settings.</p>
            </div>
        )
    }

    return (
        <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight font-headline">System Settings</h2>
                <p className="text-muted-foreground">Configure system-wide settings and preferences</p>
            </div>

            <Tabs defaultValue={defaultTab} className="w-full">
                 <div className="overflow-x-auto pb-1">
                     <TabsList className="inline-flex h-auto items-center justify-start rounded-lg bg-muted p-1 gap-1 text-muted-foreground">
                        <TabsTrigger value="general" className="rounded-md px-3 py-1.5 text-sm font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">General</TabsTrigger>
                        <TabsTrigger value="users" className="rounded-md px-3 py-1.5 text-sm font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">Users & Roles</TabsTrigger>
                        <TabsTrigger value="security" className="rounded-md px-3 py-1.5 text-sm font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">Security</TabsTrigger>
                        <TabsTrigger value="email" className="rounded-md px-3 py-1.5 text-sm font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">Email</TabsTrigger>
                        <TabsTrigger value="alerts" className="rounded-md px-3 py-1.5 text-sm font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">Alerts</TabsTrigger>
                        <TabsTrigger value="api" className="rounded-md px-3 py-1.5 text-sm font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">API & Integrations</TabsTrigger>
                        <TabsTrigger value="workflows" className="rounded-md px-3 py-1.5 text-sm font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">Workflows</TabsTrigger>
                        <TabsTrigger value="audit" className="rounded-md px-3 py-1.5 text-sm font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">Audit Log</TabsTrigger>
                    </TabsList>
                </div>
                
                <TabsContent value="general" className="mt-6">
                    <GeneralSettings initialSettings={settings.general} onSave={(newSettings) => handleSettingChange('general', newSettings)} />
                </TabsContent>
                <TabsContent value="users" className="mt-6">
                    <UsersSettings />
                </TabsContent>
                <TabsContent value="security" className="mt-6">
                    <SecuritySettings initialSettings={settings.security} onSave={(newSettings) => handleSettingChange('security', newSettings)} />
                </TabsContent>
                <TabsContent value="email" className="mt-6">
                    <EmailSettings initialSettings={emailSettings} onSave={setEmailSettings} />
                </TabsContent>
                <TabsContent value="alerts" className="mt-6">
                    <AlertsSettings
                        preferences={notificationPreferences}
                        onSave={setNotificationPreferences}
                    />
                </TabsContent>
                <TabsContent value="api" className="mt-6"><ApiSettings /></TabsContent>
                <TabsContent value="workflows" className="mt-6"><WorkflowsSettings /></TabsContent>
                <TabsContent value="audit" className="mt-6"><AuditLog /></TabsContent>
            </Tabs>
        </div>
    );
}

function GeneralSettings({ initialSettings, onSave: onSaveProp }: { initialSettings: GeneralSettingsType, onSave: (data: GeneralSettingsType) => void }) {
    const [settings, setSettings] = useState<GeneralSettingsType>(initialSettings);
    const [logoPreview, setLogoPreview] = useState<string | null>(initialSettings.logoUrl);
    const { toast } = useToast();

    const hasChanges = JSON.stringify(settings) !== JSON.stringify(initialSettings) || logoPreview !== initialSettings.logoUrl;

    const handleCancel = () => {
        setSettings(initialSettings);
        setLogoPreview(initialSettings.logoUrl);
    };

    const handleSave = () => {
        const settingsToSave = { ...settings };
        if (logoPreview && logoPreview !== initialSettings.logoUrl) {
            settingsToSave.logoUrl = logoPreview;
        }
        onSaveProp(settingsToSave);
        toast({
            title: 'Settings Saved',
            description: 'Your changes have been saved successfully.',
        });
    };

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    useEffect(() => {
        setSettings(initialSettings);
        setLogoPreview(initialSettings.logoUrl);
    }, [initialSettings]);


    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-3">
                    <Settings className="h-6 w-6" />
                    <div>
                        <CardTitle>General System Settings</CardTitle>
                        <CardDescription>Configure basic information and localization for your system.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-8">
                 <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="systemName">System Name</Label>
                        <Input id="systemName" value={settings.systemName} onChange={(e) => setSettings(s => ({...s, systemName: e.target.value}))} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="companyName">Company Name</Label>
                        <Input id="companyName" value={settings.companyName} onChange={(e) => setSettings(s => ({...s, companyName: e.target.value}))} />
                    </div>
                 </div>
                 <div className="space-y-2">
                    <Label>Company Logo</Label>
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center">
                            {logoPreview ? (
                                <img src={logoPreview} alt="Logo Preview" data-ai-hint="logo" className="h-full w-full object-contain rounded-md" />
                            ) : (
                                <Building className="h-8 w-8 text-muted-foreground" />
                            )}
                        </div>
                        <Input id="logoUrl" type="file" className="max-w-xs" onChange={handleLogoChange} accept="image/*" />
                    </div>
                </div>
                 <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label>Timezone</Label>
                        <Select value={settings.timeZone} onValueChange={(v) => setSettings(s => ({...s, timeZone: v}))}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="UTC-8:00">Pacific Time (UTC-8:00)</SelectItem>
                                <SelectItem value="UTC-5:00">Eastern Time (UTC-5:00)</SelectItem>
                                <SelectItem value="UTC">UTC</SelectItem>
                                <SelectItem value="GMT+1:00">Central European Time (GMT+1:00)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Default Language</Label>
                        <Select value={settings.language} onValueChange={(v) => setSettings(s => ({...s, language: v}))}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="en-US">English (United States)</SelectItem>
                                <SelectItem value="en-GB">English (United Kingdom)</SelectItem>
                                <SelectItem value="es-ES">Spanish</SelectItem>
                                <SelectItem value="fr-FR">French</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                 </div>
            </CardContent>
            <CardFooter className="border-t pt-6 justify-end flex gap-2">
                {hasChanges && <Button variant="outline" onClick={handleCancel}>Cancel</Button>}
                <Button onClick={handleSave} disabled={!hasChanges}>Save Changes</Button>
            </CardFooter>
        </Card>
    );
}

function getStatusVariant(status: User['status']) {
    return status === 'Active' ? 'success' : 'secondary';
}

function getRoleVariant(role: User['role']) {
    return role === 'admin' ? 'default' : 'outline';
}

function UsersSettings() {
    const [users, setUsers] = useState<User[]>(mockUsers);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const { toast } = useToast();

    const filteredUsers = useMemo(() => {
        return users.filter(user => {
            const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) || user.email.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesRole = roleFilter === 'all' || user.role === roleFilter;
            return matchesSearch && matchesRole;
        });
    }, [users, searchQuery, roleFilter]);

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

    const handleDeleteUser = (userId: string) => {
        setUsers(users.filter(u => u.id !== userId));
        toast({ title: "User Deleted", description: `User has been deleted.` });
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
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Users className="h-6 w-6" />
                        <div>
                            <CardTitle>User Management</CardTitle>
                            <CardDescription>Manage staff accounts, roles, and permissions.</CardDescription>
                        </div>
                    </div>
                    <Button onClick={openCreateForm}><PlusCircle className="mr-2 h-4 w-4"/> Add User</Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
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
                    </div>
                </div>
                <div className="rounded-md border bg-background">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Status</TableHead>
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
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => openEditForm(user)}>Edit User</DropdownMenuItem>
                                                <DropdownMenuItem>Reset Password</DropdownMenuItem>
                                                <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteUser(user.id)}>Delete User</DropdownMenuItem>
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
            </CardContent>
        </Card>
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

function SecuritySettings({ initialSettings, onSave }: { initialSettings: SecuritySettingsType; onSave: (data: SecuritySettingsType) => void; }) {
    const [settings, setSettings] = useState<SecuritySettingsType>(initialSettings);
    const hasChanges = JSON.stringify(settings) !== JSON.stringify(initialSettings);

    const handleCancel = () => setSettings(initialSettings);
    const handleSave = () => onSave(settings);

    useEffect(() => {
        setSettings(initialSettings);
    }, [initialSettings]);

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-3">
                    <Shield className="h-6 w-6" />
                    <div>
                        <CardTitle>Security Settings</CardTitle>
                        <CardDescription>Configure password policies, 2FA, session management, and IP whitelisting.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-8">
                <div>
                    <h4 className="font-medium text-lg mb-4">Password Policy</h4>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                            <Label htmlFor="require-special-chars">Require Special Characters</Label>
                            <Switch id="require-special-chars" checked={settings.passwordRequireSpecialChars} onCheckedChange={(checked) => setSettings(s => ({ ...s, passwordRequireSpecialChars: checked }))}/>
                        </div>
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                            <Label htmlFor="require-numbers">Require Numbers</Label>
                            <Switch id="require-numbers" checked={settings.passwordRequireNumbers} onCheckedChange={(checked) => setSettings(s => ({ ...s, passwordRequireNumbers: checked }))}/>
                        </div>
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                            <Label htmlFor="min-length">Minimum Length</Label>
                            <Input id="min-length" type="number" value={settings.passwordMinLength} onChange={(e) => setSettings(s => ({ ...s, passwordMinLength: parseInt(e.target.value, 10) || 0 }))} className="w-24"/>
                        </div>
                    </div>
                </div>
                <div>
                    <h4 className="font-medium text-lg mb-4">Authentication</h4>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                            <Label htmlFor="enable-2fa">Enable Two-Factor Authentication (2FA)</Label>
                            <Switch id="enable-2fa" checked={settings.enable2FA} onCheckedChange={(checked) => setSettings(s => ({ ...s, enable2FA: checked }))}/>
                        </div>
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                            <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
                            <Input id="session-timeout" type="number" value={settings.sessionTimeout} onChange={(e) => setSettings(s => ({ ...s, sessionTimeout: parseInt(e.target.value, 10) || 0 }))} className="w-24"/>
                        </div>
                    </div>
                </div>
                <div>
                     <h4 className="font-medium text-lg mb-2">IP Whitelist</h4>
                     <p className="text-sm text-muted-foreground mb-4">Only allow access from these IP addresses. Enter one IP per line.</p>
                     <Textarea value={settings.ipWhitelist} onChange={(e) => setSettings(s => ({...s, ipWhitelist: e.target.value}))} rows={5}/>
                </div>
            </CardContent>
            <CardFooter className="border-t pt-6 flex justify-end gap-2">
                {hasChanges && <Button variant="outline" onClick={handleCancel}>Cancel</Button>}
                <Button onClick={handleSave} disabled={!hasChanges}>Save Changes</Button>
            </CardFooter>
        </Card>
    );
}

function EmailSettings({ initialSettings, onSave }: { initialSettings: EmailSettingsType; onSave: (data: EmailSettingsType) => void; }) {
    const [isDialogOpen, setDialogOpen] = useState(false);
    
    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <Mail className="h-6 w-6" />
                        <div>
                            <CardTitle>Email Configuration</CardTitle>
                            <CardDescription>Set up SMTP (sending) and IMAP (receiving) email accounts.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="border rounded-lg p-4 flex items-center justify-between">
                        <div>
                            <h4 className="font-medium">Email Server</h4>
                            <p className="text-sm text-muted-foreground">
                                {initialSettings.configured ? `Connected to ${initialSettings.smtpHost} / ${initialSettings.imapHost}` : 'Not configured'}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                             <Badge variant={initialSettings.configured ? 'success' : 'secondary'}>
                                {initialSettings.configured ? 'Connected' : 'Inactive'}
                            </Badge>
                            <Button variant="outline" onClick={() => setDialogOpen(true)}>Configure</Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
            <EmailSettingsDialog
                open={isDialogOpen}
                onOpenChange={setDialogOpen}
                settings={initialSettings}
                onSave={onSave}
            />
        </>
    );
}

function EmailSettingsDialog({ open, onOpenChange, settings, onSave }: { open: boolean, onOpenChange: (open: boolean) => void, settings: EmailSettingsType, onSave: (data: EmailSettingsType) => void }) {
    const [localSettings, setLocalSettings] = useState<EmailSettingsType>(settings);
    const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
    const { toast } = useToast();

    const isFormValid = localSettings.smtpHost && localSettings.smtpPort && localSettings.smtpUser && localSettings.smtpPass && localSettings.imapHost && localSettings.imapPort && localSettings.imapUser && localSettings.imapPass;

    useEffect(() => {
        if(open) {
            setLocalSettings(settings);
            setTestStatus('idle');
        }
    }, [settings, open]);
    
    const handleFieldChange = (field: keyof EmailSettingsType, value: any) => {
        setLocalSettings(prev => ({...prev, [field]: value}));
    };

    const handleTestConnection = () => {
        setTestStatus('testing');
        // Simulate API call to test both SMTP and IMAP
        setTimeout(() => {
            if (isFormValid) {
                setTestStatus('success');
                toast({ title: "Connection Successful", description: "SMTP and IMAP connections verified." });
            } else {
                setTestStatus('error');
                 toast({ variant: 'destructive', title: "Connection Failed", description: "Please check all your settings and try again." });
            }
        }, 1500);
    };

    const handleSubmit = () => {
        onSave({ ...localSettings, configured: true });
        toast({ title: 'Email Settings Saved', description: 'Your email configuration has been updated.' });
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Email Server Configuration</DialogTitle>
                    <DialogDescription>Enter your email server details for sending and receiving emails.</DialogDescription>
                </DialogHeader>
                <Tabs defaultValue="smtp">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="smtp">Sending (SMTP)</TabsTrigger>
                        <TabsTrigger value="imap">Receiving (IMAP)</TabsTrigger>
                    </TabsList>
                    <TabsContent value="smtp" className="pt-4">
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="smtpHost" className="text-right">Host</Label><Input id="smtpHost" value={localSettings.smtpHost} onChange={(e) => handleFieldChange('smtpHost', e.target.value)} className="col-span-3" /></div>
                            <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="smtpPort" className="text-right">Port</Label><Input id="smtpPort" type="number" value={localSettings.smtpPort} onChange={(e) => handleFieldChange('smtpPort', parseInt(e.target.value, 10) || 0)} className="col-span-3" /></div>
                            <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="smtpUser" className="text-right">Username</Label><Input id="smtpUser" value={localSettings.smtpUser} onChange={(e) => handleFieldChange('smtpUser', e.target.value)} className="col-span-3" /></div>
                            <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="smtpPass" className="text-right">Password</Label><Input id="smtpPass" type="password" value={localSettings.smtpPass} onChange={(e) => handleFieldChange('smtpPass', e.target.value)} className="col-span-3" /></div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="smtpEncryption" className="text-right">Encryption</Label>
                                <Select onValueChange={(v: string) => handleFieldChange('smtpEncryption', v)} value={localSettings.smtpEncryption}>
                                    <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                                    <SelectContent><SelectItem value="none">None</SelectItem><SelectItem value="ssl">SSL/TLS</SelectItem><SelectItem value="tls">STARTTLS</SelectItem></SelectContent>
                                </Select>
                            </div>
                        </div>
                    </TabsContent>
                    <TabsContent value="imap" className="pt-4">
                        <div className="grid gap-4 py-4">
                             <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="imapHost" className="text-right">Host</Label><Input id="imapHost" value={localSettings.imapHost} onChange={(e) => handleFieldChange('imapHost', e.target.value)} className="col-span-3" /></div>
                            <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="imapPort" className="text-right">Port</Label><Input id="imapPort" type="number" value={localSettings.imapPort} onChange={(e) => handleFieldChange('imapPort', parseInt(e.target.value, 10) || 0)} className="col-span-3" /></div>
                            <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="imapUser" className="text-right">Username</Label><Input id="imapUser" value={localSettings.imapUser} onChange={(e) => handleFieldChange('imapUser', e.target.value)} className="col-span-3" /></div>
                            <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="imapPass" className="text-right">Password</Label><Input id="imapPass" type="password" value={localSettings.imapPass} onChange={(e) => handleFieldChange('imapPass', e.target.value)} className="col-span-3" /></div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="imapEncryption" className="text-right">Encryption</Label>
                                <Select onValueChange={(v: string) => handleFieldChange('imapEncryption', v)} value={localSettings.imapEncryption}>
                                    <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                                    <SelectContent><SelectItem value="none">None</SelectItem><SelectItem value="ssl">SSL/TLS</SelectItem></SelectContent>
                                </Select>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
                <DialogFooter className="justify-between pt-4 border-t">
                     <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={handleTestConnection} disabled={testStatus === 'testing' || !isFormValid}>
                            {testStatus === 'testing' ? 'Testing...' : 'Test Connection'}
                        </Button>
                        {testStatus === 'success' && <CheckCircle className="h-5 w-5 text-green-500" />}
                        {testStatus === 'error' && <AlertCircle className="h-5 w-5 text-destructive" />}
                    </div>
                    <div className="flex gap-2">
                         <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                         <Button onClick={handleSubmit} disabled={!isFormValid}>Save Changes</Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

const notificationConfig = {
    cases: {
        title: 'Cases',
        events: {
            newAssignment: 'New case assigned to me',
            statusChange: 'Status changes on my cases',
            newComment: 'New comment on my cases',
        },
    },
    tasks: {
        title: 'Tasks',
        events: {
            newAssignment: 'New task assigned to me',
            statusChange: 'Task status changes',
            dueSoon: 'Task is due soon',
        },
    },
    meetings: {
        title: 'Meetings',
        events: {
            newInvite: 'New meeting invitation',
            update: 'Meeting details are updated',
            cancellation: 'Meeting is canceled',
        },
    },
};

function AlertsSettings({ preferences, onSave }: { preferences: NotificationPreferences; onSave: (data: NotificationPreferences) => void; }) {
    const [currentPreferences, setCurrentPreferences] = useState(preferences);
    const { toast } = useToast();

    useEffect(() => {
        setCurrentPreferences(preferences);
    }, [preferences]);

    const handlePreferenceChange = (
        category: keyof NotificationPreferences,
        event: keyof NotificationPreferences[keyof NotificationPreferences],
        channel: 'inApp' | 'email',
        value: boolean
    ) => {
        setCurrentPreferences(prev => ({
            ...prev,
            [category]: {
                ...prev[category],
                [event]: {
                    ...prev[category][event],
                    [channel]: value,
                },
            },
        }));
    };

    const handleSave = () => {
        onSave(currentPreferences);
        toast({ title: 'Preferences Saved', description: 'Your notification preferences have been updated.' });
    };

    const hasChanges = JSON.stringify(currentPreferences) !== JSON.stringify(preferences);

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-3">
                    <Bell className="h-6 w-6" />
                    <div>
                        <CardTitle>Alerts & Notifications</CardTitle>
                        <CardDescription>Choose how you receive notifications for important events.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-8">
                {Object.entries(notificationConfig).map(([categoryKey, categoryValue]) => (
                    <div key={categoryKey}>
                        <h4 className="font-medium text-lg mb-4">{categoryValue.title}</h4>
                        <div className="space-y-4">
                            {Object.entries(categoryValue.events).map(([eventKey, eventLabel]) => (
                                <div key={eventKey} className="border rounded-lg p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                    <Label className="flex-1 font-normal">{eventLabel}</Label>
                                    <div className="flex items-center gap-6 w-full md:w-auto">
                                        <div className="flex items-center space-x-2">
                                            <Switch
                                                id={`${categoryKey}-${eventKey}-inApp`}
                                                checked={currentPreferences[categoryKey as keyof NotificationPreferences][eventKey as keyof NotificationPreferences[keyof NotificationPreferences]].inApp}
                                                onCheckedChange={(checked) => handlePreferenceChange(categoryKey as keyof NotificationPreferences, eventKey as any, 'inApp', checked)}
                                            />
                                            <Label htmlFor={`${categoryKey}-${eventKey}-inApp`} className="text-sm font-normal">In-App</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Switch
                                                id={`${categoryKey}-${eventKey}-email`}
                                                checked={currentPreferences[categoryKey as keyof NotificationPreferences][eventKey as keyof NotificationPreferences[keyof NotificationPreferences]].email}
                                                onCheckedChange={(checked) => handlePreferenceChange(categoryKey as keyof NotificationPreferences, eventKey as any, 'email', checked)}
                                            />
                                            <Label htmlFor={`${categoryKey}-${eventKey}-email`} className="text-sm font-normal">Email</Label>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </CardContent>
            <CardFooter className="border-t pt-6 justify-end flex gap-2">
                {hasChanges && <Button variant="outline" onClick={() => setCurrentPreferences(preferences)}>Cancel</Button>}
                <Button onClick={handleSave} disabled={!hasChanges}>Save Changes</Button>
            </CardFooter>
        </Card>
    );
}

function ApiSettings() {
    const { toast } = useToast();
    const [apiKeys, setApiKeys] = useState<ApiKey[]>(initialApiKeys);
    const [apiLogs] = useState<ApiLog[]>(initialApiLogs);
    const [newlyGeneratedKey, setNewlyGeneratedKey] = useState<string | null>(null);

    const generateKey = () => {
        const newKey = `sk_live_${[...Array(24)].map(() => Math.random().toString(36)[2]).join('')}`;
        const newKeyObject: ApiKey = {
            id: `key-${Date.now()}`,
            key: newKey,
            displayName: `${newKey.slice(0, 9)}...${newKey.slice(-4)}`,
            createdAt: new Date().toISOString().split('T')[0],
            lastUsed: 'Never',
        };
        setApiKeys(prev => [...prev, newKeyObject]);
        setNewlyGeneratedKey(newKey);
    };

    const copyToClipboard = (key: string, message: string) => {
        navigator.clipboard.writeText(key).then(() => {
            toast({ title: "Copied!", description: message });
        });
    };

    const revokeKey = (keyId: string) => {
        setApiKeys(prev => prev.filter(key => key.id !== keyId));
        toast({ title: 'API Key Revoked', description: 'The selected API key has been deleted.' });
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <KeyRound className="h-6 w-6" />
                            <div>
                                <CardTitle>API & Integrations</CardTitle>
                                <CardDescription>Manage API keys and connected third-party applications.</CardDescription>
                            </div>
                        </div>
                        <Button onClick={generateKey}><PlusCircle className="mr-2 h-4 w-4" /> Generate API Key</Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div>
                        <h4 className="font-medium text-lg mb-4">Active API Keys</h4>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Key</TableHead>
                                        <TableHead>Created</TableHead>
                                        <TableHead>Last Used</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {apiKeys.map((key) => (
                                        <TableRow key={key.id}>
                                            <TableCell className="font-mono">{key.displayName}</TableCell>
                                            <TableCell>{key.createdAt}</TableCell>
                                            <TableCell>{key.lastUsed}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="sm" onClick={() => copyToClipboard(key.key, "API key copied to clipboard.")}>
                                                    <Copy className="mr-2 h-4 w-4" /> Copy
                                                </Button>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                                                            <Trash2 className="mr-2 h-4 w-4" /> Revoke
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                This will permanently delete the API key. This action cannot be undone.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => revokeKey(key.id)}>Revoke Key</AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                    <div>
                        <h4 className="font-medium text-lg mb-4">Usage Logs</h4>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Endpoint</TableHead>
                                        <TableHead>Timestamp</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {apiLogs.map((log) => (
                                        <TableRow key={log.id}>
                                            <TableCell className="font-mono">{log.endpoint}</TableCell>
                                            <TableCell>{log.timestamp}</TableCell>
                                            <TableCell>
                                                <Badge variant={log.status === 'Success' ? 'success' : 'destructive'}>{log.status}</Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={!!newlyGeneratedKey} onOpenChange={(open) => !open && setNewlyGeneratedKey(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>New API Key Generated</DialogTitle>
                        <DialogDescription>
                            Please copy your new API key. For security reasons, you will not be able to see it again.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="relative rounded-md bg-muted p-4 font-mono text-sm break-all">
                        {newlyGeneratedKey}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-2 top-1/2 -translate-y-1/2"
                            onClick={() => newlyGeneratedKey && copyToClipboard(newlyGeneratedKey, "New API key copied to clipboard.")}
                        >
                            <Copy className="h-4 w-4" />
                        </Button>
                    </div>
                    <DialogFooter>
                        <Button onClick={() => setNewlyGeneratedKey(null)}>Done</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

function WorkflowsSettings() {
    const [workflows, setWorkflows] = useState<Workflow[]>(initialWorkflows);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null);
    const { toast } = useToast();

    const handleAddWorkflow = (newWorkflow: Omit<Workflow, 'id'>) => {
        const workflow = { ...newWorkflow, id: `wf-${Date.now()}` };
        setWorkflows([...workflows, workflow]);
        setIsFormOpen(false);
        toast({ title: 'Workflow Created', description: `Workflow "${workflow.name}" has been created.` });
    };
    
    const handleUpdateWorkflow = (updatedWorkflow: Workflow) => {
        setWorkflows(workflows.map(wf => wf.id === updatedWorkflow.id ? updatedWorkflow : wf));
        setEditingWorkflow(null);
        setIsFormOpen(false);
        toast({ title: 'Workflow Updated', description: `Workflow "${updatedWorkflow.name}" has been updated.` });
    };

    const handleDeleteWorkflow = (workflowId: string) => {
        setWorkflows(workflows.filter(wf => wf.id !== workflowId));
        toast({ title: 'Workflow Deleted', description: 'The workflow has been deleted.' });
    };

    const openCreateForm = () => {
        setEditingWorkflow(null);
        setIsFormOpen(true);
    };

    const openEditForm = (workflow: Workflow) => {
        setEditingWorkflow(workflow);
        setIsFormOpen(true);
    };

    const getWorkflowStepLabel = (type: 'trigger' | 'condition' | 'action', value: string) => {
        const options: Record<string, Record<string, string>> = {
            trigger: { 'case-created': 'Case is created', 'task-status-changed': 'Task status changes' },
            condition: { 'priority-high': 'Priority is High', 'status-resolved': 'Status is Resolved', 'task-overdue': 'Task is overdue' },
            action: { 'assign-team-t2': 'Assign to Tier 2', 'send-email-customer': 'Send email to customer', 'create-followup-task': 'Create follow-up task' }
        };
        return options[type][value] || value;
    };


    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Bot className="h-6 w-6" />
                            <div>
                                <CardTitle>Workflow Configuration</CardTitle>
                                <CardDescription>Configure automated workflows and business rules.</CardDescription>
                            </div>
                        </div>
                        <Button onClick={openCreateForm}><PlusCircle className="mr-2 h-4 w-4" /> Add Workflow</Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {workflows.map((workflow) => (
                        <div key={workflow.id} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between">
                                <h4 className="font-medium">{workflow.name}</h4>
                                <div className="flex items-center gap-2">
                                    <Button variant="ghost" size="sm" onClick={() => openEditForm(workflow)}>Edit</Button>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">Delete</Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Delete Workflow?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Are you sure you want to delete the "{workflow.name}" workflow? This action cannot be undone.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDeleteWorkflow(workflow.id)}>Delete</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                                <Badge variant="secondary">{getWorkflowStepLabel('trigger', workflow.trigger)}</Badge>
                                <ArrowRight className="h-4 w-4" />
                                <Badge variant="secondary">{getWorkflowStepLabel('condition', workflow.condition)}</Badge>
                                <ArrowRight className="h-4 w-4" />
                                <Badge variant="secondary">{getWorkflowStepLabel('action', workflow.action)}</Badge>
                            </div>
                        </div>
                    ))}
                    {workflows.length === 0 && <p className="text-center text-muted-foreground py-8">No workflows configured.</p>}
                </CardContent>
            </Card>
            <WorkflowFormDialog
                key={editingWorkflow ? editingWorkflow.id : 'create'}
                open={isFormOpen}
                onOpenChange={setIsFormOpen}
                workflow={editingWorkflow}
                onSave={(data, isEdit) => {
                    if (isEdit && editingWorkflow) {
                        handleUpdateWorkflow({ ...editingWorkflow, ...data });
                    } else {
                        handleAddWorkflow(data as Omit<Workflow, 'id'>);
                    }
                }}
            />
        </>
    )
}

function WorkflowFormDialog({ open, onOpenChange, workflow, onSave }: { open: boolean, onOpenChange: (open: boolean) => void, workflow: Workflow | null, onSave: (data: any, isEdit: boolean) => void }) {
    const isEditMode = !!workflow;
    const [name, setName] = useState('');
    const [trigger, setTrigger] = useState('');
    const [condition, setCondition] = useState('');
    const [action, setAction] = useState('');
    
    useEffect(() => {
        if(workflow) {
            setName(workflow.name);
            setTrigger(workflow.trigger);
            setCondition(workflow.condition);
            setAction(workflow.action);
        } else {
             setName(''); setTrigger(''); setCondition(''); setAction('');
        }
    }, [workflow, open]);

    const handleSubmit = () => {
        onSave({ name, trigger, condition, action }, isEditMode);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{isEditMode ? 'Edit Workflow' : 'Create New Workflow'}</DialogTitle>
                </DialogHeader>
                 <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Workflow Name</Label>
                        <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g., High-Priority Case Assignment" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="trigger">Trigger</Label>
                        <Select onValueChange={setTrigger} value={trigger}>
                            <SelectTrigger><SelectValue placeholder="When..." /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="case-created">A new case is created</SelectItem>
                                <SelectItem value="task-status-changed">A task's status changes</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="condition">Condition</Label>
                        <Select onValueChange={setCondition} value={condition}>
                            <SelectTrigger><SelectValue placeholder="If..." /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="priority-high">Case priority is High</SelectItem>
                                <SelectItem value="status-resolved">Case status is Resolved</SelectItem>
                                <SelectItem value="task-overdue">Task is overdue</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="action">Action</Label>
                        <Select onValueChange={setAction} value={action}>
                            <SelectTrigger><SelectValue placeholder="Then..." /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="assign-team-t2">Assign to Tier 2 Support</SelectItem>
                                <SelectItem value="send-email-customer">Send email to customer</SelectItem>
                                <SelectItem value="create-followup-task">Create follow-up task</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button type="submit" onClick={handleSubmit}>{isEditMode ? 'Save Changes' : 'Create Workflow'}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function AuditLog() {
    const [logs] = useState<AuditLogType[]>(mockAuditLogs);
    const [searchQuery, setSearchQuery] = useState('');
    const [userFilter, setUserFilter] = useState('all');
    const [dateRange, setDateRange] = useState<DateRange | undefined>();

    const filteredLogs = useMemo(() => {
        return logs.filter(log => {
            const matchesSearch = log.details.toLowerCase().includes(searchQuery.toLowerCase()) || log.action.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesUser = userFilter === 'all' || log.userId === userFilter;
            const matchesDate = !dateRange?.from || isWithinInterval(new Date(log.timestamp), { start: startOfDay(dateRange.from), end: endOfDay(dateRange.to || dateRange.from) });
            return matchesSearch && matchesUser && matchesDate;
        });
    }, [logs, searchQuery, userFilter, dateRange]);

    const userOptions = useMemo(() => {
        const uniqueUsers = [...new Map(logs.map(log => [log.userId, mockUsers.find(u => u.id === log.userId)])).values()];
        return uniqueUsers.filter(Boolean) as User[];
    }, [logs]);

    const clearFilters = () => {
        setSearchQuery('');
        setUserFilter('all');
        setDateRange(undefined);
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-3">
                    <FileText className="h-6 w-6" />
                    <div>
                        <CardTitle>Audit Log</CardTitle>
                        <CardDescription>Review a log of all administrative actions taken in the system.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex flex-col md:flex-row gap-2">
                    <Input 
                        placeholder="Search by action or details..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="max-w-sm"
                    />
                    <Select value={userFilter} onValueChange={setUserFilter}>
                        <SelectTrigger className="w-full md:w-[180px]"><SelectValue placeholder="Filter by user" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Users</SelectItem>
                            {userOptions.map(user => <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <DateRangePicker onDateChange={setDateRange} />
                    <Button variant="outline" onClick={clearFilters}><X className="mr-2 h-4 w-4" /> Clear Filters</Button>
                </div>

                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead>Action</TableHead>
                                <TableHead>Details</TableHead>
                                <TableHead>Timestamp</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredLogs.map(log => (
                                <TableRow key={log.id}>
                                    <TableCell>{mockUsers.find(u => u.id === log.userId)?.name || 'System'}</TableCell>
                                    <TableCell><Badge variant="secondary">{log.action}</Badge></TableCell>
                                    <TableCell>{log.details}</TableCell>
                                    <TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
                {filteredLogs.length === 0 && (
                    <div className="text-center py-16 text-muted-foreground">
                        <p>No audit logs found for the selected filters.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
