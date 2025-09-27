
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/app/lib/supabase/client';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { getUserProfile } from '@/app/lib/get-user-profile-client';
import type { UserProfile } from '@/app/lib/definitions';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  isAdmin: boolean;
  assignedEventId: string | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<any>;
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
      const user = session?.user ?? null;
      setUser(user);

      if (user) {
        const userProfile = await getUserProfile(user.id);
        setProfile(userProfile);
      }
      setLoading(false);
    };
    
    fetchSessionAndProfile();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const user = session?.user ?? null;
        setUser(user);
        if (event === 'SIGNED_IN' && user) {
          const userProfile = await getUserProfile(user.id);
          setProfile(userProfile);
        }
        if (event === 'SIGNED_OUT') {
          setProfile(null);
          router.push('/login');
        }
        // No need to set loading to false here as the initial load handles it.
        // This prevents flashes of content.
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

  const logout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const isAdmin = profile?.role === 'admin';
  const assignedEventId = profile?.event_id || null;

  const value = {
    user,
    profile,
    isAdmin,
    assignedEventId,
    loading,
    login,
    logout,
  };

  // Centralized loading and auth protection
  const publicPaths = ['/login', '/']; 
  const pathIsProtected = !publicPaths.includes(usePathname());
  
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user && pathIsProtected) {
    // Redirect logic handled by middleware, but this is a client-side failsafe
     if (typeof window !== 'undefined') {
      router.push('/login');
    }
    return (
        <div className="flex h-screen w-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    );
  }
  
  if (user && !pathIsProtected) {
    if (typeof window !== 'undefined') {
        router.push('/dashboard');
    }
    return (
        <div className="flex h-screen w-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
