
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { getAccounts, getContacts, createAccount, updateAccount, deleteAccount, createContact, updateContact, deleteContact } from './actions';
import { getCases } from '../cases/actions';
import { getTasks } from '../tasks/actions';
import { getMeetings } from '../meetings/actions';
import type { Account, Contact, Case, Task, Meeting } from '@/lib/types';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetClose, SheetFooter } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { MoreHorizontal, PlusCircle, Trash2, Edit, X, Building2, Users, Briefcase, ListTodo, Calendar, Globe, Users2, Search, Mail, Phone, ChevronDown, Link as LinkIcon, ArrowLeft, ArrowRight } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useSearchParams } from 'next/navigation';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { cn } from '@/lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';

export default function CustomersPage() {
    const searchParams = useSearchParams();
    const [activeTab, setActiveTab] = useState('accounts');

    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab === 'contacts' || tab === 'accounts') {
            setActiveTab(tab);
        }
    }, [searchParams]);

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight font-headline">Accounts</h2>
                    <p className="text-muted-foreground">Manage your accounts and contacts.</p>
                </div>
            </div>
             <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="accounts">Accounts</TabsTrigger>
                    <TabsTrigger value="contacts">Contacts</TabsTrigger>
                </TabsList>
                <TabsContent value="accounts" className="mt-4">
                    <AccountsView />
                </TabsContent>
                <TabsContent value="contacts" className="mt-4">
                    <ContactsView />
                </TabsContent>
            </Tabs>
        </div>
    )
}


