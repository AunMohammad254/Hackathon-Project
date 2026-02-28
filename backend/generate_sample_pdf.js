const PDFDocument = require('pdfkit');
const fs = require('fs');

const doc = new PDFDocument();
doc.pipe(fs.createWriteStream('sample_lab_report.pdf'));

doc.fontSize(20).text('CITY GENERAL HOSPITAL - LABORATORY REPORT', { align: 'center' });
doc.moveDown();
doc.fontSize(12).text('Patient Name: Jane Smith');
doc.text('Date of Birth: 1985-04-12');
doc.text('Date of Test: 2026-03-01');
doc.moveDown();

doc.fontSize(14).text('Complete Blood Count (CBC) & Lipid Panel', { underline: true });
doc.moveDown();

doc.fontSize(12).text('1. Hemoglobin: 11.2 g/dL (Normal: 12.0 - 15.5) - LOW');
doc.text('2. White Blood Cells: 6.5 K/uL (Normal: 4.5 - 11.0) - NORMAL');
doc.text('3. Platelets: 250 K/uL (Normal: 150 - 450) - NORMAL');
doc.text('4. Total Cholesterol: 245 mg/dL (Normal: < 200) - HIGH');
doc.text('5. LDL (Bad) Cholesterol: 160 mg/dL (Normal: < 100) - HIGH');
doc.text('6. HDL (Good) Cholesterol: 45 mg/dL (Normal: > 50) - LOW');
doc.text('7. Triglycerides: 180 mg/dL (Normal: < 150) - HIGH');
doc.text('8. Fasting Glucose: 95 mg/dL (Normal: 70 - 100) - NORMAL');

doc.moveDown();
doc.text('Notes: Patient shows signs of mild anemia and hyperlipidemia. Recommend dietary changes and follow-up in 3 months.');

doc.end();

console.log('sample_lab_report.pdf created successfully');
