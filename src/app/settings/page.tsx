
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Upload, Shield, Bell, Users, Settings, Database, Building, KeyRound, Globe, Palette, Mail, UserCheck, FileText, Bot, Search, PlusCircle, MoreHorizontal, Trash2, CheckCircle, AlertCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { users as mockUsers, teams as mockTeams } from '@/lib/data.tsx';
import type { User, Team } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';


const initialSettings = {
  general: {
    systemName: 'Caseflow CRM',
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
  email: {
      host: 'smtp.example.com',
      port: 587,
      username: 'user@example.com',
      password: 'password123',
      encryption: 'tls',
      configured: false
  }
};

type SettingsType = typeof initialSettings;
type GeneralSettingsType = SettingsType['general'];
type SecuritySettingsType = SettingsType['security'];
type EmailSettingsType = SettingsType['email'];


export default function SettingsPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [settings, setSettings] = useState<SettingsType>(initialSettings);
    const isAdmin = user?.role === 'admin';

    const handleSettingChange = (section: keyof SettingsType, newSettings: Partial<SettingsType[keyof SettingsType]>) => {
        setSettings(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                ...newSettings
            }
        }));
         toast({
            title: 'Settings Saved',
            description: 'Your changes have been saved successfully.',
        });
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

            <Tabs defaultValue="general" className="w-full">
                <div className="overflow-x-auto">
                     <TabsList className="inline-flex h-auto items-center justify-start rounded-none border-b bg-transparent p-0 gap-4">
                        <TabsTrigger value="general">General</TabsTrigger>
                        <TabsTrigger value="users">Users & Roles</TabsTrigger>
                        <TabsTrigger value="security">Security</TabsTrigger>
                        <TabsTrigger value="email">Email</TabsTrigger>
                        <TabsTrigger value="alerts">Alerts</TabsTrigger>
                        <TabsTrigger value="api">API & Integrations</TabsTrigger>
                        <TabsTrigger value="workflows">Workflows</TabsTrigger>
                        <TabsTrigger value="audit">Audit Log</TabsTrigger>
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
                    <EmailSettings initialSettings={settings.email} onSave={(newSettings) => handleSettingChange('email', newSettings)} />
                </TabsContent>
                <TabsContent value="alerts" className="mt-6"><PlaceholderCard title="Alerts & Notifications" description="Define system-wide alert triggers and notification channels." icon={Bell} /></TabsContent>
                <TabsContent value="api" className="mt-6"><PlaceholderCard title="API & Integrations" description="Manage API keys and connected third-party applications." icon={KeyRound} /></TabsContent>
                <TabsContent value="workflows" className="mt-6"><WorkflowsSettings /></TabsContent>
                <TabsContent value="audit" className="mt-6"><PlaceholderCard title="Audit Log" description="Review a log of all administrative actions taken in the system." icon={FileText} /></TabsContent>
            </Tabs>
        </div>
    );
}

function GeneralSettings({ initialSettings, onSave }: { initialSettings: GeneralSettingsType, onSave: (data: GeneralSettingsType) => void }) {
    const [settings, setSettings] = useState<GeneralSettingsType>(initialSettings);
    const [logoPreview, setLogoPreview] = useState<string | null>(initialSettings.logoUrl);

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
        onSave(settingsToSave);
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
    const [settings, setSettings] = useState<EmailSettingsType>(initialSettings);
    
    useEffect(() => {
        setSettings(initialSettings);
    }, [initialSettings]);
    
    const handleSaveChanges = (newSettings: EmailSettingsType) => {
        onSave(newSettings);
        setDialogOpen(false);
    }
    
    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <Mail className="h-6 w-6" />
                        <div>
                            <CardTitle>Email Configuration</CardTitle>
                            <CardDescription>Set up SMTP and default email templates.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="border rounded-lg p-4 flex items-center justify-between">
                        <div>
                            <h4 className="font-medium">SMTP Server</h4>
                            <p className="text-sm text-muted-foreground">
                                {settings.configured ? `Connected to ${settings.host}` : 'Not configured'}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                             <Badge variant={settings.configured ? 'success' : 'secondary'}>
                                {settings.configured ? 'Connected' : 'Inactive'}
                            </Badge>
                            <Button variant="outline" onClick={() => setDialogOpen(true)}>Configure</Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
            <EmailSettingsDialog
                open={isDialogOpen}
                onOpenChange={setDialogOpen}
                settings={settings}
                onSave={handleSaveChanges}
            />
        </>
    );
}

