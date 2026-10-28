import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserPreferences, UserSession } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface UserContextType {
  currentUser: UserProfile | null;
  loading: boolean;
  signIn: (email: string, pass: string) => Promise<{ success: boolean; message: string }>;
  signUp: (email: string, pass: string, companyName: string, legalName: string, fullName: string, phone?: string) => Promise<{ success: boolean; message: string }>;
  signOut: () => Promise<void>;
  updateCurrentUser: (updates: Partial<UserProfile>) => Promise<{ success: boolean; message?: string }>;
  preferences: UserPreferences;
  updatePreferences: (updates: Partial<UserPreferences>) => void;
  users: UserProfile[];
  inviteUser: (data: Omit<UserProfile, 'id' | 'createdAt'>) => Promise<{ success: boolean; message: string }>;
  updateUser: (id: string, updates: Partial<UserProfile>) => Promise<{ success: boolean; message: string }>;
  toggleUserStatus: (id: string) => Promise<{ success: boolean; message: string }>;
  deleteUser: (id: string) => Promise<{ success: boolean; message: string }>;
  sessions: UserSession[];
  revokeSession: (id: string) => void;
  revokeAllOtherSessions: () => void;
  changePassword: (currentPass: string, newPass: string) => Promise<{ success: boolean; message: string }>;
  isSuperAdmin: boolean;
  authError: string | null;
}

