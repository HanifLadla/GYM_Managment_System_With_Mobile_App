const nodemailer = require('nodemailer');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function sendEmail(to, subject, text) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    recipient: to,
    subject: subject,
    message: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
    status: null,
    error: null
  };

  try {
    // Get email config from settings
    const settings = await prisma.settings.findFirst();
    
    if (!settings?.emailUser || !settings?.emailPass) {
      logEntry.status = 'FAILED';
      logEntry.error = 'Email not configured in settings';
      console.log('❌ EMAIL FAILED:', JSON.stringify(logEntry, null, 2));
      return { success: false, message: 'Email not configured' };
    }
    
    const transporter = nodemailer.createTransport({
      host: settings.emailHost || 'smtp.gmail.com',
      port: settings.emailPort || 587,
      auth: {
        user: settings.emailUser,
        pass: settings.emailPass
      }
    });
    
    const result = await transporter.sendMail({
      from: settings.emailUser,
      to,
      subject,
      text
    });
    
    logEntry.status = 'SUCCESS';
    logEntry.messageId = result.messageId;
    console.log('✅ EMAIL SUCCESS:', JSON.stringify(logEntry, null, 2));
    return { success: true, message: 'Email sent successfully' };
  } catch (error) {
    logEntry.status = 'FAILED';
    logEntry.error = error.message;
    logEntry.errorCode = error.code;
    console.error('❌ EMAIL FAILED:', JSON.stringify(logEntry, null, 2));
    return { success: false, message: error.message };
  }
}

module.exports = { sendEmail };
