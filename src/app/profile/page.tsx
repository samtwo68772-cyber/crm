

"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { getUserProfile, updateUserProfile, updateUserPassword, updateUserPreferences } from './actions';
import { getTeams } from '../admin/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { User, Shield, Bell, Upload, Lock, Users as UsersIcon } from 'lucide-react';
import type { User as UserType, NotificationPreferences, Team } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getGlobalNotificationPreferences } from '../settings/actions';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';

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

export default function ProfilePage() {
    const { user: authUser, login } = useAuth();
    const queryClient = useQueryClient();
    const { toast } = useToast();
    
    const { data: user, isLoading: userLoading } = useQuery<UserType | null>({
        queryKey: ['userProfile', authUser?.id],
        queryFn: () => getUserProfile(authUser!.id),
        enabled: !!authUser,
    });
    
    const { data: globalNotificationPrefs, isLoading: globalPrefsLoading } = useQuery<NotificationPreferences | null>({
        queryKey: ['globalNotificationPreferences'],
        queryFn: getGlobalNotificationPreferences
    });
    
    const [userNotificationPrefs, setUserNotificationPrefs] = useState<NotificationPreferences | null>(null);

    useEffect(() => {
        if (user?.notificationPreferences) {
            setUserNotificationPrefs(user.notificationPreferences as NotificationPreferences);
        }
    }, [user]);

    const profileUpdateMutation = useMutation({
        mutationFn: (updatedData: Partial<UserType>) => updateUserProfile(user!.id, updatedData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['userProfile', authUser?.id] });
            toast({ title: "Profile Updated", description: "Your profile information has been saved." });
        },
        onError: () => {
             toast({ variant: 'destructive', title: 'Error', description: 'Failed to update profile.'})
        }
    });

    const passwordChangeMutation = useMutation({
        mutationFn: (newPassword: string) => updateUserPassword(user!.id, newPassword),
        onSuccess: async (_, newPassword) => {
            await login(user!.email, newPassword);
            toast({ title: "Password Changed", description: "Your password has been successfully updated." });
        },
        onError: () => {
             toast({ variant: 'destructive', title: 'Error', description: 'Failed to update password.'})
        }
    });

    const preferencesSaveMutation = useMutation({
        mutationFn: (newPreferences: NotificationPreferences) => updateUserPreferences(user!.id, newPreferences),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['userProfile', authUser?.id] });
            toast({ title: "Preferences Saved", description: "Your notification preferences have been updated." });
        },
        onError: () => {
             toast({ variant: 'destructive', title: 'Error', description: 'Failed to save preferences.'})
        }
    });

    const handleProfileUpdate = async (updatedData: Partial<UserType>) => {
        profileUpdateMutation.mutate(updatedData);
    };

    const handlePasswordChange = async (newPassword: string) => {
        if (!newPassword || !user) {
            toast({ variant: 'destructive', title: "Error", description: "Password cannot be empty." });
            return;
        }
        passwordChangeMutation.mutate(newPassword);
    };

    const handleNotificationsSave = async (newPreferences: NotificationPreferences) => {
        if (!user) return;
        preferencesSaveMutation.mutate(newPreferences);
    };

    if (userLoading || globalPrefsLoading || !user) {
        return (
            <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
                <Skeleton className="h-12 w-1/3" />
                <Skeleton className="h-10 w-96" />
                <Skeleton className="h-96 w-full" />
            </div>
        )
    }

    return (
        <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight font-headline">Profile & Settings</h2>
                <p className="text-muted-foreground">Manage your personal information and application preferences.</p>
            </div>

            <Tabs defaultValue="profile" className="w-full">
                 <TabsList className={cn("grid w-full", user.team ? "grid-cols-2 md:grid-cols-4" : "grid-cols-1 md:grid-cols-3", "h-auto")}>
                    <TabsTrigger value="profile"><User className="mr-2 h-4 w-4" />Profile</TabsTrigger>
                    <TabsTrigger value="security"><Shield className="mr-2 h-4 w-4" />Security</TabsTrigger>
                    <TabsTrigger value="notifications"><Bell className="mr-2 h-4 w-4" />Notifications</TabsTrigger>
                    {user.team && <TabsTrigger value="team"><UsersIcon className="mr-2 h-4 w-4" />My Team</TabsTrigger>}
                </TabsList>
                <TabsContent value="profile" className="mt-6">
                    <ProfileSettings user={user} onSave={handleProfileUpdate} />
                </TabsContent>
                <TabsContent value="security" className="mt-6">
                    <SecuritySettings onSave={handlePasswordChange} />
                </TabsContent>
                <TabsContent value="notifications" className="mt-6">
                    {globalNotificationPrefs && userNotificationPrefs && (
                        <NotificationsSettings 
                            globalPreferences={globalNotificationPrefs}
                            userPreferences={userNotificationPrefs} 
                            onSave={handleNotificationsSave} 
                        />
                    )}
                </TabsContent>
                <TabsContent value="team" className="mt-6">
                    <MyTeamView />
                </TabsContent>
            </Tabs>
        </div>
    );
}