function EmailSettingsDialog({ open, onOpenChange, settings, onSave }: { open: boolean, onOpenChange: (open: boolean) => void, settings: EmailSettingsType, onSave: (data: EmailSettingsType) => void }) {
    const [localSettings, setLocalSettings] = useState<EmailSettingsType>(settings);
    const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
    const { toast } = useToast();

    useEffect(() => {
        setLocalSettings(settings);
    }, [settings]);
    
    const handleFieldChange = (field: keyof EmailSettingsType, value: any) => {
        setLocalSettings(prev => ({...prev, [field]: value}));
    };

    const handleSendTestEmail = () => {
        setTestStatus('testing');
        // Simulate API call
        setTimeout(() => {
            if (localSettings.host && localSettings.username && localSettings.password) {
                setTestStatus('success');
                toast({ title: "Connection Successful", description: "Test email sent successfully." });
            } else {
                setTestStatus('error');
                 toast({ variant: 'destructive', title: "Connection Failed", description: "Please check your SMTP settings and try again." });
            }
        }, 1500);
    };

    const handleSubmit = () => {
        onSave({ ...localSettings, configured: true });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>SMTP Configuration</DialogTitle>
                    <DialogDescription>Enter your SMTP server details to send emails from the system.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="host" className="text-right">Host</Label><Input id="host" value={localSettings.host} onChange={(e) => handleFieldChange('host', e.target.value)} className="col-span-3" /></div>
                    <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="port" className="text-right">Port</Label><Input id="port" type="number" value={localSettings.port} onChange={(e) => handleFieldChange('port', parseInt(e.target.value, 10))} className="col-span-3" /></div>
                    <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="username" className="text-right">Username</Label><Input id="username" value={localSettings.username} onChange={(e) => handleFieldChange('username', e.target.value)} className="col-span-3" /></div>
                    <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="password" className="text-right">Password</Label><Input id="password" type="password" value={localSettings.password} onChange={(e) => handleFieldChange('password', e.target.value)} className="col-span-3" /></div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="encryption" className="text-right">Encryption</Label>
                        <Select onValueChange={(v: string) => handleFieldChange('encryption', v)} value={localSettings.encryption}>
                            <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                            <SelectContent><SelectItem value="none">None</SelectItem><SelectItem value="ssl">SSL/TLS</SelectItem><SelectItem value="tls">STARTTLS</SelectItem></SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter className="justify-between">
                     <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={handleSendTestEmail} disabled={testStatus === 'testing'}>
                            {testStatus === 'testing' ? 'Testing...' : 'Send Test Email'}
                        </Button>
                        {testStatus === 'success' && <CheckCircle className="h-5 w-5 text-green-500" />}
                        {testStatus === 'error' && <AlertCircle className="h-5 w-5 text-destructive" />}
                    </div>
                    <div className="flex gap-2">
                         <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                         <Button onClick={handleSubmit}>Save Changes</Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function WorkflowsSettings() {
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-3">
                    <Bot className="h-6 w-6" />
                    <div>
                        <CardTitle>Workflow Configuration</CardTitle>
                        <CardDescription>Configure automated workflows and business rules</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="border rounded-lg p-4 flex items-center justify-between">
                    <div>
                        <h4 className="font-medium">Case Auto-Assignment</h4>
                        <p className="text-sm text-muted-foreground">Automatically assign new cases based on category and team availability</p>
                    </div>
                    <Button variant="outline">Configure Rules</Button>
                </div>
                 <div className="border rounded-lg p-4 flex items-center justify-between">
                    <div>
                        <h4 className="font-medium">Escalation Rules</h4>
                        <p className="text-sm text-muted-foreground">Automatically escalate overdue cases to supervisors</p>
                    </div>
                    <Button variant="outline">Configure Rules</Button>
                </div>
                 <div className="border rounded-lg p-4 flex items-center justify-between">
                    <div>
                        <h4 className="font-medium">Automated Notifications</h4>
                        <p className="text-sm text-muted-foreground">Send automated email updates to customers on case status changes</p>
                    </div>
                    <Button variant="outline">Configure Rules</Button>
                </div>
            </CardContent>
             <CardFooter className="border-t pt-6 justify-end">
                <Button>Add New Workflow</Button>
            </CardFooter>
        </Card>
    )
}

function PlaceholderCard({ title, description, icon: Icon }: { title: string, description: string, icon: React.ElementType }) {
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-3">
                    <Icon className="h-6 w-6" />
                    <div>
                        <CardTitle>{title}</CardTitle>
                        <CardDescription>{description}</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-center py-16 border-2 border-dashed rounded-lg">
                    <p className="text-muted-foreground">Configuration options for this section will be available here.</p>
                </div>
            </CardContent>
             <CardFooter className="border-t pt-6 justify-end">
                <Button disabled>Save Changes</Button>
            </CardFooter>
        </Card>
    )
}

    


    

    