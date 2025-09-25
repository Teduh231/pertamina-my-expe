
'use server';

import { detectPii } from '@/ai/flows/pii-detection-for-registration';
import { Activity, ActivityParticipant, Attendee, Booth, Product, Raffle, RaffleWinner, Tenant, Transaction } from './definitions';
import { getBoothById, getAttendees, getAttendeeById, getActivityById, getProductById } from './data';
import { revalidatePath } from 'next/cache';
import { unstable_noStore as noStore } from 'next/cache';
import { supabase as supabaseClient } from './supabase/client';
import { supabaseAdmin } from './supabase/server';
import { cookies }from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { format } from 'date-fns';

// Placeholder function for sending message.
// You need to integrate a real messaging service like Twilio.
async function sendQrCodeMessage(recipientPhoneNumber: string, attendeeName: string, boothName:string, qrCodeUrl: string) {
  console.log(`Simulating sending SMS to ${recipientPhoneNumber}`);
  console.log(`Attendee: ${attendeeName}`);
  console.log(`Booth: ${boothName}`);
  console.log(`QR Code URL: ${qrCodeUrl}`);
  
  // For now, we'll just return a success promise.
  return Promise.resolve();
}


export async function detectPiiInField(fieldName: string, fieldValue: string) {
  // This function still uses AI, but doesn't write to DB. Keeping it as is.
  if (!fieldValue || fieldValue.trim().length < 3) {
    return { mayContainPii: false };
  }
  try {
    const result = await detectPii({ fieldName, fieldValue });
    return result;
  } catch (error) {
    console.error('Error in PII detection flow:', error);
    // Be cautious and assume PII if AI fails
    return { mayContainPii: true };
  }
}

export async function exportBoothAttendeesToCsv(boothId: string): Promise<string> {
    noStore();
    const booth = await getBoothById(boothId);
    if (!booth) {
        throw new Error('Booth not found');
    }

    const checkIns = booth.check_ins || [];

    if (checkIns.length === 0) {
        return "attendee_id,name,phone_number,checked_in_at\n";
    }

    const headers = ['attendee_id', 'name', 'phone_number', 'checked_in_at'];
    const csvRows = [headers.join(',')];

    for (const checkIn of checkIns) {
        if (checkIn.attendees) {
            const values = [
                checkIn.attendee_id,
                checkIn.attendees.name,
                checkIn.attendees.phone_number,
                format(new Date(checkIn.checked_in_at), 'yyyy-MM-dd HH:mm:ss'),
            ].map(value => {
                if (typeof value === 'string' && value.includes(',')) {
                    return `"${value}"`;
                }
                return value;
            });
            csvRows.push(values.join(','));
        }
    }

    return csvRows.join('\n');
}

export async function exportAttendeesToCsv(boothId: string): Promise<string> {
    noStore();
    const booth = await getBoothById(boothId);
    const allAttendees = await getAttendees();

    if (!booth) {
        throw new Error('Booth not found');
    }
    
    // In the new model, we just export all attendees since they are not tied to a booth
    const attendees = allAttendees;

    if (attendees.length === 0) {
        return "id,name,phone_number,registered_at,points,custom_response\n";
    }

    const headers = ['id', 'name', 'phone_number', 'registered_at', 'points', 'custom_response'];
    const csvRows = [headers.join(',')];

    for (const attendee of attendees) {
        const values = headers.map(header => {
            const value = attendee[header as keyof Attendee];
            // Handle values that might contain commas
            if (typeof value === 'string' && value.includes(',')) {
                return `"${value}"`;
            }
            return value;
        });
        csvRows.push(values.join(','));
    }

    return csvRows.join('\n');
}

