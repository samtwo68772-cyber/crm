
"use client";

import React, { useState, useMemo } from 'react';
import { documents as mockDocuments, cases as mockCases, accounts as mockAccounts } from '@/lib/data.tsx';
import type { Document } from '@/lib/types';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MoreHorizontal, PlusCircle, File, FileText, FileSpreadsheet, Image as ImageIcon, Download, Edit, Trash2, Search, X, Folder, Link as LinkIcon, Calendar, User, Building, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from "@/hooks/use-toast";
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';


const fileTypeIcons: { [key in Document['type']]: React.ReactNode } = {
    'PDF': <FileText className="h-10 w-10 text-red-500" />,
    'Document': <File className="h-10 w-10 text-blue-500" />,
    'Spreadsheet': <FileSpreadsheet className="h-10 w-10 text-green-500" />,
    'Image': <ImageIcon className="h-10 w-10 text-orange-500" />,
    'Meeting': <Calendar className="h-10 w-10 text-purple-500" />,
};

const getLinkedItemName = (doc: Document) => {
    switch (doc.linkedToType) {
        case 'Case': return mockCases.find(c => c.id === doc.linkedToId)?.subject || doc.linkedToId;
        case 'Account': return mockAccounts.find(a => a.id === doc.linkedToId)?.name || doc.linkedToId;
        default: return doc.linkedToId;
    }
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>(mockDocuments);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [expandedDocId, setExpandedDocId] = useState<string | null>(null);
  const [isUploadOpen, setUploadOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const { toast } = useToast();

  const documentCategories = useMemo(() => ['all', ...Array.from(new Set(mockDocuments.map(d => d.category)))], [mockDocuments]);

  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) || (doc.description && doc.description.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = categoryFilter === 'all' || doc.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [documents, searchQuery, categoryFilter]);

  const handleUploadDocument = (newDocData: Omit<Document, 'id' | 'uploadedBy' | 'uploadedAt'>) => {
    const newDoc: Document = {
      id: `doc-${Date.now()}`,
      uploadedAt: new Date().toISOString().split('T')[0],
      uploadedBy: user?.name || 'System',
      ...newDocData,
    };
    setDocuments([newDoc, ...documents]);
    setUploadOpen(false);
    toast({ title: 'Document Uploaded', description: `"${newDoc.name}" has been uploaded.` });
  };
  
  const handleUpdateDocument = (updatedDoc: Document) => {
    setDocuments(documents.map(d => d.id === updatedDoc.id ? updatedDoc : d));
    setEditingDocument(null);
    toast({ title: 'Document Updated', description: `"${updatedDoc.name}" has been updated.` });
  };
  
  const handleDeleteDocument = (docId: string) => {
    setDocuments(documents.filter(d => d.id !== docId));
    setExpandedDocId(null);
    toast({ title: 'Document Deleted', description: 'The document has been deleted.' });
  };
  
  const clearFilters = () => {
    setSearchQuery('');
    setCategoryFilter('all');
  }

  return (
    <div className="flex-1 space-y-6 pt-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
            <h2 className="text-3xl font-bold tracking-tight font-headline">Documents</h2>
            <p className="text-muted-foreground">Browse, manage, and upload files.</p>
        </div>
        <Button onClick={() => { setEditingDocument(null); setUploadOpen(true); }}><PlusCircle className="mr-2 h-4 w-4" /> Upload Document</Button>
      </div>

       <Card>
            <CardContent className="p-4">
                 <div className="flex flex-col md:flex-row items-center gap-4">
                    <div className="relative w-full md:flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Search documents..." className="pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-muted-foreground">Categories:</span>
                        {documentCategories.map(cat => (
                            <Badge 
                                key={cat} 
                                variant={categoryFilter === cat ? 'default' : 'secondary'}
                                className="cursor-pointer"
                                onClick={() => setCategoryFilter(cat)}
                            >
                                {cat === 'all' ? 'All' : cat}
                            </Badge>
                        ))}
                    </div>
                     <Button variant="outline" onClick={clearFilters}><X className="mr-2 h-4 w-4" /> Clear</Button>
                </div>
            </CardContent>
        </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredDocuments.map(doc => (
            <Collapsible key={doc.id} open={expandedDocId === doc.id} onOpenChange={(isOpen) => setExpandedDocId(isOpen ? doc.id : null)} className="col-span-1 md:col-span-2 lg:col-span-3 xl:col-span-4 data-[state=open]:col-span-full">
                <Card className="hover:shadow-md transition-shadow duration-200">
                    <CollapsibleTrigger asChild>
                         <div className="flex items-center p-4 cursor-pointer">
                            <div className="mr-4 shrink-0">{fileTypeIcons[doc.type]}</div>
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold truncate">{doc.name}</p>
                                <p className="text-sm text-muted-foreground">{doc.category} &bull; {doc.size}</p>
                            </div>
                            <Button variant="ghost" size="icon" className="ml-4">
                                {expandedDocId === doc.id ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                            </Button>
                        </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                        <Separator />
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
                            <div className="md:col-span-1 flex flex-col items-center justify-center bg-muted/50 rounded-lg p-4">
                               {doc.type === 'Image' && doc.previewUrl ? (
                                    <img src={doc.previewUrl} alt={doc.name} data-ai-hint="document image" className="rounded-md object-contain max-h-48 w-full" />
                                 ) : (
                                    <div className="p-8 text-muted-foreground">
                                        {React.cloneElement(fileTypeIcons[doc.type], {className: "h-24 w-24"})}
                                    </div>
                                )}
                            </div>
                            <div className="md:col-span-2">
                                <h3 className="font-semibold text-lg mb-2">{doc.name}</h3>
                                <p className="text-sm text-muted-foreground mb-4">{doc.description}</p>
                                <div className="space-y-2 text-sm">
                                   <div className="flex gap-2 items-center"><LinkIcon className="h-4 w-4 text-muted-foreground" /> <strong>Linked To:</strong> {getLinkedItemName(doc)} ({doc.linkedToType})</div>
                                   <div className="flex gap-2 items-center"><Folder className="h-4 w-4 text-muted-foreground" /> <strong>Category:</strong> {doc.category}</div>
                                   <div className="flex gap-2 items-center"><User className="h-4 w-4 text-muted-foreground" /> <strong>Uploaded By:</strong> {doc.uploadedBy}</div>
                                   <div className="flex gap-2 items-center"><Calendar className="h-4 w-4 text-muted-foreground" /> <strong>Uploaded At:</strong> {doc.uploadedAt}</div>
                                </div>
                                <div className="flex gap-2 mt-6">
                                    <Button size="sm"><Download className="mr-2 h-4 w-4"/> Download</Button>
                                    <Button size="sm" variant="outline" onClick={() => setEditingDocument(doc)}><Edit className="mr-2 h-4 w-4"/> Edit</Button>
                                    {isAdmin && <Button size="sm" variant="destructive" onClick={() => handleDeleteDocument(doc.id)}><Trash2 className="mr-2 h-4 w-4"/> Delete</Button>}
                                </div>
                            </div>
                        </div>
                    </CollapsibleContent>
                </Card>
             </Collapsible>
        ))}
      </div>
      {filteredDocuments.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
            <p className="text-lg font-semibold">No documents found</p>
            <p>Try adjusting your search or filters.</p>
        </div>
      )}
      
       <UploadDocumentDialog
          key={editingDocument ? editingDocument.id : 'create'}
          open={isUploadOpen || !!editingDocument}
          onOpenChange={(open) => {
            if (!open) {
              setUploadOpen(false);
              setEditingDocument(null);
            }
          }}
          document={editingDocument}
          onSave={(data, isEdit) => {
            if (isEdit && editingDocument) {
              handleUpdateDocument({ ...editingDocument, ...data });
            } else {
              handleUploadDocument(data);
            }
          }}
       />
    </div>
  );
}

