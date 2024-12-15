import jsPDF from 'jspdf';
import { CaslonGradReg } from './fonts/CaslonGrad-Regular.js';
import { IbarraRealNovaBold } from './fonts/IbarraRealNova-Bold.js';
import elementsistLogo from './assets/stylized-logo.png';
import smallLogo from './assets/black-logo.png';

interface PdfOptions {
  brandName: string;
  reportParts: string[];
}

export const generatePDF = async ({ brandName, reportParts }: PdfOptions): Promise<void> => {
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
  pdf.addImage(elementsistLogo, 'PNG', 0, 0, pageWidth, pageHeight);
  pdf.setFont('IbarraRealNova-Bold', 'bold');
  pdf.setFontSize(32);
  pdf.setTextColor(255, 255, 255);
  
  // Center brand name on cover
  const brandNameWidth = pdf.getTextWidth(brandName.toUpperCase());
  const brandNameX = (pageWidth - brandNameWidth) / 2;
  const brandNameY = pageHeight * 0.75;
  pdf.text(brandName.toUpperCase(), brandNameX, brandNameY);

  // Add title page
  pdf.addPage();
  pdf.setTextColor(0, 0, 0);
  pdf.setFont('CaslonGrad-Regular', 'normal');
  pdf.setFontSize(24);
  pdf.text('Brand Development Report', margin, margin + 40);
  pdf.setFontSize(16);
  pdf.text(new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }), margin, margin + 80);

  // Process each report section
  reportParts.forEach((reportContent, index) => {
    if (index > 0) pdf.addPage();
    
    let yPosition = margin;
    const lines = reportContent.split('\n');
    
    lines.forEach(line => {
      // Skip empty lines but add spacing
      if (line.trim() === '') {
        yPosition += 20;
        return;
      }

      // Format based on markdown heading level
      if (line.startsWith('# ')) {
        pdf.setFont('IbarraRealNova-Bold', 'bold');
        pdf.setFontSize(24);
        const text = line.replace('# ', '');
        pdf.text(text, margin, yPosition);
        yPosition += 40;
      } else if (line.startsWith('## ')) {
        pdf.setFont('IbarraRealNova-Bold', 'bold');
        pdf.setFontSize(18);
        const text = line.replace('## ', '');
        pdf.text(text, margin, yPosition);
        yPosition += 30;
      } else {
        // Handle regular text and bullet points
        pdf.setFont('CaslonGrad-Regular', 'normal');
        pdf.setFontSize(12);
        
        // Handle bullet points (numbered or unordered)
        const indent = line.startsWith('- ') || /^\d+\./.test(line) ? 20 : 0;
        
        const wrappedText = pdf.splitTextToSize(line, usableWidth - indent);
        wrappedText.forEach(textLine => {
          // Check if we need to add a new page
          if (yPosition > pageHeight - margin) {
            pdf.addPage();
            yPosition = margin;
          }
          
          pdf.text(textLine, margin + indent, yPosition);
          yPosition += 20;
        });
      }
    });
  });

  // Add footer with page numbers and logo
  const pageCount = pdf.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    if (i === 1) continue; // Skip footer on cover page

    // Add page number
    pdf.setFont('CaslonGrad-Regular', 'normal');
    pdf.setFontSize(10);
    pdf.text(`Page ${i} of ${pageCount}`, margin, pageHeight - margin/2);

    // Add small logo to footer
    const logoHeight = margin/2;
    const logoWidth = logoHeight * 2.34; // Maintain aspect ratio
    pdf.addImage(smallLogo, 'PNG', pageWidth - margin - logoWidth, pageHeight - margin * 0.75, logoWidth, logoHeight);
  }

  // Save the PDF
  const fileName = `${brandName.toLowerCase().replace(/\s+/g, '-')}-brand-report.pdf`;
  pdf.save(fileName);
};