'use server';

import { detectPii } from '@/ai/flows/pii-detection-for-registration';
import { Attendee, Booth, Product, Raffle, RaffleWinner, Transaction } from './definitions';
import { getBoothById } from './data';
import { revalidatePath } from 'next/cache';
import { supabase } from './supabase';
import { unstable_noStore as noStore } from 'next/cache';

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
    
    const { data: attendees, error } = await supabase
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

export async function createOrUpdateBooth(boothData: Omit<Booth, 'id' | 'created_at'>, boothId?: string) {
  // The 'attendees' property is part of the Booth type for client-side use,
  // but it's not a column in the 'booths' table. We must remove it before insert/update.
  const { attendees, ...restOfBoothData } = boothData;
  
  if (boothId) {
    // Update existing booth
    const { error } = await supabase
      .from('booths')
      .update(restOfBoothData)
      .eq('id', boothId);
    
    if (error) {
      console.error('Supabase error updating booth:', error);
      return { success: false, error: 'Database error: Could not update booth.' };
    }
    revalidatePath(`/booths/${boothId}`);
  } else {
    // Create new booth
    const { data, error } = await supabase
      .from('booths')
      .insert([restOfBoothData])
      .select('id')
      .single();

    if (error) {
        console.error('Supabase error creating booth:', error);
        return { success: false, error: 'Database error: Could not create booth.' };
    }
    boothId = data.id;
  }

  revalidatePath('/booths');
  revalidatePath('/dashboard');
  return { success: true, boothId };
}

export async function deleteBooth(boothId: string) {
    // First, delete all attendees for the booth
    const { error: attendeeError } = await supabase
      .from('attendees')
      .delete()
      .eq('booth_id', boothId);
  
    if (attendeeError) {
      console.error('Supabase error deleting attendees:', attendeeError);
      return { success: false, error: 'Database error: Could not delete attendees.' };
    }
  
    // Then, delete the booth itself
    const { error: boothError } = await supabase
      .from('booths')
      .delete()
      .eq('id', boothId);
  
    if (boothError) {
      console.error('Supabase error deleting booth:', boothError);
      return { success: false, error: 'Database error: Could not delete booth.' };
    }
  
    revalidatePath('/booths');
    revalidatePath('/dashboard');
    return { success: true };
}

export async function registerAttendee(boothId: string, attendeeData: Omit<Attendee, 'id' | 'registered_at' | 'qr_code_url' | 'points'>) {
    const booth = await getBoothById(boothId);
    if (!booth) {
        return { success: false, error: 'Booth not found.' };
    }

    const { data: newAttendee, error } = await supabase
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
    const { error: updateError } = await supabase
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
    revalidatePath(`/booths/${boothId}`);
    revalidatePath('/attendees');
    revalidatePath('/dashboard');
    return { success: true };
}


export async function createRaffle(raffleData: Omit<Raffle, 'id' | 'status' | 'winners' | 'drawn_at'>) {
    const { error } = await supabase.from('raffles').insert([raffleData]);
    if (error) {
        console.error('Supabase error creating raffle:', error);
        return { success: false, error: 'Database error: Could not create raffle.' };
    }
    revalidatePath('/raffle');
    revalidatePath('/prize-history');
    return { success: true };
}

export async function drawRaffleWinner(raffleId: string) {
  noStore();
  const { data: raffle, error: raffleError } = await supabase
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
    await supabase.from('raffles').update({ status: 'finished' }).eq('id', raffleId);
    revalidatePath('/raffle');
    revalidatePath('/prize-history');
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

  const { error: updateError } = await supabase
    .from('raffles')
    .update(updatedRaffle)
    .eq('id', raffleId);

  if (updateError) {
    console.error('Error updating raffle:', updateError);
    return { success: false, error: 'Could not save the winner.' };
  }
  
  revalidatePath('/raffle');
  revalidatePath('/prize-history');
  
  return { success: true, winner: newWinner };
}

export async function redeemProduct(productId: string, userId: string, productName: string, points: number) {
    const { data: transaction, error } = await supabase
      .from('transactions')
      .insert([{
          user_id: userId, // This would be the actual user's ID
          user_name: 'John Doe', // Placeholder, you'd fetch the user's name
          product_name: productName,
          points: points,
      }])
      .select()
      .single();

    if (error) {
        console.error('Supabase error creating transaction:', error);
        return { success: false, error: 'Database error: Could not redeem product.' };
    }

    const { error: stockError } = await supabase.rpc('decrement_product_stock', { p_id: productId });
    
    if (stockError) {
        console.error('Supabase error decrementing stock:', stockError);
        // Optionally, you could try to revert the transaction here
        return { success: false, error: 'Database error: Could not update stock.' };
    }

    revalidatePath('/pos');
    revalidatePath('/qr-scanner');

    return { success: true, transaction };
}

export async function redeemMerchandiseForAttendee(attendeeId: string, productId: string) {
    noStore();
    // 1. Fetch attendee and product in parallel
    const [attendeeResult, productResult] = await Promise.all([
        supabase.from('attendees').select('id, name, points').eq('id', attendeeId).single(),
        supabase.from('products').select('id, name, points, stock').eq('id', productId).single()
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
        supabase.from('attendees').update({ points: newAttendeePoints }).eq('id', attendee.id),
        supabase.from('products').update({ stock: product.stock - 1 }).eq('id', product.id),
        supabase.from('transactions').insert({
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

    revalidatePath('/qr-scanner');
    revalidatePath('/pos');

    return {
        success: true,
        message: `Successfully redeemed ${product.name} for ${attendee.name}.`,
        attendeeName: attendee.name,
        pointsUsed: product.points,
        remainingPoints: newAttendeePoints
    };
}
