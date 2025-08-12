
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { contacts as mockContacts, cases as mockCases, tasks as mockTasks, meetings as mockMeetings, accounts as mockAccounts } from '@/lib/data.tsx';
import type { Contact, Case, Task, Meeting, Account } from '@/lib/types';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetClose } from '@/components/ui/sheet';
import { MoreHorizontal, PlusCircle, Briefcase, ListTodo, Calendar, Trash2, Edit, X, User as UserIcon, Building, Phone, Mail, Search, ChevronDown } from 'lucide-react';
import { useToast } from "@/hooks/use-toast"
import { Separator } from '@/components/ui/separator';

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>(mockContacts);
  const [searchQuery, setSearchQuery] = useState('');
  const [companyFilter, setCompanyFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [openContactId, setOpenContactId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const isAdmin = user?.role === 'admin';

  const companies = useMemo(() => ['all', ...Array.from(new Set(mockContacts.map(c => c.company)))], [mockContacts]);
  const roles = useMemo(() => ['all', ...Array.from(new Set(mockContacts.map(c => c.role)))], [mockContacts]);

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
    setOpenContactId(null);
    toast({ title: "Contact Deleted", description: `Contact has been deleted.` });
  };
  
  const openCreateForm = () => {
    setEditingContact(null);
    setIsFormOpen(true);
  }

  const openEditForm = (contact: Contact) => {
    setEditingContact(contact);
    setIsFormOpen(true);
  }
  
  const clearFilters = () => {
      setSearchQuery('');
      setCompanyFilter('all');
      setRoleFilter('all');
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
            <h2 className="text-3xl font-bold tracking-tight font-headline">Contacts</h2>
            <p className="text-muted-foreground">Manage your customer and lead contacts.</p>
        </div>
        <Button onClick={openCreateForm}><PlusCircle className="mr-2 h-4 w-4" /> Add Contact</Button>
      </div>

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
          </div>
        </CardContent>
       </Card>

      <div className="bg-card border rounded-lg">
        {filteredContacts.map((contact, index) => (
          <Collapsible key={contact.id} open={openContactId === contact.id} onOpenChange={() => setOpenContactId(prevId => prevId === contact.id ? null : contact.id)}>
              <div className={`flex flex-col md:flex-row items-start md:items-center p-4 gap-4 ${index > 0 ? 'border-t' : ''} ${openContactId === contact.id ? 'bg-muted/50' : 'hover:bg-muted/50'}`}>
                <CollapsibleTrigger asChild>
                   <div className="flex-1 grid items-center grid-cols-1 md:grid-cols-[auto_1fr_1fr_1fr_1fr_auto] gap-x-4 gap-y-1 w-full cursor-pointer">
                     <Avatar className="h-10 w-10 row-span-2 md:row-span-1">
                       <AvatarImage src={`https://placehold.co/40x40.png`} data-ai-hint="person avatar" alt={contact.name} />
                       <AvatarFallback>{contact.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="font-semibold col-span-1">{contact.name}</div>
                    <div className="text-muted-foreground text-sm col-span-1">{contact.role}, {contact.company}</div>
                    <div className="text-muted-foreground text-sm col-span-1">{contact.email}</div>
                    <div className="text-muted-foreground text-sm col-span-1">{contact.phone}</div>
                    <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform duration-200 justify-self-end ${openContactId === contact.id ? 'rotate-180' : ''}`} />
                   </div>
                </CollapsibleTrigger>
                 <div className="flex gap-2 self-start md:self-center shrink-0 ml-auto md:ml-0">
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); alert(`Emailing ${contact.name}`); }}>
                        <Mail className="h-4 w-4" />
                        <span className="sr-only">Email</span>
                    </Button>
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); alert(`Calling ${contact.name}`); }}>
                        <Phone className="h-4 w-4" />
                        <span className="sr-only">Call</span>
                    </Button>
                     <Button variant="outline" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); openEditForm(contact); }}>
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit Contact</span>
                    </Button>
                </div>
            </div>
            <CollapsibleContent>
                <div className="p-6 bg-background border-t">
                     <ContactDetails contact={contact} />
                </div>
            </CollapsibleContent>
          </Collapsible>
        ))}
         {filteredContacts.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
                <p className="text-lg font-semibold">No contacts found</p>
                <p>Try adjusting your search or filters.</p>
            </div>
        )}
      </div>
      
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


function ContactDetails({ contact }: { contact: Contact }) {
    const relatedCases = useMemo(() => mockCases.filter(c => c.contactId === contact.id), [contact.id]);
    const relatedTasks = useMemo(() => mockTasks.filter(t => t.contactId === contact.id), [contact.id]);
    const relatedMeetings = useMemo(() => mockMeetings.filter(m => m.contactId === contact.id), [contact.id]);

    return (
        <Tabs defaultValue="related" className="w-full">
            <TabsList>
                <TabsTrigger value="related">Related Items</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
            </TabsList>
            <TabsContent value="related" className="mt-4 space-y-6">
                <RelatedItemsList title="Cases" icon={Briefcase} items={relatedCases} />
                <RelatedItemsList title="Tasks" icon={ListTodo} items={relatedTasks} />
                <RelatedItemsList title="Meetings" icon={Calendar} items={relatedMeetings} />
            </TabsContent>
            <TabsContent value="notes" className="mt-4">
                <p className="text-sm text-muted-foreground bg-muted/50 p-4 rounded-md whitespace-pre-wrap">{contact.notes || "No notes for this contact."}</p>
            </TabsContent>
        </Tabs>
    )
}

function RelatedItemsList({ title, icon: Icon, items }: { title: string, icon: React.ElementType, items: (Case | Task | Meeting)[] }) {
    if (items.length === 0) return (
        <div>
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-2"><Icon className="h-5 w-5 text-muted-foreground" /> {title}</h3>
            <p className="text-sm text-muted-foreground text-center py-4 bg-muted/20 rounded-md">No {title.toLowerCase()} found.</p>
        </div>
    );

    return (
        <div>
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-2"><Icon className="h-5 w-5 text-muted-foreground" /> {title}</h3>
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

function ContactFormDialog({ open, onOpenChange, contact, onSave }: { open: boolean, onOpenChange: (open: boolean) => void, contact: Contact | null, onSave: (data: any, isEdit: boolean) => void }) {
    const isEditMode = !!contact;
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [company, setCompany] = useState('');
    const [role, setRole] = useState('');
    const [notes, setNotes] = useState('');
    const [accountId, setAccountId] = useState('');
    
    useEffect(() => {
        if(contact) {
            setName(contact.name);
            setEmail(contact.email);
            setPhone(contact.phone);
            setCompany(contact.company);
            setAccountId(contact.accountId);
            setRole(contact.role);
            setNotes(contact.notes || '');
        } else {
            setName(''); setEmail(''); setPhone(''); setCompany(''); setAccountId(''); setRole(''); setNotes('');
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

