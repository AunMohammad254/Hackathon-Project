import PDFDocument from 'pdfkit';
import { IAppointmentDocument } from '../models/Appointment';
import { IPatientDocument } from '../models/Patient';
import { IUserDocument } from '../models/User';

export const generateInvoicePDF = async (
  appointment: IAppointmentDocument,
  patient: IPatientDocument,
  doctor: IUserDocument
): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Header
    doc
      .fillColor('#444444')
      .fontSize(20)
      .text('AI Clinic Management', 110, 57)
      .fontSize(10)
      .text('123 Health Street, Medical City', 200, 65, { align: 'right' })
      .text('Phone: +1 234 567 890', 200, 80, { align: 'right' })
      .moveDown();

    // Horizontal Line
    doc.strokeColor('#aaaaaa').lineWidth(1).moveTo(50, 100).lineTo(550, 100).stroke();

    // Invoice Info
    doc
      .fontSize(15)
      .text('INVOICE', 50, 120)
      .fontSize(10)
      .text(`Invoice Number: INV-${appointment._id.toString().slice(-6)}`, 50, 140)
      .text(`Date: ${new Date().toLocaleDateString()}`, 50, 155)
      .moveDown();

    // Patient & Doctor Info
    doc
      .fontSize(12)
      .text('Billed To:', 50, 190)
      .fontSize(10)
      .text(patient.name, 50, 210)
      .text(`Contact: ${patient.contact}`, 50, 225)
      .moveDown();

    doc
      .fontSize(12)
      .text('Consulting Doctor:', 350, 190)
      .fontSize(10)
      .text(doctor.name, 350, 210)
      .text(`Email: ${doctor.email}`, 350, 225)
      .moveDown();

    // Table Header
    const tableTop = 270;
    doc
      .fontSize(10)
      .text('Service Description', 50, tableTop)
      .text('Date', 300, tableTop)
      .text('Amount', 450, tableTop, { align: 'right' });

    doc.strokeColor('#aaaaaa').lineWidth(1).moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

    // Table Content
    const rowY = tableTop + 30;
    doc
      .text('General Consultation', 50, rowY)
      .text(new Date(appointment.date).toLocaleDateString(), 300, rowY)
      .text('$100.00', 450, rowY, { align: 'right' });

    // Footer
    const footerY = 500;
    doc
      .strokeColor('#aaaaaa').lineWidth(1).moveTo(50, footerY).lineTo(550, footerY).stroke()
      .fontSize(15)
      .text('Total: $100.00', 450, footerY + 20, { align: 'right' })
      .fontSize(10)
      .text('Thank you for choosing AI Clinic!', 50, footerY + 50, { align: 'center' });

    doc.end();
  });
};
