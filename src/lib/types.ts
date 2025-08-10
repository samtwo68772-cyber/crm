export type User = {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'staff';
  team: string;
  avatar: string;
};

export type Case = {
  id: string;
  subject: string;
  customer: string;
  email: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'New' | 'In Progress' | 'Resolved';
  assignedTo: string;
  createdAt: string;
  description: string;
};

export type Task = {
  id: string;
  title: string;
  status: 'To Do' | 'In Progress' | 'Done';
  dueDate: string;
  priority: 'High' | 'Medium' | 'Low';
};

export type Contact = {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  avatar: string;
};

export type Team = {
  id: string;
  name: string;
  memberCount: number;
};