export async function createOrUpdateBooth(formData: Partial<Booth> & { booth_user_email?: string, booth_user_password?: string }, boothId?: string) {
  const cookieStore = cookies();
  const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
          cookies: {
              get(name: string) {
                  return cookieStore.get(name)?.value
              },
          },
      }
  );
  
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Authentication required.' };
  }

  const { attendees, booth_user_email, booth_user_password, ...restOfBoothData } = formData;
  const dataToUpsert = { ...restOfBoothData };

  if (boothId) {
    // Update existing booth
    const { error } = await supabaseAdmin
      .from('booths')
      .update(dataToUpsert)
      .eq('id', boothId);
    
    if (error) {
      console.error('Supabase error updating booth:', error);
      return { success: false, error: 'Database error: Could not update booth.' };
    }
    revalidatePath(`/booths/${boothId}`);
    revalidatePath(`/booth-dashboard/${boothId}`);
  } else {
    // Create new booth, initiated by a tenant, so it should be pending
    dataToUpsert.user_id = user.id;
    dataToUpsert.status = 'pending';
    
    const { data, error } = await supabaseAdmin
      .from('booths')
      .insert([dataToUpsert])
      .select('id')
      .single();

    if (error || !data) {
        console.error('Supabase error creating booth:', error);
        return { success: false, error: 'Database error: Could not create booth.' };
    }
    boothId = data.id;

    // If user details are provided, create the user and tenant record (admin-only feature)
    const {data: { session }} = await supabase.auth.getSession();
    const userRole = session?.user?.user_metadata?.role;
    if (userRole === 'admin' && booth_user_email && booth_user_password) {
        const createTenantResult = await createTenantUser({
            name: restOfBoothData.booth_manager, // Use booth manager name for the tenant name
            email: booth_user_email,
            password: booth_user_password,
            booth_id: boothId,
        });

        if (!createTenantResult.success) {
            // Attempt to clean up the created booth if tenant creation fails
            await supabaseAdmin.from('booths').delete().eq('id', boothId);
            return { success: false, error: `Booth created, but failed to create user: ${createTenantResult.error}` };
        }
    }
  }

  revalidatePath('/booths');
  revalidatePath('/tenants');
  revalidatePath('/dashboard');
  revalidatePath('/tenant-dashboard');
  return { success: true, boothId };
}

export async function deleteBooth(boothId: string) {
    const { data, error } = await supabaseAdmin
      .from('booths')
      .select('image_path')
      .eq('id', boothId)
      .single();

    if (error) {
      console.error('Supabase error fetching booth for deletion:', error);
    }
    if (data?.image_path) {
        const { error: storageError } = await supabaseAdmin.storage.from('images').remove([data.image_path]);
        if (storageError) {
            console.error('Supabase storage error deleting image:', storageError);
        }
    }

    const { error: checkinError } = await supabaseAdmin
      .from('check_ins')
      .delete()
      .eq('booth_id', boothId);

    if (checkinError) {
      console.error('Supabase error deleting check-ins:', checkinError);
      return { success: false, error: 'Database error: Could not delete associated check-ins.' };
    }
    
    const { error: tenantUnassignError } = await supabaseAdmin
      .from('tenants')
      .update({ booth_id: null })
      .eq('booth_id', boothId);

    if (tenantUnassignError) {
        console.error('Supabase error unassigning tenants:', tenantUnassignError);
    }
  
    const { error: boothError } = await supabaseAdmin
      .from('booths')
      .delete()
      .eq('id', boothId);
  
    if (boothError) {
      console.error('Supabase error deleting booth:', boothError);
      return { success: false, error: 'Database error: Could not delete booth.' };
    }
  
    revalidatePath('/booths');
    revalidatePath('/dashboard');
    revalidatePath('/tenants');
    revalidatePath('/tenant-dashboard');
    return { success: true };
}

