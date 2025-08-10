
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from './ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Bell, Briefcase, Users, LayoutDashboard, LogOut, Menu, Settings, ListTodo, Contact, Building, FileText, Calendar, PlusCircle, Search, User as UserIcon } from "lucide-react";
import { Logo } from '@/components/icons';
import { Badge } from './ui/badge';
import { useIsMobile } from '@/hooks/use-mobile';


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
    const isMobile = useIsMobile();
    const [isSidebarOpen, setSidebarOpen] = useState(isMobile ? false : true);

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
      <div className="flex flex-col h-full bg-card text-card-foreground backdrop-blur-md border-r">
        <div className="flex h-16 items-center border-b px-6 shrink-0">
            <Link href="/" className="flex items-center gap-3 font-semibold text-foreground">
              <Logo className="h-7 w-7 text-primary" />
              <span className={`font-headline text-xl ${!isSidebarOpen && "hidden"}`}>MintCRM</span>
            </Link>
        </div>
        <nav className="flex-1 space-y-2 p-4">
            {filteredNavItems.map((item) => (
              <Link key={item.href} href={item.href} onClick={handleLinkClick}>
                <Button
                    variant={pathname === item.href ? 'secondary' : 'ghost'}
                    className={`w-full justify-start gap-3 text-base h-11 ${!isSidebarOpen && "w-11 px-0"}`}
                    title={item.label}
                >
                    <item.icon className="h-5 w-5" />
                    <span className={`${!isSidebarOpen && "hidden"}`}>{item.label}</span>
                </Button>
              </Link>
            ))}
        </nav>
      </div>
    );


    return (
        <div className="grid min-h-screen w-full bg-muted/40" style={{gridTemplateColumns: isSidebarOpen && !isMobile ? '280px 1fr' : 'auto 1fr'}}>
            <div className={`hidden lg:block transition-all duration-300 ease-in-out ${isSidebarOpen ? 'w-[280px]' : 'w-[88px]'}`}>
                {sidebarContent}
            </div>

            <div className="flex flex-col">
                <header className="flex h-16 items-center gap-4 border-b bg-card px-6">
                  <Sheet open={isMobile && isSidebarOpen} onOpenChange={setSidebarOpen}>
                      <SheetTrigger asChild>
                          <Button variant="outline" size="icon" className="lg:hidden">
                              <Menu className="h-6 w-6" />
                              <span className="sr-only">Toggle navigation menu</span>
                          </Button>
                      </SheetTrigger>
                      <SheetContent side="left" className="p-0 w-[280px]">
                        <SheetHeader>
                          <SheetTitle className="sr-only">Menu</SheetTitle>
                        </SheetHeader>
                        {sidebarContent}
                      </SheetContent>
                  </Sheet>
                  <Button variant="outline" size="icon" className="hidden lg:inline-flex" onClick={() => setSidebarOpen(!isSidebarOpen)}>
                      <Menu className="h-6 w-6" />
                      <span className="sr-only">Toggle navigation menu</span>
                  </Button>
                  
                  <div className="flex-1">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input placeholder="Search cases, contacts..." className="pl-10 w-full max-w-md bg-background" />
                    </div>
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
                            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                                <UserIcon className="h-5 w-5 mr-2" />
                                <Avatar className="h-10 w-10">
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
                <main className="flex-1 bg-muted/40 overflow-auto">{children}</main>
            </div>
        </div>
    );
}
