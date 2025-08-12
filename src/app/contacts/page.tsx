
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { contacts as mockContacts, cases as mockCases, tasks as mockTasks, meetings as mockMeetings, accounts as mockAccounts } from '@/lib/data.tsx';
import type { Contact, Case, Task, Meeting, Account } from '@/lib/types';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, PlusCircle, Briefcase, ListTodo, Calendar, Trash2, Edit, X, User as UserIcon, Building, Phone, Mail } from 'lucide-react';
import { useToast } from "@/hooks/use-toast"
import { Separator } from '@/components/ui/separator';

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>(mockContacts);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const isAdmin = user?.role === 'admin';

  const filteredContacts = useMemo(() => {
    return contacts.filter(contact =>
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.company.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [contacts, searchQuery]);
  
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
    setSelectedContact(updatedContact); // Keep sheet updated
    toast({ title: "Contact Updated", description: `Contact "${updatedContact.name}" has been updated.` });
  };
  
  const handleDeleteContact = (contactId: string) => {
    setContacts(contacts.filter(c => c.id !== contactId));
    setSelectedContact(null);
    setIsSheetOpen(false);
    toast({ title: "Contact Deleted", description: `Contact has been deleted.` });
  };
  
  const openCreateForm = () => {
    setEditingContact(null);
    setIsFormOpen(true);
  }

  const openEditForm = (contact: Contact) => {
    setEditingContact(contact);
    setIsSheetOpen(false); // Close sheet to open dialog
    setTimeout(() => setIsFormOpen(true), 150); // Delay to allow sheet to close
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight font-headline">Contacts</h2>
        <Button onClick={openCreateForm}><PlusCircle className="mr-2 h-4 w-4" /> Add Contact</Button>
      </div>
      <div className="flex items-center justify-between">
        <Input placeholder="Filter contacts..." className="max-w-sm" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
      </div>
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredContacts.map((contact) => (
              <TableRow key={contact.id} onClick={() => { setSelectedContact(contact); setIsSheetOpen(true);}} className="cursor-pointer">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                       <AvatarImage src={`https://placehold.co/40x40.png`} data-ai-hint="person avatar" alt={contact.name} />
                       <AvatarFallback>{contact.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{contact.name}</span>
                  </div>
                </TableCell>
                <TableCell>{contact.company}</TableCell>
                <TableCell>{contact.email}</TableCell>
                <TableCell>{contact.phone}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0" onClick={(e) => e.stopPropagation()}><MoreHorizontal className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => { setSelectedContact(contact); setIsSheetOpen(true); }}>View Details</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openEditForm(contact)}>Edit</DropdownMenuItem>
                      {isAdmin && <DropdownMenuSeparator />}
                      {isAdmin && <DropdownMenuItem onClick={() => handleDeleteContact(contact.id)} className="text-destructive focus:text-destructive">Delete</DropdownMenuItem>}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      {selectedContact && (
        <ContactDetailSheet
            open={isSheetOpen}
            onOpenChange={setIsSheetOpen}
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
                handleAddContact(data);
            }
        }}
      />
    </div>
  );
}


function ContactDetailSheet({ open, onOpenChange, contact, onEdit, onDelete }: { open: boolean, onOpenChange: (open: boolean) => void, contact: Contact, onEdit: () => void, onDelete: () => void }) {
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';
    const relatedCases = useMemo(() => mockCases.filter(c => c.contactId === contact.id), [contact.id]);
    const relatedTasks = useMemo(() => mockTasks.filter(t => t.contactId === contact.id), [contact.id]);
    const relatedMeetings = useMemo(() => mockMeetings.filter(m => m.contactId === contact.id), [contact.id]);

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-2xl p-0">
                <div className="flex flex-col h-full">
                    <SheetHeader className="p-6 border-b">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <Avatar className="h-16 w-16">
                                    <AvatarImage src={`https://placehold.co/40x40.png`} data-ai-hint="person avatar" alt={contact.name} />
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
                        <div className="flex items-center gap-6 text-sm text-muted-foreground pt-4">
                            <div className="flex items-center gap-2"><Mail className="h-4 w-4" /> {contact.email}</div>
                            <div className="flex items-center gap-2"><Phone className="h-4 w-4" /> {contact.phone}</div>
                            <div className="flex items-center gap-2"><Building className="h-4 w-4" /> {contact.company}</div>
                        </div>
                    </SheetHeader>
                    <div className="flex-1 overflow-y-auto">
                        <Tabs defaultValue="related" className="p-6">
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
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    )
}

function RelatedItemsList({ title, icon: Icon, items }: { title: string, icon: React.ElementType, items: (Case | Task | Meeting)[] }) {
    if (items.length === 0) return null;

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
        onSave({ name, email, phone, company, accountId, role, notes }, isEditMode);
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