function UploadDocumentDialog({ open, onOpenChange, document, onSave }: { open: boolean, onOpenChange: (open: boolean) => void, document: Document | null, onSave: (data: any, isEdit: boolean) => void }) {
    const isEditMode = !!document;
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState<Document['category']>('Other');
    const [type, setType] = useState<Document['type']>('Document');
    const [linkedToType, setLinkedToType] = useState<Document['linkedToType'] | ''>('');
    const [linkedToId, setLinkedToId] = useState('');

    const linkedOptions = useMemo(() => {
        if (linkedToType === 'Case') return mockCases.map(c => ({ value: c.id, label: c.subject }));
        if (linkedToType === 'Account') return mockAccounts.map(a => ({ value: a.id, label: a.name }));
        return [];
    }, [linkedToType]);
    
    React.useEffect(() => {
        if(document) {
            setName(document.name);
            setDescription(document.description || '');
            setCategory(document.category);
            setType(document.type);
            setLinkedToType(document.linkedToType);
            setLinkedToId(document.linkedToId);
        } else {
             setName(''); setDescription(''); setCategory('Other'); setType('Document'); setLinkedToType(''); setLinkedToId('');
        }
    }, [document, open]);

    const handleSubmit = () => {
        onSave({ name, description, category, type, linkedToId, linkedToType, size: 'N/A' }, isEditMode);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{isEditMode ? 'Edit Document' : 'Upload New Document'}</DialogTitle>
                </DialogHeader>
                 <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="name" className="text-right">Name</Label><Input id="name" value={name} onChange={e => setName(e.target.value)} className="col-span-3" /></div>
                    <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="desc" className="text-right">Description</Label><Textarea id="desc" value={description} onChange={e => setDescription(e.target.value)} className="col-span-3" /></div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="category" className="text-right">Category</Label>
                        <Select onValueChange={(v: Document['category']) => setCategory(v)} value={category}><SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Case File">Case File</SelectItem><SelectItem value="Contract">Contract</SelectItem><SelectItem value="Report">Report</SelectItem><SelectItem value="Meeting Notes">Meeting Notes</SelectItem><SelectItem value="Other">Other</SelectItem></SelectContent></Select>
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="type" className="text-right">File Type</Label>
                        <Select onValueChange={(v: Document['type']) => setType(v)} value={type}><SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="PDF">PDF</SelectItem><SelectItem value="Document">Document</SelectItem><SelectItem value="Spreadsheet">Spreadsheet</SelectItem><SelectItem value="Image">Image</SelectItem></SelectContent></Select>
                    </div>
                     <Separator className="my-2" />
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="linkType" className="text-right">Link To</Label>
                        <Select onValueChange={(v: Document['linkedToType']) => { setLinkedToType(v); setLinkedToId(''); }} value={linkedToType}><SelectTrigger className="col-span-3"><SelectValue placeholder="Select type..." /></SelectTrigger><SelectContent><SelectItem value="Case">Case</SelectItem><SelectItem value="Account">Account</SelectItem></SelectContent></Select>
                    </div>
                     {linkedToType && <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="linkId" className="text-right">Record</Label>
                        <Select onValueChange={setLinkedToId} value={linkedToId}><SelectTrigger className="col-span-3"><SelectValue placeholder="Select record..." /></SelectTrigger><SelectContent>{linkedOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent></Select>
                    </div>}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button type="submit" onClick={handleSubmit}>{isEditMode ? 'Save Changes' : 'Upload'}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

    