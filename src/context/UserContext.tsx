import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserPreferences, UserSession } from '../types';

interface UserContextType {
  currentUser: UserProfile;
  updateCurrentUser: (updates: Partial<UserProfile>) => { success: boolean; message?: string };
  preferences: UserPreferences;
  updatePreferences: (updates: Partial<UserPreferences>) => void;
  users: UserProfile[];
  inviteUser: (data: Omit<UserProfile, 'id' | 'createdAt'>) => { success: boolean; message: string };
  updateUser: (id: string, updates: Partial<UserProfile>) => { success: boolean; message: string };
  toggleUserStatus: (id: string) => { success: boolean; message: string };
  deleteUser: (id: string) => { success: boolean; message: string };
  sessions: UserSession[];
  revokeSession: (id: string) => void;
  revokeAllOtherSessions: () => void;
  changePassword: (currentPass: string, newPass: string) => Promise<{ success: boolean; message: string }>;
  signOut: () => void;
  isSuperAdmin: boolean;
}

const defaultUser: UserProfile = {
  id: 'usr_zaid_01',
  name: 'Rashid Al-Zaid',
  displayName: 'Rashid Al-Zaid',
  email: 'zaidtrading.info@gmail.com',
  phone: '+94 77 123 4567',
  jobTitle: 'Managing Director & Head of Operations',
  role: 'Owner / Administrator',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
  preferredLanguage: 'English (UK)',
  createdAt: '2024-01-15T08:00:00.000Z',
  status: 'active',
  assignedWarehouse: 'Colombo Central Distribution Hub',
  lastActive: 'Active Now',
};

const defaultUsersList: UserProfile[] = [
  defaultUser,
  {
    id: 'usr_zaid_02',
    name: 'Tariq Mansoor',
    displayName: 'Tariq M.',
    email: 'tariq.m@zaidtrading.com',
    phone: '+94 71 890 1234',
    jobTitle: 'Senior Warehouse Lead',
    role: 'Storekeeper',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
    preferredLanguage: 'English',
    createdAt: '2024-03-10T10:30:00.000Z',
    status: 'active',
    assignedWarehouse: 'Colombo Central Distribution Hub',
    lastActive: '2 hours ago',
  },
  {
    id: 'usr_zaid_03',
    name: 'Fahad Al-Harbi',
    displayName: 'Fahad H.',
    email: 'fahad.h@zaidtrading.com',
    phone: '+94 76 543 2109',
    jobTitle: 'Field Dispatch Specialist',
    role: 'Delivery Driver',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80',
    preferredLanguage: 'English',
    createdAt: '2024-04-01T09:15:00.000Z',
    status: 'active',
    assignedWarehouse: 'Van Fleet Unit 01 (Western Province)',
    lastActive: '34 minutes ago',
  },
  {
    id: 'usr_zaid_04',
    name: 'Sarah Nabil',
    displayName: 'Sarah N.',
    email: 'sarah.n@zaidtrading.com',
    phone: '+94 77 987 6543',
    jobTitle: 'Chief Financial Accountant',
    role: 'Accountant',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80',
    preferredLanguage: 'English',
    createdAt: '2024-02-20T14:00:00.000Z',
    status: 'active',
    assignedWarehouse: 'Corporate Head Office',
    lastActive: '1 day ago',
  },
];

const defaultPreferences: UserPreferences = {
  theme: 'light',
  dateFormat: 'YYYY-MM-DD',
  timeFormat: '24h',
  emailNotifications: true,
  lowStockAlerts: true,
  financialAlerts: true,
  marketingEmails: false,
};

