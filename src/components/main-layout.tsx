
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
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Bell, Briefcase, Users, LayoutDashboard, LogOut, Menu, Settings, ListTodo, Contact, Building, FileText, Calendar, Search, Mail, BarChart, HardHat, Workflow, User } from "lucide-react";
import { Logo } from '@/components/icons';
import { Badge } from './ui/badge';
import { useIsMobile } from '@/hooks/use-mobile';


const navItems = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard, count: null },
    { href: '/cases', label: 'Cases', icon: Briefcase, count: 24 },
    { href: '/tasks', label: 'Tasks', icon: ListTodo, count: 18 },
    { href: '/contacts', label: 'Contacts', icon: Contact, count: 156 },
    { href: '/calendar', label: 'Meetings', icon: Calendar, count: 5 },
    { href: '/documents', label: 'Documents', icon: FileText, count: 89 },
    { href: '/emails', label: 'Emails', icon: Mail, count: 7 },
    { href: '/reports', label: 'Reports', icon: BarChart, count: null },
    { href: '/users', label: 'Users', icon: Users, count: null },
    { href: '/workflows', label: 'Workflows', icon: Workflow, count: null },
    { href: '/settings', label: 'Settings', icon: Settings, count: null, adminOnly: true },
];

export default function MainLayout({ children }: { children: React.ReactNode }) {
    const { user, logout } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const isMobile = useIsMobile();
    const [isSidebarOpen, setSidebarOpen] = useState(!isMobile);

    useEffect(() => {
        if (!user) {
            router.push('/login');
        }
    }, [user, router]);
    
    useEffect(() => {
        setSidebarOpen(!isMobile);
    }, [isMobile]);

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

    const filteredNavItems = navItems.filter(item => !item.adminOnly || user.role === 'admin');

    const sidebarContent = (
      <div className="flex flex-col h-full bg-card text-card-foreground border-r">
        <div className="flex h-20 items-center border-b px-6 shrink-0">
            <Link href="/" className="flex items-center gap-3 font-semibold text-foreground">
              <Logo className="h-8 w-8 text-primary" />
              <div className="flex flex-col">
                <span className={`font-headline text-xl`}>MinT CRM</span>
                <span className="text-xs text-muted-foreground">Customer Relations</span>
              </div>
            </Link>
        </div>
        <nav className="flex-1 space-y-2 p-4">
            {filteredNavItems.map((item) => (
              <Link key={item.href} href={item.href} onClick={handleLinkClick}>
                <Button
                    variant={pathname === item.href ? 'secondary' : 'ghost'}
                    className="w-full justify-start gap-3 text-base h-11"
                    title={item.label}
                >
                    <item.icon className="h-5 w-5" />
                    <span>{item.label}</span>
                    {item.count && <Badge className="ml-auto bg-primary/20 text-primary hover:bg-primary/30">{item.count}</Badge>}
                </Button>
              </Link>
            ))}
        </nav>
      </div>
    );


    return (
        <div className="grid min-h-screen w-full bg-muted/40 lg:grid-cols-[280px_1fr]">
            <div className="hidden border-r bg-card lg:block">
                {sidebarContent}
            </div>
            <div className="flex flex-col">
                <header className="flex h-20 items-center gap-4 border-b bg-card px-6 sticky top-0 z-30">
                  <Sheet open={isSidebarOpen && isMobile} onOpenChange={setSidebarOpen}>
                      <SheetTrigger asChild>
                          <Button variant="outline" size="icon" className="lg:hidden">
                              <Menu className="h-6 w-6" />
                              <span className="sr-only">Toggle navigation menu</span>
                          </Button>
                      </SheetTrigger>
                      <SheetContent side="left" className="p-0 w-[280px]">
                        {sidebarContent}
                      </SheetContent>
                  </Sheet>
                  
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
                            <DropdownMenuItem>Profile</DropdownMenuItem>
                            <DropdownMenuItem>Settings</DropdownMenuItem>
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
