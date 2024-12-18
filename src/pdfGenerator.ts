import jsPDF from 'jspdf';
import { CaslonGradReg } from './fonts/CaslonGrad-Regular.js';
import { IbarraRealNovaBold } from './fonts/IbarraRealNova-Bold.js';
import titlepage from './assets/bam-spark-1.png';
import secondpage from './assets/bam-spark-2.png';
// import smallLogo from './assets/black-logo.png';

interface PdfOptions {
  brandName: string;
  reportParts: string[];
  phaseName: string; // New parameter for dynamic naming
}

// Process text with bold headings and inline bold content
const processTextLine = (
  pdf: jsPDF,
  line: string,
  x: number,
  y: number,
  usableWidth: number
): { y: number; newPage: boolean } => {
  const heading1Regex = /^# (.*)/; // Top-level heading
  const heading2Regex = /^## (.*)/; // Sub-level heading
  const boldTextRegex = /\*\*(.*?)\*\*/g;

  let newPage = false;

  // Top-level heading
  if (heading1Regex.test(line)) {
    pdf.setFont('CaslonGrad-Regular', 'normal');
    pdf.setFontSize(24);
    const text = line.match(heading1Regex)?.[1] || '';
    pdf.text(text, x, y);
    return { y: y + 40, newPage };
  }

  // Sub-level heading
  if (heading2Regex.test(line)) {
    pdf.setFont('CaslonGrad-Regular', 'normal');
    pdf.setFontSize(18);
    const text = line.match(heading2Regex)?.[1] || '';
    pdf.text(text, x, y);
    return { y: y + 30, newPage };
  }

  // Regular text with inline bold content
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(12);

  const wrappedLines = pdf.splitTextToSize(line, usableWidth);
  wrappedLines.forEach((wrappedLine: string) => {
    let currentX = x;
    let currentFont = 'normal';

    const segments = wrappedLine.split(boldTextRegex);

    segments.forEach((segment: string, index: number) => {
      if (index % 2 === 1) {
        // Bold text
        pdf.setFont('helvetica', 'bold');
        currentFont = 'bold';
      } else {
        // Regular text
        pdf.setFont('helvetica', 'normal');
        currentFont = 'normal';
      }
      pdf.text(segment, currentX, y);
      currentX += pdf.getTextWidth(segment) + 2; // Increment X for inline text
    });

    // Reset font after line
    pdf.setFont('helvetica', currentFont);
    y += 20;

    // Check for page overflow
    if (y > pdf.internal.pageSize.height - 50) {
      newPage = true;
    }
  });

  return { y, newPage };
};

export const generatePDF = async ({ brandName, reportParts, phaseName }: PdfOptions): Promise<void> => {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4'
  });

  // Add custom fonts
  pdf.addFileToVFS('CaslonGrad-Regular.ttf', CaslonGradReg);
  pdf.addFileToVFS('IbarraRealNova-Bold.ttf', IbarraRealNovaBold);
  pdf.addFont('CaslonGrad-Regular.ttf', 'CaslonGrad-Regular', 'normal');
  pdf.addFont('IbarraRealNova-Bold.ttf', 'IbarraRealNova-Bold', 'bold');

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 50;
  const usableWidth = pageWidth - 2 * margin;

  // Add cover page
  pdf.addImage(titlepage, 'PNG', 0, 0, pageWidth, pageHeight);
  pdf.setFont('IbarraRealNova-Bold', 'bold');
  pdf.setFontSize(32);
  pdf.setTextColor(255, 255, 255);

  const brandNameWidth = pdf.getTextWidth(brandName.toUpperCase());
  pdf.text(brandName.toUpperCase(), (pageWidth - brandNameWidth) / 2, pageHeight * 0.9);

  // Add second page
  pdf.addPage();
  pdf.addImage(secondpage, 'PNG', 0, 0, pageWidth, pageHeight);

  // Start content on a new page
  pdf.addPage();
  pdf.setTextColor(0, 0, 0);

  // Process each report part
  reportParts.forEach((reportContent, index) => {
    let yPosition = margin;

    // Add a new page for each report part
    if (index > 0) {
      pdf.addPage();
    }

    const lines = reportContent.split('\n');
    lines.forEach(line => {
      const { y, newPage } = processTextLine(pdf, line, margin, yPosition, usableWidth);
      yPosition = y;

      if (newPage) {
        pdf.addPage();
        yPosition = margin;
      }
    });
  });

  // Add footer with page numbers and logo
  // const pageCount = pdf.getNumberOfPages();
  // for (let i = 1; i <= pageCount; i++) {
  //   pdf.setPage(i);
  //   if (i === 1) continue; // Skip footer on cover page

  //   pdf.setFont('helvetica', 'normal');
  //   pdf.setFontSize(10);
  //   pdf.text(`Page ${i} of ${pageCount}`, margin, pageHeight - margin / 2);

  //   const logoHeight = margin / 2;
  //   const logoWidth = logoHeight * 2.34;
  //   pdf.addImage(smallLogo, 'PNG', pageWidth - margin - logoWidth, pageHeight - margin * 0.75, logoWidth, logoHeight);
  // }

  // Save the PDF with dynamic phase-based name
  const sanitizedPhaseName = phaseName.toLowerCase().replace(/\s+/g, '-');
  const fileName = `${brandName.toLowerCase().replace(/\s+/g, '-')}-${sanitizedPhaseName}-report.pdf`;
  pdf.save(fileName);
};