function AccountsView() {
    const queryClient = useQueryClient();
    const { data: accounts, isLoading: accountsLoading } = useQuery<Account[]>({ queryKey: ['accounts'], queryFn: getAccounts });
    const { data: contacts, isLoading: contactsLoading } = useQuery<Contact[]>({ queryKey: ['contacts'], queryFn: getContacts });
    const { data: cases, isLoading: casesLoading } = useQuery<Case[]>({ queryKey: ['cases'], queryFn: getCases });
    const { data: tasks, isLoading: tasksLoading } = useQuery<Task[]>({ queryKey: ['tasks'], queryFn: getTasks });
    const { data: meetings, isLoading: meetingsLoading } = useQuery<Meeting[]>({ queryKey: ['meetings'], queryFn: getMeetings });

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingAccount, setEditingAccount] = useState<Account | null>(null);
    const { user } = useAuth();
    const { toast } = useToast();
    const isAdmin = user?.role === 'admin';
    const isLoading = accountsLoading || contactsLoading || casesLoading || tasksLoading || meetingsLoading;

    const filteredAccounts = useMemo(() => {
        if (!accounts) return [];
        return accounts.filter(account =>
            account.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (account.industry && account.industry.toLowerCase().includes(searchQuery.toLowerCase()))
        );
    }, [accounts, searchQuery]);

    const createAccountMutation = useMutation({
        mutationFn: createAccount,
        onSuccess: (newAccount) => {
            queryClient.invalidateQueries({ queryKey: ['accounts'] });
            toast({ title: "Account Created", description: `Account "${newAccount.name}" has been successfully created.` });
            setIsFormOpen(false);
        },
        onError: (error) => {
            toast({ variant: "destructive", title: "Error", description: error.message });
        }
    });

    const updateAccountMutation = useMutation({
        mutationFn: (data: { id: string, data: Partial<Account> }) => updateAccount(data.id, data.data as any),
        onSuccess: (updatedAccount) => {
            queryClient.invalidateQueries({ queryKey: ['accounts'] });
            toast({ title: "Account Updated", description: `Account "${updatedAccount.name}" has been updated.` });
            setEditingAccount(null);
            setIsFormOpen(false);
            setSelectedAccount(updatedAccount);
        },
        onError: (error) => {
            toast({ variant: "destructive", title: "Error", description: error.message });
        }
    });

    const deleteAccountMutation = useMutation({
        mutationFn: deleteAccount,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['accounts'] });
            toast({ title: "Account Deleted", description: `The account has been deleted.` });
            setSelectedAccount(null);
            setIsSheetOpen(false);
        },
        onError: (error) => {
            toast({ variant: "destructive", title: "Error", description: error.message });
        }
    });


    const handleAddAccount = async (newAccountData: Omit<Account, 'id' | 'createdAt' | 'owner' | 'primaryContactId'>) => {
        createAccountMutation.mutate(newAccountData);
    };
  
    const handleUpdateAccount = async (updatedAccountData: Partial<Account> & { id: string }) => {
        const { id, ...data } = updatedAccountData;
        updateAccountMutation.mutate({ id, data });
    };
  
    const handleDeleteAccount = async (accountId: string) => {
        deleteAccountMutation.mutate(accountId);
    };

  const openCreateForm = () => {
    setEditingAccount(null);
    setIsFormOpen(true);
  };

  const openEditForm = (account: Account) => {
    setEditingAccount(account);
    setIsSheetOpen(false);
    setTimeout(() => setIsFormOpen(true), 150);
  };

  const getAccountStats = (accountId: string) => {
    if(!contacts || !cases || !tasks) return { contacts: 0, cases: 0, tasks: 0 };
    const relatedContacts = contacts.filter(c => c.accountId === accountId);
    const relatedContactIds = relatedContacts.map(c => c.id);
    const relatedCases = cases.filter(c => c.contactId && relatedContactIds.includes(c.contactId)).length;
    const relatedTasks = tasks.filter(t => t.contactId && relatedContactIds.includes(t.contactId)).length;
    return { contacts: relatedContacts.length, cases: relatedCases, tasks: relatedTasks };
  };

  return (
    <div className="space-y-4 pt-2 bg-muted/50 rounded-lg p-4">
      <div className="flex items-center justify-between pb-4 border-b">
         <Card className="shadow-none border-0 bg-transparent w-full">
            <CardContent className="p-0">
                <div className="flex justify-between items-center">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Search accounts by name or industry..." className="pl-9 w-full max-w-lg" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                    </div>
                    <Button onClick={openCreateForm}><PlusCircle className="mr-2 h-4 w-4" /> Add Account</Button>
                </div>
            </CardContent>
        </Card>
      </div>
      
        {isLoading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-36 w-full" />)}
            </div>
        ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredAccounts.map((account) => {
                    const stats = getAccountStats(account.id);
                    return (
                    <Card key={account.id} onClick={() => { setSelectedAccount(account); setIsSheetOpen(true); }} className="cursor-pointer hover:shadow-lg transition-shadow duration-200">
                        <CardHeader className="flex flex-row items-center gap-4">
                            <Avatar className="h-12 w-12">
                                <AvatarImage src={`https://placehold.co/64x64/F1F5F9/334155.png?text=${account.name.charAt(0)}`} data-ai-hint="company logo" />
                                <AvatarFallback>{account.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <CardTitle className="text-lg">{account.name}</CardTitle>
                                <CardDescription>{account.industry}</CardDescription>
                            </div>
                        </CardHeader>
                        <CardFooter className="flex justify-between text-sm text-muted-foreground">
                            <div className="flex items-center gap-1"><Users className="h-4 w-4"/> {stats.contacts}</div>
                            <div className="flex items-center gap-1"><Briefcase className="h-4 w-4"/> {stats.cases}</div>
                            <div className="flex items-center gap-1"><ListTodo className="h-4 w-4"/> {stats.tasks}</div>
                        </CardFooter>
                    </Card>
                    )
                })}
            </div>
        )}
      
      {selectedAccount && (
        <AccountDetailSheet
            open={isSheetOpen}
            onOpenChange={setIsSheetOpen}
            account={selectedAccount}
            onEdit={() => openEditForm(selectedAccount)}
            onDelete={() => handleDeleteAccount(selectedAccount.id)}
            contacts={contacts || []}
            cases={cases || []}
            tasks={tasks || []}
            meetings={meetings || []}
        />
      )}
      
      <AccountFormDialog
        key={editingAccount ? editingAccount.id : 'create'}
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        account={editingAccount}
        onSave={(data, isEdit) => {
            if (isEdit && editingAccount) {
                handleUpdateAccount({ ...editingAccount, ...data });
            } else {
                handleAddAccount(data);
            }
        }}
      />
    </div>
  );
}

