// @ts-nocheck

export type PermissionLevel = 'Full Access' | 'Edit' | 'View Only' | 'None';

export interface Role {
  id: string;
  name: string;
  permissions: {
    [module: string]: PermissionLevel;
  };
}

const DEFAULT_ROLES: Role[] = [
  {
    id: 'admin',
    name: 'Admin',
    permissions: {
      'Dashboard': 'Full Access',
      'Client 360': 'Full Access',
      'Products': 'Full Access',
      'Tools': 'Full Access',
      'Workload': 'Full Access',
      'Settings': 'Full Access',
      'Activity Logs': 'Full Access'
    }
  },
  {
    id: 'manager',
    name: 'Manager',
    permissions: {
      'Dashboard': 'Full Access',
      'Client 360': 'Edit',
      'Products': 'Edit',
      'Tools': 'Full Access',
      'Workload': 'View Only',
      'Settings': 'None',
      'Activity Logs': 'View Only'
    }
  },
  {
    id: 'viewer',
    name: 'Viewer',
    permissions: {
      'Dashboard': 'View Only',
      'Client 360': 'View Only',
      'Products': 'View Only',
      'Tools': 'View Only',
      'Workload': 'None',
      'Settings': 'None',
      'Activity Logs': 'None'
    }
  }
];

const STORAGE_KEY = 'revops_roles';

export const roleService = {
  getAll: (): Role[] => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : DEFAULT_ROLES;
  },

  getById: (id: string): Role | undefined => {
    return roleService.getAll().find(r => r.id === id);
  },

  save: (roles: Role[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(roles));
  },

  add: (name: string): Role => {
    const roles = roleService.getAll();
    const newRole: Role = {
      id: name.toLowerCase().replace(/\s+/g, '_'),
      name,
      permissions: {
        'Dashboard': 'None',
        'Client 360': 'None',
        'Products': 'None',
        'Tools': 'None',
        'Workload': 'None',
        'Settings': 'None',
        'Activity Logs': 'None'
      }
    };
    roles.push(newRole);
    roleService.save(roles);
    return newRole;
  },

  updatePermission: (roleId: string, module: string, level: PermissionLevel) => {
    const roles = roleService.getAll();
    const role = roles.find(r => r.id === roleId);
    if (role) {
      role.permissions[module] = level;
      roleService.save(roles);
    }
  },

  delete: (id: string) => {
    if (id === 'admin') return; // Cannot delete admin
    const roles = roleService.getAll().filter(r => r.id !== id);
    roleService.save(roles);
  }
};