export async function registerAttendee(registrationData: Omit<Attendee, 'id' | 'registered_at' | 'qr_code_url' | 'points'>) {
    // Attendee is no longer registered to a specific booth, so boothId is removed.
    const { data: newAttendee, error } = await supabaseClient
        .from('attendees')
        .insert([{ ...registrationData, points: 100 }]) // Award 100 points on registration
        .select()
        .single();

    if (error || !newAttendee) {
        console.error('Supabase error registering attendee:', error);
        if (error?.code === '23505') { // unique_violation for phone_number
            return { success: false, error: 'This phone number has already been registered.' };
        }
        return { success: false, error: 'Database error: Could not register attendee.' };
    }

    // Generate QR code URL using the unique attendee ID
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${newAttendee.id}`;

    // Update the attendee with the generated QR code URL
    const { error: updateError } = await supabaseClient
        .from('attendees')
        .update({ qr_code_url: qrCodeUrl })
        .eq('id', newAttendee.id);

    if (updateError) {
        console.error('Supabase error updating attendee with QR code:', updateError);
    } else {
        await sendQrCodeMessage(newAttendee.phone_number, newAttendee.name, 'EventFlow', qrCodeUrl);
    }

    revalidatePath(`/booths`); // Revalidate booths pages
    revalidatePath('/attendees');
    revalidatePath('/dashboard');
    return { success: true };
}


export async function createRaffle(raffleData: Omit<Raffle, 'id' | 'status' | 'winners' | 'drawn_at'>) {
    const { error } = await supabaseAdmin.from('raffles').insert([raffleData]);
    if (error) {
        console.error('Supabase error creating raffle:', error);
        return { success: false, error: 'Database error: Could not create raffle.' };
    }
    revalidatePath(`/booth-dashboard/${raffleData.booth_id}`);
    return { success: true };
}

export async function drawRaffleWinner(raffleId: string, boothId: string) {
  noStore();
  const { data: raffle, error: raffleError } = await supabaseAdmin
    .from('raffles')
    .select('*')
    .eq('id', raffleId)
    .single();

  if (raffleError || !raffle) {
    console.error('Error fetching raffle:', raffleError);
    return { success: false, error: 'Could not find the specified raffle.' };
  }

  // Get attendees who have checked in to this specific booth
  const { data: checkIns, error: checkInError } = await supabaseAdmin
    .from('check_ins')
    .select('attendees(*)')
    .eq('booth_id', boothId);
  
  if (checkInError || !checkIns) {
    console.error('Error fetching check-ins:', checkInError);
    return { success: false, error: 'Could not fetch attendees for this booth.' };
  }
  const attendeesForBooth = checkIns.map(ci => ci.attendees).filter(Boolean) as Attendee[];

  const drawnWinnerIds = raffle.winners?.map((w: RaffleWinner) => w.attendeeId) || [];
  const eligibleAttendees = attendeesForBooth.filter(
    (attendee: Attendee) => attendee && !drawnWinnerIds.includes(attendee.id)
  );

  if (eligibleAttendees.length === 0) {
    await supabaseAdmin.from('raffles').update({ status: 'finished' }).eq('id', raffleId);
    revalidatePath(`/booth-dashboard/${raffle.booth_id}`);
    return { success: true, message: 'No more eligible attendees to draw.' };
  }
  
  const winnerIndex = Math.floor(Math.random() * eligibleAttendees.length);
  const winner = eligibleAttendees[winnerIndex];

  const newWinner: RaffleWinner = {
    attendeeId: winner.id,
    name: winner.name,
    phone_number: winner.phone_number,
  };

  const updatedWinners = [...(raffle.winners || []), newWinner];

  const updatedRaffle: Partial<Raffle> = {
    winners: updatedWinners,
    status: updatedWinners.length >= raffle.number_of_winners ? 'finished' : 'active',
    drawn_at: updatedWinners.length >= raffle.number_of_winners ? new Date().toISOString() : null,
  };

  const { error: updateError } = await supabaseAdmin
    .from('raffles')
    .update(updatedRaffle)
    .eq('id', raffleId);

  if (updateError) {
    console.error('Error updating raffle:', updateError);
    return { success: false, error: 'Could not save the winner.' };
  }
  
  revalidatePath(`/booth-dashboard/${raffle.booth_id}`);
  
  return { success: true, winner: newWinner };
}


export async function redeemMerchandiseForAttendee(attendeeId: string, productId: string, boothId: string) {
    noStore();
    const attendee = await getAttendeeById(attendeeId);
    if (!attendee) {
        return { success: false, error: "Attendee not found." };
    }

    const { data: product, error: productError } = await supabaseAdmin.from('products').select('id, name, points, stock').eq('id', productId).single();

    if (productError || !product) {
        return { success: false, error: "Product not found." };
    }

    if (product.stock <= 0) {
        return { success: false, error: `Sorry, "${product.name}" is out of stock.` };
    }
    if (attendee.points < product.points) {
        return { success: false, error: `Attendee has insufficient points. Needs ${product.points}, has ${attendee.points}.`, attendeeName: attendee.name, };
    }

    const newAttendeePoints = attendee.points - product.points;

    const { error: updateAttendeeError } = await supabaseAdmin.from('attendees').update({ points: newAttendeePoints }).eq('id', attendee.id);
    const { error: updateProductError } = await supabaseAdmin.from('products').update({ stock: product.stock - 1 }).eq('id', product.id);

    if (updateAttendeeError || updateProductError) {
        return { success: false, error: "Database error during transaction." };
    }
    
    revalidatePath(`/booth-dashboard/${boothId}`);

    return {
        success: true,
        message: `Successfully redeemed ${product.name} for ${attendee.name}.`,
        attendeeName: attendee.name,
        pointsUsed: product.points,
        remainingPoints: newAttendeePoints
    };
}


async function createTenantUser(tenantData: { name: string; email: string; password?: string; booth_id: string | null; }) {
    if (!tenantData.password) {
        return { success: false, error: 'Password is required for new users.' };
    }
    // 1. Create user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: tenantData.email,
      password: tenantData.password,
      email_confirm: true, // Auto-confirm email
    });

    if (authError) {
      console.error('Supabase Auth error creating tenant user:', authError);
      return { success: false, error: authError.message };
    }

    const userId = authData.user.id;

    // 2. Insert into tenants table
    const { error: dbError } = await supabaseAdmin
      .from('tenants')
      .insert({
        id: userId, // Use the same ID from auth user
        name: tenantData.name,
        email: tenantData.email,
        booth_id: tenantData.booth_id === 'unassigned' ? null : tenantData.booth_id,
      });

    if (dbError) {
      console.error('Supabase DB error creating tenant record:', dbError);
      // Attempt to clean up the created auth user
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return { success: false, error: 'Database error: Could not create tenant record.' };
    }
    
    return { success: true };
}


export async function createOrUpdateTenant(formData: FormData) {
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const booth_id = formData.get('booth_id') as string | null;
  const tenantId = formData.get('tenantId') as string | undefined;

  if (tenantId) {
    // Update existing tenant logic (only name and booth assignment)
    const { error } = await supabaseAdmin
      .from('tenants')
      .update({ name, booth_id: booth_id === 'unassigned' ? null : booth_id })
      .eq('id', tenantId);

    if (error) {
      console.error('Supabase DB error updating tenant:', error);
      return { success: false, error: 'Database error: Could not update tenant.' };
    }
  } else {
    // Create new tenant and auth user
    const result = await createTenantUser({
        name,
        email,
        password,
        booth_id,
    });
    if (!result.success) {
        return result;
    }
  }

  revalidatePath('/tenants');
  return { success: true };
}

  
export async function deleteTenant(tenantId: string) {
    // First, delete the user from Supabase Auth
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(tenantId);
    if (authError) {
        // If user is already deleted from auth, we might get a "User not found" error.
        // We can choose to ignore this or handle it, for now we log and continue.
        console.warn('Supabase Auth error deleting tenant. Might be already deleted. Continuing...', authError.message);
    }
    
    // Then, delete the record from the tenants table
    const { error: dbError } = await supabaseAdmin
      .from('tenants')
      .delete()
      .eq('id', tenantId);
  
    if (dbError) {
      console.error('Supabase DB error deleting tenant:', dbError);
      return { success: false, error: 'Database error: Could not delete tenant record.' };
    }
  
    revalidatePath('/tenants');
    return { success: true };
}


export async function createProduct(productData: Omit<Product, 'id' | 'created_at'>) {
    const { data, error } = await supabaseAdmin
        .from('products')
        .insert([productData])
        .select()
        .single();

    if (error || !data) {
        console.error('Supabase error creating product:', error);
        return { success: false, error: 'Database error: Could not create product.' };
    }
    
    revalidatePath(`/booth-dashboard/${productData.booth_id}/pos`);
    return { success: true, product: data };
}

export async function createCheckIn(attendeeId: string, boothId: string) {
  const { data, error } = await supabaseAdmin
    .from('check_ins')
    .insert({ attendee_id: attendeeId, booth_id: boothId })
    .select()
    .single();

  if (error) {
    console.error('Supabase error creating check-in:', error);
    // Handle unique constraint violation gracefully
    if (error.code === '23505') {
      return { success: false, error: 'Attendee has already checked into this specific booth.' };
    }
    return { success: false, error: `Database error: Could not record check-in. (${error.message})` };
  }
  revalidatePath(`/booth-dashboard/${boothId}/scanner`);
  return { success: true, checkIn: data };
}

export async function uploadImage(formData: FormData) {
    const file = formData.get('file') as File;
    if (!file) {
        return { success: false, error: 'No file provided.' };
    }

    const fileExtension = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExtension}`;
    const filePath = `public/${fileName}`;

    const { error: uploadError } = await supabaseAdmin.storage.from('images').upload(filePath, file);

    if (uploadError) {
        console.error('Supabase storage error:', uploadError);
        return { success: false, error: 'Failed to upload image.' };
    }

    const { data: { publicUrl } } = supabaseClient.storage.from('images').getPublicUrl(filePath);

    return { success: true, url: publicUrl, path: filePath };
}

