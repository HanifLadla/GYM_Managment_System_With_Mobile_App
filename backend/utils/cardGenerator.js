const { PrismaClient } = require('@prisma/client');
const QRCode = require('qrcode');
const prisma = new PrismaClient();

async function generateCard(memberId) {
  // Derive seq from existing card count for this member or total cards
  const cardCount = await prisma.card.count();
  const seq = String(cardCount + 1).padStart(4, '0');
  const cardNumber = `CARD-${seq}`;
  
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
