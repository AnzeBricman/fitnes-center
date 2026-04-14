import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export async function createSimplePdf({
  title,
  subtitle,
  lines,
}: {
  title: string;
  subtitle: string;
  lines: string[];
}) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  page.drawText(title, {
    x: 50,
    y: 780,
    size: 24,
    font: bold,
    color: rgb(0.11, 0.1, 0.08),
  });

  page.drawText(subtitle, {
    x: 50,
    y: 750,
    size: 12,
    font,
    color: rgb(0.42, 0.38, 0.34),
  });

  lines.forEach((line, index) => {
    page.drawText(line, {
      x: 50,
      y: 700 - index * 24,
      size: 12,
      font,
      color: rgb(0.11, 0.1, 0.08),
    });
  });

  return pdfDoc.save();
}
