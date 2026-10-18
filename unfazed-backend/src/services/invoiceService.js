const PDFDocument = require('pdfkit');

class InvoiceService {
  /**
   * Generates a professional GST-style PDF invoice as a Promise<Buffer>
   * @param {Object} payment - Payment model doc
   * @param {Object} therapist - Therapist model doc
   * @param {Object} client - Client model doc
   */
  async generateInvoicePdfBuffer(payment, therapist, client) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 40, size: 'A4' });
        const buffers = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfData = Buffer.concat(buffers);
          resolve(pdfData);
        });

        // 1. Header Banner / Practice Branding
        const brandColor = '#047857';
        doc.rect(40, 40, 515, 60).fill(brandColor);

        doc.fillColor('#FFFFFF')
          .fontSize(22)
          .font('Helvetica-Bold')
          .text(therapist.practiceDetails?.clinicName || therapist.name, 55, 52);

        doc.fontSize(10)
          .font('Helvetica')
          .text(therapist.title || 'Mental Health Practice', 55, 78);

        doc.fillColor('#FFFFFF')
          .fontSize(16)
          .font('Helvetica-Bold')
          .text('INVOICE / RECEIPT', 380, 52, { align: 'right', width: 160 });

        if (payment.isSimulated) {
          doc.fontSize(8)
            .fillColor('#FCD34D')
            .text('[TEST / SIMULATED TRANSACTION]', 380, 75, { align: 'right', width: 160 });
        }

        // 2. Invoice Metadata Block
        doc.fillColor('#1E293B').fontSize(10).font('Helvetica');
        let y = 120;

        // Left Column: Seller Details
        doc.font('Helvetica-Bold').text('ISSUED BY:', 45, y);
        doc.font('Helvetica').fontSize(9);
        doc.text(therapist.name, 45, y + 15);
        if (therapist.practiceDetails?.address) {
          doc.text(therapist.practiceDetails.address, 45, y + 27);
        }
        doc.text(`${therapist.practiceDetails?.city || 'Delhi'}, ${therapist.practiceDetails?.country || 'India'}`, 45, y + 39);
        doc.text(`Email: ${therapist.email}`, 45, y + 51);
        if (therapist.practiceDetails?.gstNumber) {
          doc.text(`GSTIN: ${therapist.practiceDetails.gstNumber}`, 45, y + 63);
        } else {
          doc.text('GST: Not Registered / Exempt', 45, y + 63);
        }

        // Right Column: Invoice Details & Client
        doc.font('Helvetica-Bold').fontSize(10).text('INVOICE DETAILS:', 340, y);
        doc.font('Helvetica').fontSize(9);
        doc.text(`Invoice Number: ${payment.invoiceNumber}`, 340, y + 15);
        doc.text(`Date: ${new Date(payment.invoiceDate || payment.createdAt).toLocaleDateString('en-IN')}`, 340, y + 27);
        doc.text(`Status: ${payment.status.toUpperCase()}`, 340, y + 39);
        doc.text(`Payment ID: ${payment.razorpayPaymentId || (payment.isSimulated ? 'SIMULATED-PAID' : 'PENDING')}`, 340, y + 51);

        y += 85;
        doc.font('Helvetica-Bold').fontSize(10).text('BILLED TO:', 45, y);
        doc.font('Helvetica').fontSize(9);
        doc.text(client.name, 45, y + 15);
        doc.text(`Email: ${client.email}`, 45, y + 27);
        if (client.phone) doc.text(`Phone: ${client.phone}`, 45, y + 39);

        // 3. Line Items Table
        y += 60;
        doc.rect(40, y, 515, 24).fill('#F1F5F9');
        doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(9);
        doc.text('DESCRIPTION', 50, y + 7);
        doc.text('TYPE', 260, y + 7);
        doc.text('QTY', 360, y + 7);
        doc.text('RATE (INR)', 410, y + 7);
        doc.text('AMOUNT (INR)', 480, y + 7, { align: 'right', width: 65 });

        y += 24;
        doc.rect(40, y, 515, 30).stroke('#E2E8F0');
        doc.fillColor('#334155').font('Helvetica').fontSize(9);
        doc.text(payment.itemDescription || 'Consultation Session', 50, y + 9);
        doc.text(payment.itemType.toUpperCase(), 260, y + 9);
        doc.text('1', 360, y + 9);
        doc.text(`₹${payment.amount.toFixed(2)}`, 410, y + 9);
        doc.text(`₹${payment.amount.toFixed(2)}`, 480, y + 9, { align: 'right', width: 65 });

        // 4. Summary & Tax breakdown
        y += 45;
        const subtotal = payment.taxDetails?.subtotal || payment.amount;
        const hasGst = payment.taxDetails?.hasGst;
        const totalTax = payment.taxDetails?.totalTax || 0;

        doc.font('Helvetica').fontSize(9);
        doc.text('Subtotal:', 380, y);
        doc.text(`₹${subtotal.toFixed(2)}`, 480, y, { align: 'right', width: 65 });

        if (hasGst && totalTax > 0) {
          y += 16;
          doc.text(`CGST (${(payment.taxDetails.gstRatePercent / 2).toFixed(1)}%):`, 380, y);
          doc.text(`₹${(payment.taxDetails.cgstAmount || 0).toFixed(2)}`, 480, y, { align: 'right', width: 65 });
          y += 16;
          doc.text(`SGST (${(payment.taxDetails.gstRatePercent / 2).toFixed(1)}%):`, 380, y);
          doc.text(`₹${(payment.taxDetails.sgstAmount || 0).toFixed(2)}`, 480, y, { align: 'right', width: 65 });
        }

        y += 20;
        doc.rect(360, y - 5, 195, 26).fill('#ECFDF5');
        doc.fillColor('#065F46').font('Helvetica-Bold').fontSize(11);
        doc.text('TOTAL PAID:', 375, y + 3);
        doc.text(`₹${payment.amount.toFixed(2)}`, 480, y + 3, { align: 'right', width: 65 });

        // 5. Notes & Footer
        y += 50;
        doc.fillColor('#64748B').font('Helvetica').fontSize(8);
        doc.text('Thank you for entrusting your care with our practice.', 45, y);
        doc.text('This is a computer-generated tax invoice issued via UNFAZED Practice Management Platform.', 45, y + 12);
        if (payment.isSimulated) {
          doc.fillColor('#DC2626').text('* Notice: This transaction was processed in simulated test mode for testing purposes.', 45, y + 24);
        }

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }
}

module.exports = new InvoiceService();