export async function createActivity(activityData: Omit<Activity, 'id' | 'created_at' | 'updated_at' | 'participant_count'>) {
    const { data, error } = await supabaseAdmin
        .from('activities')
        .insert([{...activityData, updated_at: new Date() }])
        .select()
        .single();

    if (error || !data) {
        console.error('Supabase error creating activity:', error);
        return { success: false, error: 'Database error: Could not create activity.' };
    }
    
    revalidatePath(`/booth-dashboard/${activityData.booth_id}/activity`);
    return { success: true, activity: data };
}


export async function addActivityParticipant(activityId: string, attendeeId: string) {
    noStore();
    // 1. Get attendee and activity details
    const attendee = await getAttendeeById(attendeeId);
    const activity = await getActivityById(activityId);

    if (!attendee) {
        return { success: false, error: "Attendee not found." };
    }
    if (!activity) {
        return { success: false, error: "Activity not found." };
    }

    // 2. Check if already participated
    const { data: existingParticipant, error: checkError } = await supabaseAdmin
        .from('activity_participants')
        .select('id')
        .eq('activity_id', activityId)
        .eq('attendee_id', attendeeId)
        .maybeSingle();

    if (checkError) {
        console.error('Error checking for existing participant:', checkError);
        return { success: false, error: 'Database error while checking participation.' };
    }
    if (existingParticipant) {
        return { success: false, error: `Attendee has already completed "${activity.name}".`, attendeeName: attendee.name, isInfo: true };
    }

    // 3. Award points and create participant record
    const newTotalPoints = attendee.points + activity.points_reward;
    const { error: updatePointsError } = await supabaseAdmin
        .from('attendees')
        .update({ points: newTotalPoints })
        .eq('id', attendeeId);

    if (updatePointsError) {
        return { success: false, error: "Failed to update attendee points." };
    }

    const { error: insertError } = await supabaseAdmin
        .from('activity_participants')
        .insert({
            activity_id: activityId,
            attendee_id: attendeeId,
            points_awarded: activity.points_reward,
        });
    
    if (insertError) {
        // Attempt to roll back points
        await supabaseAdmin.from('attendees').update({ points: attendee.points }).eq('id', attendeeId);
        return { success: false, error: "Failed to record activity completion." };
    }
    
    revalidatePath(`/booth-dashboard/${activity.booth_id}/activity`);
    revalidatePath(`/booth-dashboard/${activity.booth_id}/activity/${activityId}`);

    return {
        success: true,
        message: `Awarded ${activity.points_reward} points for completing "${activity.name}".`,
        attendeeName: attendee.name,
        pointsAwarded: activity.points_reward,
        totalPoints: newTotalPoints,
    };
}


