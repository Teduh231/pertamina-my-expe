
import type { UserProfile } from '@/app/lib/definitions';
import { supabase } from './supabase/client';

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
        const { data: roleData, error: roleError } = await supabase
            .from('user_roles')
            .select('role, event_id')
            .eq('id', userId)
            .single();

        if (roleError && roleError.code !== 'PGRST116') { // PGRST116: row not found
             console.error('Error fetching user role:', roleError?.message);
             return null;
        }

        return {
            role: roleData?.role || 'staff', // Default to staff if no role found for some reason
            event_id: roleData?.event_id || null,
        };
    } catch (error) {
        console.error("Failed to fetch user profile, returning null:", error);
        return null;
    }
}