function AccountDetailSheet({ open, onOpenChange, account, onEdit, onDelete, contacts, cases, tasks, meetings }: { open: boolean, onOpenChange: (open: boolean) => void, account: Account, onEdit: () => void, onDelete: () => void, contacts: Contact[], cases: Case[], tasks: Task[], meetings: Meeting[] }) {
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';
    
    const relatedContacts = useMemo(() => contacts.filter(c => c.accountId === account.id), [account.id, contacts]);
    const relatedContactIds = useMemo(() => relatedContacts.map(c => c.id), [relatedContacts]);

    const relatedCases = useMemo(() => cases.filter(c => c.contactId && relatedContactIds.includes(c.contactId)), [relatedContactIds, cases]);
    const relatedTasks = useMemo(() => tasks.filter(t => t.contactId && relatedContactIds.includes(t.contactId)), [relatedContactIds, tasks]);
    const relatedMeetings = useMemo(() => meetings.filter(m => m.contactId && relatedContactIds.includes(m.contactId)), [relatedContactIds, meetings]);

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-4xl p-0">
                <div className="flex flex-col h-full">
                    <SheetHeader className="p-6 border-b bg-card">
                         <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <Avatar className="h-16 w-16">
                                    <AvatarImage src={`https://placehold.co/64x64/F1F5F9/334155.png?text=${account.name.charAt(0)}`} data-ai-hint="company logo" />
                                    <AvatarFallback>{account.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <SheetTitle className="font-headline text-2xl">{account.name}</SheetTitle>
                                    <SheetDescription>{account.industry}</SheetDescription>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" size="icon" onClick={onEdit}><Edit className="h-4 w-4"/></Button>
                                {isAdmin && <Button variant="destructive" size="icon" onClick={onDelete}><Trash2 className="h-4 w-4"/></Button>}
                            </div>
                        </div>
                    </SheetHeader>
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 overflow-hidden">
                        <div className="col-span-1 border-r p-6 space-y-6 overflow-y-auto bg-card">
                            <h4 className="font-semibold text-lg">Account Details</h4>
                             <div className="space-y-4 text-sm">
                                <div className="flex items-start gap-3"><Globe className="h-4 w-4 mt-1 text-muted-foreground" /><div><p className="text-muted-foreground">Address</p><p>{account.address || 'N/A'}</p></div></div>
                                <div className="flex items-start gap-3"><Phone className="h-4 w-4 mt-1 text-muted-foreground" /><div><p className="text-muted-foreground">Phone</p><p>{account.phone || 'N/A'}</p></div></div>
                                <div className="flex items-start gap-3"><Mail className="h-4 w-4 mt-1 text-muted-foreground" /><div><p className="text-muted-foreground">Email</p><p>{account.email || 'N/A'}</p></div></div>
                                <div className="flex items-start gap-3"><LinkIcon className="h-4 w-4 mt-1 text-muted-foreground" /><div><p className="text-muted-foreground">Website</p><p>{account.website || 'N/A'}</p></div></div>
                                <div className="flex items-start gap-3"><Building2 className="h-4 w-4 mt-1 text-muted-foreground" /><div><p className="text-muted-foreground">Industry</p><p>{account.industry}</p></div></div>
                            </div>
                        </div>
                        <div className="col-span-2 overflow-y-auto p-6">
                            <Tabs defaultValue="contacts">
                                <TabsList>
                                    <TabsTrigger value="contacts">Related Contacts ({relatedContacts.length})</TabsTrigger>
                                    <TabsTrigger value="cases">Cases ({relatedCases.length})</TabsTrigger>
                                    <TabsTrigger value="tasks">Tasks ({relatedTasks.length})</TabsTrigger>
                                    <TabsTrigger value="meetings">Meetings ({relatedMeetings.length})</TabsTrigger>
                                </TabsList>
                                <TabsContent value="contacts" className="mt-4">
                                     <div className="space-y-2">
                                        {relatedContacts.map(contact => (
                                            <Card key={contact.id}>
                                                <CardContent className="p-3 flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-8 w-8"><AvatarImage src={`https://placehold.co/40x40.png`} data-ai-hint="person avatar" alt={contact.name} /><AvatarFallback>{contact.name.charAt(0)}</AvatarFallback></Avatar>
                                                        <div><p className="font-medium">{contact.name}</p><p className="text-xs text-muted-foreground">{contact.role}</p></div>
                                                    </div>
                                                    <Button variant="outline" size="sm">View Contact</Button>
                                                </CardContent>
                                            </Card>
                                        ))}
                                     </div>
                                </TabsContent>
                                <TabsContent value="cases" className="mt-4"><RelatedItemsList items={relatedCases} /></TabsContent>
                                <TabsContent value="tasks" className="mt-4"><RelatedItemsList items={relatedTasks} /></TabsContent>
                                <TabsContent value="meetings" className="mt-4"><RelatedItemsList items={relatedMeetings} /></TabsContent>
                            </Tabs>
                        </div>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    )
}