const defaultPreferences: UserPreferences = {
  theme: 'light',
  dateFormat: 'YYYY-MM-DD',
  timeFormat: '24h',
  emailNotifications: true,
  lowStockAlerts: true,
  financialAlerts: true,
  marketingEmails: false,
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const [sessions, setSessions] = useState<UserSession[]>([
    {
      id: 'sess_cur_01',
      device: 'Desktop Browser',
      browser: navigator.userAgent,
      ipAddress: 'Local Network',
      location: 'Colombo, Sri Lanka',
      lastActive: 'Active Now',
      isCurrent: true,
    }
  ]);

  useEffect(() => {
    let mounted = true;

    async function loadSessionAndProfile() {
      if (!isSupabaseConfigured() || !supabase) {
        if (mounted) {
          setLoading(false);
          setAuthError('Supabase is not configured. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in environment variables.');
        }
        return;
      }

      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        if (session?.user) {
          // Fetch user profile from database
          const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', session.user.id)
            .single();

          if (profileError || !profile) {
            if (mounted) {
              setCurrentUser(null);
              setAuthError('User authenticated in Supabase Auth, but no ERP profile found. Please complete company registration.');
            }
          } else if (profile.status !== 'active') {
            if (mounted) {
              setCurrentUser(null);
              setAuthError('Your user account has been deactivated by the company administrator.');
              await supabase.auth.signOut();
            }
          } else {
            if (mounted) {
              setCurrentUser({
                id: profile.id,
                name: profile.name,
                displayName: profile.display_name || profile.name,
                email: profile.email,
                phone: profile.phone || '',
                jobTitle: profile.job_title || '',
                role: profile.role,
                status: profile.status,
                assignedWarehouse: profile.assigned_warehouse || '',
                createdAt: profile.created_at,
              });
              setAuthError(null);
              
              // Load company users list if admin/manager
              if (profile.role === 'Owner / Administrator' || profile.role === 'Manager') {
                const { data: companyUsers } = await supabase
                  .from('user_profiles')
                  .select('*')
                  .eq('company_id', profile.company_id);
                if (companyUsers) {
                  setUsers(companyUsers.map((u: any) => ({
                    id: u.id,
                    name: u.name,
                    displayName: u.display_name || u.name,
                    email: u.email,
                    phone: u.phone || '',
                    jobTitle: u.job_title || '',
                    role: u.role,
                    status: u.status,
                    assignedWarehouse: u.assigned_warehouse || '',
                    createdAt: u.created_at,
                  })));
                }
              }
            }
          }
        } else {
          if (mounted) {
            setCurrentUser(null);
          }
        }
      } catch (err: any) {
        if (mounted) {
          setAuthError(err.message || 'Failed to initialize session.');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadSessionAndProfile();

    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          await loadSessionAndProfile();
        } else if (event === 'SIGNED_OUT') {
          setCurrentUser(null);
          setUsers([]);
        }
      });

      return () => {
        subscription.unsubscribe();
        mounted = false;
      };
    }
  }, []);

  const signIn = async (email: string, pass: string): Promise<{ success: boolean; message: string }> => {
    if (!supabase) return { success: false, message: 'Supabase client not initialized.' };
    setAuthError(null);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
      if (error) return { success: false, message: error.message };

      if (data.user) {
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', data.user.id)
          .single();

        if (profileError || !profile) {
          await supabase.auth.signOut();
          return { success: false, message: 'Authenticated successfully, but no ERP profile exists. Please sign up or complete registration.' };
        }

        if (profile.status !== 'active') {
          await supabase.auth.signOut();
          return { success: false, message: 'Account is deactivated.' };
        }

        setCurrentUser({
          id: profile.id,
          name: profile.name,
          displayName: profile.display_name || profile.name,
          email: profile.email,
          phone: profile.phone || '',
          jobTitle: profile.job_title || '',
          role: profile.role,
          status: profile.status,
          assignedWarehouse: profile.assigned_warehouse || '',
          createdAt: profile.created_at,
        });
        return { success: true, message: 'Signed in successfully.' };
      }
      return { success: false, message: 'Sign in failed.' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Sign in error.' };
    }
  };

  const signUp = async (
    email: string, 
    pass: string, 
    companyName: string, 
    legalName: string, 
    fullName: string, 
    phone?: string
  ): Promise<{ success: boolean; message: string }> => {
    if (!supabase) return { success: false, message: 'Supabase client not initialized.' };
    try {
      // 1. Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({ email, password: pass });
      if (authError) return { success: false, message: authError.message };

      if (!authData.user) return { success: false, message: 'Registration failed in Auth.' };

      // 2. Call secure onboarding RPC to create company and initial Owner profile atomically
      const { data: companyId, error: rpcError } = await supabase.rpc('register_new_company', {
        p_company_name: companyName,
        p_legal_name: legalName,
        p_name: fullName,
        p_phone: phone || null,
      });

      if (rpcError) {
        return { success: false, message: `Company registration error: ${rpcError.message}` };
      }

      return { success: true, message: 'Company and administrator account created successfully.' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Sign up error.' };
    }
  };

  const signOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setCurrentUser(null);
    setUsers([]);
  };

  const updateCurrentUser = async (updates: Partial<UserProfile>): Promise<{ success: boolean; message?: string }> => {
    if (!currentUser || !supabase) return { success: false, message: 'Not authenticated' };
    const safeUpdates: any = {};
    if (updates.name) safeUpdates.name = updates.name;
    if (updates.displayName) safeUpdates.display_name = updates.displayName;
    if (updates.phone) safeUpdates.phone = updates.phone;
    if (updates.jobTitle) safeUpdates.job_title = updates.jobTitle;
    if (updates.assignedWarehouse) safeUpdates.assigned_warehouse = updates.assignedWarehouse;

    const { error } = await supabase
      .from('user_profiles')
      .update(safeUpdates)
      .eq('id', currentUser.id);

    if (error) return { success: false, message: error.message };

    setCurrentUser(prev => prev ? { ...prev, ...updates } : null);
    return { success: true, message: 'Profile updated successfully.' };
  };

  const updatePreferences = (updates: Partial<UserPreferences>) => {
    setPreferences(prev => ({ ...prev, ...updates }));
  };

  const inviteUser = async (data: Omit<UserProfile, 'id' | 'createdAt'>): Promise<{ success: boolean; message: string }> => {
    if (!currentUser || !supabase) return { success: false, message: 'Not authenticated' };
    if (currentUser.role !== 'Owner / Administrator') return { success: false, message: 'Permission denied: Only Owner / Administrator can invite users.' };

    const { data: companyIdResult } = await supabase
      .from('user_profiles')
      .select('company_id')
      .eq('id', currentUser.id)
      .single();

    if (!companyIdResult) return { success: false, message: 'Company context not found.' };

    const { error } = await supabase
      .from('user_profiles')
      .insert({
        company_id: companyIdResult.company_id,
        name: data.name,
        display_name: data.displayName || data.name,
        email: data.email,
        phone: data.phone,
        job_title: data.jobTitle,
        role: data.role,
        assigned_warehouse: data.assignedWarehouse,
        status: data.status || 'active',
      });

    if (error) return { success: false, message: error.message };
    return { success: true, message: 'User invited successfully.' };
  };

  const updateUser = async (id: string, updates: Partial<UserProfile>): Promise<{ success: boolean; message: string }> => {
    if (!supabase) return { success: false, message: 'Supabase not configured' };
    const safeUpdates: any = {};
    if (updates.name) safeUpdates.name = updates.name;
    if (updates.displayName) safeUpdates.display_name = updates.displayName;
    if (updates.phone) safeUpdates.phone = updates.phone;
    if (updates.jobTitle) safeUpdates.job_title = updates.jobTitle;
    if (updates.role) safeUpdates.role = updates.role;
    if (updates.assignedWarehouse) safeUpdates.assigned_warehouse = updates.assignedWarehouse;
    if (updates.status) safeUpdates.status = updates.status;

    const { error } = await supabase
      .from('user_profiles')
      .update(safeUpdates)
      .eq('id', id);

    if (error) return { success: false, message: error.message };
    return { success: true, message: 'User updated successfully.' };
  };

  const toggleUserStatus = async (id: string): Promise<{ success: boolean; message: string }> => {
    const target = users.find(u => u.id === id);
    if (!target) return { success: false, message: 'User not found.' };
    const newStatus = target.status === 'active' ? 'inactive' : 'active';
    return updateUser(id, { status: newStatus });
  };

  const deleteUser = async (id: string): Promise<{ success: boolean; message: string }> => {
    if (!supabase) return { success: false, message: 'Supabase not configured' };
    const { error } = await supabase.from('user_profiles').delete().eq('id', id);
    if (error) return { success: false, message: error.message };
    return { success: true, message: 'User removed successfully.' };
  };

  const revokeSession = (id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id));
  };

  const revokeAllOtherSessions = () => {
    setSessions(prev => prev.filter(s => s.isCurrent));
  };

  const changePassword = async (currentPass: string, newPass: string): Promise<{ success: boolean; message: string }> => {
    if (!supabase) return { success: false, message: 'Supabase not configured' };
    const { error } = await supabase.auth.updateUser({ password: newPass });
    if (error) return { success: false, message: error.message };
    return { success: true, message: 'Password updated successfully.' };
  };

  const isSuperAdmin = currentUser?.role === 'Owner / Administrator';

  return (
    <UserContext.Provider
      value={{
        currentUser,
        loading,
        signIn,
        signUp,
        signOut,
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
        isSuperAdmin,
        authError,
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
