
import type { PermissionSet } from './types';
import { getSession } from '@/context/actions';
import { prisma } from './prisma';

export const permissionModules = {
    cases: {
        label: 'Cases',
        permissions: { create: 'Create', view: 'View', update: 'Update', delete: 'Delete', assign: 'Assign' }
    },
    tasks: {
        label: 'Tasks',
        permissions: { create: 'Create', view: 'View', update: 'Update', delete: 'Delete', assign: 'Assign' }
    },
    meetings: {
        label: 'Meetings',
        permissions: { create: 'Create', view: 'View', update: 'Update', delete: 'Delete', invite: 'Invite' }
    },
    emails: {
        label: 'Emails',
        permissions: { view: 'View', send: 'Send', delete: 'Delete' }
    },
    teams: {
        label: 'Teams',
        permissions: { create: 'Create', update: 'Update', archive: 'Archive', delete: 'Delete', assignMembers: 'Assign Members' }
    },
    users: {
        label: 'Users',
        permissions: { create: 'Create', update: 'Update', delete: 'Delete', manageRoles: 'Manage Roles' }
    },
    settings: {
        label: 'Settings',
        permissions: { updateSystem: 'Update System Config', manageIntegrations: 'Manage Integrations' }
    },
    audit: {
        label: 'Audit Logs',
        permissions: { view: 'View' }
    }
};

export const defaultPermissions: { [key: string]: PermissionSet } = {
    admin: {
        cases: { create: true, view: true, update: true, delete: true, assign: true },
        tasks: { create: true, view: true, update: true, delete: true, assign: true },
        meetings: { create: true, view: true, update: true, delete: true, invite: true },
        emails: { view: true, send: true, delete: true },
        teams: { create: true, update: true, archive: true, delete: true, assignMembers: true },
        users: { create: true, update: true, delete: true, manageRoles: true },
        settings: { updateSystem: true, manageIntegrations: true },
        audit: { view: true },
    },
    staff: {
        cases: { create: true, view: true, update: true, delete: false, assign: true },
        tasks: { create: true, view: true, update: true, delete: false, assign: true },
        meetings: { create: true, view: true, update: true, delete: false, invite: true },
        emails: { view: true, send: true, delete: false },
        teams: { create: false, update: false, archive: false, delete: false, assignMembers: false },
        users: { create: false, update: false, delete: false, manageRoles: false },
        settings: { updateSystem: false, manageIntegrations: false },
        audit: { view: false },
    }
};


export async function checkPermission(permission: `${keyof typeof permissionModules}:${keyof (typeof permissionModules)[keyof typeof permissionModules]['permissions']}`) {
    const session = await getSession();
    if (!session?.userId) throw new Error('Authentication required.');

    const user = await prisma.user.findUnique({
        where: { id: session.userId },
        include: { role: true },
    });

    if (!user) throw new Error('User not found.');

    const [module, requiredPermission] = permission.split(':');
    const userPermissions = user.role.permissions as PermissionSet;

    if (!userPermissions?.[module]?.[requiredPermission]) {
        throw new Error('Access Denied: You do not have the required permission.');
    }
}
