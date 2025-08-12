
"use client";

import React, { useState, useMemo } from 'react';
import { documents as mockDocuments, cases as mockCases, accounts as mockAccounts } from '@/lib/data.tsx';
import type { Document } from '@/lib/types';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MoreHorizontal, PlusCircle, File, FileText, FileSpreadsheet, Image as ImageIcon, Download, Edit, Trash2, Search, X, Folder, Link as LinkIcon, Calendar, User, Building } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from "@/hooks/use-toast";

const fileTypeIcons = {
    'PDF': <FileText className="h-5 w-5 text-destructive" />,
    'Document': <File className="h-5 w-5 text-primary" />,
    'Spreadsheet': <FileSpreadsheet className="h-5 w-5 text-green-600" />,
    'Image': <ImageIcon className="h-5 w-5 text-accent" />,
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
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [isUploadOpen, setUploadOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const { toast } = useToast();

  const documentCategories = useMemo(() => ['all', ...Array.from(new Set(mockDocuments.map(d => d.category)))], []);

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
    setSelectedDocument(updatedDoc);
    setEditingDocument(null);
    toast({ title: 'Document Updated', description: `"${updatedDoc.name}" has been updated.` });
  };
  
  const handleDeleteDocument = (docId: string) => {
    setDocuments(documents.filter(d => d.id !== docId));
    setSelectedDocument(null);
    toast({ title: 'Document Deleted', description: 'The document has been deleted.' });
  };

  return (
    <div className="flex-1 space-y-4 md:space-y-6 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight font-headline">Documents</h2>
        <Button onClick={() => { setEditingDocument(null); setUploadOpen(true); }}><PlusCircle className="mr-2 h-4 w-4" /> Upload Document</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] lg:grid-cols-[280px_1fr] gap-6">
        {/* Sidebar */}
        <aside className="hidden md:flex flex-col gap-4">
            <h3 className="text-lg font-semibold">Categories</h3>
            <div className="flex flex-col gap-1">
                {documentCategories.map(cat => (
                    <Button 
                        key={cat} 
                        variant={categoryFilter === cat ? 'secondary' : 'ghost'}
                        className="justify-start"
                        onClick={() => setCategoryFilter(cat)}
                    >
                        {cat === 'all' ? 'All Categories' : cat}
                    </Button>
                ))}
            </div>
        </aside>

        {/* Main Content */}
        <main className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-6">
            <div className="flex flex-col gap-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search documents..." className="pl-9 w-full" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                </div>
                <Card className="shadow-none border-0">
                    <CardContent className="p-0">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[400px]">Name</TableHead>
                              <TableHead>Category</TableHead>
                              <TableHead>Size</TableHead>
                              <TableHead>Uploaded</TableHead>
                              <TableHead><span className="sr-only">Actions</span></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredDocuments.map((doc) => (
                              <TableRow key={doc.id} onClick={() => setSelectedDocument(doc)} className="cursor-pointer">
                                <TableCell className="font-medium flex items-center gap-3">
                                  {fileTypeIcons[doc.type]}
                                  {doc.name}
                                </TableCell>
                                <TableCell>{doc.category}</TableCell>
                                <TableCell>{doc.size}</TableCell>
                                <TableCell>{doc.uploadedAt}</TableCell>
                                <TableCell className="text-right">
                                  <Button variant="ghost" size="sm" onClick={() => setSelectedDocument(doc)}>View</Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            {/* Details Pane */}
            {selectedDocument && (
                <Card className="hidden xl:flex flex-col">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-lg">Details</CardTitle>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedDocument(null)}><X className="h-4 w-4"/></Button>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center text-center gap-4 flex-1 justify-center">
                         {selectedDocument.type === 'Image' ? (
                            <img src={selectedDocument.previewUrl} alt={selectedDocument.name} data-ai-hint="document image" className="rounded-md object-cover w-full h-48" />
                         ) : (
                            <div className="p-8 bg-muted rounded-full">
                                {fileTypeIcons[selectedDocument.type]}
                            </div>
                         )}
                        <h3 className="font-semibold">{selectedDocument.name}</h3>
                        <p className="text-sm text-muted-foreground">{selectedDocument.description}</p>
                        <Separator />
                        <div className="text-sm space-y-2 text-left w-full">
                           <div className="flex gap-2"><LinkIcon className="h-4 w-4 text-muted-foreground" /> Linked To: {getLinkedItemName(selectedDocument)} ({selectedDocument.linkedToType})</div>
                           <div className="flex gap-2"><Folder className="h-4 w-4 text-muted-foreground" /> Category: {selectedDocument.category}</div>
                           <div className="flex gap-2"><User className="h-4 w-4 text-muted-foreground" /> Uploaded By: {selectedDocument.uploadedBy}</div>
                           <div className="flex gap-2"><Calendar className="h-4 w-4 text-muted-foreground" /> Uploaded At: {selectedDocument.uploadedAt}</div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex-col gap-2 items-stretch">
                        <Button><Download className="mr-2 h-4 w-4"/> Download</Button>
                        <Button variant="outline" onClick={() => setEditingDocument(selectedDocument)}><Edit className="mr-2 h-4 w-4"/> Edit</Button>
                        {isAdmin && <Button variant="destructive" onClick={() => handleDeleteDocument(selectedDocument.id)}><Trash2 className="mr-2 h-4 w-4"/> Delete</Button>}
                    </CardFooter>
                </Card>
            )}
        </main>
      </div>
      
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
                        <Select onValueChange={(v: Document['linkedToType']) => setLinkedToType(v)} value={linkedToType}><SelectTrigger className="col-span-3"><SelectValue placeholder="Select type..." /></SelectTrigger><SelectContent><SelectItem value="Case">Case</SelectItem><SelectItem value="Account">Account</SelectItem></SelectContent></Select>
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
