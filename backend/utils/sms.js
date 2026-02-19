const twilio = require('twilio');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function formatPhoneNumber(phone) {
  if (!phone) return null;
  
  // Remove spaces, dashes, parentheses
  let cleaned = phone.replace(/[\s\-\(\)]/g, '');
  
  // If starts with 0 and is 11 digits (Pakistani format), convert to +92
  if (cleaned.startsWith('0') && cleaned.length === 11) {
    cleaned = '+92' + cleaned.substring(1);
  }
  // If doesn't start with +, assume Pakistan and add +92
  else if (!cleaned.startsWith('+')) {
    cleaned = '+92' + cleaned;
  }
  
  return cleaned;
}

async function sendSMS(to, message) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    originalRecipient: to,
    message: message.substring(0, 100) + (message.length > 100 ? '...' : ''),
    status: null,
    error: null
  };

  try {
    // Get SMS config from settings
    const settings = await prisma.settings.findFirst();
    
    if (!settings?.twilioAccountSid || !settings?.twilioAuthToken) {
      logEntry.status = 'FAILED';
      logEntry.error = 'SMS not configured in settings';
      console.log('❌ SMS FAILED:', JSON.stringify(logEntry, null, 2));
      return { success: false, message: 'SMS not configured' };
    }
    
    // Format phone numbers to E.164
    let targetNumber = formatPhoneNumber(settings.twilioTestNumber || to);
    logEntry.actualRecipient = targetNumber;
    logEntry.testMode = !!settings.twilioTestNumber;
    
    const client = twilio(settings.twilioAccountSid, settings.twilioAuthToken);
    
    const result = await client.messages.create({
      body: message,
      from: settings.twilioPhoneNumber,
      to: targetNumber
    });
    
    logEntry.status = 'SUCCESS';
    logEntry.messageSid = result.sid;
    console.log('✅ SMS SUCCESS:', JSON.stringify(logEntry, null, 2));
    
    return { success: true, message: 'SMS sent successfully' };
  } catch (error) {
    logEntry.status = 'FAILED';
    logEntry.error = error.message;
    logEntry.errorCode = error.code;
    console.error('❌ SMS FAILED:', JSON.stringify(logEntry, null, 2));
    return { success: false, message: error.message };
  }
}

async function sendExpiryReminder(member) {
  const daysLeft = Math.ceil((new Date(member.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
  
  if (daysLeft === 3 || daysLeft === 1) {
    const message = `Dear ${member.name}, your gym membership will expire in ${daysLeft} day(s). Please renew to continue access.`;
    await sendSMS(member.phone, message);
  }
}

async function sendBirthdayWish(member) {
  const message = `Happy Birthday ${member.name}! 🎉 Wishing you a healthy and fit year ahead. - Your Gym Team`;
  await sendSMS(member.phone, message);
}

async function sendFeesReminder(member, amount) {
  const message = `Dear ${member.name}, your gym fees of $${amount} are pending. Please clear your dues to avoid service interruption.`;
  await sendSMS(member.phone, message);
}

module.exports = { sendSMS, sendExpiryReminder, sendBirthdayWish, sendFeesReminder };
