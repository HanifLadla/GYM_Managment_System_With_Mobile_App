const PdfPrinter = require('pdfmake');
const fs = require('fs');
const path = require('path');

const fonts = {
  Roboto: {
    normal: 'Helvetica',
    bold: 'Helvetica-Bold',
  }
};

async function generateInvoicePDF(data) {
  const { invoiceNumber, totalAmount, dueDate, memberId } = data;
  
  const docDefinition = {
    content: [
      { text: 'GYM INVOICE', style: 'header' },
      { text: `Invoice #: ${invoiceNumber}`, margin: [0, 10] },
      { text: `Amount: $${totalAmount}`, margin: [0, 5] },
      { text: `Due Date: ${new Date(dueDate).toLocaleDateString()}`, margin: [0, 5] },
      { text: `Member ID: ${memberId || 'N/A'}`, margin: [0, 5] }
    ],
    styles: {
      header: { fontSize: 18, bold: true }
    }
  };

  const printer = new PdfPrinter(fonts);
  const pdfDoc = printer.createPdfKitDocument(docDefinition);
  
  const filePath = path.join(__dirname, '../uploads', `${invoiceNumber}.pdf`);
  
  if (!fs.existsSync(path.join(__dirname, '../uploads'))) {
    fs.mkdirSync(path.join(__dirname, '../uploads'), { recursive: true });
  }
  
  pdfDoc.pipe(fs.createWriteStream(filePath));
  pdfDoc.end();
  
  return `/uploads/${invoiceNumber}.pdf`;
}

module.exports = { generateInvoicePDF };
