
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
  const pathname = usePathname();

  useEffect(() => {
    const fetchSessionAndProfile = async () => {
      setLoading(true);
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
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  const isAdmin = profile?.role === 'admin';
  const assignedEventId = profile?.event_id || null;

  const login = async (email: string, pass: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) throw error;
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const value = {
    user,
    profile,
    isAdmin,
    assignedEventId,
    loading,
    login,
    logout,
  };

  const publicPaths = ['/login', '/', '/booths/[id]/register', '/events/[id]/register']; 
  
  const isPublicPath = (path: string) => {
    if (publicPaths.includes(path)) return true;
    // Handle dynamic paths
    if (path.startsWith('/booths/') && path.endsWith('/register')) return true;
    if (path.startsWith('/events/') && path.endsWith('/register')) return true;
    return false;
  }
  
  const pathIsProtected = !isPublicPath(pathname);

  useEffect(() => {
    if (!loading && !user && pathIsProtected) {
      router.push('/login');
    }
    if (!loading && user && !pathIsProtected) {
      router.push('/dashboard');
    }
  }, [user, loading, pathIsProtected, router]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if ((!user && pathIsProtected) || (user && !pathIsProtected)) {
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

export const ProtectedRoute: React.FC<{ children: React.ReactNode, adminOnly?: boolean }> = ({ children, adminOnly = false }) => {
    const { user, profile, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push('/login');
            } else if (adminOnly && profile?.role !== 'admin') {
                router.push('/dashboard');
            }
        }
    }, [user, profile, loading, router, adminOnly]);
    
    if (loading || !user || (adminOnly && profile?.role !== 'admin')) {
        return (
            <div className="flex h-[calc(100vh-theme(space.16))] w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }
    return <>{children}</>;
};
