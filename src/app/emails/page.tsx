
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { emails as mockEmails, contacts as mockContacts, cases as mockCases, accounts as mockAccounts } from '@/lib/data.tsx';
import type { Email, Contact, Case, Account } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from "@/hooks/use-toast";
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import {
  Search,
  Inbox,
  Send,
  FileText,
  Archive,
  Trash2,
  Edit,
  Reply,
  ReplyAll,
  Forward,
  Paperclip,
  Link as LinkIcon,
  PlusCircle,
  AlertCircle
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';


export default function EmailsPage() {
    const { user } = useAuth();
    const [emails, setEmails] = useState<Email[]>(mockEmails);
    const [allCases, setAllCases] = useState<Case[]>(mockCases);
    const [allContacts, setAllContacts] = useState<Contact[]>(mockContacts);
    const [selectedEmail, setSelectedEmail] = useState<Email | null>(emails.find(e => e.type === 'inbox') || null);
    const [mailbox, setMailbox] = useState<'inbox' | 'sent'>('inbox');
    const [searchQuery, setSearchQuery] = useState('');
    const { toast } = useToast();
    const [isContactCreateOpen, setContactCreateOpen] = useState(false);
    const [isConfirmCreateContactOpen, setConfirmCreateContactOpen] = useState(false);
    const [emailForNewContact, setEmailForNewContact] = useState<Email | null>(null);

    const filteredEmails = useMemo(() => {
        return emails.filter(email => 
            email.type === mailbox &&
            (email.subject.toLowerCase().includes(searchQuery.toLowerCase()) || 
             email.from.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
             email.to.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
             email.body.toLowerCase().includes(searchQuery.toLowerCase()))
        ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [emails, mailbox, searchQuery]);

    const handleSelectEmail = (email: Email) => {
        setSelectedEmail(email);
        if (!email.read) {
            setEmails(emails.map(e => e.id === email.id ? { ...e, read: true } : e));
        }
    };
    
    const createCaseForContact = (contact: Contact, email: Email) => {
         const newCase: Case = {
            id: `case-${Date.now()}`,
            subject: email.subject,
            customer: contact.name,
            email: contact.email,
            priority: 'Medium',
            type: 'General Question',
            status: 'New',
            assignedTo: 'Unassigned',
            createdAt: new Date().toISOString().split('T')[0],
            description: email.body,
            communications: [{
                id: `comm-${Date.now()}`,
                type: 'Email',
                content: `Original email received from ${email.from.name}:\n\n${email.body}`,
                author: email.from.name,
                authorRole: 'staff',
                timestamp: new Date(email.date).toLocaleString(),
            }],
            contactId: contact.id
        };
        
        setAllCases(prev => [newCase, ...prev]);
        setEmails(prev => prev.map(e => e.id === email.id ? {...e, linkedCaseId: newCase.id} : e));
        setSelectedEmail(prev => prev ? {...prev, linkedCaseId: newCase.id} : null);

        toast({
            title: "Case Created",
            description: `New case "${newCase.subject}" has been created and linked to this email.`,
        });
    }
    
    const handleCreateCaseFromEmail = (email: Email) => {
        const relatedContact = allContacts.find(c => c.email === email.from.email);
        
        if (relatedContact) {
            createCaseForContact(relatedContact, email);
        } else {
            setEmailForNewContact(email);
            setConfirmCreateContactOpen(true);
        }
    };
    
    const handleAddContactAndCreateCase = (newContactData: Omit<Contact, 'id' | 'avatar'>) => {
        const newContact: Contact = {
          id: `contact-${Date.now()}`,
          avatar: '/avatars/placeholder.png',
          ...newContactData
        };
        setAllContacts([newContact, ...allContacts]);
        setContactCreateOpen(false);
        
        toast({ title: "Contact Created", description: `Contact "${newContact.name}" has been successfully created. Now creating case.` });

        if(emailForNewContact) {
            createCaseForContact(newContact, emailForNewContact);
        }
        setEmailForNewContact(null);
    };

    return (
        <div className="flex-1 p-0 flex flex-col h-[calc(100vh_-_5rem)]">
             <header className="flex items-center justify-between p-4 border-b">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight font-headline">Email</h1>
                    <p className="text-muted-foreground">Manage your communications and cases.</p>
                </div>
                <Button><Edit className="mr-2 h-4 w-4" /> Compose</Button>
            </header>
            <div className="grid grid-cols-1 md:grid-cols-4 flex-1 overflow-hidden">
                <aside className="col-span-1 border-r flex flex-col">
                    <div className="p-4 space-y-4">
                         <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Search emails..." className="pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                        </div>
                        <div className="space-y-1">
                            <Button variant={mailbox === 'inbox' ? 'secondary' : 'ghost'} className="w-full justify-start gap-2" onClick={() => setMailbox('inbox')}>
                                <Inbox className="h-4 w-4" /> Inbox
                                <Badge variant="default" className="ml-auto">{emails.filter(e => e.type === 'inbox' && !e.read).length}</Badge>
                            </Button>
                            <Button variant={mailbox === 'sent' ? 'secondary' : 'ghost'} className="w-full justify-start gap-2" onClick={() => setMailbox('sent')}>
                                <Send className="h-4 w-4" /> Sent
                            </Button>
                        </div>
                    </div>
                    <Separator />
                    <div className="flex-1 overflow-y-auto">
                        {filteredEmails.length > 0 ? (
                            filteredEmails.map(email => (
                                <div 
                                    key={email.id} 
                                    className={cn(
                                        "p-4 border-b cursor-pointer hover:bg-muted/50",
                                        selectedEmail?.id === email.id && "bg-muted",
                                        !email.read && "font-bold"
                                    )}
                                    onClick={() => handleSelectEmail(email)}
                                >
                                    <div className="flex justify-between items-start">
                                        <p className="truncate text-sm">{mailbox === 'inbox' ? email.from.name : `To: ${email.to.name}`}</p>
                                        <p className={cn("text-xs text-muted-foreground", !email.read && "text-primary")}>{format(parseISO(email.date), 'MMM d')}</p>
                                    </div>
                                    <p className={cn("text-sm truncate", !email.read && "text-foreground")}>{email.subject}</p>
                                    <p className={cn("text-xs text-muted-foreground truncate", !email.read && "font-normal")}>{email.body}</p>
                                    {email.linkedCaseId && <Badge variant="secondary" className="mt-2 text-xs">Linked</Badge>}
                                </div>
                            ))
                        ) : (
                            <p className="p-4 text-center text-muted-foreground">No emails in {mailbox}.</p>
                        )}
                    </div>
                </aside>
                <main className="col-span-3 flex flex-col overflow-y-auto">
                    {selectedEmail ? (
                        <div className="flex flex-col h-full">
                            <div className="p-4 border-b">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-xl font-semibold">{selectedEmail.subject}</h2>
                                     <div className="flex items-center gap-2">
                                        <TooltipProvider>
                                            <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon"><Reply className="h-4 w-4"/></Button></TooltipTrigger><TooltipContent><p>Reply</p></TooltipContent></Tooltip>
                                            <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon"><Forward className="h-4 w-4"/></Button></TooltipTrigger><TooltipContent><p>Forward</p></TooltipContent></Tooltip>
                                            <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon"><Trash2 className="h-4 w-4"/></Button></TooltipTrigger><TooltipContent><p>Delete</p></TooltipContent></Tooltip>
                                        </TooltipProvider>
                                        <Separator orientation="vertical" className="h-6" />
                                        {selectedEmail.linkedCaseId ? (
                                            <Button variant="secondary" size="sm" className="gap-2"><LinkIcon className="h-4 w-4"/>Linked to Case #{selectedEmail.linkedCaseId.split('-')[1]}</Button>
                                        ) : (
                                            <Button variant="outline" size="sm" className="gap-2" onClick={() => handleCreateCaseFromEmail(selectedEmail)}><PlusCircle className="h-4 w-4" /> Create Case</Button>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 mt-4">
                                     <Avatar>
                                        <AvatarFallback>{selectedEmail.from.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-semibold">{selectedEmail.from.name} <span className="text-muted-foreground font-normal text-sm">&lt;{selectedEmail.from.email}&gt;</span></p>
                                        <p className="text-sm text-muted-foreground">To: {selectedEmail.to.name}</p>
                                    </div>
                                    <p className="text-sm text-muted-foreground ml-auto">{format(parseISO(selectedEmail.date), 'PPpp')}</p>
                                </div>
                            </div>
                            <div className="flex-1 p-6 overflow-y-auto whitespace-pre-wrap font-serif text-base/relaxed">
                                {selectedEmail.body}
                            </div>
                            {selectedEmail.attachments && selectedEmail.attachments.length > 0 && (
                                <div className="p-4 border-t">
                                    <h4 className="font-semibold mb-2">Attachments ({selectedEmail.attachments.length})</h4>
                                    <div className="flex gap-4">
                                        {selectedEmail.attachments.map(att => (
                                            <div key={att.name} className="p-2 border rounded-md flex items-center gap-2 text-sm">
                                                <Paperclip className="h-4 w-4 text-muted-foreground" />
                                                <span>{att.name} ({att.size})</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <div className="p-4 border-t bg-muted/50">
                                <Textarea placeholder={`Reply to ${selectedEmail.from.name}...`} />
                                <div className="flex justify-end mt-2">
                                     <Button><Send className="mr-2 h-4 w-4"/>Send Reply</Button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                            <p>Select an email to read</p>
                        </div>
                    )}
                </main>
            </div>
            
            <AlertDialog open={isConfirmCreateContactOpen} onOpenChange={setConfirmCreateContactOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Contact Not Found</AlertDialogTitle>
                        <AlertDialogDescription>
                           The sender <span className="font-medium">{emailForNewContact?.from.email}</span> was not found in your contacts. Would you like to create a new contact record for them?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setEmailForNewContact(null)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => { setConfirmCreateContactOpen(false); setContactCreateOpen(true); }}>Create Contact</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            
             <ContactFormDialog
                key={emailForNewContact?.id}
                open={isContactCreateOpen}
                onOpenChange={setContactCreateOpen}
                initialEmail={emailForNewContact?.from.email}
                initialName={emailForNewContact?.from.name}
                onSave={handleAddContactAndCreateCase}
                onCancel={() => setEmailForNewContact(null)}
              />
        </div>
    );
}

function ContactFormDialog({ open, onOpenChange, initialEmail, initialName, onSave, onCancel }: { open: boolean, onOpenChange: (open: boolean) => void, initialEmail?: string, initialName?: string, onSave: (data: any) => void, onCancel: () => void }) {
    const [name, setName] = useState(initialName || '');
    const [email, setEmail] = useState(initialEmail || '');
    const [phone, setPhone] = useState('');
    const [company, setCompany] = useState('');
    const [role, setRole] = useState('');
    const [notes, setNotes] = useState('');
    
    useEffect(() => {
        if(open) {
            setName(initialName || '');
            setEmail(initialEmail || '');
            setPhone(''); setCompany(''); setRole(''); setNotes('');
        }
    }, [initialEmail, initialName, open]);

    const handleSubmit = () => {
        const selectedAccount = mockAccounts.find(acc => acc.name === company);
        onSave({ name, email, phone, company, accountId: selectedAccount?.id || '', role, notes });
    };
    
    const handleOpenChange = (isOpen: boolean) => {
        if (!isOpen) {
            onCancel();
        }
        onOpenChange(isOpen);
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create New Contact</DialogTitle>
                    <DialogDescription>This contact was not found. Please fill in their details to create a new contact record.</DialogDescription>
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
                    <Button type="submit" onClick={handleSubmit}>Create Contact</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
