
'use server';

import { detectPii } from '@/ai/flows/pii-detection-for-registration';
import { Activity, ActivityParticipant, Attendee, Event, Product, Raffle, RaffleWinner, Transaction } from './definitions';
import { getEventById, getAttendees, getAttendeeById, getActivityById, getProductById } from './data';
import { revalidatePath } from 'next/cache';
import { unstable_noStore as noStore } from 'next/cache';
import { supabase as supabaseClient } from './supabase/client';
import { supabaseAdmin } from './supabase/server';
import { cookies }from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { format } from 'date-fns';

// Placeholder function for sending message.
// You need to integrate a real messaging service like Twilio.
async function sendQrCodeMessage(recipientPhoneNumber: string, attendeeName: string, eventName:string, qrCodeUrl: string) {
  console.log(`Simulating sending SMS to ${recipientPhoneNumber}`);
  console.log(`Attendee: ${attendeeName}`);
  console.log(`Event: ${eventName}`);
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

export async function exportEventAttendeesToCsv(eventId: string): Promise<string> {
    noStore();
    const event = await getEventById(eventId);
    if (!event) {
        throw new Error('Event not found');
    }

    const checkIns = event.check_ins || [];

    if (checkIns.length === 0) {
        return "phone_number,checked_in_at\n";
    }

    const headers = ['phone_number', 'checked_in_at'];
    const csvRows = [headers.join(',')];

    for (const checkIn of checkIns) {
        const values = [
            checkIn.phone_number,
            format(new Date(checkIn.checked_in_at), 'yyyy-MM-dd HH:mm:ss'),
        ].map(value => {
            if (typeof value === 'string' && value.includes(',')) {
                return `"${value}"`;
            }
            return value;
        });
        csvRows.push(values.join(','));
    }

    return csvRows.join('\n');
}

export async function exportAttendeesToCsv(eventId: string): Promise<string> {
    noStore();
    const event = await getEventById(eventId);
    const allAttendees = await getAttendees();

    if (!event) {
        throw new Error('Event not found');
    }
    
    // In the new model, we just export all attendees since they are not tied to an event
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

export async function createOrUpdateEvent(formData: Partial<Event>, eventId?: string) {
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

  const { attendees, ...restOfEventData } = formData;
  const dataToUpsert = { ...restOfEventData };

  if (eventId) {
    // Update existing event
    const { error } = await supabaseAdmin
      .from('events')
      .update(dataToUpsert)
      .eq('id', eventId);
    
    if (error) {
      console.error('Supabase error updating event:', error);
      return { success: false, error: 'Database error: Could not update event.' };
    }
    revalidatePath(`/events/${eventId}`);
    revalidatePath(`/events/manage/${eventId}`);
  } else {
    // Create new event
    dataToUpsert.user_id = user.id;
    
    const { data, error } = await supabaseAdmin
      .from('events')
      .insert([dataToUpsert])
      .select('id')
      .single();

    if (error || !data) {
        console.error('Supabase error creating event:', error);
        return { success: false, error: 'Database error: Could not create event.' };
    }
    eventId = data.id;
  }

  revalidatePath('/events');
  revalidatePath('/dashboard');
  return { success: true, eventId };
}

export async function deleteEvent(eventId: string) {
    const { data, error } = await supabaseAdmin
      .from('events')
      .select('image_path')
      .eq('id', eventId)
      .single();

    if (error) {
      console.error('Supabase error fetching event for deletion:', error);
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
      .eq('event_id', eventId);

    if (checkinError) {
      console.error('Supabase error deleting check-ins:', checkinError);
      return { success: false, error: 'Database error: Could not delete associated check-ins.' };
    }
  
    const { error: eventError } = await supabaseAdmin
      .from('events')
      .delete()
      .eq('id', eventId);
  
    if (eventError) {
      console.error('Supabase error deleting event:', eventError);
      return { success: false, error: 'Database error: Could not delete event.' };
    }
  
    revalidatePath('/events');
    revalidatePath('/dashboard');
    return { success: true };
}

export async function registerAttendee(registrationData: Omit<Attendee, 'id' | 'registered_at' | 'qr_code_url' | 'points'>) {
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

    revalidatePath(`/events`); 
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
    revalidatePath(`/events/manage/${raffleData.event_id}`);
    return { success: true };
}

export async function drawRaffleWinner(raffleId: string, eventId: string) {
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

  const { data: checkIns, error: checkInError } = await supabaseAdmin
    .from('check_ins')
    .select('attendees(*)')
    .eq('event_id', eventId);
  
  if (checkInError || !checkIns) {
    console.error('Error fetching check-ins:', checkInError);
    return { success: false, error: 'Could not fetch attendees for this event.' };
  }
  const attendeesForEvent = checkIns.map(ci => ci.attendees).filter(Boolean) as Attendee[];

  const drawnWinnerIds = raffle.winners?.map((w: RaffleWinner) => w.attendeeId) || [];
  const eligibleAttendees = attendeesForEvent.filter(
    (attendee: Attendee) => attendee && !drawnWinnerIds.includes(attendee.id)
  );

  if (eligibleAttendees.length === 0) {
    await supabaseAdmin.from('raffles').update({ status: 'finished' }).eq('id', raffleId);
    revalidatePath(`/events/manage/${raffle.event_id}`);
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
  
  revalidatePath(`/events/manage/${raffle.event_id}`);
  
  return { success: true, winner: newWinner };
}

async function createStaffUser(staffData: { name: string; email: string; password?: string; event_id: string | null; }) {
    if (!staffData.password) {
        return { success: false, error: 'Password is required for new users.' };
    }
    // 1. Create user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: staffData.email,
      password: staffData.password,
      email_confirm: true, // Auto-confirm email
      user_metadata: { role: 'staff' },
    });

    if (authError) {
      console.error('Supabase Auth error creating staff user:', authError);
      return { success: false, error: authError.message };
    }

    const userId = authData.user.id;

    // 2. Insert into user_roles table
    const { error: roleError } = await supabaseAdmin
        .from('user_roles')
        .insert({ id: userId, role: 'staff', event_id: staffData.event_id === 'unassigned' ? null : staffData.event_id });

    if (roleError) {
        console.error('Supabase DB error creating staff record:', roleError);
        // Attempt to clean up the created auth user
        await supabaseAdmin.auth.admin.deleteUser(userId);
        return { success: false, error: 'Database error: Could not create staff record.' };
    }
    
    return { success: true };
}


export async function createOrUpdateStaff(formData: FormData) {
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const event_id = formData.get('event_id') as string | null;
  const staffId = formData.get('staffId') as string | undefined;

  if (staffId) {
    // Update existing staff logic (only name and event assignment)
    const { error } = await supabaseAdmin
      .from('user_roles')
      .update({ event_id: event_id === 'unassigned' ? null : event_id })
      .eq('id', staffId);
      
    // Note: We don't update user's name in auth metadata here for simplicity,
    // but a full implementation might want to.

    if (error) {
      console.error('Supabase DB error updating staff:', error);
      return { success: false, error: 'Database error: Could not update staff.' };
    }
  } else {
    // Create new staff and auth user
    const result = await createStaffUser({
        name,
        email,
        password,
        event_id,
    });
    if (!result.success) {
        return result;
    }
  }

  revalidatePath('/staff');
  return { success: true };
}

export async function deleteStaff(staffId: string) {
    // First, delete the user from Supabase Auth
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(staffId);
    if (authError) {
        // If user is already deleted from auth, we might get a "User not found" error.
        // We can choose to ignore this or handle it, for now we log and continue.
        console.warn('Supabase Auth error deleting staff. Might be already deleted. Continuing...', authError.message);
    }
    
    // Then, delete the record from the user_roles table
    const { error: dbError } = await supabaseAdmin
      .from('user_roles')
      .delete()
      .eq('id', staffId);
  
    if (dbError) {
      console.error('Supabase DB error deleting staff record:', dbError);
      return { success: false, error: 'Database error: Could not delete staff record.' };
    }
  
    revalidatePath('/staff');
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
    
    revalidatePath(`/events/manage/${productData.event_id}/pos`);
    return { success: true, product: data };
}

/**
 * Simulates calling an external Pertamina API to verify an attendee.
 * In a real-world scenario, this would involve an actual HTTP request.
 * @param qrData The data scanned from the QR code.
 * @returns A promise that resolves with the attendee's phone number if verification is successful.
 */
export async function verifyAttendeeWithPertaminaAPI(qrData: string): Promise<{ success: true, phoneNumber: string } | { success: false, error: string }> {
  console.log(`Verifying QR data with Pertamina API: ${qrData}`);
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // --- REPLACE THIS WITH YOUR ACTUAL API CALL ---
  // For demonstration, we'll assume the QR data is valid and we can derive a phone number.
  // A real implementation would look something like this:
  /*
  try {
    const response = await fetch('https://api.pertamina.com/verify-attendee', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.PERTAMINA_API_KEY}` },
      body: JSON.stringify({ qr_token: qrData })
    });
    const data = await response.json();
    if (data.isValid) {
      return { success: true, phoneNumber: data.phoneNumber };
    } else {
      return { success: false, error: data.errorMessage || 'Invalid QR code.' };
    }
  } catch (apiError) {
    console.error('Pertamina API call failed:', apiError);
    return { success: false, error: 'Could not connect to verification service.' };
  }
  */
  
  // For now, we'll just simulate a successful response with a dummy phone number.
  const isSuccessful = true; //Math.random() > 0.1; // Simulate a 10% failure rate
  if (isSuccessful) {
    const dummyPhoneNumber = `0812${Math.random().toString().slice(2, 12)}`;
    return { success: true, phoneNumber: dummyPhoneNumber };
  } else {
    return { success: false, error: "Verifikasi QR Code dari API Pertamina gagal." };
  }
}


export async function createCheckIn(eventId: string, phoneNumber: string) {
  const { data, error } = await supabaseAdmin
    .from('check_ins')
    .insert({ event_id: eventId, phone_number: phoneNumber })
    .select()
    .single();

  if (error) {
    console.error('Supabase error creating check-in:', error);
    // Handle unique constraint violation gracefully
    if (error.code === '23505') {
      return { success: false, error: 'Nomor telepon ini sudah pernah check-in di event ini.' };
    }
    return { success: false, error: `Database error: Could not record check-in. (${error.message})` };
  }
  revalidatePath(`/events/manage/${eventId}/scanner`);
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
    
    revalidatePath(`/events/manage/${activityData.event_id}/activity`);
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
    
    revalidatePath(`/events/manage/${activity.event_id}/activity`);
    revalidatePath(`/events/manage/${activity.event_id}/activity/${activityId}`);

    return {
        success: true,
        message: `Awarded ${activity.points_reward} points for completing "${activity.name}".`,
        attendeeName: attendee.name,
        pointsAwarded: activity.points_reward,
        totalPoints: newTotalPoints,
    };
}


export async function redeemProduct(attendeeId: string, productId: string, eventId: string) {
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
            event_id: eventId,
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
    
    revalidatePath(`/events/manage/${eventId}/pos`);
    revalidatePath(`/events/manage/${eventId}/merchandise`);

    return {
        success: true,
        attendeeName: attendee.name,
        newTransaction,
    };
}