const initialSessions: UserSession[] = [
  {
    id: 'sess_cur_01',
    device: 'Desktop Mac Studio (Apple M2 Ultra)',
    browser: 'Chrome 122.0.0.0 (WebKit)',
    ipAddress: '123.231.104.22',
    location: 'Colombo, Western Province, Sri Lanka',
    lastActive: 'Active Now (Current Session)',
    isCurrent: true,
  },
  {
    id: 'sess_mob_02',
    device: 'iPhone 15 Pro Max (iOS 17.4)',
    browser: 'Mobile Safari',
    ipAddress: '123.231.104.45',
    location: 'Colombo, Western Province, Sri Lanka',
    lastActive: 'Today at 07:42 AM',
    isCurrent: false,
  },
  {
    id: 'sess_lap_03',
    device: 'Lenovo ThinkPad X1 Carbon (Windows 11)',
    browser: 'Edge 121.0.0.0',
    ipAddress: '112.134.198.14',
    location: 'Kandy Logistics Office, Sri Lanka',
    lastActive: '3 days ago',
    isCurrent: false,
  },
];

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('zaid_erp_current_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return defaultUser;
      }
    }
    return defaultUser;
  });

  const [users, setUsers] = useState<UserProfile[]>(() => {
    const saved = localStorage.getItem('zaid_erp_users_list');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return defaultUsersList;
      }
    }
    return defaultUsersList;
  });

  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    const saved = localStorage.getItem('zaid_erp_user_preferences');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return defaultPreferences;
      }
    }
    return defaultPreferences;
  });

  const [sessions, setSessions] = useState<UserSession[]>(() => {
    const saved = localStorage.getItem('zaid_erp_user_sessions');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return initialSessions;
      }
    }
    return initialSessions;
  });

  useEffect(() => {
    localStorage.setItem('zaid_erp_current_user', JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('zaid_erp_users_list', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('zaid_erp_user_preferences', JSON.stringify(preferences));
  }, [preferences]);

  useEffect(() => {
    localStorage.setItem('zaid_erp_user_sessions', JSON.stringify(sessions));
  }, [sessions]);

  const isSuperAdmin = currentUser.role === 'Owner / Administrator';

  const updateCurrentUser = (updates: Partial<UserProfile>) => {
    // Protected fields that cannot be altered from user profile
    const safeUpdates = { ...updates };
    delete safeUpdates.role;
    delete safeUpdates.status;
    delete safeUpdates.id;
    delete safeUpdates.createdAt;

    const updated = { ...currentUser, ...safeUpdates };
    setCurrentUser(updated);

    // Also update in users list
    setUsers((prev) => prev.map((u) => (u.id === currentUser.id ? { ...u, ...safeUpdates } : u)));
    return { success: true };
  };

  const updatePreferences = (updates: Partial<UserPreferences>) => {
    setPreferences((prev) => ({ ...prev, ...updates }));
  };

  const inviteUser = (data: Omit<UserProfile, 'id' | 'createdAt'>) => {
    if (!isSuperAdmin) {
      return { success: false, message: 'Unauthorized: Only administrators can invite new team members.' };
    }

    const emailTrimmed = data.email.trim().toLowerCase();
    const existing = users.find((u) => u.email.toLowerCase() === emailTrimmed);
    if (existing) {
      return { success: false, message: `A user with email ${emailTrimmed} already exists in the system.` };
    }

    const newUser: UserProfile = {
      ...data,
      id: `usr_zaid_${Date.now().toString(36)}`,
      createdAt: new Date().toISOString(),
      displayName: data.displayName || data.name.split(' ')[0],
      status: 'active',
      lastActive: 'Invited (Pending login)',
    };

    setUsers((prev) => [newUser, ...prev]);
    return { success: true, message: `Invitation successfully sent to ${emailTrimmed}.` };
  };

  const updateUser = (id: string, updates: Partial<UserProfile>) => {
    if (!isSuperAdmin && currentUser.id !== id) {
      return { success: false, message: 'Unauthorized: You do not have permission to modify this account.' };
    }

    // Safety: prevent removing the last administrator
    if (updates.role && updates.role !== 'Owner / Administrator') {
      const adminCount = users.filter((u) => u.role === 'Owner / Administrator' && u.status === 'active').length;
      const targetUser = users.find((u) => u.id === id);
      if (targetUser?.role === 'Owner / Administrator' && adminCount <= 1) {
        return {
          success: false,
          message: 'Security Constraint: Cannot revoke the last active Administrator role in the enterprise.',
        };
      }
    }

    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          const updated = { ...u, ...updates };
          if (id === currentUser.id) {
            setCurrentUser(updated);
          }
          return updated;
        }
        return u;
      })
    );
    return { success: true, message: 'User record updated successfully.' };
  };

  const toggleUserStatus = (id: string) => {
    if (!isSuperAdmin) {
      return { success: false, message: 'Unauthorized: Only administrators can modify account status.' };
    }

    const targetUser = users.find((u) => u.id === id);
    if (!targetUser) return { success: false, message: 'User not found.' };

    // Prevent deactivating oneself if last admin
    if (targetUser.id === currentUser.id) {
      const adminCount = users.filter((u) => u.role === 'Owner / Administrator' && u.status === 'active').length;
      if (adminCount <= 1) {
        return {
          success: false,
          message: 'Security Constraint: You cannot deactivate your own account as the sole enterprise Administrator.',
        };
      }
    }

    const newStatus: 'active' | 'inactive' = targetUser.status === 'active' ? 'inactive' : 'active';
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, status: newStatus } : u))
    );

    if (id === currentUser.id) {
      setCurrentUser((prev) => ({ ...prev, status: newStatus }));
    }

    return {
      success: true,
      message: `Account for ${targetUser.name} has been ${newStatus === 'active' ? 'reactivated' : 'deactivated'}.`,
    };
  };

  const deleteUser = (id: string) => {
    if (!isSuperAdmin) {
      return { success: false, message: 'Unauthorized: Only administrators can delete team accounts.' };
    }

    if (id === currentUser.id) {
      return { success: false, message: 'Security Constraint: You cannot delete your own active administrator account.' };
    }

    const targetUser = users.find((u) => u.id === id);
    if (!targetUser) return { success: false, message: 'User not found.' };

    setUsers((prev) => prev.filter((u) => u.id !== id));
    return { success: true, message: `User ${targetUser.name} has been removed from the company directory.` };
  };

  const revokeSession = (id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id || s.isCurrent));
  };

  const revokeAllOtherSessions = () => {
    setSessions((prev) => prev.filter((s) => s.isCurrent));
  };

  const changePassword = async (
    currentPass: string,
    newPass: string
  ): Promise<{ success: boolean; message: string }> => {
    // Simulate real auth handshake
    await new Promise((resolve) => setTimeout(resolve, 600));

    if (!currentPass || currentPass.length < 4) {
      return { success: false, message: 'The current password provided is incorrect.' };
    }

    if (!newPass || newPass.length < 8) {
      return { success: false, message: 'New password must be at least 8 characters long.' };
    }

    // Record security log entry
    return {
      success: true,
      message: 'Password successfully updated. Security credential tokens refreshed.',
    };
  };

  const signOut = () => {
    // Clear active sessions except template
    setSessions([initialSessions[0]]);
  };

  return (
    <UserContext.Provider
      value={{
        currentUser,
        updateCurrentUser,
        preferences,
        updatePreferences,
        users,
        inviteUser,
        updateUser,
        toggleUserStatus,
        deleteUser,
        sessions,
        revokeSession,
        revokeAllOtherSessions,
        changePassword,
        signOut,
        isSuperAdmin,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
