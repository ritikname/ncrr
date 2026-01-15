
import { Booking } from '../types';

// --- CONFIGURATION ---
// Your active Google Script URL
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzPZyzeLWmdPQpbVzpg6qYjWQ61iVj_8v-qS6zmjrhY17apui_235uwKzx_w37pP1QJbQ/exec"; 

const OWNER_PHONE_NUMBER = "9870375798"; 

// --- SAFETY MECHANISM ---
// Prevents double-firing the API for the same booking ID within a short time
const sentBookingIds = new Set<string>();

// --- WHATSAPP LOGIC ---
const formatWhatsAppMessage = (booking: Booking): string => {
  return `
✅ *BOOKING CONFIRMED - NCR DRIVE*
--------------------------------
Hi *${booking.customerName}*,

Your booking for *${booking.carName}* has been approved! 🚗💨

📋 *Trip Details:*
• Dates: ${new Date(booking.startDate).toLocaleDateString()} - ${new Date(booking.endDate).toLocaleDateString()}
• Pickup: ${booking.location}
• Ref ID: ${booking.transactionId}

👤 *Customer Details:*
• Name: ${booking.customerName}
• *WhatsApp Contact Number:* ${booking.customerPhone}

💰 *Payment:*
• Total: ₹${booking.totalCost.toLocaleString()}
• Advance: ₹${(booking.advanceAmount || 0).toLocaleString()} (Paid)

--------------------------------
📞 *Owner Support:* ${OWNER_PHONE_NUMBER}

Please carry your original Driving License & Aadhar Card.
Safe Travels!
`.trim();
};

export const sendWhatsAppNotification = async (booking: Booking) => {
  // Logic updated: Send TO the CUSTOMER, not the owner.
  
  // Sanitize phone number (remove spaces, dashes)
  let phone = booking.customerPhone.replace(/\D/g, '');
  
  // Default to India (91) if 10 digits provided
  if (phone.length === 10) phone = '91' + phone;
  
  const msg = formatWhatsAppMessage(booking);
  const encodedMsg = encodeURIComponent(msg);
  
  // Generates a link to open WhatsApp Chat with the CUSTOMER with the pre-filled confirmation message
  return `https://wa.me/${phone}?text=${encodedMsg}`;
};

// --- EMAIL LOGIC (Via Google Apps Script) ---
export const sendEmailNotification = async (booking: Booking) => {
  // 1. Quota Protection: Prevent duplicate sends for the same ID
  if (sentBookingIds.has(booking.id)) {
    console.warn(`[MAILER] Skipped duplicate email for booking ${booking.id}`);
    return true; 
  }

  // 2. Configuration Check
  if (!GOOGLE_SCRIPT_URL || GOOGLE_SCRIPT_URL.includes("YOUR_GOOGLE_SCRIPT")) {
    console.error("⚠️ MAIL FAILED: Google Script URL is missing.");
    return false;
  }

  try {
    console.log(`[MAILER] Sending via Google Script to ${booking.email}...`);

    const payload = {
      to_email: booking.email,
      customer_name: booking.customerName,
      ref_id: booking.transactionId,
      car_name: booking.carName,
      start_date: booking.startDate,
      end_date: booking.endDate,
      pickup_location: booking.location,
      total_cost: `₹${booking.totalCost.toLocaleString()}`,
      advance_amount: `₹${(booking.advanceAmount || 0).toLocaleString()}`, // Added Advance Amount
      owner_phone: OWNER_PHONE_NUMBER
    };

    // 3. Send Request
    await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors", 
      headers: {
        "Content-Type": "text/plain",
      },
      body: JSON.stringify(payload),
    });

    // 4. Mark as sent to protect quota
    sentBookingIds.add(booking.id);
    console.log("[MAILER] Request sent to Google Script.");
    return true;

  } catch (error) {
    console.error("[MAILER] Failed to send:", error);
    return false;
  }
};

export const triggerAllNotifications = async (booking: Booking) => {
  // Fire and forget email (don't block UI if it's slow)
  sendEmailNotification(booking).catch(err => console.error("Email trigger failed", err));
  
  const waLink = await sendWhatsAppNotification(booking);
  return waLink;
};
