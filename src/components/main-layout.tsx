

"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from './ui/input';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Bell, Briefcase, Users, LayoutDashboard, LogOut, Menu, Settings, ListTodo, Contact, Building, FileText, Calendar, Search, Mail, User, BarChart, Shield, CheckCheck } from "lucide-react";
import { Logo } from '@/components/icons';
import { Badge } from './ui/badge';
import { useIsMobile } from '@/hooks/use-mobile';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { cn } from '@/lib/utils';
import type { Notification } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { getNotifications, markAllAsRead, markAsRead } from '@/app/notifications/actions';
import { getGeneralSettings } from '@/app/settings/actions';
import { useIsClient } from '@/hooks/use-is-client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';


const navItemsAdmin = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/cases', label: 'Cases Management', icon: Briefcase },
    { href: '/tasks', label: 'Tasks Management', icon: ListTodo },
    { href: '/meetings', label: 'Meetings Management', icon: Calendar },
    { href: '/accounts', label: 'Accounts', icon: Contact },
    { href: '/documents', label: 'Documents', icon: FileText },
    { href: '/emails', label: 'Emails / Communication', icon: Mail },
    { href: '/reports', label: 'Reports', icon: BarChart },
    { href: '/admin', label: 'Users & Roles', icon: Users },
    { href: '/settings', label: 'System Settings', icon: Settings },
];

const navItemsStaff = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/cases', label: 'Cases', icon: Briefcase },
    { href: '/tasks', label: 'Tasks', icon: ListTodo },
    { href: '/meetings', label: 'Meetings', icon: Calendar },
    { href: '/accounts', label: 'Accounts', icon: Contact },
    { href: '/documents', label: 'Documents', icon: FileText },
    { href: '/emails', label: 'Emails / Messages', icon: Mail },
];

const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
        case 'case': return <Briefcase className="h-4 w-4 text-blue-500" />;
        case 'task': return <ListTodo className="h-4 w-4 text-green-500" />;
        case 'email': return <Mail className="h-4 w-4 text-orange-500" />;
        case 'meeting': return <Calendar className="h-4 w-4 text-purple-500" />;
        default: return <Bell className="h-4 w-4 text-muted-foreground" />;
    }
};

