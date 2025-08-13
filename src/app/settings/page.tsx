
"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Upload, Shield, Bell, Users, Settings, Database, Building, KeyRound, Globe, Palette, Mail, UserCheck, FileText, Bot, Search } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"


const initialSettings = {
  general: {
    systemName: 'Caseflow CRM',
    companyName: 'My Company',
    logoUrl: '',
    timeZone: 'UTC-5:00',
    language: 'en-US',
  },
};

type SettingsType = typeof initialSettings;
type GeneralSettingsType = SettingsType['general'];


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
                <TabsList className="border-b-0 justify-start overflow-x-auto p-0 bg-transparent">
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="users">Users</TabsTrigger>
                    <TabsTrigger value="security">Security</TabsTrigger>
                    <TabsTrigger value="email">Email</TabsTrigger>
                    <TabsTrigger value="alerts">Alerts</TabsTrigger>
                    <TabsTrigger value="api">API</TabsTrigger>
                    <TabsTrigger value="workflows">Workflows</TabsTrigger>
                    <TabsTrigger value="audit">Audit</TabsTrigger>
                </TabsList>
                
                <TabsContent value="general" className="mt-6">
                    <GeneralSettings initialSettings={settings.general} onSave={(newSettings) => handleSettingChange('general', newSettings)} />
                </TabsContent>
                <TabsContent value="users" className="mt-6"><PlaceholderCard title="User Management" description="Manage staff accounts, roles, and permissions." icon={Users} /></TabsContent>
                <TabsContent value="security" className="mt-6"><PlaceholderCard title="Security Settings" description="Configure password policies, 2FA, and session management." icon={Shield} /></TabsContent>
                <TabsContent value="email" className="mt-6"><PlaceholderCard title="Email Configuration" description="Set up SMTP and default email templates." icon={Mail} /></TabsContent>
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

    