function MyTeamView() {
    const { user: authUser } = useAuth();
    const { data: users, isLoading: usersLoading } = useQuery<User[]>({ queryKey: ['users'], queryFn: getUsers });
    const { data: teams, isLoading: teamsLoading } = useQuery<Team[]>({ queryKey: ['teams'], queryFn: getTeams });
    
    if (usersLoading || teamsLoading) {
        return <Card><CardContent><Skeleton className="h-48 w-full" /></CardContent></Card>
    }

    const myTeam = teams?.find(t => t.name === authUser?.team);
    
    if (!myTeam) {
        return (
             <Card>
                <CardHeader>
                    <CardTitle>My Team</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">You are not currently assigned to a team.</p>
                </CardContent>
            </Card>
        )
    }
    
    const leader = users?.find(u => u.id === myTeam.leaderId);
    const members = users?.filter(u => myTeam.memberIds.includes(u.id));

    return (
        <Card>
            <CardHeader>
                <CardTitle>{myTeam.name}</CardTitle>
                <CardDescription>{myTeam.description}</CardDescription>
                {leader && <p className="pt-2 text-sm text-muted-foreground">Led by: <span className="font-medium text-foreground">{leader.name}</span></p>}
            </CardHeader>
            <CardContent>
                <h4 className="font-medium text-lg mb-4">Members ({members?.length})</h4>
                <div className="space-y-4">
                    {members?.map(member => (
                        <div key={member.id} className="flex items-center gap-4">
                            <Avatar>
                                <AvatarImage src={member.avatar} data-ai-hint="person avatar" />
                                <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <p className="font-semibold">{member.name}</p>
                                <p className="text-sm text-muted-foreground">{member.email}</p>
                            </div>
                            <Badge variant="outline" className="capitalize">{member.role} {member.id === leader?.id && <span className="ml-1 font-semibold">(Leader)</span>}</Badge>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

function ProfileSettings({ user, onSave }: { user: UserType, onSave: (data: Partial<UserType>) => void }) {
    const [name, setName] = useState(user.name);
    const [email, setEmail] = useState(user.email);
    const [team, setTeam] = useState(user.team);
    const [avatar, setAvatar] = useState(user.avatar);

    const hasChanges = name !== user.name || email !== user.email || team !== user.team || avatar !== user.avatar;
    
    useEffect(() => {
        setName(user.name);
        setEmail(user.email);
        setTeam(user.team);
        setAvatar(user.avatar);
    }, [user]);

    const handleSave = () => {
        onSave({ name, email, team, avatar });
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatar(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleCancel = () => {
        setName(user.name);
        setEmail(user.email);
        setTeam(user.team);
        setAvatar(user.avatar);
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Update your photo and personal details here.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
                <div className="flex flex-col md:flex-row items-center gap-4">
                    <Avatar className="h-20 w-20">
                        <AvatarImage src={avatar} data-ai-hint="user avatar" />
                        <AvatarFallback>{name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex items-center gap-2">
                        <Label htmlFor="avatar-upload" className="cursor-pointer">
                            <Button asChild variant="outline">
                                <span><Upload className="mr-2 h-4 w-4" /> Change Photo</span>
                            </Button>
                        </Label>
                        <Input id="avatar-upload" type="file" className="sr-only" onChange={handleAvatarChange} accept="image/*" />
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input id="name" value={name} onChange={e => setName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="team">Team / Department</Label>
                        <Input id="team" value={team} disabled />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="role">Role</Label>
                        <Input id="role" value={user.role} disabled className="capitalize" />
                    </div>
                </div>
            </CardContent>
            <CardFooter className="border-t pt-6 flex flex-col sm:flex-row justify-end gap-2">
                {hasChanges && <Button variant="outline" onClick={handleCancel} className="w-full sm:w-auto">Cancel</Button>}
                <Button onClick={handleSave} disabled={!hasChanges} className="w-full sm:w-auto">Save Changes</Button>
            </CardFooter>
        </Card>
    )
}

function SecuritySettings({ onSave }: { onSave: (password: string) => void }) {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [enable2FA, setEnable2FA] = useState(false);
    
    const handleSave = () => {
        if (newPassword !== confirmPassword) {
            alert("New passwords do not match.");
            return;
        }
        onSave(newPassword);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
    }

    return (
         <Card>
            <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>Manage your password and two-factor authentication.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
                 <div>
                    <h4 className="font-medium text-lg mb-4">Change Password</h4>
                    <div className="space-y-4 max-w-sm">
                        <div className="space-y-2">
                            <Label htmlFor="current-password">Current Password</Label>
                            <Input id="current-password" type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="new-password">New Password</Label>
                            <Input id="new-password" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirm-password">Confirm New Password</Label>
                            <Input id="confirm-password" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                        </div>
                    </div>
                </div>
                <div>
                    <h4 className="font-medium text-lg mb-4">Two-Factor Authentication</h4>
                     <div className="flex items-center justify-between p-4 border rounded-lg max-w-sm">
                        <div className="space-y-1">
                            <Label htmlFor="enable-2fa">Enable 2FA</Label>
                            <p className="text-sm text-muted-foreground">Receive a code via email to confirm your login.</p>
                        </div>
                        <Switch id="enable-2fa" checked={enable2FA} onCheckedChange={setEnable2FA}/>
                    </div>
                </div>
            </CardContent>
            <CardFooter className="border-t pt-6 flex flex-col sm:flex-row justify-end gap-2">
                <Button onClick={handleSave} className="w-full sm:w-auto">Update Password</Button>
            </CardFooter>
        </Card>
    )
}

function NotificationsSettings({ globalPreferences, userPreferences, onSave }: { globalPreferences: NotificationPreferences; userPreferences: NotificationPreferences; onSave: (data: NotificationPreferences) => void; }) {
    const [currentUserPreferences, setCurrentUserPreferences] = useState(userPreferences);

    useEffect(() => {
        setCurrentUserPreferences(userPreferences);
    }, [userPreferences]);
    
    const handlePreferenceChange = (
        category: keyof NotificationPreferences,
        event: keyof NotificationPreferences[keyof NotificationPreferences],
        channel: 'inApp' | 'email',
        value: boolean
    ) => {
        setCurrentUserPreferences(prev => {
            const newPrefs = JSON.parse(JSON.stringify(prev));
            newPrefs[category][event][channel] = value;
            return newPrefs;
        });
    };

    const handleSave = () => {
        onSave(currentUserPreferences);
    };

    const handleCancel = () => {
        setCurrentUserPreferences(userPreferences);
    };

    const hasChanges = JSON.stringify(currentUserPreferences) !== JSON.stringify(userPreferences);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Choose how you receive notifications for important events. Some notifications are mandatory and cannot be disabled.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
                {Object.entries(notificationConfig).map(([categoryKey, categoryValue]) => (
                    <div key={categoryKey}>
                        <h4 className="font-medium text-lg mb-4">{categoryValue.title}</h4>
                        <div className="space-y-4">
                            {Object.entries(categoryValue.events).map(([eventKey, eventLabel]) => {
                                const category = categoryKey as keyof NotificationPreferences;
                                const event = eventKey as keyof NotificationPreferences[typeof category];
                                const globalPref = globalPreferences[category][event];
                                const userPref = currentUserPreferences[category][event];
                                
                                const isMandatory = globalPref.mandatory;

                                return (
                                <div key={eventKey} className="border rounded-lg p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                    <div className="flex-1">
                                        <Label className="font-normal">{eventLabel}</Label>
                                        {isMandatory && (
                                             <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                                <Lock className="h-3 w-3" />
                                                This notification is mandatory and cannot be disabled.
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-6 w-full md:w-auto">
                                        <div className="flex items-center space-x-2">
                                            <Switch
                                                id={`${categoryKey}-${eventKey}-inApp`}
                                                checked={isMandatory || userPref.inApp}
                                                disabled={isMandatory}
                                                onCheckedChange={(checked) => handlePreferenceChange(category, event, 'inApp', checked)}
                                            />
                                            <Label htmlFor={`${categoryKey}-${eventKey}-inApp`} className="text-sm font-normal">In-App</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Switch
                                                id={`${categoryKey}-${eventKey}-email`}
                                                checked={isMandatory || userPref.email}
                                                disabled={isMandatory}
                                                onCheckedChange={(checked) => handlePreferenceChange(category, event, 'email', checked)}
                                            />
                                            <Label htmlFor={`${categoryKey}-${eventKey}-email`} className="text-sm font-normal">Email</Label>
                                        </div>
                                    </div>
                                </div>
                            )})}
                        </div>
                    </div>
                ))}
            </CardContent>
            <CardFooter className="border-t pt-6 flex flex-col sm:flex-row justify-end gap-2">
                {hasChanges && <Button variant="outline" onClick={handleCancel} className="w-full sm:w-auto">Cancel</Button>}
                <Button onClick={handleSave} disabled={!hasChanges} className="w-full sm:w-auto">Save Preferences</Button>
            </CardFooter>
        </Card>
    );
}
