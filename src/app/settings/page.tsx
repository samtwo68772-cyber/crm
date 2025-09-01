

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
import { Upload, Shield, Bell, Users, Settings, Database, Building, KeyRound, Globe, Palette, Mail, UserCheck, FileText, Bot, Search, PlusCircle, MoreHorizontal, Trash2, CheckCircle, AlertCircle, Copy, ArrowRight, X, Lock, Loader2, Eye, EyeOff } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { User, Team, AuditLog as AuditLogType, EmailSettingsType, NotificationPreferences, GeneralSettingsType, NotificationChannel, Workflow } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import type { DateRange } from "react-day-picker";
import { isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { useSearchParams } from 'next/navigation';
import { Checkbox } from '@/components/ui/checkbox';
import { getGeneralSettings, updateGeneralSettings, getEmailSettings, updateEmailSettings, testEmailConnection, getGlobalNotificationPreferences, updateGlobalNotificationPreferences, getWorkflows, createWorkflow, updateWorkflow, deleteWorkflow, getAuditLogs } from './actions';
import { getUsers, getTeams } from '../admin/actions';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { permissionModules } from '@/lib/permissions';


type SecuritySettingsType = {
    passwordMinLength: number;
    passwordRequireSpecialChars: boolean;
    passwordRequireNumbers: boolean;
    enable2FA: boolean;
    sessionTimeout: number; // in minutes
    ipWhitelist: string;
};

const initialSecuritySettings: SecuritySettingsType = {
    passwordMinLength: 8,
    passwordRequireSpecialChars: true,
    passwordRequireNumbers: true,
    enable2FA: false,
    sessionTimeout: 30, // in minutes
    ipWhitelist: '192.168.1.1\n127.0.0.1',
};


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


export default function SettingsPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: generalSettings, isLoading: generalLoading } = useQuery<GeneralSettingsType>({ queryKey: ['generalSettings'], queryFn: getGeneralSettings });
    const { data: emailSettings, isLoading: emailLoading } = useQuery<EmailSettingsType>({ queryKey: ['emailSettings'], queryFn: getEmailSettings });
    const { data: notificationPreferences, isLoading: notificationsLoading } = useQuery<NotificationPreferences>({ queryKey: ['globalNotificationPreferences'], queryFn: getGlobalNotificationPreferences });
    const { data: workflows, isLoading: workflowsLoading } = useQuery<Workflow[]>({ queryKey: ['workflows'], queryFn: getWorkflows });
    const { data: auditLogs, isLoading: auditLogsLoading } = useQuery<AuditLogType[]>({ queryKey: ['auditLogs'], queryFn: getAuditLogs });
    const { data: users, isLoading: usersLoading } = useQuery<User[]>({ queryKey: ['users'], queryFn: getUsers });
    const { data: teams, isLoading: teamsLoading } = useQuery<Team[]>({ queryKey: ['teams'], queryFn: getTeams });

    const isLoading = generalLoading || emailLoading || notificationsLoading || workflowsLoading || auditLogsLoading || usersLoading || teamsLoading;

    const [securitySettings, setSecuritySettings] = useState<SecuritySettingsType>(initialSecuritySettings);
    const searchParams = useSearchParams()
    const defaultTab = searchParams.get('tab') || "general";

    const workflowMutation = useMutation({
        mutationFn: async ({ action, payload }: { action: 'create' | 'update' | 'delete', payload: any }) => {
            switch (action) {
                case 'create': return createWorkflow(payload);
                case 'update': return updateWorkflow(payload.id, payload);
                case 'delete': return deleteWorkflow(payload);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workflows'] });
            toast({ title: 'Success', description: 'Workflow has been updated.'})
        },
        onError: () => {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to update workflow.'})
        }
    });

    if (isLoading) {
        return (
            <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
                <Skeleton className="h-12 w-1/2" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-96 w-full" />
            </div>
        );
    }
    
    if (user?.role.name !== 'Admin') {
        return (
            <div className="p-8">
                <h2 className="text-3xl font-bold tracking-tight font-headline">System Settings</h2>
                <p className="text-muted-foreground">You do not have permission to view or edit system settings.</p>
            </div>
        )
    }

    if (!generalSettings || !emailSettings || !notificationPreferences || !workflows || !auditLogs || !users || !teams) {
        return (
             <div className="p-8">
                <h2 className="text-3xl font-bold tracking-tight font-headline">System Settings</h2>
                <p className="text-muted-foreground">Could not load settings data.</p>
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
                     <TabsList className="inline-flex h-auto items-center justify-start rounded-lg bg-muted p-1 text-muted-foreground md:w-full md:grid md:grid-cols-7">
                        <TabsTrigger value="general" className="rounded-md px-3 py-1.5 text-sm font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">General</TabsTrigger>
                        <TabsTrigger value="security" className="rounded-md px-3 py-1.5 text-sm font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">Security</TabsTrigger>
                        <TabsTrigger value="email" className="rounded-md px-3 py-1.5 text-sm font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">Email</TabsTrigger>
                        <TabsTrigger value="alerts" className="rounded-md px-3 py-1.5 text-sm font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">Alerts</TabsTrigger>
                        <TabsTrigger value="api" className="rounded-md px-3 py-1.5 text-sm font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">API</TabsTrigger>
                        <TabsTrigger value="workflows" className="rounded-md px-3 py-1.5 text-sm font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">Workflows</TabsTrigger>
                        <TabsTrigger value="audit" className="rounded-md px-3 py-1.5 text-sm font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">Audit Log</TabsTrigger>
                    </TabsList>
                </div>
                
                <TabsContent value="general" className="mt-6">
                    <GeneralSettings initialSettings={generalSettings} />
                </TabsContent>
                <TabsContent value="security" className="mt-6">
                    <SecuritySettings initialSettings={securitySettings} onSave={setSecuritySettings} />
                </TabsContent>
                <TabsContent value="email" className="mt-6">
                    <EmailSettings initialSettings={emailSettings} />
                </TabsContent>
                <TabsContent value="alerts" className="mt-6">
                    <AlertsSettings
                        preferences={notificationPreferences}
                    />
                </TabsContent>
                <TabsContent value="api" className="mt-6"><ApiSettings /></TabsContent>
                <TabsContent value="workflows" className="mt-6">
                    <WorkflowsSettings 
                        workflows={workflows} 
                        onAddWorkflow={(payload) => workflowMutation.mutate({ action: 'create', payload })}
                        onUpdateWorkflow={(payload) => workflowMutation.mutate({ action: 'update', payload })}
                        onDeleteWorkflow={(payload) => workflowMutation.mutate({ action: 'delete', payload })}
                    />
                </TabsContent>
                <TabsContent value="audit" className="mt-6"><AuditLog logs={auditLogs} users={users} /></TabsContent>
            </Tabs>
        </div>
    );
}

function GeneralSettings({ initialSettings }: { initialSettings: GeneralSettingsType }) {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const [settings, setSettings] = useState<GeneralSettingsType>(initialSettings);
    const [logoPreview, setLogoPreview] = useState<string | null>(initialSettings.logoUrl);

    useEffect(() => {
        setSettings(initialSettings);
        setLogoPreview(initialSettings.logoUrl);
    }, [initialSettings]);
    
    const hasChanges = JSON.stringify(settings) !== JSON.stringify(initialSettings) || logoPreview !== initialSettings.logoUrl;

    const mutation = useMutation({
        mutationFn: updateGeneralSettings,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['generalSettings'] });
            toast({
                title: 'Settings Saved',
                description: 'Your changes have been saved successfully.',
            });
        },
        onError: () => {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to save settings.'})
        }
    })

    const handleCancel = () => {
        setSettings(initialSettings);
        setLogoPreview(initialSettings.logoUrl);
    };

    const handleSave = async () => {
        const settingsToSave = { ...settings };
        if (logoPreview && logoPreview !== initialSettings.logoUrl) {
            settingsToSave.logoUrl = logoPreview;
        }
        mutation.mutate(settingsToSave);
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
            <CardFooter className="border-t pt-6 flex flex-col sm:flex-row justify-end gap-2">
                {hasChanges && <Button variant="outline" onClick={handleCancel} className="w-full sm:w-auto">Cancel</Button>}
                <Button onClick={handleSave} disabled={!hasChanges || mutation.isPending} className="w-full sm:w-auto">
                    {mutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
            </CardFooter>
        </Card>
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
            <CardFooter className="border-t pt-6 flex flex-col sm:flex-row justify-end gap-2">
                {hasChanges && <Button variant="outline" onClick={handleCancel} className="w-full sm:w-auto">Cancel</Button>}
                <Button onClick={handleSave} disabled={!hasChanges} className="w-full sm:w-auto">Save Changes</Button>
            </CardFooter>
        </Card>
    );
}

