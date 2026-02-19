const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function formatPhoneNumber(phone) {
  if (!phone) return null;
  
  // Remove spaces, dashes, parentheses
  let cleaned = phone.replace(/[\s\-\(\)]/g, '');
  
  // If starts with 0 and is 11 digits (Pakistani format), convert to 92
  if (cleaned.startsWith('0') && cleaned.length === 11) {
    cleaned = '92' + cleaned.substring(1);
  }
  // If starts with +, remove it
  else if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  }
  // If doesn't start with 92, assume Pakistan and add 92
  else if (!cleaned.startsWith('92')) {
    cleaned = '92' + cleaned;
  }
  
  return cleaned;
}

async function sendWhatsApp(to, message) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    originalRecipient: to,
    message: message.substring(0, 100) + (message.length > 100 ? '...' : ''),
    status: null,
    error: null
  };

  try {
    // Get WhatsApp config from settings
    const settings = await prisma.settings.findFirst();
    
    if (!settings?.whatsappApiUrl || !settings?.whatsappApiKey) {
      logEntry.status = 'FAILED';
      logEntry.error = 'WhatsApp not configured in settings';
      console.log('❌ WHATSAPP FAILED:', JSON.stringify(logEntry, null, 2));
      return { success: false, message: 'WhatsApp not configured' };
    }
    
    // Format phone number
    const targetNumber = formatPhoneNumber(to);
    logEntry.actualRecipient = targetNumber;
    
    const response = await axios.post(
      settings.whatsappApiUrl,
      {
        messaging_product: 'whatsapp',
        to: targetNumber,
        type: 'text',
        text: { body: message }
      },
      {
        headers: {
          'Authorization': `Bearer ${settings.whatsappApiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    logEntry.status = 'SUCCESS';
    logEntry.messageId = response.data?.messages?.[0]?.id;
    console.log('✅ WHATSAPP SUCCESS:', JSON.stringify(logEntry, null, 2));
    return { success: true, message: 'WhatsApp sent successfully' };
  } catch (error) {
    logEntry.status = 'FAILED';
    logEntry.error = error.response?.data?.error?.message || error.message;
    logEntry.errorCode = error.response?.data?.error?.code;
    console.error('❌ WHATSAPP FAILED:', JSON.stringify(logEntry, null, 2));
    return { success: false, message: error.message };
  }
}

module.exports = { sendWhatsApp };
