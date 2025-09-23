'use client';

import React, { createContext, useContext as useReactContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/app/lib/supabase/client';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { getUserProfile } from '@/app/lib/data';
import type { UserProfile } from '@/app/lib/definitions';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  isAdmin: boolean;
  assignedBoothId: string | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<any>;
  signup: (email: string, pass: string) => Promise<any>;
  logout: () => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchSessionAndProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);

      if (session?.user) {
        const userProfile = await getUserProfile(session.user.id);
        setProfile(userProfile);
      }
      setLoading(false);
    };
    
    fetchSessionAndProfile();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        if (event === 'SIGNED_IN' && session?.user) {
          const userProfile = await getUserProfile(session.user.id);
          setProfile(userProfile);
        }
        if (event === 'SIGNED_OUT') {
          setProfile(null);
          router.push('/login');
        }
        setLoading(false);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  const login = async (email: string, pass: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) throw error;
  };

  const signup = async (email: string, pass: string) => {
    const { error } = await supabase.auth.signUp({ email, password: pass });
    if (error) throw error;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    // We push to login here as a fallback, but the onAuthStateChange should handle it.
    router.push('/login'); 
    router.refresh(); // Force a refresh to clear any cached user data.
  };

  const isAdmin = profile?.role === 'admin';
  const assignedBoothId = profile?.booth_id || null;

  const value = {
    user,
    profile,
    isAdmin,
    assignedBoothId,
    loading,
    login,
    signup,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useReactContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const ProtectedRoute: React.FC<{ children: React.ReactNode; adminOnly?: boolean }> = ({ children, adminOnly = false }) => {
    const { user, loading, isAdmin } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
  
    useEffect(() => {
      if (loading) return;
  
      if (!user) {
        router.push('/login');
        return;
      }

      if (adminOnly && !isAdmin) {
        // If it's an admin-only route and user is not an admin, redirect to dashboard
        router.push('/dashboard');
      }

    }, [user, loading, isAdmin, adminOnly, router, pathname]);
  
    if (loading || !user || (adminOnly && !isAdmin)) {
      return (
          <div className="flex h-screen items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin" />
          </div>
      );
    }
  
    return <>{children}</>;
};
