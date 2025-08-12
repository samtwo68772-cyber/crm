
"use client";

import React, { useEffect, useState } from 'react';
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
import { Bell, Briefcase, Users, LayoutDashboard, LogOut, Menu, Settings, ListTodo, Contact, Building, FileText, Calendar, Search, Mail, User, BarChart, Shield } from "lucide-react";
import { Logo } from '@/components/icons';
import { Badge } from './ui/badge';
import { useIsMobile } from '@/hooks/use-mobile';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';


const navItemsAdmin = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/cases', label: 'Cases Management', icon: Briefcase },
    { href: '/tasks', label: 'Tasks Management', icon: ListTodo },
    { href: '/meetings', label: 'Meetings Management', icon: Calendar },
    { href: '/accounts', label: 'Customers', icon: Contact },
    { href: '/documents', label: 'Documents', icon: FileText },
    { href: '/emails', label: 'Emails / Communication', icon: Mail },
    { href: '/reports', label: 'Reports', icon: BarChart },
    { href: '/admin', label: 'Users & Roles', icon: Users },
    { href: '/settings', label: 'System Settings', icon: Settings },
    { href: '/audit-logs', label: 'Audit Logs', icon: Shield },
    { href: '/notifications-settings', label: 'Notifications Settings', icon: Bell },
    { href: '/profile', label: 'Profile & Settings', icon: User },
];

const navItemsStaff = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/cases', label: 'Cases', icon: Briefcase },
    { href: '/tasks', label: 'Tasks', icon: ListTodo },
    { href: '/meetings', label: 'Meetings', icon: Calendar },
    { href: '/accounts', label: 'Customers', icon: Contact },
    { href: '/documents', label: 'Documents', icon: FileText },
    { href: '/calendar', label: 'Calendar', icon: Calendar },
    { href: '/emails', label: 'Emails / Messages', icon: Mail },
    { href: '/notifications-settings', label: 'Notifications', icon: Bell },
    { href: '/profile', label: 'Profile & Settings', icon: User },
];


export default function MainLayout({ children }: { children: React.ReactNode }) {
    const { user, logout } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const isMobile = useIsMobile();
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    useEffect(() => {
        if (!user) {
            router.push('/login');
        }
    }, [user, router]);
    
    const handleLinkClick = () => {
        if (isMobile) {
            setSidebarOpen(false);
        }
    }

    if (!user) {
        return (
          <div className="flex h-screen w-full items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        )
    }

    const navItems = user.role === 'admin' ? navItemsAdmin : navItemsStaff;

    const sidebarContent = (
      <div className="flex flex-col h-full bg-card text-card-foreground border-r">
        <div className={`flex h-20 items-center border-b px-6 shrink-0 ${sidebarCollapsed ? 'justify-center' : ''}`}>
            <Link href="/" className={`flex items-center gap-3 font-semibold text-foreground ${sidebarCollapsed ? 'justify-center' : ''}`}>
              <Logo className="h-8 w-8 text-primary shrink-0" />
              <div className={`flex flex-col ${sidebarCollapsed ? 'hidden' : 'block'}`}>
                <span className={`font-headline text-xl`}>MinT CRM</span>
              </div>
            </Link>
        </div>
        <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
            {navItems.map((item) => (
               <Link key={item.href} href={item.href} onClick={handleLinkClick}
                  className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ease-in-out
                    ${pathname === item.href 
                        ? 'bg-primary/10 text-primary border-l-4 border-primary' 
                        : 'text-muted-foreground hover:bg-primary/5 hover:text-primary'}
                    ${sidebarCollapsed ? 'justify-center' : ''}
                  `}
                >
                  <item.icon className={`h-5 w-5 shrink-0 transition-colors duration-200 ease-in-out ${sidebarCollapsed ? '' : 'mr-3'} ${pathname === item.href ? 'text-primary' : 'group-hover:text-primary'}`} />
                  <span className={`truncate ${sidebarCollapsed ? 'hidden' : 'block'}`}>{item.label}</span>
              </Link>
            ))}
        </nav>
      </div>
    );


    return (
        <div className="grid min-h-screen w-full bg-background" style={{ gridTemplateColumns: sidebarCollapsed ? '80px 1fr' : '280px 1fr' }}>
            <div className="bg-card">
                 {isMobile ? (
                    <Sheet open={isSidebarOpen} onOpenChange={setSidebarOpen}>
                      <SheetContent side="left" className="p-0 w-[280px]">
                        <VisuallyHidden><SheetTitle>Mobile Navigation Menu</SheetTitle></VisuallyHidden>
                        {sidebarContent}
                      </SheetContent>
                  </Sheet>
                 ) : sidebarContent }
            </div>
            <div className="flex flex-col">
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
                  
                  <Button variant="ghost" size="icon">
                    <Bell className="h-5 w-5" />
                    <span className="sr-only">Toggle notifications</span>
                  </Button>
                
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={`https://placehold.co/40x40.png`} data-ai-hint="user avatar" alt={user.name} />
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
                            <DropdownMenuItem>
                               <User className="mr-2 h-4 w-4" />
                               <span>Profile</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                               <Settings className="mr-2 h-4 w-4" />
                               <span>Settings</span>
                            </DropdownMenuItem>
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
