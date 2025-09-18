'use server';

import { detectPii } from '@/ai/flows/pii-detection-for-registration';
import { Attendee, Booth, Product, Raffle, RaffleWinner, Tenant } from './definitions';
import { getBoothById } from './data';
import { revalidatePath } from 'next/cache';
import { unstable_noStore as noStore } from 'next/cache';
import { supabase as supabaseClient } from './supabase/client';
import { supabaseAdmin } from './supabase/server';

// Placeholder function for sending email.
// You need to integrate a real email service like SendGrid, Resend, or Nodemailer.
async function sendQrCodeEmail(recipientEmail: string, attendeeName: string, boothName:string, qrCodeUrl: string) {
  console.log(`Simulating sending email to ${recipientEmail}`);
  console.log(`Attendee: ${attendeeName}`);
  console.log(`Booth: ${boothName}`);
  console.log(`QR Code URL: ${qrCodeUrl}`);
  
  // TODO: Implement actual email sending logic here.
  // Example using a hypothetical email service:
  /*
  try {
    const emailHtml = `<h1>Hi ${attendeeName},</h1><p>Thank you for registering for ${boothName}.</p><p>Here is your unique QR code for check-in:</p><img src="${qrCodeUrl}" alt="Your QR Code" /><p>We look forward to seeing you!</p>`;
    
    await emailService.send({
      from: 'you@yourdomain.com',
      to: recipientEmail,
      subject: `Your QR Code for ${boothName}`,
      html: emailHtml,
    });
    console.log('Email sent successfully.');
  } catch (error) {
    console.error('Failed to send email:', error);
    // Even if email fails, the registration was successful, so we don't throw an error here.
  }
  */

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

export async function exportAttendeesToCsv(boothId: string): Promise<string> {
    noStore();
    const booth = await getBoothById(boothId);

    if (!booth) {
        throw new Error('Booth not found');
    }
    
    const { data: attendees, error } = await supabaseClient
        .from('attendees')
        .select('*')
        .eq('booth_id', boothId);

    if (error) {
        console.error('Supabase error fetching attendees:', error);
        throw new Error('Could not fetch attendees for CSV export.');
    }

    if (attendees.length === 0) {
        return "id,name,email,registered_at,custom_response\n";
    }

    const headers = Object.keys(attendees[0]);
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
  const { attendees, booth_user_email, booth_user_password, ...restOfBoothData } = formData;

  if (boothId) {
    // Update existing booth
    const { error } = await supabaseAdmin
      .from('booths')
      .update(restOfBoothData)
      .eq('id', boothId);
    
    if (error) {
      console.error('Supabase error updating booth:', error);
      return { success: false, error: 'Database error: Could not update booth.' };
    }
    revalidatePath(`/booths/${boothId}`);
    revalidatePath(`/booth-dashboard/${boothId}`);
  } else {
    // Create new booth
    const { data, error } = await supabaseAdmin
      .from('booths')
      .insert([restOfBoothData])
      .select('id')
      .single();

    if (error || !data) {
        console.error('Supabase error creating booth:', error);
        return { success: false, error: 'Database error: Could not create booth.' };
    }
    boothId = data.id;

    // If user details are provided, create the user and tenant record
    if (booth_user_email && booth_user_password) {
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
  return { success: true, boothId };
}

export async function deleteBooth(boothId: string) {
    // First, delete all attendees for the booth
    const { error: attendeeError } = await supabaseAdmin
      .from('attendees')
      .delete()
      .eq('booth_id', boothId);
  
    if (attendeeError) {
      console.error('Supabase error deleting attendees:', attendeeError);
      return { success: false, error: 'Database error: Could not delete attendees.' };
    }
    
    // Also, unassign any tenants associated with this booth
    const { error: tenantUnassignError } = await supabaseAdmin
      .from('tenants')
      .update({ booth_id: null })
      .eq('booth_id', boothId);

    if (tenantUnassignError) {
        // Log the error but don't block deletion
        console.error('Supabase error unassigning tenants:', tenantUnassignError);
    }
  
    // Then, delete the booth itself
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
    return { success: true };
}

export async function registerAttendee(boothId: string, attendeeData: Omit<Attendee, 'id' | 'registered_at' | 'qr_code_url' | 'points'>) {
    const booth = await getBoothById(boothId);
    if (!booth) {
        return { success: false, error: 'Booth not found.' };
    }

    const { data: newAttendee, error } = await supabaseClient
        .from('attendees')
        .insert([{ ...attendeeData, booth_id: boothId, points: 100 }]) // Award 100 points on registration
        .select()
        .single();

    if (error || !newAttendee) {
        console.error('Supabase error registering attendee:', error);
        // Handle specific errors, e.g., unique constraint violation for email per booth
        if (error?.code === '23505') { // unique_violation
            return { success: false, error: 'This email address has already been registered for this booth.' };
        }
        return { success: false, error: 'Database error: Could not register attendee.' };
    }

    // Generate QR code URL
    const qrCodeData = newAttendee.id; // Using the unique attendee ID for the QR code
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${qrCodeData}`;

    // Update the attendee with the generated QR code URL
    const { error: updateError } = await supabaseClient
        .from('attendees')
        .update({ qr_code_url: qrCodeUrl })
        .eq('id', newAttendee.id);

    if (updateError) {
        console.error('Supabase error updating attendee with QR code:', updateError);
        // We can decide to ignore this error for the user, as they are already registered.
        // The main registration was successful.
    } else {
        // If QR code is saved successfully, send the email
        await sendQrCodeEmail(newAttendee.email, newAttendee.name, booth.name, qrCodeUrl);
    }

    revalidatePath(`/booths/${boothId}/register`);
    revalidatePath(`/booth-dashboard/${boothId}`);
    revalidatePath('/attendees');
revalidatePath('/dashboard');
    return { success: true };
}


export async function createRaffle(raffleData: Omit<Raffle, 'id' | 'status' | 'winners' | 'drawn_at'>) {
    const { error } = await supabaseClient.from('raffles').insert([raffleData]);
    if (error) {
        console.error('Supabase error creating raffle:', error);
        return { success: false, error: 'Database error: Could not create raffle.' };
    }
    revalidatePath(`/booth-dashboard/${raffleData.booth_id}`);
    return { success: true };
}

export async function drawRaffleWinner(raffleId: string) {
  noStore();
  const { data: raffle, error: raffleError } = await supabaseClient
    .from('raffles')
    .select('*, booths(id, name, attendees(id, name, email))')
    .eq('id', raffleId)
    .single();

  if (raffleError || !raffle) {
    console.error('Error fetching raffle:', raffleError);
    return { success: false, error: 'Could not find the specified raffle.' };
  }

  const drawnWinnerIds = raffle.winners?.map((w: RaffleWinner) => w.attendeeId) || [];
  const eligibleAttendees = raffle.booths.attendees.filter(
    (attendee: Attendee) => !drawnWinnerIds.includes(attendee.id)
  );

  if (eligibleAttendees.length === 0) {
    await supabaseClient.from('raffles').update({ status: 'finished' }).eq('id', raffleId);
    revalidatePath(`/booth-dashboard/${raffle.booth_id}`);
    return { success: true, message: 'No more eligible attendees to draw.' };
  }
  
  const winnerIndex = Math.floor(Math.random() * eligibleAttendees.length);
  const winner = eligibleAttendees[winnerIndex];

  const newWinner: RaffleWinner = {
    attendeeId: winner.id,
    name: winner.name,
    email: winner.email,
  };

  const updatedWinners = [...(raffle.winners || []), newWinner];

  const updatedRaffle: Partial<Raffle> = {
    winners: updatedWinners,
    status: updatedWinners.length >= raffle.number_of_winners ? 'finished' : 'active',
    drawn_at: updatedWinners.length >= raffle.number_of_winners ? new Date().toISOString() : null,
  };

  const { error: updateError } = await supabaseClient
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
    // 1. Fetch attendee and product in parallel
    const [attendeeResult, productResult] = await Promise.all([
        supabaseClient.from('attendees').select('id, name, points').eq('id', attendeeId).single(),
        supabaseClient.from('products').select('id, name, points, stock').eq('id', productId).single()
    ]);

    if (attendeeResult.error || !attendeeResult.data) {
        return { success: false, error: "Attendee not found." };
    }
    if (productResult.error || !productResult.data) {
        return { success: false, error: "Product not found." };
    }

    const attendee = attendeeResult.data;
    const product = productResult.data;

    // 2. Check stock and points
    if (product.stock <= 0) {
        return { success: false, error: `Sorry, "${product.name}" is out of stock.` };
    }
    if (attendee.points < product.points) {
        return { success: false, error: `Attendee has insufficient points. Needs ${product.points}, has ${attendee.points}.`, attendeeName: attendee.name, };
    }

    // 3. Perform the transaction
    const newAttendeePoints = attendee.points - product.points;

    const [updateAttendeeResult, updateProductResult, createTransactionResult] = await Promise.all([
        supabaseClient.from('attendees').update({ points: newAttendeePoints }).eq('id', attendee.id),
        supabaseClient.from('products').update({ stock: product.stock - 1 }).eq('id', product.id),
        supabaseClient.from('transactions').insert({
            user_id: attendee.id,
            user_name: attendee.name,
            product_name: product.name,
            points: product.points,
        })
    ]);

    if (updateAttendeeResult.error || updateProductResult.error || createTransactionResult.error) {
        console.error("Transaction failed:", {
            attendeeError: updateAttendeeResult.error,
            productError: updateProductResult.error,
            transactionError: createTransactionResult.error,
        });
        // Here you might want to add logic to revert the parts of the transaction that succeeded
        return { success: false, error: "Database error during transaction." };
    }

    revalidatePath(`/booth-dashboard/${boothId}`);
    revalidatePath('/pos');

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
    const { data, error } = await supabaseClient
        .from('products')
        .insert([productData])
        .select()
        .single();

    if (error || !data) {
        console.error('Supabase error creating product:', error);
        return { success: false, error: 'Database error: Could not create product.' };
    }
    
    revalidatePath(`/booth-dashboard/${productData.booth_id}`);
    return { success: true, product: data };
}