function AccountFormDialog({ open, onOpenChange, account, onSave }: { open: boolean, onOpenChange: (open: boolean) => void, account: Account | null, onSave: (data: any, isEdit: boolean) => void }) {
    const isEditMode = !!account;
    const [name, setName] = useState('');
    const [industry, setIndustry] = useState('');
    const [address, setAddress] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [website, setWebsite] = useState('');

    useEffect(() => {
        if(account) {
            setName(account.name);
            setIndustry(account.industry);
            setAddress(account.address || '');
            setPhone(account.phone || '');
            setEmail(account.email || '');
            setWebsite(account.website || '');
        } else {
            setName(''); setIndustry(''); setAddress(''); setPhone(''); setEmail(''); setWebsite('');
        }
    }, [account, open]);

    const handleSubmit = () => {
        onSave({ name, industry, address, phone, email, website }, isEditMode);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{isEditMode ? 'Edit Account' : 'Create New Account'}</DialogTitle>
                    <DialogDescription>{isEditMode ? 'Update the details for this account.' : 'Fill in the details for the new account.'}</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="name" className="text-right">Account Name</Label><Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" /></div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="industry" className="text-right">Industry/Type</Label>
                        <Select onValueChange={setIndustry} value={industry}>
                            <SelectTrigger className="col-span-3"><SelectValue placeholder="Select an industry" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Government">Government</SelectItem>
                                <SelectItem value="NGO">NGO</SelectItem>
                                <SelectItem value="Private">Private</SelectItem>
                                <SelectItem value="Technology">Technology</SelectItem>
                                <SelectItem value="Finance">Finance</SelectItem>
                                <SelectItem value="Healthcare">Healthcare</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="address" className="text-right">Address</Label><Textarea id="address" value={address} onChange={(e) => setAddress(e.target.value)} className="col-span-3" /></div>
                    <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="phone" className="text-right">Phone Number</Label><Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="col-span-3" /></div>
                    <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="email" className="text-right">Email Address</Label><Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="col-span-3" /></div>
                    <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="website" className="text-right">Website</Label><Input id="website" type="url" value={website} onChange={(e) => setWebsite(e.target.value)} className="col-span-3" placeholder="https://example.com"/></div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button type="submit" onClick={handleSubmit}>{isEditMode ? 'Save Changes' : 'Create Account'}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function ContactsView() {
    const queryClient = useQueryClient();
    const { data: contacts, isLoading: contactsLoading } = useQuery<Contact[]>({ queryKey: ['contacts'], queryFn: getContacts });
    const { data: accounts, isLoading: accountsLoading } = useQuery<Account[]>({ queryKey: ['accounts'], queryFn: getAccounts });
    
    const { data: cases } = useQuery<Case[]>({ queryKey: ['cases'], queryFn: getCases });
    const { data: tasks } = useQuery<Task[]>({ queryKey: ['tasks'], queryFn: getTasks });
    const { data: meetings } = useQuery<Meeting[]>({ queryKey: ['meetings'], queryFn: getMeetings });

    const [searchQuery, setSearchQuery] = useState('');
    const [companyFilter, setCompanyFilter] = useState('all');
    const [roleFilter, setRoleFilter] = useState('all');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingContact, setEditingContact] = useState<Contact | null>(null);
    const [isDetailSheetOpen, setDetailSheetOpen] = useState(false);
    const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
    const isMobile = useIsMobile();
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;
    const { toast } = useToast();
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';
    const isLoading = contactsLoading || accountsLoading;

    const companies = useMemo(() => {
        if (!contacts) return [];
        return ['all', ...Array.from(new Set(contacts.map(c => c.company).filter(Boolean)))]
    }, [contacts]);
    const roles = useMemo(() => {
        if (!contacts) return [];
        return ['all', ...Array.from(new Set(contacts.map(c => c.role).filter(Boolean)))]
    }, [contacts]);

    const filteredContacts = useMemo(() => {
        if (!contacts) return [];
        setCurrentPage(1); // Reset to first page on filter change
        return contacts.filter(contact =>
            (contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            contact.email.toLowerCase().includes(searchQuery.toLowerCase())) &&
            (companyFilter === 'all' || contact.company === companyFilter) &&
            (roleFilter === 'all' || contact.role === roleFilter)
        );
    }, [contacts, searchQuery, companyFilter, roleFilter]);
  
    const paginatedContacts = useMemo(() => {
        if (!filteredContacts) return [];
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredContacts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredContacts, currentPage]);
  
    const totalPages = Math.ceil((filteredContacts?.length || 0) / ITEMS_PER_PAGE);

    const createContactMutation = useMutation({
        mutationFn: createContact,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['contacts'] });
            toast({ title: "Contact Created", description: "A new contact has been created." });
            setIsFormOpen(false);
        },
        onError: (error) => {
            toast({ variant: "destructive", title: "Error", description: error.message });
        }
    });

    const updateContactMutation = useMutation({
        mutationFn: (data: { id: string, data: Partial<Contact> }) => updateContact(data.id, data.data as any),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['contacts'] });
            toast({ title: "Contact Updated", description: "The contact has been updated." });
            setIsFormOpen(false);
            setEditingContact(null);
        },
        onError: (error) => {
            toast({ variant: "destructive", title: "Error", description: error.message });
        }
    });

    const deleteContactMutation = useMutation({
        mutationFn: deleteContact,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['contacts'] });
            toast({ title: "Contact Deleted", description: "The contact has been deleted." });
        },
        onError: (error) => {
            toast({ variant: "destructive", title: "Error", description: error.message });
        }
    });
  
    const handleAddContact = async (newContactData: Omit<Contact, 'id' | 'avatar'>) => {
        createContactMutation.mutate(newContactData);
    };
  
    const handleUpdateContact = async (updatedContactData: Partial<Contact> & { id: string }) => {
        const { id, ...data } = updatedContactData;
        updateContactMutation.mutate({ id, data });
    };
  
    const handleDeleteContact = async (contactId: string) => {
        deleteContactMutation.mutate(contactId);
    };
  
    const openCreateForm = () => {
        setEditingContact(null);
        setIsFormOpen(true);
    }

    const openEditForm = (contact: Contact) => {
        setEditingContact(contact);
        setDetailSheetOpen(false); // Close detail sheet if open
        setTimeout(() => setIsFormOpen(true), 150);
    }
  
    const openDetailSheet = (contact: Contact) => {
        setSelectedContact(contact);
        setDetailSheetOpen(true);
    }

    const clearFilters = () => {
        setSearchQuery('');
        setCompanyFilter('all');
        setRoleFilter('all');
    }

    const PaginationControls = () => (
     <div className="flex items-center justify-between pt-4">
        <div className="text-sm text-muted-foreground">
            Page {totalPages > 0 ? currentPage : 0} of {totalPages} ({(filteredContacts || []).length} total contacts)
        </div>
        <div className="flex items-center gap-2">
            <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
            >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Previous
            </Button>
            <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
            >
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
        </div>
    </div>
    );
  
    return (
        <div className="space-y-6 pt-2">
        <Card>
            <CardContent className="p-4">
            <div className="flex flex-col md:flex-row items-center gap-4">
                <div className="relative w-full md:flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search contacts..." className="pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
                    <span className="text-sm font-medium text-muted-foreground hidden sm:block">Filter by:</span>
                    <Select value={companyFilter} onValueChange={setCompanyFilter}>
                        <SelectTrigger className="w-full md:w-[180px]"><SelectValue placeholder="Company" /></SelectTrigger>
                        <SelectContent>{companies.map(c => <SelectItem key={c} value={c}>{c === 'all' ? 'All Companies' : c}</SelectItem>)}</SelectContent>
                    </Select>
                    <Select value={roleFilter} onValueChange={setRoleFilter}>
                        <SelectTrigger className="w-full md:w-[180px]"><SelectValue placeholder="Role" /></SelectTrigger>
                        <SelectContent>{roles.map(r => <SelectItem key={r} value={r}>{r === 'all' ? 'All Roles' : r}</SelectItem>)}</SelectContent>
                    </Select>
                    <Button variant="outline" onClick={clearFilters} className="w-full md:w-auto"><X className="mr-2 h-4 w-4" /> Clear</Button>
                </div>
                <Button onClick={openCreateForm} className="w-full md:w-auto"><PlusCircle className="mr-2 h-4 w-4" /> Add Contact</Button>
            </div>
            </CardContent>
        </Card>

        {isLoading ? (
            <div className="border rounded-lg bg-card overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[250px]">Name</TableHead>
                            <TableHead>Company</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {[...Array(10)].map((_, i) => (
                            <TableRow key={i}>
                                <TableCell><Skeleton className="h-10 w-48" /></TableCell>
                                <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                                <TableCell><Skeleton className="h-6 w-36" /></TableCell>
                                <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                                <TableCell className="text-right"><Skeleton className="h-8 w-20" /></TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        ) : isMobile ? (
            <div className="space-y-4">
                {paginatedContacts.map((contact) => (
                    <Card key={contact.id} onClick={() => openDetailSheet(contact)} className="cursor-pointer">
                        <CardContent className="p-4 flex items-center gap-4">
                            <Avatar className="h-12 w-12">
                                <AvatarImage src={`https://placehold.co/40x40.png`} data-ai-hint="person avatar" alt={contact.name} />
                                <AvatarFallback>{contact.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <p className="font-semibold">{contact.name}</p>
                                <p className="text-sm text-muted-foreground">{contact.role}</p>
                                <p className="text-sm text-muted-foreground">{contact.company}</p>
                            </div>
                            <div className="flex flex-col gap-1">
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); alert(`Emailing ${contact.name}`); }}>
                                    <Mail className="h-4 w-4" />
                                    <span className="sr-only">Email</span>
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); alert(`Calling ${contact.name}`); }}>
                                    <Phone className="h-4 w-4" />
                                    <span className="sr-only">Call</span>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        ) : (
            <div className="border rounded-lg bg-card overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[250px]">Name</TableHead>
                            <TableHead>Company</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedContacts.map((contact) => (
                            <TableRow key={contact.id} onClick={() => openDetailSheet(contact)} className="cursor-pointer">
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage src={`https://placehold.co/40x40.png`} data-ai-hint="person avatar" alt={contact.name} />
                                            <AvatarFallback>{contact.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-semibold">{contact.name}</p>
                                            <p className="text-sm text-muted-foreground">{contact.role}</p>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>{contact.company}</TableCell>
                                <TableCell>{contact.email}</TableCell>
                                <TableCell>{contact.phone}</TableCell>
                                <TableCell className="text-right">
                                    <div className="flex gap-1 items-center justify-end">
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); alert(`Emailing ${contact.name}`); }}>
                                            <Mail className="h-4 w-4" />
                                            <span className="sr-only">Email</span>
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); alert(`Calling ${contact.name}`); }}>
                                            <Phone className="h-4 w-4" />
                                            <span className="sr-only">Call</span>
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); openDetailSheet(contact)}}>
                                            <MoreHorizontal className="h-4 w-4" />
                                            <span className="sr-only">View Details</span>
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                {totalPages > 1 && <div className="p-4 border-t"><PaginationControls /></div>}
            </div>
        )}
        {isMobile && totalPages > 1 && <PaginationControls />}
      
        {filteredContacts?.length === 0 && !isLoading && (
            <div className="text-center py-16 text-muted-foreground">
                <p className="text-lg font-semibold">No contacts found</p>
                <p>Try adjusting your search or filters.</p>
            </div>
        )}
      
        {selectedContact && (
            <ContactDetailSheet
                open={isDetailSheetOpen}
                onOpenChange={setDetailSheetOpen}
                contact={selectedContact}
                onEdit={() => openEditForm(selectedContact)}
                onDelete={() => handleDeleteContact(selectedContact.id)}
                cases={cases || []}
                tasks={tasks || []}
                meetings={meetings || []}
            />
        )}
      
        <ContactFormDialog
            key={editingContact ? editingContact.id : 'create'}
            open={isFormOpen}
            onOpenChange={setIsFormOpen}
            contact={editingContact}
            accounts={accounts || []}
            onSave={(data, isEdit) => {
                if (isEdit && editingContact) {
                    handleUpdateContact({ ...editingContact, ...data });
                } else {
                    handleAddContact(data as Omit<Contact, 'id' | 'avatar'>);
                }
            }}
        />
        </div>
    );
}


