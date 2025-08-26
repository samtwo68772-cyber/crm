
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { getEmails, processIncomingEmails, markEmailAsRead, createCaseFromEmail, sendEmail, syncSentEmails } from './actions';
import { getContacts, createContact } from '../accounts/actions';
import { getAccounts } from '../accounts/actions';
import { getCases, createCase } from '../cases/actions';
import { getEmailSettings } from '../settings/actions';
import type { Email, Contact, Case, Account, EmailSettingsType } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetClose } from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from "@/hooks/use-toast";
import { cn } from '@/lib/utils';
import { format, isValid } from 'date-fns';
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
  AlertCircle,
  Mail,
  Settings,
  RefreshCw,
  ArrowLeft,
  X,
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Link from 'next/link';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { useSearchParams } from 'next/navigation';
import { useIsMobile } from '@/hooks/use-mobile';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';

function EmailClientView() {
    const queryClient = useQueryClient();
    const { data: emails, isLoading: emailsLoading } = useQuery<Email[]>({ queryKey: ['emails'], queryFn: getEmails });
    const { data: contacts, isLoading: contactsLoading } = useQuery<Contact[]>({ queryKey: ['contacts'], queryFn: getContacts });
    const { data: accounts, isLoading: accountsLoading } = useQuery<Account[]>({ queryKey: ['accounts'], queryFn: getAccounts });
    const isLoading = emailsLoading || contactsLoading || accountsLoading;

    const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [mailbox, setMailbox] = useState<'inbox' | 'sent'>('inbox');
    const [searchQuery, setSearchQuery] = useState('');
    const { toast } = useToast();
    const [isContactCreateOpen, setContactCreateOpen] = useState(false);
    const [isConfirmCreateContactOpen, setConfirmCreateContactOpen] = useState(false);
    const [emailForNewContact, setEmailForNewContact] = useState<Email | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSyncingSent, setIsSyncingSent] = useState(false);
    const searchParams = useSearchParams();
    const [showUnread, setShowUnread] = useState(false);
    const isMobile = useIsMobile();

    const safeParseDate = (dateString: string | Date) => {
        const date = (dateString instanceof Date) ? dateString : new Date(dateString);
        return isValid(date) ? date : new Date(0);
    }
    
    useEffect(() => {
        if (searchParams.get('filter') === 'unread') {
            setShowUnread(true);
            setMailbox('inbox');
        }
    }, [searchParams]);

    const processEmailsMutation = useMutation({
        mutationFn: processIncomingEmails,
        onMutate: () => setIsProcessing(true),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['emails'] });
            queryClient.invalidateQueries({ queryKey: ['cases'] });
            queryClient.invalidateQueries({ queryKey: ['contacts'] });
            toast({
                title: "Email Processing Complete",
                description: `Fetched ${data.count} new email(s). New cases may have been created.`,
            });
        },
        onError: (error: Error) => {
            toast({ variant: 'destructive', title: 'Error Processing Emails', description: error.message || 'An unknown error occurred.' })
        },
        onSettled: () => {
            setIsProcessing(false);
        }
    })

    const syncSentEmailsMutation = useMutation({
        mutationFn: syncSentEmails,
        onMutate: () => setIsSyncingSent(true),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['emails'] });
            toast({
                title: "Sent Mail Synced",
                description: `Synced ${data.count} new sent email(s).`,
            });
        },
        onError: (error: Error) => {
            toast({ variant: 'destructive', title: 'Error Syncing Sent Mail', description: error.message || 'An unknown error occurred.' })
        },
        onSettled: () => {
            setIsSyncingSent(false);
        }
    });

    const handleProcessEmails = async () => {
        processEmailsMutation.mutate();
    };
    
    const handleSyncSentEmails = async () => {
        syncSentEmailsMutation.mutate();
    }

    const filteredEmails = useMemo(() => {
        if (!emails) return [];
        let sortedEmails = emails
            .filter(email => email.type === mailbox)
            .sort((a, b) => safeParseDate(b.date).getTime() - safeParseDate(a.date).getTime());
            
        if (showUnread) {
            sortedEmails = sortedEmails.filter(e => !e.read && e.type === 'inbox');
        }

        if (!searchQuery) {
            return sortedEmails;
        }

        return sortedEmails.filter(email => 
            email.subject.toLowerCase().includes(searchQuery.toLowerCase()) || 
            email.from.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
            (email.to && email.to.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
            email.body.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [emails, mailbox, searchQuery, showUnread]);
    
    const markAsReadMutation = useMutation({
        mutationFn: markEmailAsRead,
        onSuccess: () => {
             queryClient.invalidateQueries({ queryKey: ['emails'] });
        }
    });
    
    const handleSelectEmail = async (email: Email) => {
        setSelectedEmail(email);
        setIsSheetOpen(true);
        if (!email.read) {
            markAsReadMutation.mutate(email.id);
        }
    };

    const createCaseFromEmailMutation = useMutation({
        mutationFn: createCaseFromEmail,
        onSuccess: (newCase) => {
            queryClient.invalidateQueries({ queryKey: ['emails'] });
            queryClient.invalidateQueries({ queryKey: ['cases'] });
            setSelectedEmail(prev => prev ? {...prev, linkedCaseId: newCase.id} : null);
            toast({
                title: "Case Created",
                description: `New case "${newCase.subject}" has been created and linked to this email.`,
            });
        },
        onError: (error) => {
            if (error instanceof Error && error.message.includes('Contact not found')) {
                 setEmailForNewContact(selectedEmail);
                 setConfirmCreateContactOpen(true);
            } else {
                toast({ variant: 'destructive', title: 'Error', description: 'Failed to create case from email.'})
            }
        }
    });
    
    const handleCreateCaseFromEmail = async (email: Email) => {
        createCaseFromEmailMutation.mutate(email.id);
    };
    
    const createContactMutation = useMutation({
        mutationFn: createContact,
        onSuccess: () => {
             queryClient.invalidateQueries({ queryKey: ['contacts'] });
        }
    })

    const handleAddContactAndCreateCase = async (newContactData: Omit<Contact, 'id' | 'avatar'>) => {
        try {
            await createContactMutation.mutateAsync(newContactData);
            setContactCreateOpen(false);
            
            toast({ title: "Contact Created", description: `Contact "${newContactData.name}" has been successfully created. Now creating case.` });

            if(emailForNewContact) {
                handleCreateCaseFromEmail(emailForNewContact);
            }
            setEmailForNewContact(null);
        } catch (e) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to create contact.'})
        }
    };

    if (isLoading) return (
         <div className="flex flex-col h-full">
            <div className="p-4 space-y-4 border-b">
                 <Skeleton className="h-10 w-full" />
                 <div className="flex gap-2">
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-10 w-24" />
                 </div>
            </div>
            <div className="p-4 space-y-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
            </div>
         </div>
    );

    const DesktopView = () => (
        <div className="flex-1 overflow-y-auto">
            {filteredEmails.length > 0 ? (
                filteredEmails.map(email => (
                    <div 
                        key={email.id} 
                        className={cn(
                            "p-4 border-b cursor-pointer transition-colors hover:bg-muted/50",
                            !email.read && "bg-primary/5 hover:bg-primary/10"
                        )}
                        onClick={() => handleSelectEmail(email)}
                    >
                        <div className="flex justify-between items-start">
                            <p className={cn("truncate text-sm font-medium", !email.read && "text-primary")}>{mailbox === 'inbox' ? email.from.name : `To: ${email.to.name}`}</p>
                            <p className={cn("text-xs text-muted-foreground shrink-0 pl-2", !email.read && "text-primary")}>{format(safeParseDate(email.date), 'MMM d')}</p>
                        </div>
                        <p className={cn("text-sm truncate font-semibold", !email.read && "text-foreground")}>{email.subject}</p>
                        <p className="text-xs text-muted-foreground truncate">{email.body}</p>
                        {email.linkedCaseId && <Badge variant="secondary" className="mt-2 text-xs">Linked</Badge>}
                    </div>
                ))
            ) : (
                <p className="p-8 text-center text-muted-foreground">No emails in {mailbox}.</p>
            )}
        </div>
    );

    const MobileView = () => (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {filteredEmails.length > 0 ? (
                filteredEmails.map(email => (
                    <Card 
                        key={email.id} 
                        className={cn(
                            "cursor-pointer transition-shadow hover:shadow-md",
                            !email.read && "border-primary/50 bg-primary/5"
                        )}
                        onClick={() => handleSelectEmail(email)}
                    >
                        <CardContent className="p-4">
                            <div className="flex justify-between items-start">
                                <p className={cn("truncate text-sm font-semibold", !email.read && "text-primary")}>{mailbox === 'inbox' ? email.from.name : `To: ${email.to.name}`}</p>
                                <p className={cn("text-xs text-muted-foreground shrink-0 pl-2", !email.read && "text-primary")}>{format(safeParseDate(email.date), 'MMM d')}</p>
                            </div>
                            <p className={cn("text-sm font-medium truncate", !email.read && "text-foreground")}>{email.subject}</p>
                            <div className="flex justify-between items-center mt-2">
                                <p className="text-xs text-muted-foreground truncate flex-1 pr-2">{email.body}</p>
                                {email.linkedCaseId && <Badge variant="secondary" className="text-xs shrink-0">Linked</Badge>}
                            </div>
                        </CardContent>
                    </Card>
                ))
            ) : (
                 <p className="p-8 text-center text-muted-foreground">No emails in {mailbox}.</p>
            )}
        </div>
    );
    
    return (
        <div className="flex flex-col h-full">
            <div className="p-4 space-y-4 border-b">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search emails..." className="pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                </div>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Button variant={mailbox === 'inbox' && !showUnread ? 'secondary' : 'ghost'} className="justify-start gap-2" onClick={() => { setMailbox('inbox'); setShowUnread(false); }}>
                            <Inbox className="h-4 w-4" /> Inbox
                        </Button>
                         <Button variant={showUnread ? 'secondary' : 'ghost'} className="justify-start gap-2" onClick={() => { setMailbox('inbox'); setShowUnread(true); }}>
                             <Mail className="h-4 w-4" /> Unread
                            <Badge variant="default" className="ml-auto">{emails?.filter(e => e.type === 'inbox' && !e.read).length}</Badge>
                        </Button>
                        <Button variant={mailbox === 'sent' ? 'secondary' : 'ghost'} className="justify-start gap-2" onClick={() => { setMailbox('sent'); setShowUnread(false);}}>
                            <Send className="h-4 w-4" /> Sent
                        </Button>
                    </div>
                     <div className="flex items-center gap-2">
                        <Button 
                            onClick={handleProcessEmails} 
                            disabled={isProcessing || isSyncingSent}
                            variant="outline"
                            size="sm"
                        >
                            <RefreshCw className={cn("mr-2 h-4 w-4", isProcessing && "animate-spin")} />
                            {isProcessing ? 'Processing...' : 'Process Inbox'}
                        </Button>
                        <Button 
                            onClick={handleSyncSentEmails} 
                            disabled={isSyncingSent || isProcessing}
                            variant="outline"
                            size="sm"
                        >
                            <RefreshCw className={cn("mr-2 h-4 w-4", isSyncingSent && "animate-spin")} />
                            {isSyncingSent ? 'Syncing...' : 'Sync Sent'}
                        </Button>
                    </div>
                </div>
            </div>

            {isMobile ? <MobileView /> : <DesktopView />}
             
            {selectedEmail && (
                <EmailDetailSheet
                    open={isSheetOpen}
                    onOpenChange={setIsSheetOpen}
                    email={selectedEmail}
                    onCreateCase={handleCreateCaseFromEmail}
                />
            )}
            
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
                accounts={accounts || []}
            />
        </div>
    );
}

function EmailDetailSheet({ open, onOpenChange, email, onCreateCase }: { open: boolean, onOpenChange: (open: boolean) => void, email: Email, onCreateCase: (email: Email) => void }) {
    
    const safeParseDate = (dateString: string | Date) => {
        const date = (dateString instanceof Date) ? dateString : new Date(dateString);
        return isValid(date) ? date : new Date(0);
    }
    
    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-[45%] p-0 flex flex-col">
                <SheetHeader className="p-4 border-b sticky top-0 bg-background/95 backdrop-blur-sm z-10">
                    <VisuallyHidden>
                        <SheetTitle>Email Details</SheetTitle>
                        <SheetDescription>View the details of the selected email.</SheetDescription>
                    </VisuallyHidden>
                    <div className="flex items-center justify-between">
                         <div className="flex items-center gap-2 min-w-0">
                            <h2 className="text-lg font-semibold truncate shrink">{email.subject}</h2>
                        </div>
                        <div className="flex items-center gap-1 md:gap-2 shrink-0">
                            <TooltipProvider>
                                <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon"><Reply className="h-4 w-4"/></Button></TooltipTrigger><TooltipContent><p>Reply</p></TooltipContent></Tooltip>
                                <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon"><Forward className="h-4 w-4"/></Button></TooltipTrigger><TooltipContent><p>Forward</p></TooltipContent></Tooltip>
                                <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon"><Trash2 className="h-4 w-4"/></Button></TooltipTrigger><TooltipContent><p>Delete</p></TooltipContent></Tooltip>
                            </TooltipProvider>
                            <Separator orientation="vertical" className="h-6 mx-1" />
                            {email.linkedCaseId ? (
                                <Button variant="secondary" size="sm" asChild>
                                    <Link href={`/cases?id=${email.linkedCaseId}`}>
                                        <LinkIcon className="h-4 w-4 mr-2"/>Linked
                                    </Link>
                                </Button>
                            ) : (
                                <Button variant="outline" size="sm" className="gap-2" onClick={() => onCreateCase(email)}><PlusCircle className="h-4 w-4" /> Create Case</Button>
                            )}
                            <SheetClose asChild>
                                <Button variant="ghost" size="icon"><X className="h-4 w-4"/></Button>
                            </SheetClose>
                        </div>
                    </div>
                </SheetHeader>
                 <div className="flex-1 overflow-y-auto">
                    <div className="p-4 border-b">
                        <div className="flex items-center gap-4">
                             <Avatar>
                                <AvatarFallback>{email.from.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <p className="font-semibold">{email.from.name} <span className="text-muted-foreground font-normal text-sm">&lt;{email.from.email}&gt;</span></p>
                                <p className="text-sm text-muted-foreground">To: {email.to.name}</p>
                            </div>
                            <p className="text-sm text-muted-foreground ml-auto shrink-0">{format(safeParseDate(email.date), 'PPpp')}</p>
                        </div>
                    </div>
                    <div className="p-6 whitespace-pre-wrap font-serif text-base/relaxed" dangerouslySetInnerHTML={{ __html: email.body }}>
                    </div>
                    {email.attachments && email.attachments.length > 0 && (
                        <div className="p-4 border-t">
                            <h4 className="font-semibold mb-2">Attachments ({email.attachments.length})</h4>
                            <div className="flex gap-4">
                                {email.attachments.map(att => (
                                    <div key={att.name} className="p-2 border rounded-md flex items-center gap-2 text-sm">
                                        <Paperclip className="h-4 w-4 text-muted-foreground" />
                                        <span>{att.name} ({att.size})</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                <div className="p-4 border-t bg-muted/50 mt-auto">
                    <Textarea placeholder={`Reply to ${email.from.name}...`} />
                    <div className="flex justify-end mt-2">
                         <Button><Send className="mr-2 h-4 w-4"/>Send Reply</Button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}

function ComposeEmailDialog({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [to, setTo] = useState('');
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');

    const sendEmailMutation = useMutation({
        mutationFn: (data: {to: string, subject: string, body: string}) => sendEmail(data.to, data.subject, data.body),
        onSuccess: () => {
            toast({ title: "Email Sent", description: "Your email has been successfully sent." });
            queryClient.invalidateQueries({ queryKey: ['emails'] });
            onOpenChange(false);
            setTo(''); setSubject(''); setBody('');
        },
        onError: (error: Error) => {
            toast({ variant: 'destructive', title: "Error Sending Email", description: error.message });
        }
    });

    const handleSend = () => {
        sendEmailMutation.mutate({ to, subject, body });
    };

    return (
         <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Compose Email</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="to" className="text-right">To</Label>
                        <Input id="to" value={to} onChange={e => setTo(e.target.value)} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="subject" className="text-right">Subject</Label>
                        <Input id="subject" value={subject} onChange={e => setSubject(e.target.value)} className="col-span-3" />
                    </div>
                    <Textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Write your email here..." className="min-h-[250px]" />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSend} disabled={sendEmailMutation.isPending}>
                        {sendEmailMutation.isPending ? 'Sending...' : 'Send'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function ContactFormDialog({ open, onOpenChange, initialEmail, initialName, onSave, onCancel, accounts }: { open: boolean, onOpenChange: (open: boolean) => void, initialEmail?: string, initialName?: string, onSave: (data: any) => void, onCancel: () => void, accounts: Account[] }) {
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
        const selectedAccount = accounts.find(acc => acc.name === company);
        onSave({ name, email, phone, company, accountId: selectedAccount?.id || null, role, notes });
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
                            <SelectContent>{accounts.map(acc => <SelectItem key={acc.id} value={acc.name}>{acc.name}</SelectItem>)}</SelectContent>
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

function NotConfiguredView() {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <Mail className="h-24 w-24 text-muted-foreground/50 mb-6" />
            <h2 className="text-2xl font-semibold mb-2">Email Not Configured</h2>
            <p className="max-w-md text-muted-foreground mb-6">
                To send and receive emails from your own account, you first need to configure your email server settings.
            </p>
            <Link href="/settings?tab=email">
                <Button>
                    <Settings className="mr-2 h-4 w-4" /> Go to Email Settings
                </Button>
            </Link>
        </div>
    );
}


export default function EmailsPage() {
    const { data: emailSettings, isLoading } = useQuery<EmailSettingsType | null>({ 
        queryKey: ['emailSettings'], 
        queryFn: getEmailSettings 
    });
    const [isComposeOpen, setComposeOpen] = useState(false);

    const isConfigured = emailSettings?.configured;

    if (isLoading) {
        return (
            <div className="flex-1 p-0 flex flex-col h-[calc(100vh_-_5rem)]">
                <Skeleton className="h-20 w-full rounded-none" />
                <div className="p-8 flex-1 flex items-center justify-center">
                    <Skeleton className="h-48 w-96" />
                </div>
            </div>
        )
    }

    return (
        <div className="flex-1 p-0 flex flex-col h-[calc(100vh_-_5rem)]">
             <header className="flex items-center justify-between p-4 border-b">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight font-headline">Email</h1>
                    <p className="text-muted-foreground">Manage your communications and cases.</p>
                </div>
                {isConfigured && (
                    <Dialog open={isComposeOpen} onOpenChange={setComposeOpen}>
                        <DialogTrigger asChild>
                             <Button><Edit className="mr-2 h-4 w-4" /> Compose</Button>
                        </DialogTrigger>
                        <ComposeEmailDialog open={isComposeOpen} onOpenChange={setComposeOpen}/>
                    </Dialog>
                )}
            </header>
            <div className="flex-1 overflow-hidden">
                {isConfigured ? <EmailClientView /> : <NotConfiguredView />}
            </div>
        </div>
    );
}
