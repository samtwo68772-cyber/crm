
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { useData } from '@/context/data-context';
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
import { MoreHorizontal, PlusCircle, Trash2, Edit, X, Building2, Users, Briefcase, ListTodo, Calendar, Globe, Users2, Search, Mail, Phone, ChevronDown, Link as LinkIcon } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function CustomersPage() {
    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight font-headline">Accounts</h2>
                    <p className="text-muted-foreground">Manage your accounts and contacts.</p>
                </div>
            </div>
             <Tabs defaultValue="accounts">
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
  const { accounts, setAccounts, contacts: mockContacts, cases: mockCases, tasks: mockTasks, meetings: mockMeetings } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const isAdmin = user?.role === 'admin';

  const filteredAccounts = useMemo(() => {
    return accounts.filter(account =>
      account.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      account.industry.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [accounts, searchQuery]);

  const handleAddAccount = (newAccountData: Omit<Account, 'id' | 'createdAt'>) => {
    const newAccount: Account = {
      id: `acc-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
      ...newAccountData
    };
    setAccounts([newAccount, ...accounts]);
    setIsFormOpen(false);
    toast({ title: "Account Created", description: `Account "${newAccount.name}" has been successfully created.` });
  };
  
  const handleUpdateAccount = (updatedAccount: Account) => {
    setAccounts(accounts.map(acc => acc.id === updatedAccount.id ? updatedAccount : acc));
    setEditingAccount(null);
    setIsFormOpen(false);
    setSelectedAccount(updatedAccount); // Keep sheet updated
    toast({ title: "Account Updated", description: `Account "${updatedAccount.name}" has been updated.` });
  };
  
  const handleDeleteAccount = (accountId: string) => {
    setAccounts(accounts.filter(acc => acc.id !== accountId));
    setSelectedAccount(null);
    setIsSheetOpen(false);
    toast({ title: "Account Deleted", description: `The account has been deleted.` });
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
    const relatedContacts = mockContacts.filter(c => c.accountId === accountId);
    const relatedContactIds = relatedContacts.map(c => c.id);
    const relatedCases = mockCases.filter(c => c.contactId && relatedContactIds.includes(c.contactId)).length;
    const relatedTasks = mockTasks.filter(t => t.contactId && relatedContactIds.includes(t.contactId)).length;
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
      
      {selectedAccount && (
        <AccountDetailSheet
            open={isSheetOpen}
            onOpenChange={setIsSheetOpen}
            account={selectedAccount}
            onEdit={() => openEditForm(selectedAccount)}
            onDelete={() => handleDeleteAccount(selectedAccount.id)}
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

function AccountDetailSheet({ open, onOpenChange, account, onEdit, onDelete }: { open: boolean, onOpenChange: (open: boolean) => void, account: Account, onEdit: () => void, onDelete: () => void }) {
    const { user } = useAuth();
    const { contacts: mockContacts, cases: mockCases, tasks: mockTasks, meetings: mockMeetings } = useData();
    const isAdmin = user?.role === 'admin';
    
    const relatedContacts = useMemo(() => mockContacts.filter(c => c.accountId === account.id), [account.id, mockContacts]);
    const relatedContactIds = useMemo(() => relatedContacts.map(c => c.id), [relatedContacts]);

    const relatedCases = useMemo(() => mockCases.filter(c => c.contactId && relatedContactIds.includes(c.contactId)), [relatedContactIds, mockCases]);
    const relatedTasks = useMemo(() => mockTasks.filter(t => t.contactId && relatedContactIds.includes(t.contactId)), [relatedContactIds, mockTasks]);
    const relatedMeetings = useMemo(() => mockMeetings.filter(m => m.contactId && relatedContactIds.includes(m.contactId)), [relatedContactIds, mockMeetings]);

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
                                <SheetClose asChild><Button variant="ghost" size="icon"><X className="h-4 w-4"/></Button></SheetClose>
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
  const { contacts, setContacts, accounts } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [companyFilter, setCompanyFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [isDetailSheetOpen, setDetailSheetOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  const { user } = useAuth();
  const { toast } = useToast();
  const isAdmin = user?.role === 'admin';

  const companies = useMemo(() => ['all', ...Array.from(new Set(contacts.map(c => c.company)))], [contacts]);
  const roles = useMemo(() => ['all', ...Array.from(new Set(contacts.map(c => c.role)))], [contacts]);

  const filteredContacts = useMemo(() => {
    return contacts.filter(contact =>
      (contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchQuery.toLowerCase())) &&
      (companyFilter === 'all' || contact.company === companyFilter) &&
      (roleFilter === 'all' || contact.role === roleFilter)
    );
  }, [contacts, searchQuery, companyFilter, roleFilter]);
  
  const handleAddContact = (newContactData: Omit<Contact, 'id' | 'avatar'>) => {
    const newContact: Contact = {
      id: `contact-${Date.now()}`,
      avatar: '/avatars/placeholder.png',
      ...newContactData
    };
    setContacts([newContact, ...contacts]);
    setIsFormOpen(false);
    toast({ title: "Contact Created", description: `Contact "${newContact.name}" has been successfully created.` });
  };
  
  const handleUpdateContact = (updatedContact: Contact) => {
    setContacts(contacts.map(c => c.id === updatedContact.id ? updatedContact : c));
    setEditingContact(null);
    setIsFormOpen(false);
    toast({ title: "Contact Updated", description: `Contact "${updatedContact.name}" has been updated.` });
  };
  
  const handleDeleteContact = (contactId: string) => {
    setContacts(contacts.filter(c => c.id !== contactId));
    toast({ title: "Contact Deleted", description: `Contact has been deleted.` });
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

  return (
    <div className="space-y-6 pt-2">
       <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="relative w-full md:flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search contacts..." className="pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-muted-foreground">Filter by:</span>
                 <Select value={companyFilter} onValueChange={setCompanyFilter}>
                    <SelectTrigger className="w-full md:w-[180px]"><SelectValue placeholder="Company" /></SelectTrigger>
                    <SelectContent>{companies.map(c => <SelectItem key={c} value={c}>{c === 'all' ? 'All Companies' : c}</SelectItem>)}</SelectContent>
                </Select>
                 <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-full md:w-[180px]"><SelectValue placeholder="Role" /></SelectTrigger>
                    <SelectContent>{roles.map(r => <SelectItem key={r} value={r}>{r === 'all' ? 'All Roles' : r}</SelectItem>)}</SelectContent>
                </Select>
                <Button variant="outline" onClick={clearFilters}><X className="mr-2 h-4 w-4" /> Clear</Button>
            </div>
            <Button onClick={openCreateForm}><PlusCircle className="mr-2 h-4 w-4" /> Add Contact</Button>
          </div>
        </CardContent>
       </Card>

      <div className="border rounded-lg bg-card overflow-hidden">
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead className="w-[250px]">Name</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead className="hidden md:table-cell">Email</TableHead>
                    <TableHead className="hidden lg:table-cell">Phone</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {filteredContacts.map((contact) => (
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
                        <TableCell className="hidden md:table-cell">{contact.email}</TableCell>
                        <TableCell className="hidden lg:table-cell">{contact.phone}</TableCell>
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
         {filteredContacts.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
                <p className="text-lg font-semibold">No contacts found</p>
                <p>Try adjusting your search or filters.</p>
            </div>
        )}
      </div>
      
      {selectedContact && (
        <ContactDetailSheet
            open={isDetailSheetOpen}
            onOpenChange={setDetailSheetOpen}
            contact={selectedContact}
            onEdit={() => openEditForm(selectedContact)}
            onDelete={() => handleDeleteContact(selectedContact.id)}
        />
      )}
      
      <ContactFormDialog
        key={editingContact ? editingContact.id : 'create'}
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        contact={editingContact}
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


function ContactDetailSheet({ open, onOpenChange, contact, onEdit, onDelete }: { open: boolean, onOpenChange: (open: boolean) => void, contact: Contact, onEdit: () => void, onDelete: () => void }) {
    const { user } = useAuth();
    const { cases: mockCases, tasks: mockTasks, meetings: mockMeetings } = useData();
    const isAdmin = user?.role === 'admin';
    const relatedCases = useMemo(() => mockCases.filter(c => c.contactId === contact.id), [contact.id, mockCases]);
    const relatedTasks = useMemo(() => mockTasks.filter(t => t.contactId === contact.id), [contact.id, mockTasks]);
    const relatedMeetings = useMemo(() => mockMeetings.filter(m => m.contactId === contact.id), [contact.id, mockMeetings]);

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-2xl p-0">
                 <div className="flex flex-col h-full">
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
                            <div className="flex gap-2">
                                <Button variant="outline" size="icon" onClick={onEdit}><Edit className="h-4 w-4"/></Button>
                                {isAdmin && <Button variant="destructive" size="icon" onClick={onDelete}><Trash2 className="h-4 w-4"/></Button>}
                                <SheetClose asChild><Button variant="ghost" size="icon"><X className="h-4 w-4"/></Button></SheetClose>
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
                                <RelatedItemsList title="Cases" icon={Briefcase} items={relatedCases} />
                                <RelatedItemsList title="Tasks" icon={ListTodo} items={relatedTasks} />
                                <RelatedItemsList title="Meetings" icon={Calendar} items={relatedMeetings} />
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    )
}

function ContactFormDialog({ open, onOpenChange, contact, onSave }: { open: boolean, onOpenChange: (open: boolean) => void, contact: Contact | null, onSave: (data: any, isEdit: boolean) => void }) {
    const { accounts: mockAccounts } = useData();
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
        const selectedAccount = mockAccounts.find(acc => acc.name === company);
        onSave({ name, email, phone, company, accountId: selectedAccount?.id || '', role, notes }, isEditMode);
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
                            <SelectContent>{mockAccounts.map(acc => <SelectItem key={acc.id} value={acc.name}>{acc.name}</SelectItem>)}</SelectContent>
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
                             {'dueDate' in item && <span>Due: {item.dueDate}</span>}
                             {'date' in item && <span>Date: {new Date(item.date).toLocaleDateString()}</span>}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