function EmailSettings({ initialSettings }: { initialSettings: EmailSettingsType; }) {
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
                    <div className="border rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <h4 className="font-medium">Email Server</h4>
                             <p className="text-sm text-muted-foreground">
                                {initialSettings.configured ? `Configuration for ${initialSettings.imapUser}` : 'Not configured'}
                            </p>
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                             <Badge variant={initialSettings.configured ? 'success' : 'secondary'} className="mr-auto sm:mr-0">
                                {initialSettings.configured ? 'Active' : 'Inactive'}
                            </Badge>
                            <Button variant="outline" onClick={() => setDialogOpen(true)} className="w-full sm:w-auto">
                                {initialSettings.configured ? 'View/Edit Config' : 'Configure'}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
            <EmailSettingsDialog
                key={initialSettings.id}
                open={isDialogOpen}
                onOpenChange={setDialogOpen}
                settings={initialSettings}
            />
        </>
    );
}

function EmailSettingsDialog({ open, onOpenChange, settings }: { open: boolean, onOpenChange: (open: boolean) => void, settings: EmailSettingsType }) {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [currentSettings, setCurrentSettings] = useState(settings);
    const [showSmtpPass, setShowSmtpPass] = useState(false);
    const [showImapPass, setShowImapPass] = useState(false);
    
    const testConnectionMutation = useMutation({
        mutationFn: testEmailConnection,
        onSuccess: (data) => {
            if (data.smtp.success && data.imap.success) {
                toast({ title: "Connection Successful!", description: "Both SMTP and IMAP connections were successful.", variant: 'default' });
            } else {
                let errorParts = [];
                if (!data.smtp.success) errorParts.push(`SMTP: ${data.smtp.error}`);
                if (!data.imap.success) errorParts.push(`IMAP: ${data.imap.error}`);
                toast({ variant: "destructive", title: "Connection Failed", description: errorParts.join('\n'), duration: 9000 });
            }
        },
        onError: (error: any) => {
             toast({ variant: "destructive", title: "Error", description: error.message });
        }
    });
    
    const updateSettingsMutation = useMutation({
        mutationFn: updateEmailSettings,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['emailSettings'] });
            toast({ title: "Settings Saved", description: "Your email settings have been updated." });
            onOpenChange(false);
        },
        onError: () => {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to save email settings.'})
        }
    });

    const handleSave = () => {
        updateSettingsMutation.mutate({...currentSettings, configured: true });
    };
    
    const handleTestConnection = () => {
        testConnectionMutation.mutate(currentSettings);
    };

    const handleFieldChange = (field: keyof EmailSettingsType, value: string | number) => {
        setCurrentSettings(s => ({...s, [field]: value}));
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Email Server Configuration</DialogTitle>
                    <DialogDescription>
                       Enter your email server details for both sending and receiving emails.
                       Use the same account for both.
                    </DialogDescription>
                </DialogHeader>
                <Tabs defaultValue="smtp" className="pt-4">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="smtp">Sending (SMTP)</TabsTrigger>
                        <TabsTrigger value="imap">Receiving (IMAP)</TabsTrigger>
                    </TabsList>
                    <TabsContent value="smtp" className="space-y-4 pt-4">
                        <div><Label>Host</Label><Input placeholder="smtp.example.com" value={currentSettings.smtpHost} onChange={e => handleFieldChange('smtpHost', e.target.value)} /></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><Label>Port</Label><Input type="number" placeholder="587" value={currentSettings.smtpPort} onChange={e => handleFieldChange('smtpPort', parseInt(e.target.value, 10))} /></div>
                             <div>
                                <Label>Encryption</Label>
                                <Select value={currentSettings.smtpEncryption} onValueChange={(v) => handleFieldChange('smtpEncryption', v)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="tls">TLS</SelectItem>
                                        <SelectItem value="ssl">SSL</SelectItem>
                                        <SelectItem value="none">None</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div><Label>Username</Label><Input placeholder="you@example.com" value={currentSettings.smtpUser} onChange={e => handleFieldChange('smtpUser', e.target.value)} /></div>
                        <div>
                            <Label>Password</Label>
                            <div className="relative">
                                <Input type={showSmtpPass ? 'text' : 'password'} value={currentSettings.smtpPass} onChange={e => handleFieldChange('smtpPass', e.target.value)} />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                                    onClick={() => setShowSmtpPass(!showSmtpPass)}
                                >
                                    {showSmtpPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    <span className="sr-only">{showSmtpPass ? 'Hide password' : 'Show password'}</span>
                                </Button>
                            </div>
                        </div>
                    </TabsContent>
                     <TabsContent value="imap" className="space-y-4 pt-4">
                        <div><Label>Host</Label><Input placeholder="imap.example.com" value={currentSettings.imapHost} onChange={e => handleFieldChange('imapHost', e.target.value)} /></div>
                         <div className="grid grid-cols-2 gap-4">
                            <div><Label>Port</Label><Input type="number" placeholder="993" value={currentSettings.imapPort} onChange={e => handleFieldChange('imapPort', parseInt(e.target.value, 10))} /></div>
                            <div>
                                <Label>Encryption</Label>
                                <Select value={currentSettings.imapEncryption} onValueChange={(v) => handleFieldChange('imapEncryption', v)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ssl">SSL</SelectItem>
                                        <SelectItem value="tls">TLS</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div><Label>Username</Label><Input placeholder="you@example.com" value={currentSettings.imapUser} onChange={e => handleFieldChange('imapUser', e.target.value)} /></div>
                        <div>
                            <Label>Password</Label>
                             <div className="relative">
                                <Input type={showImapPass ? 'text' : 'password'} value={currentSettings.imapPass} onChange={e => handleFieldChange('imapPass', e.target.value)} />
                                 <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                                    onClick={() => setShowImapPass(!showImapPass)}
                                >
                                    {showImapPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    <span className="sr-only">{showImapPass ? 'Hide password' : 'Show password'}</span>
                                </Button>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
                 <DialogFooter className="flex-col sm:flex-row justify-between pt-4 border-t mt-4">
                     <Button variant="outline" onClick={handleTestConnection} disabled={testConnectionMutation.isPending}>
                        {testConnectionMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Test Connection
                     </Button>
                    <div className="flex gap-2">
                         <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                         <Button onClick={handleSave} disabled={updateSettingsMutation.isPending}>
                            {updateSettingsMutation.isPending ? 'Saving...' : 'Save Changes'}
                         </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function AlertsSettings({ preferences }: { preferences: NotificationPreferences; }) {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const [currentPreferences, setCurrentPreferences] = useState(preferences);

    useEffect(() => {
        setCurrentPreferences(preferences);
    }, [preferences]);

    const mutation = useMutation({
        mutationFn: updateGlobalNotificationPreferences,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['globalNotificationPreferences'] });
            toast({ title: 'Preferences Saved', description: 'Global notification preferences have been updated.' });
        },
        onError: () => {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to update preferences.' });
        }
    })

    const handlePreferenceChange = (
        category: keyof NotificationPreferences,
        event: keyof NotificationPreferences[keyof NotificationPreferences],
        channel: 'inApp' | 'email' | 'mandatory',
        value: boolean
    ) => {
        setCurrentPreferences(prev => {
            const newPrefs = JSON.parse(JSON.stringify(prev));
            const eventPrefs = newPrefs[category][event] as NotificationChannel;
            (eventPrefs[channel] as boolean) = value;

            if (channel === 'mandatory' && value) {
                eventPrefs.inApp = true;
                eventPrefs.email = true;
            }
            if ((channel === 'inApp' || channel === 'email') && !value) {
                eventPrefs.mandatory = false;
            }

            return newPrefs;
        });
    };

    const handleSave = async () => {
        mutation.mutate(currentPreferences);
    };

    const hasChanges = JSON.stringify(currentPreferences) !== JSON.stringify(preferences);

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-3">
                    <Bell className="h-6 w-6" />
                    <div>
                        <CardTitle>Alerts & Notifications</CardTitle>
                        <CardDescription>Define default notification settings for all users and mark critical alerts as mandatory.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-8">
                {Object.entries(permissionModules).filter(([key]) => key in currentPreferences).map(([categoryKey, categoryValue]) => (
                    <div key={categoryKey}>
                        <h4 className="font-medium text-lg mb-4">{categoryValue.label}</h4>
                        <div className="space-y-4">
                            {Object.entries(categoryValue.permissions).filter(([key]) => key in currentPreferences[categoryKey as keyof NotificationPreferences]).map(([eventKey, eventLabel]) => {
                                const pref = currentPreferences[categoryKey as keyof NotificationPreferences][eventKey as keyof NotificationPreferences[typeof category]];
                                return (
                                <div key={eventKey} className="border rounded-lg p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                    <Label className="flex-1 font-normal">{eventLabel}</Label>
                                    <div className="flex items-center gap-6 w-full md:w-auto">
                                        <div className="flex items-center space-x-2">
                                            <Switch
                                                id={`${categoryKey}-${eventKey}-inApp`}
                                                checked={pref.inApp}
                                                onCheckedChange={(checked) => handlePreferenceChange(categoryKey as keyof NotificationPreferences, eventKey as any, 'inApp', checked)}
                                                disabled={pref.mandatory}
                                            />
                                            <Label htmlFor={`${categoryKey}-${eventKey}-inApp`} className="text-sm font-normal">In-App</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Switch
                                                id={`${categoryKey}-${eventKey}-email`}
                                                checked={pref.email}
                                                onCheckedChange={(checked) => handlePreferenceChange(categoryKey as keyof NotificationPreferences, eventKey as any, 'email', checked)}
                                                disabled={pref.mandatory}
                                            />
                                            <Label htmlFor={`${categoryKey}-${eventKey}-email`} className="text-sm font-normal">Email</Label>
                                        </div>
                                         <div className="flex items-center space-x-2 border-l pl-4">
                                            <Checkbox
                                                id={`${categoryKey}-${eventKey}-mandatory`}
                                                checked={pref.mandatory}
                                                onCheckedChange={(checked) => handlePreferenceChange(categoryKey as keyof NotificationPreferences, eventKey as any, 'mandatory', !!checked)}
                                            />
                                            <Label htmlFor={`${categoryKey}-${eventKey}-mandatory`} className="text-sm font-normal flex items-center gap-1">
                                                <Lock className="h-3 w-3" />
                                                Mandatory
                                            </Label>
                                        </div>
                                    </div>
                                </div>
                            )})}
                        </div>
                    </div>
                ))}
            </CardContent>
            <CardFooter className="border-t pt-6 flex flex-col sm:flex-row justify-end gap-2">
                {hasChanges && <Button variant="outline" className="w-full sm:w-auto" onClick={() => setCurrentPreferences(preferences)}>Cancel</Button>}
                <Button onClick={handleSave} disabled={!hasChanges || mutation.isPending} className="w-full sm:w-auto">
                    {mutation.isPending ? "Saving..." : "Save Preferences"}
                </Button>
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
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <KeyRound className="h-6 w-6" />
                            <div>
                                <CardTitle>API & Integrations</CardTitle>
                                <CardDescription>Manage API keys and connected third-party applications.</CardDescription>
                            </div>
                        </div>
                        <Button onClick={generateKey} className="w-full sm:w-auto"><PlusCircle className="mr-2 h-4 w-4" /> Generate API Key</Button>
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
                                        <TableHead className="hidden md:table-cell">Created</TableHead>
                                        <TableHead className="hidden md:table-cell">Last Used</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {apiKeys.map((key) => (
                                        <TableRow key={key.id}>
                                            <TableCell className="font-mono">{key.displayName}</TableCell>
                                            <TableCell className="hidden md:table-cell">{key.createdAt}</TableCell>
                                            <TableCell className="hidden md:table-cell">{key.lastUsed}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="sm" onClick={() => copyToClipboard(key.key, "API key copied to clipboard.")}>
                                                    <Copy className="mr-2 h-4 w-4" /> <span className="hidden sm:inline">Copy</span>
                                                </Button>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                                                            <Trash2 className="mr-2 h-4 w-4" /> <span className="hidden sm:inline">Revoke</span>
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

function WorkflowsSettings({ workflows, onAddWorkflow, onUpdateWorkflow, onDeleteWorkflow }: { workflows: Workflow[], onAddWorkflow: (data: any) => void, onUpdateWorkflow: (data: any) => void, onDeleteWorkflow: (id: string) => void }) {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null);

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
            trigger: { 
                'case-created': 'Case is created', 
                'task-status-changed': 'Task status changes',
                'case-unattended': 'Case is unattended',
            },
            condition: { 
                'priority-high': 'Priority is High', 
                'status-resolved': 'Status is Resolved', 
                'task-overdue': 'Task is overdue',
                'status-is-new-for-24h': 'Status is New for > 24h',
                'case-in-progress-for-3-days': 'In Progress for > 3 days',
            },
            action: { 
                'assign-team-t2': 'Assign to Tier 2 Support', 
                'send-email-customer': 'Send email to customer', 
                'create-followup-task': 'Create follow-up task',
                'change-priority-high': 'Change priority to High',
                'assign-to-manager': 'Assign to manager',
                'send-escalation-email': 'Send escalation email',
            }
        };
        return options[type][value] || value;
    };


    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <Bot className="h-6 w-6" />
                            <div>
                                <CardTitle>Workflow Configuration</CardTitle>
                                <CardDescription>Configure automated workflows and business rules.</CardDescription>
                            </div>
                        </div>
                        <Button onClick={openCreateForm} className="w-full sm:w-auto"><PlusCircle className="mr-2 h-4 w-4" /> Add Workflow</Button>
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
                                                <AlertDialogAction onClick={() => onDeleteWorkflow(workflow.id)}>Delete</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </div>
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 text-sm text-muted-foreground mt-2">
                                <Badge variant="secondary">{getWorkflowStepLabel('trigger', workflow.trigger)}</Badge>
                                <ArrowRight className="h-4 w-4 hidden sm:block" />
                                <Badge variant="secondary">{getWorkflowStepLabel('condition', workflow.condition)}</Badge>
                                <ArrowRight className="h-4 w-4 hidden sm:block" />
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
                        onUpdateWorkflow({ ...editingWorkflow, ...data });
                    } else {
                        onAddWorkflow(data);
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
                        <Label htmlFor="trigger">Trigger (When...)</Label>
                        <Select onValueChange={setTrigger} value={trigger}>
                            <SelectTrigger><SelectValue placeholder="Select a trigger" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="case-created">A new case is created</SelectItem>
                                <SelectItem value="task-status-changed">A task's status changes</SelectItem>
                                <SelectItem value="case-unattended">A case is unattended</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="condition">Condition (If...)</Label>
                        <Select onValueChange={setCondition} value={condition}>
                            <SelectTrigger><SelectValue placeholder="Select a condition" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="priority-high">Case priority is High</SelectItem>
                                <SelectItem value="status-resolved">Case status is Resolved</SelectItem>
                                <SelectItem value="task-overdue">Task is overdue</SelectItem>
                                <SelectItem value="status-is-new-for-24h">Case status is 'New' for > 24 hours</SelectItem>
                                <SelectItem value="case-in-progress-for-3-days">Case is 'In Progress' for > 3 days</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="action">Action (Then...)</Label>
                        <Select onValueChange={setAction} value={action}>
                            <SelectTrigger><SelectValue placeholder="Select an action" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="assign-team-t2">Assign to Tier 2 Support</SelectItem>
                                <SelectItem value="send-email-customer">Send email to customer</SelectItem>
                                <SelectItem value="create-followup-task">Create follow-up task</SelectItem>
                                <SelectItem value="change-priority-high">Change priority to High</SelectItem>
                                <SelectItem value="assign-to-manager">Assign to manager</SelectItem>
                                <SelectItem value="send-escalation-email">Send escalation email</SelectItem>
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

function AuditLog({ logs, users }: { logs: AuditLogType[], users: User[]}) {
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
        const uniqueUsers = [...new Map(logs.map(log => [log.userId, users.find(u => u.id === log.userId)])).values()];
        return uniqueUsers.filter(Boolean) as User[];
    }, [logs, users]);

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
                                    <TableCell>{users.find(u => u.id === log.userId)?.name || 'System'}</TableCell>
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
