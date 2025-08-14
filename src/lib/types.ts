

export type User = {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'staff';
  status: 'Active' | 'Inactive';
  team: string;
  avatar: string;
};

export type Case = {
  id: string;
  subject: string;
  customer: string;
  email: string;
  priority: 'High' | 'Medium' | 'Low';
  type: 'Bug Report' | 'Feature Request' | 'Billing Inquiry' | 'General Question';
  status: 'New' | 'In Progress' | 'Resolved' | 'Investigated' | 'Completed' | 'Under Review' | 'Declined' | 'Closed';
  assignedTo: string;
  createdAt: string;
  description: string;
  communications?: Communication[];
  contactId?: string;
};

export type Communication = {
  id: string;
  type: 'Finding' | 'Note' | 'Email';
  content: string;
  author: string;
  authorRole: 'admin' | 'staff';
  timestamp: string;
};

export type Task = {
  id: string;
  title: string;
  description?: string;
  status: 'To Do' | 'In Progress' | 'Done';
  dueDate: string;
  priority: 'High' | 'Medium' | 'Low';
  linkedCase?: string;
  assignedTo?: string;
  contactId?: string;
};

export type Contact = {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  accountId: string;
  role: string;
  notes?: string;
  avatar: string;
};

export type Team = {
  id: string;
  name: string;
  memberCount: number;
};

export type Account = {
  id: string;
  name: string;
  industry: string;
  createdAt: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  primaryContactId?: string;
  owner: string; 
  size?: string;
  location?:string;
};

export type Document = {
    id: string;
    name: string;
    type: 'PDF' | 'Document' | 'Spreadsheet' | 'Image' | 'Meeting';
    size: string;
    uploadedAt: string;
    uploadedBy: string;
    category: 'Case File' | 'Contract' | 'Report' | 'Meeting Notes' | 'Other';
    description?: string;
    linkedToType: 'Case' | 'Task' | 'Account' | 'Contact' | 'Meeting';
    linkedToId: string;
    previewUrl?: string;
};

export type Meeting = {
  id: string;
  title: string;
  description: string;
  date: string;
  status: 'Upcoming' | 'Completed' | 'Canceled';
  participants: string[]; // array of user IDs
  linkedRecord?: string; // case or task ID
  notes?: { authorId: string; content: string; timestamp: string }[];
  attachments?: { name: string; url: string }[];
  contactId?: string;
}

export type AuditLog = {
    id: string;
    userId: string;
    action: string;
    details: string;
    timestamp: string;
};

export type Email = {
    id: string;
    from: { name: string, email: string };
    to: { name: string, email: string };
    subject: string;
    body: string;
    date: string;
    type: 'inbox' | 'sent';
    read: boolean;
    linkedCaseId?: string;
    attachments?: { name: string, size: string, type: 'PDF' | 'Image' | 'Document' }[];
};
