
import type { UserProfile } from '@/app/lib/definitions';
import { supabase } from './supabase/client';

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
        const { data: roleData, error: roleError } = await supabase
            .from('user_roles')
            .select('role')
            .eq('id', userId)
            .single();

        if (roleError && roleError.code !== 'PGRST116') { // PGRST116: row not found
             console.error('Error fetching user role:', roleError?.message);
             return null;
        }

        const { data: tenantData, error: tenantError } = await supabase
            .from('tenants')
            .select('event_id')
            .eq('id', userId)
            .single();
        
        if (tenantError && tenantError.code !== 'PGRST116') {
             console.error('Error fetching tenant info:', tenantError?.message);
        }

        return {
            role: roleData?.role || 'tenant',
            event_id: tenantData?.event_id || null,
        };
    } catch (error) {
        console.error("Failed to fetch user profile, returning null:", error);
        return null;
    }
}
