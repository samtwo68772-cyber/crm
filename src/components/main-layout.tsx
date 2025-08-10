"use client";

import React, { useEffect } from 'react';
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Bell, Briefcase, Users, LayoutDashboard, LogOut, Menu, Settings, ListTodo, Contact, Building, FileText, Calendar } from "lucide-react";
import { Logo } from '@/components/icons';
import { Badge } from './ui/badge';

const navItems = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/cases', label: 'Cases', icon: Briefcase },
    { href: '/tasks', label: 'Tasks', icon: ListTodo },
    { href: '/contacts', label: 'Contacts', icon: Contact },
    { href: '/accounts', label: 'Accounts', icon: Building },
    { href: '/documents', label: 'Documents', icon: FileText },
    { href: '/calendar', label: 'Calendar', icon: Calendar },
    { href: '/admin', label: 'Admin', icon: Settings, adminOnly: true },
];

export default function MainLayout({ children }: { children: React.ReactNode }) {
    const { user, logout } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!user) {
            router.push('/login');
        }
    }, [user, router]);

    if (!user) {
        return (
          <div className="flex h-screen w-full items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        )
    }

    const filteredNavItems = navItems.filter(item => !item.adminOnly || user.role === 'admin');

    const sidebarContent = (
      <>
        <SheetHeader className="border-b p-4">
          <SheetTitle>
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <Logo className="h-6 w-6 text-primary" />
              <span className="font-headline">Caseflow CRM</span>
            </Link>
          </SheetTitle>
        </SheetHeader>
        <div className="flex flex-col">
            <nav className="flex-1 space-y-2 p-4">
            {filteredNavItems.map((item) => (
                <Link key={item.href} href={item.href}>
                <Button
                    variant={pathname === item.href ? 'secondary' : 'ghost'}
                    className="w-full justify-start gap-2"
                >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                </Button>
                </Link>
            ))}
            </nav>
        </div>
      </>
    );

    const desktopSidebarContent = (
        <div className="flex flex-col">
          <div className="flex h-16 items-center border-b px-6 shrink-0">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <Logo className="h-6 w-6 text-primary" />
              <span className="font-headline">Caseflow CRM</span>
            </Link>
          </div>
          <nav className="flex-1 space-y-2 p-4">
            {filteredNavItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={pathname === item.href ? 'secondary' : 'ghost'}
                  className="w-full justify-start gap-2"
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Button>
              </Link>
            ))}
          </nav>
        </div>
      );


    return (
        <div className="grid min-h-screen w-full lg:grid-cols-[280px_1fr]">
            <div className="hidden border-r bg-card lg:block">
                {desktopSidebarContent}
            </div>
            <div className="flex flex-col">
                <header className="flex h-16 items-center gap-4 border-b bg-card px-6">
                  <Sheet>
                      <SheetTrigger asChild>
                          <Button variant="outline" size="icon" className="lg:hidden">
                              <Menu className="h-6 w-6" />
                              <span className="sr-only">Toggle navigation menu</span>
                          </Button>
                      </SheetTrigger>
                      <SheetContent side="left" className="p-0">
                        <SheetHeader className="border-b p-4">
                          <SheetTitle className="sr-only">Menu</SheetTitle>
                        </SheetHeader>
                        {sidebarContent}
                      </SheetContent>
                  </Sheet>
                  <div className="flex-1">
                    {/* Optional: Breadcrumbs or page title here */}
                  </div>
                  <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="relative">
                          <Bell className="h-5 w-5" />
                           <Badge className="absolute -top-1 -right-1 h-4 w-4 justify-center p-1" variant="destructive">3</Badge>
                          <span className="sr-only">Toggle notifications</span>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80">
                         <div className="grid gap-4">
                          <div className="space-y-2">
                            <h4 className="font-medium leading-none">Notifications</h4>
                            <p className="text-sm text-muted-foreground">You have 3 new messages.</p>
                          </div>
                          {/* Notifications list */}
                         </div>
                      </PopoverContent>
                  </Popover>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={`https://placehold.co/40x40.png`} data-ai-hint="user avatar" alt={user.name} />
                                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>{user.name}</DropdownMenuLabel>
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
                <main className="flex-1 bg-background">{children}</main>
            </div>
        </div>
    );
}