export default function MainLayout({ children }: { children: React.ReactNode }) {
    const { user, logout, isLoading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const isMobile = useIsMobile();
    const isClient = useIsClient();
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const queryClient = useQueryClient();

    const { data: notificationsData } = useQuery<{notifications: Notification[], total: number}>({
      queryKey: ['notifications', user?.id, 1, 'unread'], // Fetch first page of unread for the dropdown
      queryFn: () => getNotifications(user!.id, { page: 1, limit: 5, filter: 'unread' }),
      enabled: !!user,
      refetchInterval: 60000, // Refetch every 60 seconds
    });
    
    const notifications = notificationsData?.notifications || [];
    const unreadCount = notificationsData?.total || 0;


    const { data: generalSettings = { systemName: 'MinT CRM', logoUrl: '' } } = useQuery({
      queryKey: ['generalSettings'],
      queryFn: getGeneralSettings,
      enabled: !!user,
    });


    const markAsReadMutation = useMutation({
        mutationFn: markAsRead,
        onSuccess: (updatedNotification) => {
             queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
        }
    })

    const markAllAsReadMutation = useMutation({
        mutationFn: () => markAllAsRead(user!.id),
        onSuccess: () => {
             queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
        }
    })
    
    const handleNotificationClick = async (notification: Notification) => {
        if (!notification.read) {
            markAsReadMutation.mutate(notification.id);
        }
        router.push(notification.link);
    };

    const handleMarkAllAsRead = async () => {
         if (user) {
            markAllAsReadMutation.mutate();
        }
    };

    if (!user || isLoading) {
        return (
          <div className="flex h-screen w-full items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        )
    }

    const navItems = user.role.name === 'Admin' ? navItemsAdmin : navItemsStaff;
    const profileNavItem = { href: '/profile', label: 'Profile & Settings', icon: User };

    const sidebarContent = (
      <div className="flex flex-col h-full bg-card text-card-foreground border-r">
        <div className={cn("flex h-20 items-center border-b px-6 shrink-0", sidebarCollapsed ? 'justify-center' : '')}>
            <Link href="/" className={cn("flex items-center gap-3 font-semibold text-foreground", sidebarCollapsed ? 'justify-center' : '')}>
              {generalSettings.logoUrl ? <img src={generalSettings.logoUrl} alt="Logo" className="h-8 w-8 object-contain" /> : <Logo className="h-8 w-8 text-primary shrink-0" />}
              <div className={cn("flex flex-col", sidebarCollapsed ? 'hidden' : 'block')}>
                <span className="font-headline text-xl">{generalSettings.systemName}</span>
              </div>
            </Link>
        </div>
        <div className="flex-1 overflow-y-auto">
            <nav className="space-y-1 p-4">
                {navItems.map((item) => (
                   <Link key={item.href} href={item.href}
                      className={cn(
                        "group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg",
                        pathname === item.href 
                            ? 'bg-primary/10 text-primary' 
                            : 'text-muted-foreground hover:bg-muted/50',
                        sidebarCollapsed ? 'justify-center' : ''
                      )}
                    >
                      <item.icon className={cn("h-5 w-5 shrink-0", sidebarCollapsed ? '' : 'mr-3')} />
                      <span className={cn("truncate", sidebarCollapsed ? 'hidden' : 'block')}>{item.label}</span>
                  </Link>
                ))}
            </nav>
        </div>
        <div className="mt-auto p-4 border-t">
             <nav className="space-y-1">
                <Link key={profileNavItem.href} href={profileNavItem.href}
                      className={cn(
                        "group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg",
                        pathname === profileNavItem.href 
                            ? 'bg-primary/10 text-primary' 
                            : 'text-muted-foreground hover:bg-muted/50',
                        sidebarCollapsed ? 'justify-center' : ''
                      )}
                >
                    <profileNavItem.icon className={cn("h-5 w-5 shrink-0", sidebarCollapsed ? '' : 'mr-3')} />
                    <span className={cn("truncate", sidebarCollapsed ? 'hidden' : 'block')}>{profileNavItem.label}</span>
                </Link>
            </nav>
        </div>
      </div>
    );


    return (
        <div className="flex min-h-screen w-full bg-background">
            {isMobile ? (
                <Sheet open={isSidebarOpen} onOpenChange={setSidebarOpen}>
                    <SheetContent side="left" className="p-0 w-[280px]">
                      <VisuallyHidden><SheetTitle>Mobile Navigation Menu</SheetTitle></VisuallyHidden>
                      {sidebarContent}
                    </SheetContent>
                </Sheet>
            ) : (
                <div className={cn("h-screen sticky top-0 transition-all duration-300", sidebarCollapsed ? 'w-[80px]' : 'w-[280px]')}>
                    {sidebarContent}
                </div>
            )}
            <div className="flex flex-col flex-1">
                <header className="flex h-20 items-center gap-4 border-b bg-card px-6 sticky top-0 z-30">
                  <Button variant="outline" size="icon" className="shrink-0" onClick={() => isMobile ? setSidebarOpen(true) : setSidebarCollapsed(!sidebarCollapsed)}>
                      <Menu className="h-6 w-6" />
                      <span className="sr-only">Toggle navigation menu</span>
                  </Button>
                  
                  <div className="flex-1">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input placeholder="Search cases, contacts..." className="pl-10 w-full max-w-md bg-muted/40" />
                    </div>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="relative">
                            <Bell className="h-5 w-5" />
                            {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">{unreadCount}</span>
                            )}
                            <span className="sr-only">Toggle notifications</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-80">
                        <DropdownMenuLabel className="flex items-center justify-between">
                            <span>Notifications</span>
                            {unreadCount > 0 && <Button variant="link" size="sm" className="p-0 h-auto" onClick={handleMarkAllAsRead}><CheckCheck className="mr-1 h-4 w-4" />Mark all as read</Button>}
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {notifications.length > 0 ? (
                            notifications.map(notification => (
                                 <DropdownMenuItem key={notification.id} className="flex items-start gap-3" onClick={() => handleNotificationClick(notification)}>
                                    {getNotificationIcon(notification.type)}
                                    <div className="flex-1">
                                        <p className="font-semibold text-sm">{notification.title}</p>
                                        <p className="text-xs text-muted-foreground">{notification.description}</p>
                                        <p className="text-xs text-muted-foreground mt-1">{formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}</p>
                                    </div>
                                </DropdownMenuItem>
                            ))
                        ) : (
                            <p className="p-4 text-center text-sm text-muted-foreground">No new notifications</p>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="justify-center" onClick={() => router.push('/notifications')}>
                            View All Notifications
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={'https://placehold.co/40x40.png'} data-ai-hint="user avatar" alt={user.name} />
                                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel className="font-normal">
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-medium leading-none">{user.name}</p>
                                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => router.push('/profile')}>
                               <User className="mr-2 h-4 w-4" />
                               <span>Profile</span>
                            </DropdownMenuItem>
                            {user.role.name === 'Admin' && (
                                <DropdownMenuItem onClick={() => router.push('/settings')}>
                                <Settings className="mr-2 h-4 w-4" />
                                <span>Settings</span>
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={logout} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                                <LogOut className="mr-2 h-4 w-4" />
                                <span>Logout</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </header>
                <main className="flex-1 overflow-auto p-4 md:p-8">{children}</main>
            </div>
        </div>
    );
}