function ContactDetailSheet({ open, onOpenChange, contact, onEdit, onDelete, cases, tasks, meetings }: { open: boolean, onOpenChange: (open: boolean) => void, contact: Contact, onEdit: () => void, onDelete: () => void, cases: Case[], tasks: Task[], meetings: Meeting[] }) {
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';
    const [relatedItems, setRelatedItems] = useState<{cases: Case[], tasks: Task[], meetings: Meeting[]}>({cases: [], tasks: [], meetings: []});

    useEffect(() => {
        if(contact) {
            setRelatedItems({
                cases: cases.filter(c => c.contactId === contact.id),
                tasks: tasks.filter(t => t.contactId === contact.id),
                meetings: meetings.filter(m => m.contactId === contact.id)
            });
        }
    }, [contact, cases, tasks, meetings]);

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-md p-0 flex flex-col">
                <SheetHeader className="p-6 border-b bg-card">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                            <Avatar className="h-16 w-16">
                                <AvatarImage src={`https://placehold.co/64x64.png`} data-ai-hint="person avatar" alt={contact.name} />
                                <AvatarFallback>{contact.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <SheetTitle className="font-headline text-2xl">{contact.name}</SheetTitle>
                                <SheetDescription>{contact.role} at {contact.company}</SheetDescription>
                            </div>
                        </div>
                    </div>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto p-6">
                    <Tabs defaultValue="details">
                        <TabsList>
                            <TabsTrigger value="details">Details</TabsTrigger>
                            <TabsTrigger value="related">Related Items</TabsTrigger>
                        </TabsList>
                        <TabsContent value="details" className="mt-4 space-y-4">
                            <div>
                                <h4 className="font-semibold mb-2">Contact Information</h4>
                                <div className="text-sm space-y-2">
                                    <p><span className="text-muted-foreground w-20 inline-block">Email:</span> {contact.email}</p>
                                    <p><span className="text-muted-foreground w-20 inline-block">Phone:</span> {contact.phone}</p>
                                </div>
                            </div>
                                <div>
                                <h4 className="font-semibold mb-2">Notes</h4>
                                <p className="text-sm text-muted-foreground bg-muted/50 p-4 rounded-md whitespace-pre-wrap">{contact.notes || "No notes for this contact."}</p>
                                </div>
                        </TabsContent>
                        <TabsContent value="related" className="mt-4 space-y-6">
                            <RelatedItemsList title="Cases" icon={Briefcase} items={relatedItems.cases} />
                            <RelatedItemsList title="Tasks" icon={ListTodo} items={relatedItems.tasks} />
                            <RelatedItemsList title="Meetings" icon={Calendar} items={relatedItems.meetings} />
                        </TabsContent>
                    </Tabs>
                </div>
                <SheetFooter className="p-4 border-t mt-auto">
                    <div className="flex gap-2 w-full">
                        <Button variant="outline" className="w-full" onClick={onEdit}><Edit className="mr-2 h-4 w-4"/>Edit</Button>
                        {isAdmin && <Button variant="destructive" className="w-full" onClick={onDelete}><Trash2 className="mr-2 h-4 w-4"/>Delete</Button>}
                    </div>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    )
}

