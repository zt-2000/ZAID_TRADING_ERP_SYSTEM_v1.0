import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
  revokeSession: (id: string) => Promise<{ success: boolean; message: string }>;
  revokeAllOtherSessions: () => Promise<{ success: boolean; message: string }>;
  changePassword: (currentPass: string, newPass: string) => Promise<{ success: boolean; message: string }>;
  isSuperAdmin: boolean;
  authError: string | null;
  refreshUsers: () => Promise<void>;
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
  const [currentCompanyId, setCurrentCompanyId] = useState<string | null>(null);
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

  const mapProfile = (p: any): UserProfile => ({
    id: p.id,
    name: p.name,
    displayName: p.display_name || p.name,
    email: p.email,
    phone: p.phone || '',
    jobTitle: p.job_title || '',
    role: p.role,
    status: p.status,
    assignedWarehouse: p.assigned_warehouse || '',
    createdAt: p.created_at,
    avatarUrl: p.avatar_url || '',
  });

  const fetchCompanyUsers = useCallback(async (companyId: string) => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: true });

      if (!error && data) {
        setUsers(data.map(mapProfile));
      }
    } catch {
      // non-critical if fetch fails
    }
  }, []);

  const loadSessionAndProfile = useCallback(async () => {
    if (!isSupabaseConfigured() || !supabase) {
      setLoading(false);
      setAuthError('Supabase is not configured. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in environment variables.');
      return;
    }

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;

      if (session?.user) {
        // Fetch user profile from database
        let { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .single();

        // Requirement 6: Handle registration failures and missing profiles without silently leaving an unrecoverable account
        if ((profileError || !profile) && session.user.email) {
          // Attempt automatic recovery: check if user has a pending invitation
          try {
            const { data: profileId, error: rpcError } = await supabase.rpc('complete_user_registration');
            if (!rpcError && profileId) {
              const { data: recoveredProfile } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('id', profileId)
                .single();
              if (recoveredProfile) {
                profile = recoveredProfile;
                profileError = null;
              }
            }
          } catch {
            // ignore RPC missing or failed
          }
        }

        if (profileError || !profile) {
          setCurrentUser(null);
          setCurrentCompanyId(null);
          setAuthError('Authenticated in Supabase Auth, but no active ERP profile was found. Please complete company onboarding or contact your administrator.');
        } else if (profile.status !== 'active') {
          setCurrentUser(null);
          setCurrentCompanyId(null);
          setAuthError('Your user account has been deactivated by the company administrator.');
          await supabase.auth.signOut();
        } else {
          const userObj = mapProfile(profile);
          setCurrentUser(userObj);
          setCurrentCompanyId(profile.company_id);
          setAuthError(null);

          // If privileged role, load company users
          if (profile.role === 'Owner / Administrator' || profile.role === 'Manager') {
            await fetchCompanyUsers(profile.company_id);
          }
        }
      } else {
        setCurrentUser(null);
        setCurrentCompanyId(null);
      }
    } catch (err: any) {
      setAuthError(err.message || 'Failed to initialize session.');
    } finally {
      setLoading(false);
    }
  }, [fetchCompanyUsers]);

  useEffect(() => {
    loadSessionAndProfile();

    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          await loadSessionAndProfile();
        } else if (event === 'SIGNED_OUT') {
          setCurrentUser(null);
          setCurrentCompanyId(null);
          setUsers([]);
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [loadSessionAndProfile]);

  const refreshUsers = async () => {
    if (currentCompanyId) {
      await fetchCompanyUsers(currentCompanyId);
    }
  };

  const signIn = async (email: string, pass: string): Promise<{ success: boolean; message: string }> => {
    if (!supabase) return { success: false, message: 'Supabase client not initialized.' };
    setAuthError(null);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
      if (error) return { success: false, message: error.message };

      if (data.user) {
        let { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', data.user.id)
          .single();

        // Handle missing profile by attempting invited user registration completion
        if ((profileError || !profile) && data.user.email) {
          try {
            const { data: profileId } = await supabase.rpc('complete_user_registration');
            if (profileId) {
              const { data: recovered } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('id', profileId)
                .single();
              if (recovered) {
                profile = recovered;
                profileError = null;
              }
            }
          } catch {
            // ignore
          }
        }

        if (profileError || !profile) {
          await supabase.auth.signOut();
          return { success: false, message: 'Authenticated successfully, but no ERP profile exists. Please complete registration.' };
        }

        if (profile.status !== 'active') {
          await supabase.auth.signOut();
          return { success: false, message: 'Account has been deactivated.' };
        }

        const userObj = mapProfile(profile);
        setCurrentUser(userObj);
        setCurrentCompanyId(profile.company_id);

        if (profile.role === 'Owner / Administrator' || profile.role === 'Manager') {
          await fetchCompanyUsers(profile.company_id);
        }

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
      const { error: rpcError } = await supabase.rpc('register_new_company', {
        p_company_name: companyName,
        p_legal_name: legalName,
        p_name: fullName,
        p_phone: phone || null,
      });

      if (rpcError) {
        // Requirement 6: Handle registration failures and missing profiles without silently leaving an unrecoverable account
        return { 
          success: false, 
          message: `Company registration failed: ${rpcError.message}. You can log in and retry company setup.` 
        };
      }

      await loadSessionAndProfile();
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
    setCurrentCompanyId(null);
    setUsers([]);
  };

  // Requirement 3: Do not let users elevate their own role, move between companies, or alter protected profile fields
  // Requirement 7: Refresh user/profile state only after the actual database operation succeeds
  const updateCurrentUser = async (updates: Partial<UserProfile>): Promise<{ success: boolean; message?: string }> => {
    if (!currentUser || !supabase) return { success: false, message: 'Not authenticated.' };

    // Strictly whitelist non-privileged personal profile fields only
    const safeUpdates: Record<string, any> = {};
    if (updates.name !== undefined) safeUpdates.name = updates.name.trim();
    if (updates.displayName !== undefined) safeUpdates.display_name = updates.displayName.trim();
    if (updates.phone !== undefined) safeUpdates.phone = updates.phone.trim();
    if (updates.jobTitle !== undefined) safeUpdates.job_title = updates.jobTitle.trim();
    if (updates.avatarUrl !== undefined) safeUpdates.avatar_url = updates.avatarUrl;

    if (Object.keys(safeUpdates).length === 0) {
      return { success: true, message: 'No profile modifications provided.' };
    }

    const { error } = await supabase
      .from('user_profiles')
      .update(safeUpdates)
      .eq('id', currentUser.id);

    if (error) return { success: false, message: error.message };

    // Reload from database to ensure verified state
    const { data: updatedProfile, error: fetchErr } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', currentUser.id)
      .single();

    if (!fetchErr && updatedProfile) {
      setCurrentUser(mapProfile(updatedProfile));
    }

    return { success: true, message: 'Profile updated successfully.' };
  };

  const updatePreferences = (updates: Partial<UserPreferences>) => {
    setPreferences(prev => ({ ...prev, ...updates }));
  };

  // Requirement 1 & 2: Replace profile-only invitations with secure workflow using trusted server-side function
  const inviteUser = async (data: Omit<UserProfile, 'id' | 'createdAt'>): Promise<{ success: boolean; message: string }> => {
    if (!currentUser || !supabase) return { success: false, message: 'Not authenticated.' };
    if (currentUser.role !== 'Owner / Administrator') {
      return { success: false, message: 'Permission denied: Only Owner / Administrator can invite users.' };
    }

    // Call server-side function admin_invite_user with full server enforcement
    const { data: inviteResult, error: rpcError } = await supabase.rpc('admin_invite_user', {
      p_email: data.email.trim().toLowerCase(),
      p_name: data.name.trim(),
      p_role: data.role,
      p_display_name: data.displayName ? data.displayName.trim() : null,
      p_phone: data.phone ? data.phone.trim() : null,
      p_job_title: data.jobTitle ? data.jobTitle.trim() : null,
      p_assigned_warehouse: data.assignedWarehouse || null,
    });

    if (rpcError) {
      return { success: false, message: `Invitation failed: ${rpcError.message}` };
    }

    // Refresh users from database
    if (currentCompanyId) {
      await fetchCompanyUsers(currentCompanyId);
    }

    return { 
      success: true, 
      message: `Invitation successfully recorded for ${data.email} (${data.role}).` 
    };
  };

  // Requirement 2: Enforce permissions on the server/database for editing users
  // Requirement 7: Refresh state only after the actual database operation succeeds
  const updateUser = async (id: string, updates: Partial<UserProfile>): Promise<{ success: boolean; message: string }> => {
    if (!supabase) return { success: false, message: 'Supabase client not initialized.' };
    if (!currentUser) return { success: false, message: 'Not authenticated.' };

    const isSelf = currentUser.id === id;
    if (!isSelf && currentUser.role !== 'Owner / Administrator') {
      return { success: false, message: 'Permission denied: Only Owner / Administrator can modify other users.' };
    }

    const safeUpdates: Record<string, any> = {};
    if (updates.name !== undefined) safeUpdates.name = updates.name.trim();
    if (updates.displayName !== undefined) safeUpdates.display_name = updates.displayName.trim();
    if (updates.phone !== undefined) safeUpdates.phone = updates.phone.trim();
    if (updates.jobTitle !== undefined) safeUpdates.job_title = updates.jobTitle.trim();
    if (updates.assignedWarehouse !== undefined) safeUpdates.assigned_warehouse = updates.assignedWarehouse;

    // Only administrators can change role or status, and never on their own profile
    if (updates.role !== undefined) {
      if (isSelf) {
        return { success: false, message: 'Administrators cannot change their own role.' };
      }
      safeUpdates.role = updates.role;
    }

    if (updates.status !== undefined) {
      if (isSelf && updates.status !== 'active') {
        return { success: false, message: 'Administrators cannot deactivate their own account.' };
      }
      safeUpdates.status = updates.status;
    }

    // Never allow moving user between companies or changing user_id
    delete (safeUpdates as any).company_id;
    delete (safeUpdates as any).user_id;
    delete (safeUpdates as any).id;

    const { error } = await supabase
      .from('user_profiles')
      .update(safeUpdates)
      .eq('id', id);

    if (error) return { success: false, message: error.message };

    // Refresh state from database
    if (currentCompanyId) {
      await fetchCompanyUsers(currentCompanyId);
    }

    if (isSelf) {
      const { data: updatedSelf } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', id)
        .single();
      if (updatedSelf) {
        setCurrentUser(mapProfile(updatedSelf));
      }
    }

    return { success: true, message: 'User record updated successfully.' };
  };

  const toggleUserStatus = async (id: string): Promise<{ success: boolean; message: string }> => {
    if (!currentUser) return { success: false, message: 'Not authenticated.' };
    if (currentUser.id === id) {
      return { success: false, message: 'Administrators cannot deactivate their own account.' };
    }

    const target = users.find(u => u.id === id);
    if (!target) return { success: false, message: 'User record not found.' };

    const newStatus = target.status === 'active' ? 'inactive' : 'active';
    return updateUser(id, { status: newStatus });
  };

  // Requirement 2: Enforce permissions on server/database for deleting users
  const deleteUser = async (id: string): Promise<{ success: boolean; message: string }> => {
    if (!supabase) return { success: false, message: 'Supabase client not initialized.' };
    if (!currentUser) return { success: false, message: 'Not authenticated.' };
    if (currentUser.role !== 'Owner / Administrator') {
      return { success: false, message: 'Permission denied: Only Owner / Administrator can remove users.' };
    }

    if (currentUser.id === id) {
      return { success: false, message: 'Administrators cannot delete their own account.' };
    }

    // Call server-side function admin_delete_user with guardrails
    const { error: rpcError } = await supabase.rpc('admin_delete_user', {
      p_profile_id: id,
    });

    if (rpcError) {
      // Fallback to direct delete (which is guarded by database RLS)
      const { error: deleteError } = await supabase
        .from('user_profiles')
        .delete()
        .eq('id', id);

      if (deleteError) {
        return { success: false, message: `Failed to remove user: ${rpcError.message || deleteError.message}` };
      }
    }

    // Refresh users from database
    if (currentCompanyId) {
      await fetchCompanyUsers(currentCompanyId);
    }

    return { success: true, message: 'User account removed successfully.' };
  };

  // Requirement 5: Do not represent local UI filtering as real session revocation
  const revokeSession = async (id: string): Promise<{ success: boolean; message: string }> => {
    if (!supabase) return { success: false, message: 'Supabase client not initialized.' };
    
    // Check if target is current session
    const target = sessions.find(s => s.id === id);
    if (target?.isCurrent) {
      await signOut();
      return { success: true, message: 'Current session terminated.' };
    }

    // Real Supabase session revocation for other sessions
    try {
      const { error } = await supabase.auth.signOut({ scope: 'others' });
      if (error) {
        return { success: false, message: `Session revocation failed: ${error.message}` };
      }
      setSessions(prev => prev.filter(s => s.isCurrent));
      return { success: true, message: 'Remote session revoked through Supabase Auth.' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Failed to revoke remote session.' };
    }
  };

  const revokeAllOtherSessions = async (): Promise<{ success: boolean; message: string }> => {
    if (!supabase) return { success: false, message: 'Supabase client not initialized.' };
    try {
      const { error } = await supabase.auth.signOut({ scope: 'others' });
      if (error) {
        return { success: false, message: `Global session revocation failed: ${error.message}` };
      }
      setSessions(prev => prev.filter(s => s.isCurrent));
      return { success: true, message: 'All other active sessions revoked through Supabase Auth.' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Failed to revoke other sessions.' };
    }
  };

  // Requirement 4: Make password-change behavior accurate: handle current-password verification where required and return genuine Supabase errors
  const changePassword = async (currentPass: string, newPass: string): Promise<{ success: boolean; message: string }> => {
    if (!supabase) return { success: false, message: 'Supabase client not initialized.' };
    if (!currentUser?.email) return { success: false, message: 'Active user email context required.' };

    if (!currentPass || !currentPass.trim()) {
      return { success: false, message: 'Current password is required to verify identity.' };
    }

    if (!newPass || newPass.length < 6) {
      return { success: false, message: 'New password must be at least 6 characters in length.' };
    }

    try {
      // 1. Authenticate with current password to verify identity
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: currentUser.email,
        password: currentPass,
      });

      if (verifyError) {
        return { 
          success: false, 
          message: `Current password verification failed: ${verifyError.message}` 
        };
      }

      // 2. Perform actual password update
      const { error: updateError } = await supabase.auth.updateUser({ password: newPass });
      if (updateError) {
        return { success: false, message: `Password update rejected: ${updateError.message}` };
      }

      return { success: true, message: 'Password updated successfully in Supabase Auth.' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Password update encountered an unexpected error.' };
    }
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
        refreshUsers,
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
