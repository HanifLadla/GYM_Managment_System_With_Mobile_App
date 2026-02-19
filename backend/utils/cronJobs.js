const { PrismaClient } = require('@prisma/client');
const { sendEmail } = require('./email');
const { sendExpiryReminder, sendBirthdayWish, sendFeesReminder } = require('./sms');
const prisma = new PrismaClient();

async function checkOverdueFees() {
  try {
    const today = new Date();
    const overdueMembers = await prisma.member.findMany({
      where: {
        expiryDate: { lt: today },
        status: 'active'
      },
      include: { user: true, memberships: true }
    });

    for (const member of overdueMembers) {
      await sendEmail(
        member.user.email,
        'Fee Overdue',
        `Dear ${member.name}, your membership fee is overdue. Please renew.`
      );
      
      await sendFeesReminder(member, member.monthlyFee);
      
      global.io?.emit('alert', {
        type: 'warning',
        message: `Fee overdue for ${member.name}`
      });
    }

    console.log(`Checked ${overdueMembers.length} overdue members`);
  } catch (error) {
    console.error('Cron job error:', error.message);
  }
}

async function checkExpiringMemberships() {
  try {
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    
    const expiringMembers = await prisma.member.findMany({
      where: {
        expiryDate: { lte: threeDaysFromNow, gte: new Date() },
        status: 'active'
      }
    });

    for (const member of expiringMembers) {
      await sendExpiryReminder(member);
    }

    console.log(`Sent reminders to ${expiringMembers.length} members`);
  } catch (error) {
    console.error('Expiry check error:', error.message);
  }
}

async function checkBirthdays() {
  try {
    const today = new Date();
    const members = await prisma.member.findMany({
      where: { status: 'active' }
    });

    for (const member of members) {
      if (member.dob) {
        const dob = new Date(member.dob);
        if (dob.getMonth() === today.getMonth() && dob.getDate() === today.getDate()) {
          await sendBirthdayWish(member);
        }
      }
    }
  } catch (error) {
    console.error('Birthday check error:', error.message);
  }
}

module.exports = { checkOverdueFees, checkExpiringMemberships, checkBirthdays };