function ContactFormDialog({ open, onOpenChange, contact, accounts, onSave }: { open: boolean, onOpenChange: (open: boolean) => void, contact: Contact | null, accounts: Account[], onSave: (data: any, isEdit: boolean) => void }) {
    const isEditMode = !!contact;
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [company, setCompany] = useState('');
    const [role, setRole] = useState('');
    const [notes, setNotes] = useState('');
    
    useEffect(() => {
        if(contact) {
            setName(contact.name);
            setEmail(contact.email);
            setPhone(contact.phone);
            setCompany(contact.company);
            setRole(contact.role);
            setNotes(contact.notes || '');
        } else {
            setName(''); setEmail(''); setPhone(''); setCompany(''); setRole(''); setNotes('');
        }
    }, [contact, open]);

    const handleSubmit = () => {
        const selectedAccount = accounts.find(acc => acc.name === company);
        onSave({ name, email, phone, company, accountId: selectedAccount?.id || null, role, notes: notes || '' }, isEditMode);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{isEditMode ? 'Edit Contact' : 'Create New Contact'}</DialogTitle>
                    <DialogDescription>{isEditMode ? 'Update the details for this contact.' : 'Fill in the details for the new contact.'}</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="name" className="text-right">Name</Label><Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" /></div>
                    <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="email" className="text-right">Email</Label><Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="col-span-3" /></div>
                    <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="phone" className="text-right">Phone</Label><Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="col-span-3" /></div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="company" className="text-right">Company</Label>
                        <Select onValueChange={setCompany} value={company}>
                            <SelectTrigger className="col-span-3"><SelectValue placeholder="Select a company" /></SelectTrigger>
                            <SelectContent>{accounts.map(acc => <SelectItem key={acc.id} value={acc.name}>{acc.name}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="role" className="text-right">Role</Label><Input id="role" value={role} onChange={(e) => setRole(e.target.value)} className="col-span-3" /></div>
                    <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="notes" className="text-right">Notes</Label><Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} className="col-span-3" /></div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button type="submit" onClick={handleSubmit}>{isEditMode ? 'Save Changes' : 'Create Contact'}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function RelatedItemsList({ title, icon: Icon, items }: { title?: string, icon?: React.ElementType, items: (Case | Task | Meeting)[] }) {
    if (items.length === 0) {
        if (!title) return null;
        return (
            <div>
                {title && Icon && <h3 className="text-lg font-semibold flex items-center gap-2 mb-2"><Icon className="h-5 w-5 text-muted-foreground" /> {title}</h3>}
                <p className="text-sm text-muted-foreground text-center py-4 bg-muted/20 rounded-md">No {title ? title.toLowerCase() : 'items'} found.</p>
            </div>
        );
    }
    
    const TitleComponent = title && Icon ? <h3 className="text-lg font-semibold flex items-center gap-2 mb-2"><Icon className="h-5 w-5 text-muted-foreground" /> {title}</h3> : null;

    return (
        <div>
            {TitleComponent}
            <div className="space-y-2">
                {items.map(item => (
                    <div key={item.id} className="text-sm p-3 border rounded-md bg-card hover:bg-muted/50">
                        <p className="font-medium">{('subject' in item && item.subject) || ('title' in item && item.title)}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                            {'status' in item && <span>Status: <Badge variant="outline" className="text-xs">{item.status}</Badge></span>}
                             {'priority' in item && <span>Priority: {item.priority}</span>}
                             {'dueDate' in item && item.dueDate && <span>Due: {new Date(item.dueDate).toLocaleDateString()}</span>}
                             {'date' in item && <span>Date: {new Date(item.date).toLocaleDateString()}</span>}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
