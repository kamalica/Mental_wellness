const PDFDocument = require('pdfkit');
const fs = require('fs');

/**
 * Generates a clean, professional PDF report with proper text flow and spacing.
 * Prevents text overlapping, eliminates extra blank pages, and ensures proper alignment.
 *
 * @param {Object} reportData - Contains the report text and user metadata.
 * @returns {Promise<Buffer>} - A promise that resolves with the generated PDF buffer.
 */
async function generateWellnessPDF(reportData) {
  return new Promise((resolve, reject) => {
    try {
      const { report, userName, age, generatedDate } = reportData;

      // Define page margins and content area
      const PAGE_MARGINS = { top: 50, bottom: 90, left: 60, right: 60 };
      const FOOTER_HEIGHT = 90; // Space reserved for footer

      const doc = new PDFDocument({
        size: 'A4',
        margins: PAGE_MARGINS,
        bufferPages: true,
        autoFirstPage: true, // Let PDFKit create the first page
        info: {
          Title: `Mental Wellness Report - ${userName}`,
          Author: 'Mental Wellness Platform',
        },
      });

      // Store page configuration for easy access
      doc.PAGE_MARGINS = PAGE_MARGINS;
      doc.FOOTER_HEIGHT = FOOTER_HEIGHT;
      doc.CONTENT_WIDTH = doc.page.width - PAGE_MARGINS.left - PAGE_MARGINS.right;
      doc.CONTENT_BOTTOM = doc.page.height - FOOTER_HEIGHT;

      // Stream the PDF data into a buffer
      const chunks = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Add all content sections with proper spacing
      addHeader(doc, userName);
      addMetadata(doc, userName, age, generatedDate);
      parseAndAddReportContent(doc, report);

      // Add footers to all pages
      addFooter(doc);

      // Finalize the document
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Adds the styled header section to the document.
 */
function addHeader(doc, userName) {
  // Save current state
  doc.save();
  
  // Draw header background
  doc.rect(0, 0, doc.page.width, 120).fill('#90ee90');
  
  // Restore state for text
  doc.restore();

  // Add header text with proper positioning
  doc.fillColor('#ffffff')
     .fontSize(28)
     .font('Helvetica-Bold')
     .text('Mental Wellness Report', doc.PAGE_MARGINS.left, 40, { 
       align: 'center',
       width: doc.CONTENT_WIDTH
     });
  
  doc.fillColor('#1a202c')
     .fontSize(15)
     .font('Helvetica')
     .text(`Personalized Analysis for ${userName}`, doc.PAGE_MARGINS.left, 78, { 
       align: 'center',
       width: doc.CONTENT_WIDTH
     });

  // Move Y position below header with proper spacing
  doc.y = 140;
}

/**
 * Adds the user metadata box below the header with proper spacing.
 */
function addMetadata(doc, userName, age, generatedDate) {
  const date = new Date(generatedDate || Date.now()).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  // Check if we need a new page
  checkPageBreak(doc, 80);

  const metadataY = doc.y;
  const boxWidth = doc.CONTENT_WIDTH;
  const boxHeight = 70;

  // Draw metadata box
  doc.roundedRect(doc.PAGE_MARGINS.left, metadataY, boxWidth, boxHeight, 8)
     .fillAndStroke('#f8fafc', '#cbd5e0');

  // Box title
  doc.fillColor('#1a202c')
     .fontSize(12)
     .font('Helvetica-Bold')
     .text('Report Details', doc.PAGE_MARGINS.left + 15, metadataY + 12);
  
  // Divider line
  doc.strokeColor('#e2e8f0')
     .lineWidth(1)
     .moveTo(doc.PAGE_MARGINS.left + 15, metadataY + 30)
     .lineTo(doc.page.width - doc.PAGE_MARGINS.right - 15, metadataY + 30)
     .stroke();

  // Metadata content
  doc.fillColor('#374151')
     .fontSize(10)
     .font('Helvetica')
     .text(`Name: ${userName}  |  Age: ${age}`, doc.PAGE_MARGINS.left + 15, metadataY + 38);
  
  doc.text(`Generated: ${date}`, doc.PAGE_MARGINS.left + 15, metadataY + 52);

  // Move Y position below the box with spacing
  doc.y = metadataY + boxHeight + 20;
}

/**
 * Helper function to check if we need a page break
 */
function checkPageBreak(doc, requiredSpace) {
  if (doc.y + requiredSpace > doc.CONTENT_BOTTOM) {
    doc.addPage();
  }
}

/**
 * Parses the raw report string and adds formatted content to the document.
 */
function parseAndAddReportContent(doc, report) {
  const lines = report.split('\n');

  for (const line of lines) {
    const trimmedLine = line.trim();

    // Skip separators, empty lines, and redundant metadata
    if (/^(=|-|_){3,}\s*$/.test(trimmedLine) || !trimmedLine) continue;
    if (trimmedLine.startsWith('**Date:') || trimmedLine.match(/^\*\*Mental Wellness Report for/i)) continue;

    // Check for different content types and add them appropriately
    if (trimmedLine.startsWith('###') || trimmedLine.startsWith('##')) {
      addSectionHeader(doc, trimmedLine.replace(/#{2,3}/g, '').trim());
    } else if (trimmedLine.match(/^[\*\+\-]\s/)) {
      addBulletPoint(doc, trimmedLine.substring(2).trim());
    } else if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**')) {
      // Bold text (subheadings)
      addBoldText(doc, trimmedLine.replace(/\*\*/g, '').trim());
    } else if (trimmedLine.length > 0) {
      addFormattedText(doc, trimmedLine);
    }
  }
}

/**
 * Adds a styled section header with appropriate spacing.
 */
function addSectionHeader(doc, text) {
  // Check if we need a new page (header + some content space)
  checkPageBreak(doc, 60);

  // Add spacing before section header
  doc.moveDown(0.5);

  const headerY = doc.y;
  
  // Add section header text
  doc.fillColor('#1a202c')
     .fontSize(13)
     .font('Helvetica-Bold')
     .text(text.toUpperCase(), doc.PAGE_MARGINS.left, headerY, {
       width: doc.CONTENT_WIDTH,
       align: 'left'
     });

  // Add decorative line under header
  doc.strokeColor('#90ee90')
     .lineWidth(2)
     .moveTo(doc.PAGE_MARGINS.left, doc.y + 3)
     .lineTo(doc.page.width - doc.PAGE_MARGINS.right, doc.y + 3)
     .stroke();
  
  // Add space after the line
  doc.y += 10;
}

/**
 * Adds bold text (for subheadings)
 */
function addBoldText(doc, text) {
  checkPageBreak(doc, 30);
  
  doc.fillColor('#1a202c')
     .fontSize(11)
     .font('Helvetica-Bold')
     .text(text, doc.PAGE_MARGINS.left, doc.y, {
       width: doc.CONTENT_WIDTH,
       align: 'left',
       lineGap: 2
     });
  
  doc.moveDown(0.3);
}

/**
 * Adds a formatted bullet point with proper indentation.
 */
function addBulletPoint(doc, text) {
  // Estimate the height needed for this bullet point
  const estimatedHeight = Math.ceil(text.length / 80) * 15 + 10;
  checkPageBreak(doc, estimatedHeight);

  const currentY = doc.y;
  const bulletX = doc.PAGE_MARGINS.left + 5;
  const textX = doc.PAGE_MARGINS.left + 20;

  // Draw bullet point
  doc.circle(bulletX, currentY + 5, 2.5).fill('#90ee90');
  
  // Add bullet text
  doc.fillColor('#374151')
     .fontSize(10)
     .font('Helvetica')
     .text(text, textX, currentY, {
       width: doc.CONTENT_WIDTH - 20,
       align: 'left',
       lineGap: 2
     });
  
  // Add small space after bullet
  doc.moveDown(0.2);
}

/**
 * Adds a standard paragraph of text with proper wrapping.
 */
function addFormattedText(doc, text) {
  // Estimate height needed for this paragraph
  const estimatedHeight = Math.ceil(text.length / 90) * 15 + 10;
  checkPageBreak(doc, estimatedHeight);
  
  doc.fillColor('#374151')
     .fontSize(10)
     .font('Helvetica')
     .text(text, doc.PAGE_MARGINS.left, doc.y, {
       width: doc.CONTENT_WIDTH,
       align: 'left',
       lineGap: 3
     });
  
  // Add small space after paragraph
  doc.moveDown(0.3);
}

/**
 * Adds a consistent footer to every page of the document.
 */
function addFooter(doc) {
  const range = doc.bufferedPageRange();
  
  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(i);

    const footerY = doc.page.height - 75;
    const left = doc.PAGE_MARGINS.left;
    const right = doc.PAGE_MARGINS.right;

    // Divider line above footer
    doc.strokeColor('#cbd5e0')
       .lineWidth(1)
       .moveTo(left, footerY)
       .lineTo(doc.page.width - right, footerY)
       .stroke();

    // Disclaimer text
    const disclaimer = 'This report is for informational purposes only and does not constitute medical advice.\nPlease consult a healthcare professional for personalized guidance.';
    
    doc.fillColor('#6b7280')
       .fontSize(8)
       .font('Helvetica')
       .text(disclaimer, left, footerY + 8, { 
         width: doc.CONTENT_WIDTH, 
         align: 'center',
         lineGap: 1
       });

    // Page number at bottom
    doc.fillColor('#374151')
       .fontSize(9)
       .font('Helvetica')
       .text(`Page ${i + 1} of ${range.count}`, left, doc.page.height - 30, { 
         align: 'center', 
         width: doc.CONTENT_WIDTH 
       });
  }
}

module.exports = { generateWellnessPDF };