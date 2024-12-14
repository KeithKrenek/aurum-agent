import jsPDF from 'jspdf';
import elementsistLogo from '../assets/stylized-logo.png';
import smallLogo from '../assets/black-logo.png';
import pageTwo from '../assets/page-2.png';

// Import custom fonts
import { CaslonGradReg } from './fonts/CaslonGrad-Regular.js';
import { IbarraRealNovaBold } from './fonts/IbarraRealNova-Bold.js';

// Normalize headings and adjust report structure
function normalizeHeadingsAndStructure(sections: string[]): string {
  return sections
    .map((section, index) => {
      // Add a title for each assistant's section
      return `# Assistant ${index + 1} Report\n\n${section}`;
    })
    .join('\n\n');
}

interface PdfOptions {
  brandName: string;
  reportParts: string[];
}

export const generatePDF = async ({ brandName, reportParts }: PdfOptions): Promise<void> => {
  // Normalize the headings and combine sections
  const combinedReport = normalizeHeadingsAndStructure(reportParts);

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
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

  // Add logo and brand name to the first page
  pdf.addImage(elementsistLogo, 'PNG', 0, 0, pageWidth, pageHeight);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(29);
  pdf.setTextColor(255, 255, 255);
  const brandNameWidth = pdf.getTextWidth(brandName.toUpperCase());
  const brandNameIndent = (pageWidth - brandNameWidth) / 2;
  pdf.text(brandName.toUpperCase(), brandNameIndent, 3 * pageHeight / 4);
  pdf.setTextColor(0, 0, 0);

  // Add second page graphic
  pdf.addPage();
  pdf.addImage(pageTwo, 'PNG', 0, 0, pageWidth, pageHeight);

  // Process and add the report content
  let yPosition = margin;

  const addWrappedText = (
    text: string,
    y: number,
    fontSize: number,
    fontName: string = 'helvetica',
    fontStyle: string = 'normal',
    indent: number = 0,
  ): number => {
    pdf.setFontSize(fontSize);
    pdf.setFont(fontName, fontStyle);
    const lineHeight = fontSize * 1.5;
    const maxWidth = usableWidth - indent;

    const lines = pdf.splitTextToSize(text, maxWidth);
    lines.forEach((line: string): void => {
      pdf.text(line, margin + indent, y);
      y += lineHeight;
      if (y > pageHeight - margin) {
        pdf.addPage();
        y = margin;
      }
    });

    return y;
  };

  const lines = combinedReport.split('\n');
  for (let line of lines) {
    line = line.trim();

    if (line.startsWith('# ')) {
      // Section title
      yPosition += 20;
      yPosition = addWrappedText(line.substring(2), yPosition, 18, 'CaslonGrad-Regular', 'normal');
      yPosition += 10;
    } else if (line.startsWith('## ')) {
      // Subsection title
      yPosition += 15;
      yPosition = addWrappedText(line.substring(3), yPosition, 14, 'helvetica', 'bold');
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      // Bulleted list
      yPosition = addWrappedText(line.substring(2), yPosition, 12, 'helvetica', 'normal', 20);
      yPosition += 5;
    } else if (line.match(/^\d+\.\s/)) {
      // Numbered list
      yPosition = addWrappedText(line, yPosition, 12, 'helvetica', 'normal', 20);
      yPosition += 5;
    } else if (line === '') {
      // Empty line (add spacing)
      yPosition += 10;
    } else {
      // Regular text
      yPosition = addWrappedText(line, yPosition, 12, 'helvetica');
      yPosition += 5;
    }
  }

  // Add page numbers and logo to the footer
  const pageCount = (pdf as any).internal.getNumberOfPages();
  const logoHeight = 0.25 * margin;
  const logoWidth = 2.34 * margin;
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.setFontSize(10);
    pdf.text(`${i} of ${pageCount}`, margin, pageHeight - margin / 2, { align: 'left' });
    pdf.addImage(smallLogo, 'PNG', pageWidth - logoWidth - margin, pageHeight - logoHeight - margin / 2, logoWidth, logoHeight);
  }

  pdf.save('aurum_agent_report.pdf');
};
