
"use client";

import React, { useState, useMemo } from 'react';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Upload, Shield, Bell, Users, Settings, Database, Building, KeyRound, Globe, Palette } from 'lucide-react';

const initialSettings = {
  general: {
    orgName: 'Caseflow CRM',
    logoUrl: '',
    timeZone: 'UTC-5:00',
    dateFormat: 'MM/DD/YYYY',
    currency: 'USD',
  },
  userManagement: {
    defaultRole: 'staff',
    passwordPolicy: {
      minLength: 8,
      requireUppercase: true,
      requireNumbers: true,
      requireSymbols: true,
    },
  },
  notifications: {
    email: true,
    inApp: true,
  },
  integrations: {
    apiKey: '********************************',
  },
  data: {
    backupSchedule: 'daily',
    retentionPeriod: 365,
    gdpr: false,
  },
};

type SettingsType = typeof initialSettings;

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useState<SettingsType>(initialSettings);
  const [pendingChanges, setPendingChanges] = useState<Partial<SettingsType>>({});
  const isAdmin = user?.role === 'admin';

  const handleSettingChange = (section: keyof SettingsType, key: string, value: any) => {
    const newSettings = { ...settings };
    (newSettings[section] as any)[key] = value;
    setSettings(newSettings);
  };
  
  const handleNestedSettingChange = (section: keyof SettingsType, subSection: string, key: string, value: any) => {
      const newSettings = { ...settings };
      (newSettings[section] as any)[subSection][key] = value;
      setSettings(newSettings);
  };


  const onSave = () => {
    // Here you would typically make an API call to save the settings
    console.log('Saving settings:', settings);
    toast({
      title: 'Settings Saved',
      description: 'Your changes have been saved successfully.',
    });
  };
  
  const onReset = () => {
    setSettings(initialSettings);
    toast({
        title: 'Settings Reset',
        description: 'All settings have been reset to their default values.',
        variant: 'destructive'
    });
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight font-headline">System Settings</h2>
            <p className="text-muted-foreground">Manage global application settings. {isAdmin ? '' : 'View-only mode.'}</p>
          </div>
          {isAdmin && 
            <div className="flex gap-2">
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive">Reset to Defaults</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This will reset all system settings to their default values. This action cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={onReset}>Reset Settings</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
                <Button onClick={onSave}>Save Changes</Button>
            </div>
          }
      </div>

      <Accordion type="multiple" defaultValue={['general', 'userManagement']} className="w-full space-y-4">
        
        {/* General Settings */}
        <AccordionItem value="general" asChild>
            <Card>
                <AccordionTrigger className="p-6">
                    <div className="flex items-center gap-4">
                        <Settings className="h-6 w-6 text-primary" />
                        <div>
                            <h3 className="font-semibold text-lg">General Settings</h3>
                            <p className="text-sm text-muted-foreground">Organization name, logo, and localization.</p>
                        </div>
                    </div>
                </AccordionTrigger>
                <AccordionContent className="p-6 pt-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2"><Label>Organization Name</Label><Input value={settings.general.orgName} onChange={(e) => handleSettingChange('general', 'orgName', e.target.value)} disabled={!isAdmin}/></div>
                        <div className="space-y-2"><Label>Time Zone</Label><Select value={settings.general.timeZone} onValueChange={(v) => handleSettingChange('general', 'timeZone', v)} disabled={!isAdmin}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="UTC-8:00">Pacific Time (UTC-8:00)</SelectItem><SelectItem value="UTC-5:00">Eastern Time (UTC-5:00)</SelectItem><SelectItem value="UTC">UTC</SelectItem></SelectContent></Select></div>
                        <div className="space-y-2"><Label>Date Format</Label><Select value={settings.general.dateFormat} onValueChange={(v) => handleSettingChange('general', 'dateFormat', v)} disabled={!isAdmin}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem><SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem><SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem></SelectContent></Select></div>
                        <div className="space-y-2"><Label>Currency</Label><Select value={settings.general.currency} onValueChange={(v) => handleSettingChange('general', 'currency', v)} disabled={!isAdmin}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="USD">USD ($)</SelectItem><SelectItem value="EUR">EUR (€)</SelectItem><SelectItem value="GBP">GBP (£)</SelectItem></SelectContent></Select></div>
                        <div className="space-y-2"><Label>Organization Logo</Label><div className="flex items-center gap-2"><Input type="file" disabled={!isAdmin} className="max-w-xs"/><Button variant="outline" size="icon" disabled={!isAdmin}><Upload className="h-4 w-4"/></Button></div></div>
                    </div>
                </AccordionContent>
            </Card>
        </AccordionItem>
        
        {/* User Management Settings */}
        <AccordionItem value="userManagement" asChild>
             <Card>
                <AccordionTrigger className="p-6">
                     <div className="flex items-center gap-4">
                        <Users className="h-6 w-6 text-primary" />
                        <div>
                            <h3 className="font-semibold text-lg">User Management</h3>
                            <p className="text-sm text-muted-foreground">Default roles and password policies.</p>
                        </div>
                    </div>
                </AccordionTrigger>
                <AccordionContent className="p-6 pt-0">
                   <div className="space-y-6">
                        <div>
                            <Label>Default Role for New Users</Label>
                            <Select value={settings.userManagement.defaultRole} onValueChange={(v) => handleSettingChange('userManagement', 'defaultRole', v)} disabled={!isAdmin}>
                                <SelectTrigger className="w-[180px] mt-2"><SelectValue /></SelectTrigger>
                                <SelectContent><SelectItem value="staff">Staff</SelectItem><SelectItem value="admin">Admin</SelectItem></SelectContent>
                            </Select>
                        </div>
                        <div>
                            <h4 className="font-medium mb-2">Password Policy</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="space-y-2"><Label>Minimum Length</Label><Input type="number" value={settings.userManagement.passwordPolicy.minLength} onChange={(e) => handleNestedSettingChange('userManagement', 'passwordPolicy', 'minLength', parseInt(e.target.value))} disabled={!isAdmin} /></div>
                                <div className="flex items-center space-x-2 pt-6"><Switch id="p-uppercase" checked={settings.userManagement.passwordPolicy.requireUppercase} onCheckedChange={(c) => handleNestedSettingChange('userManagement', 'passwordPolicy', 'requireUppercase', c)} disabled={!isAdmin}/><Label htmlFor="p-uppercase">Require Uppercase</Label></div>
                                <div className="flex items-center space-x-2 pt-6"><Switch id="p-numbers" checked={settings.userManagement.passwordPolicy.requireNumbers} onCheckedChange={(c) => handleNestedSettingChange('userManagement', 'passwordPolicy', 'requireNumbers', c)} disabled={!isAdmin}/><Label htmlFor="p-numbers">Require Numbers</Label></div>
                                <div className="flex items-center space-x-2 pt-6"><Switch id="p-symbols" checked={settings.userManagement.passwordPolicy.requireSymbols} onCheckedChange={(c) => handleNestedSettingChange('userManagement', 'passwordPolicy', 'requireSymbols', c)} disabled={!isAdmin}/><Label htmlFor="p-symbols">Require Symbols</Label></div>
                            </div>
                        </div>
                   </div>
                </AccordionContent>
            </Card>
        </AccordionItem>
        
        {/* Notification Settings */}
        <AccordionItem value="notifications" asChild>
             <Card>
                <AccordionTrigger className="p-6">
                     <div className="flex items-center gap-4">
                        <Bell className="h-6 w-6 text-primary" />
                        <div>
                            <h3 className="font-semibold text-lg">Notifications</h3>
                            <p className="text-sm text-muted-foreground">Manage system-wide notification channels.</p>
                        </div>
                    </div>
                </AccordionTrigger>
                <AccordionContent className="p-6 pt-0">
                    <div className="flex flex-col md:flex-row gap-8">
                       <div className="flex items-center space-x-2"><Switch id="n-email" checked={settings.notifications.email} onCheckedChange={(c) => handleSettingChange('notifications', 'email', c)} disabled={!isAdmin} /><Label htmlFor="n-email">Enable Email Notifications</Label></div>
                       <div className="flex items-center space-x-2"><Switch id="n-inapp" checked={settings.notifications.inApp} onCheckedChange={(c) => handleSettingChange('notifications', 'inApp', c)} disabled={!isAdmin} /><Label htmlFor="n-inapp">Enable In-App Notifications</Label></div>
                    </div>
                </AccordionContent>
            </Card>
        </AccordionItem>
        
        {/* Integration Settings */}
        <AccordionItem value="integrations" asChild>
             <Card>
                <AccordionTrigger className="p-6">
                     <div className="flex items-center gap-4">
                        <KeyRound className="h-6 w-6 text-primary" />
                        <div>
                            <h3 className="font-semibold text-lg">Integrations</h3>
                            <p className="text-sm text-muted-foreground">API keys and connected applications.</p>
                        </div>
                    </div>
                </AccordionTrigger>
                <AccordionContent className="p-6 pt-0">
                     <div className="space-y-4">
                        <div className="space-y-2"><Label>API Key</Label><Input value={settings.integrations.apiKey} onChange={(e) => handleSettingChange('integrations', 'apiKey', e.target.value)} disabled={!isAdmin}/></div>
                     </div>
                </AccordionContent>
            </Card>
        </AccordionItem>
        
        {/* Data Settings */}
        <AccordionItem value="data" asChild>
             <Card>
                <AccordionTrigger className="p-6">
                     <div className="flex items-center gap-4">
                        <Database className="h-6 w-6 text-primary" />
                        <div>
                            <h3 className="font-semibold text-lg">Data & Compliance</h3>
                            <p className="text-sm text-muted-foreground">Data retention, backups, and compliance.</p>
                        </div>
                    </div>
                </AccordionTrigger>
                <AccordionContent className="p-6 pt-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div className="space-y-2"><Label>Backup Schedule</Label><Select value={settings.data.backupSchedule} onValueChange={(v) => handleSettingChange('data', 'backupSchedule', v)} disabled={!isAdmin}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="daily">Daily</SelectItem><SelectItem value="weekly">Weekly</SelectItem><SelectItem value="monthly">Monthly</SelectItem></SelectContent></Select></div>
                         <div className="space-y-2"><Label>Data Retention Period (days)</Label><Input type="number" value={settings.data.retentionPeriod} onChange={(e) => handleSettingChange('data', 'retentionPeriod', parseInt(e.target.value))} disabled={!isAdmin}/></div>
                         <div className="flex items-center space-x-2 pt-6"><Switch id="d-gdpr" checked={settings.data.gdpr} onCheckedChange={(c) => handleSettingChange('data', 'gdpr', c)} disabled={!isAdmin}/><Label htmlFor="d-gdpr">Enable GDPR Compliance Features</Label></div>
                    </div>
                </AccordionContent>
            </Card>
        </AccordionItem>

      </Accordion>
    </div>
  );
}
