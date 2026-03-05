import PDFDocument from "pdfkit";

export function generateConsultationPDF({
  reportId,
  appointmentId,
  doctorName,
  patientName,
  diagnosis,
  prescription,
  notes,
  improvementSuggestions,
  createdAt,
}) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margin: 50 });
      const chunks = [];

      doc.on("data", (c) => chunks.push(c));
      doc.on("end", () => resolve(Buffer.concat(chunks)));

      doc.fontSize(18).text("OneStep HealthCare – Consultation Report", { align: "center" });
      doc.moveDown();

      doc.fontSize(12).text(`Report ID: ${reportId}`);
      doc.text(`Appointment ID: ${appointmentId}`);
      doc.text(`Doctor: ${doctorName}`);
      doc.text(`Patient: ${patientName}`);
      doc.text(`Created: ${createdAt}`);
      doc.moveDown();

      doc.fontSize(14).text("Diagnosis");
      doc.fontSize(12).text(diagnosis || "N/A");
      doc.moveDown();

      doc.fontSize(14).text("Prescription");
      doc.fontSize(12).text(prescription || "N/A");
      doc.moveDown();

      doc.fontSize(14).text("Doctor Notes");
      doc.fontSize(12).text(notes || "N/A");
      doc.moveDown();

      doc.fontSize(14).text("Improvement Suggestions");
      doc.fontSize(12).text(improvementSuggestions || "N/A");
      doc.moveDown();

      doc.fontSize(10).text(
        "Disclaimer: This report is generated for academic study and patient guidance only. It is not medical advice.",
        { align: "left" }
      );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}