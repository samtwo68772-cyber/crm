

export type User = {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'staff';
  status: 'Active' | 'Inactive';
  team: string;
  avatar: string;
  passwordHash?: string;
  assignments?: CaseAssignment[];
  meetings?: MeetingParticipant[];
  notificationPreferences?: NotificationPreferences;
};

export type Case = {
  id: string;
  subject: string;
  customer: string;
  email: string;
  priority: 'High' | 'Medium' | 'Low';
  type: 'Bug Report' | 'Feature Request' | 'Billing Inquiry' | 'General Question';
  status: 'New' | 'In Progress' | 'Resolved' | 'Investigated' | 'Completed' | 'Under Review' | 'Declined' | 'Closed';
  createdAt: Date;
  resolvedAt?: Date;
  description: string;
  communications?: Communication[];
  contactId?: string;
  satisfactionRating?: number; // 1-5
  assignments: CaseAssignment[];
  createdById: string;
  createdBy: User;
};

export type CaseAssignment = {
  id: string;
  caseId: string;
  userId: string;
  user: User;
  assignedAt: Date;
  assignedByUserId: string;
};

export type Communication = {
  id: string;
  type: 'Finding' | 'Note' | 'Email' | 'Resolution';
  content: string;
  author: string;
  authorId: string;
  authorRole: 'admin' | 'staff';
  timestamp: string;
};

export type Task = {
  id: string;
  title: string;
  description?: string;
  status: 'To Do' | 'In Progress' | 'Done' | 'Canceled';
  dueDate: Date | null;
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
  accountId?: string;
  role: string;
  notes?: string;
  avatar: string;
  tasks: Task[];
};

export type Team = {
  id: string;
  name: string;
  description: string;
  leaderId: string;
  memberIds: string[];
  status: 'Active' | 'Archived';
};

export type Account = {
  id: string;
  name: string;
  industry: string;
  createdAt: Date;
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
  uploadedAt: Date;
  uploadedBy: string;
  authorId: string;
  category: 'Case File' | 'Contract' | 'Report' | 'Meeting Notes' | 'Other';
  description?: string;
  accountId?: string;
  caseId?: string;
  previewUrl?: string;
};

export type Meeting = {
  id: string;
  title: string;
  description: string;
  date: Date;
  status: 'Upcoming' | 'Completed' | 'Canceled';
  linkedRecord?: string; // case or task ID
  notes?: { authorId: string; content: string; timestamp: string }[];
  attachments?: { name: string; url: string }[];
  contactId?: string;
  participants: MeetingParticipant[];
}

export type MeetingParticipant = {
  id: string;
  meetingId: string;
  userId: string;
  user: User;
  joinedAt: Date;
};


export type AuditLog = {
    id: string;
    userId: string;
    action: string;
    details: string;
    timestamp: Date;
};

export type Email = {
    id: string;
    from: { name: string, email: string };
    to: { name: string, email: string };
    subject: string;
    body: string;
    date: Date;
    type: 'inbox' | 'sent';
    read: boolean;
    linkedCaseId?: string;
    attachments?: { name: string, size: string, type: 'PDF' | 'Image' | 'Document' }[];
};

export type EmailSettingsType = {
    id?: string;
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpPass: string;
    smtpEncryption: string;
    imapHost: string;
    imapPort: number;
    imapUser: string;
    imapPass: string;
    imapEncryption: string;
    configured: boolean;
};

export type Notification = {
  id: string;
  type: 'case' | 'task' | 'email' | 'meeting';
  title: string;
  description: string;
  timestamp: Date;
  read: boolean;
  userId?: string; // To whom the notification belongs. Can be undefined for system-wide (admin) notifications.
  link: string; // The URL to navigate to when clicked
};

export type NotificationChannel = {
    inApp: boolean;
    email: boolean;
    mandatory: boolean;
};

export type NotificationPreferences = {
    id?: string;
    userId?: string;
    cases: {
        newAssignment: NotificationChannel;
        statusChange: NotificationChannel;
        newComment: NotificationChannel;
    };
    tasks: {
        newAssignment: NotificationChannel;
        statusChange: NotificationChannel;
        dueSoon: NotificationChannel;
    };
    meetings: {
        newInvite: NotificationChannel;
        update: NotificationChannel;
        cancellation: NotificationChannel;
    };
};

export type GeneralSettingsType = {
    id?: string;
    systemName: string;
    companyName: string;
    logoUrl: string;
    timeZone: string;
    language: string;
};

export type Workflow = {
  id: string;
  name: string;
  trigger: 'case-created' | 'task-status-changed' | 'case-unattended';
  condition: 'priority-high' | 'status-resolved' | 'task-overdue' | 'status-is-new-for-24h' | 'case-in-progress-for-3-days';
  action: 'assign-team-t2' | 'send-email-customer' | 'create-followup-task' | 'change-priority-high' | 'assign-to-manager' | 'send-escalation-email';
};

export type SessionPayload = {
    userId: string;
    expires: Date;
}
