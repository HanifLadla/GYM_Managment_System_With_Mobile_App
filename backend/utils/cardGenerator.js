const { PrismaClient } = require('@prisma/client');
const QRCode = require('qrcode');
const prisma = new PrismaClient();

async function generateCard(memberId) {
  const cardNumber = `GYM-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  
  console.log('Generating QR code for card:', cardNumber);
  const qrCodeUrl = await QRCode.toDataURL(cardNumber);
  console.log('QR Code generated, length:', qrCodeUrl.length);
  
  const card = await prisma.card.create({
    data: {
      memberId,
      cardNumber,
      qrCodeUrl
    }
  });
  
  console.log('Card saved to database:', card.id);
  return card;
}

module.exports = { generateCard };