export async function redeemProduct(attendeeId: string, productId: string, boothId: string) {
    noStore();
    
    // Transaction
    const attendee = await getAttendeeById(attendeeId);
    if (!attendee) {
        return { success: false, error: "Attendee not found." };
    }

    const product = await getProductById(productId);
    if (!product) {
        return { success: false, error: "Product not found." };
    }

    if (product.stock <= 0) {
        return { success: false, error: `Sorry, "${product.name}" is out of stock.` };
    }
    if (attendee.points < product.points) {
        return { success: false, error: `Attendee has insufficient points. Needs ${product.points}, has ${attendee.points}.` };
    }

    // Deduct points and stock in a transaction
    const newAttendeePoints = attendee.points - product.points;
    const newProductStock = product.stock - 1;

    const { error: attendeeError } = await supabaseAdmin
        .from('attendees')
        .update({ points: newAttendeePoints })
        .eq('id', attendeeId);

    if (attendeeError) {
        return { success: false, error: 'Failed to update attendee points.' };
    }

    const { error: productError } = await supabaseAdmin
        .from('products')
        .update({ stock: newProductStock })
        .eq('id', productId);
    
    if (productError) {
        // Rollback attendee points
        await supabaseAdmin.from('attendees').update({ points: attendee.points }).eq('id', attendeeId);
        return { success: false, error: 'Failed to update product stock.' };
    }
    
    // Log the transaction
    const { data: newTransaction, error: transactionError } = await supabaseAdmin
        .from('transactions')
        .insert({
            booth_id: boothId,
            attendee_id: attendeeId,
            attendee_name: attendee.name,
            product_id: productId,
            product_name: product.name,
            points_spent: product.points,
            items: [{
                product_id: productId,
                product_name: product.name,
                quantity: 1,
                points: product.points
            }]
        })
        .select()
        .single();
    
    if (transactionError) {
        // This is not ideal, as the main transaction has completed.
        // In a real-world scenario, you'd use PostgreSQL transactions or other mechanisms.
        console.error("Failed to log transaction:", transactionError);
    }
    
    revalidatePath(`/booth-dashboard/${boothId}/pos`);
    revalidatePath(`/booth-dashboard/${boothId}/merchandise`);

    return {
        success: true,
        attendeeName: attendee.name,
        newTransaction,
    };
}
