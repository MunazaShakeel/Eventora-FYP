const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// ------------------ GENERATE CERTIFICATE PDF WITH BETTER DESIGN ------------------
exports.generateCertificate = ({
    studentName,
    studentReg,
    eventTitle,
    eventDate,
    certificateType,
    issueDate,
    qrCode
}) => {
    return new Promise((resolve, reject) => {
        try {
            // Folder ensure
            const certDir = path.join(__dirname, '../certificates');
            if (!fs.existsSync(certDir)) {
                fs.mkdirSync(certDir, { recursive: true });
            }

            const fileName = `${studentName.replace(/ /g, '_')}_${eventTitle.replace(/ /g, '_')}.pdf`;
            const filePath = path.join(certDir, fileName);

            const doc = new PDFDocument({
                size: 'A4',
                layout: 'landscape',
                margin: 0
            });

            const writeStream = fs.createWriteStream(filePath);
            doc.pipe(writeStream);

            const pageWidth = doc.page.width;
            const pageHeight = doc.page.height;

            // ---------------------- BACKGROUND DESIGN ----------------------
            // Main background
            doc.rect(0, 0, pageWidth, pageHeight)
               .fill('#ffffff');

            // Decorative top bar
            doc.rect(0, 0, pageWidth, 15)
               .fill('#8b4fa2');

            // Decorative bottom bar
            doc.rect(0, pageHeight - 15, pageWidth, 15)
               .fill('#8b4fa2');

            // Left decorative line
            doc.rect(0, 0, 8, pageHeight)
               .fill('#4ECDC4');

            // Right decorative line
            doc.rect(pageWidth - 8, 0, 8, pageHeight)
               .fill('#4ECDC4');

            // Main border
            doc.rect(30, 30, pageWidth - 60, pageHeight - 60)
               .lineWidth(3)
               .stroke('#8b4fa2');

            // Inner border
            doc.rect(40, 40, pageWidth - 80, pageHeight - 80)
               .lineWidth(1)
               .stroke('#4ECDC4');

            // ---------------------- TOP DECORATIVE PATTERN ----------------------
            for (let i = 0; i < 8; i++) {
                doc.circle(80 + (i * 90), 65, 6)
                   .fill('#f0e6ff');
            }

            // ---------------------- TITLE SECTION ----------------------
            // Certificate badge
            doc.fontSize(45)
               .fillColor('#FFE66D')
               .text('🏆', { align: 'center' });

            doc.moveDown(0.5);

            // Main Title
            doc.fontSize(34)
               .font('Helvetica-Bold')
               .fillColor('#8b4fa2')
               .text('CERTIFICATE OF PARTICIPATION', {
                   align: 'center'
               });

            doc.moveDown(0.3);

            // Subtitle line
            doc.fontSize(14)
               .font('Helvetica')
               .fillColor('#666')
               .text('Official Recognition of Achievement', {
                   align: 'center'
               });

            doc.moveDown(0.5);

            // Decorative line under title
            const titleLineY = doc.y + 5;
            doc.moveTo(250, titleLineY)
               .lineTo(pageWidth - 250, titleLineY)
               .lineWidth(1.5)
               .stroke('#4ECDC4');

            doc.moveDown(2);

            // ---------------------- BODY SECTION ----------------------
            // "Presented to" text
            doc.fontSize(16)
               .font('Helvetica')
               .fillColor('#555')
               .text('This certificate is proudly presented to', {
                   align: 'center'
               });

            doc.moveDown(1);

            // Student Name - Highlighted
            doc.fontSize(42)
               .font('Helvetica-Bold')
               .fillColor('#4ECDC4')
               .text(studentName, {
                   align: 'center'
               });

            doc.moveDown(0.5);

            // Registration ID badge
            doc.roundedRect((pageWidth / 2) - 100, doc.y - 5, 200, 25, 12)
               .fill('#f0e6ff');
            
            doc.fontSize(11)
               .font('Helvetica')
               .fillColor('#8b4fa2')
               .text(`Registration ID: ${studentReg}`, (pageWidth / 2) - 90, doc.y - 2, {
                   align: 'center'
               });

            doc.moveDown(2);

            // "for successfully completing" text
            doc.fontSize(16)
               .font('Helvetica')
               .fillColor('#555')
               .text(`for successfully completing the ${certificateType} program in`, {
                   align: 'center'
               });

            doc.moveDown(0.8);

            // Event Title - Highlighted
            doc.fontSize(26)
               .font('Helvetica-Bold')
               .fillColor('#8b4fa2')
               .text(eventTitle, {
                   align: 'center'
               });

            doc.moveDown(0.8);

            // Event details
            doc.fontSize(13)
               .font('Helvetica')
               .fillColor('#666')
               .text(`Held on: ${new Date(eventDate).toLocaleDateString('en-PK', { 
                   day: 'numeric', 
                   month: 'long', 
                   year: 'numeric' 
               })}`, {
                   align: 'center'
               });

            doc.moveDown(3);

            // ---------------------- SIGNATURE SECTION ----------------------
            const signatureY = doc.y;
            const leftSigX = 150;
            const rightSigX = pageWidth - 250;
            const centerSigX = (pageWidth / 2) - 80;

            // Left Signature
            doc.moveTo(leftSigX, signatureY)
               .lineTo(leftSigX + 150, signatureY)
               .lineWidth(1.5)
               .stroke('#333');
            
            doc.fontSize(11)
               .font('Helvetica')
               .fillColor('#333')
               .text('Event Coordinator', leftSigX + 15, signatureY + 8);

            doc.fontSize(9)
               .font('Helvetica')
               .fillColor('#888')
               .text('College Event Management', leftSigX + 25, signatureY + 22);

            // Center Stamp
            doc.circle(centerSigX + 40, signatureY - 20, 30)
               .lineWidth(1.5)
               .stroke('#8b4fa2');
            
            doc.fontSize(8)
               .font('Helvetica-Bold')
               .fillColor('#8b4fa2')
               .text('APPROVED', centerSigX + 20, signatureY - 28, {
                   align: 'center'
               });

            // Right Signature
            doc.moveTo(rightSigX, signatureY)
               .lineTo(rightSigX + 150, signatureY)
               .lineWidth(1.5)
               .stroke('#333');
            
            doc.fontSize(11)
               .font('Helvetica')
               .fillColor('#333')
               .text('Authorized Signatory', rightSigX + 25, signatureY + 8);

            doc.fontSize(9)
               .font('Helvetica')
               .fillColor('#888')
               .text('Head of Department', rightSigX + 40, signatureY + 22);

            doc.moveDown(3);

            // ---------------------- FOOTER SECTION ----------------------
            // Issue date
            doc.fontSize(10)
               .font('Helvetica')
               .fillColor('#888')
               .text(`Issued on: ${new Date(issueDate).toLocaleDateString('en-PK', {
                   day: 'numeric',
                   month: 'long',
                   year: 'numeric'
               })}`, (pageWidth / 2) - 100, doc.y, {
                   align: 'center'
               });

            // ---------------------- QR CODE ----------------------
            if (qrCode) {
                const base64Data = qrCode.replace(/^data:image\/png;base64,/, '');
                const qrBuffer = Buffer.from(base64Data, 'base64');

                // QR Code box
                doc.roundedRect(pageWidth - 110, pageHeight - 110, 85, 85, 8)
                   .fill('#f9f9f9');
                
                doc.image(qrBuffer, pageWidth - 105, pageHeight - 105, {
                    width: 75
                });

                doc.fontSize(7)
                   .fillColor('#aaa')
                   .text('Scan to verify', pageWidth - 98, pageHeight - 28, {
                       align: 'center'
                   });
            }

            // Certificate ID at bottom left
            const certificateId = `CERT-${Date.now().toString().slice(-8)}`;
            doc.fontSize(8)
               .fillColor('#bbb')
               .text(`Certificate ID: ${certificateId}`, 50, pageHeight - 30);

            // Verification URL
            doc.fontSize(7)
               .fillColor('#ccc')
               .text(`Verify at: ${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify`, 50, pageHeight - 20);

            // Decorative bottom pattern
            for (let i = 0; i < 8; i++) {
                doc.circle(80 + (i * 90), pageHeight - 55, 4)
                   .fill('#f0e6ff');
            }

            doc.end();

            writeStream.on('finish', () => {
                resolve(filePath);
            });

            writeStream.on('error', (error) => {
                reject(error);
            });

        } catch (error) {
            reject(error);
        }
    });
};

// ------------------ HELPER: GENERATE HTML CERTIFICATE (For quick download) ------------------
exports.generateCertificateHTML = ({
    studentName,
    studentReg,
    eventTitle,
    eventDate,
    certificateType,
    issueDate,
    certificateId,
    qrCode
}) => {
    const formattedDate = new Date(eventDate).toLocaleDateString('en-PK', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
    
    const formattedIssueDate = new Date(issueDate).toLocaleDateString('en-PK', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Certificate of Participation - ${studentName}</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: 'Segoe UI', 'Arial', sans-serif;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                padding: 20px;
            }
            
            .certificate {
                width: 1000px;
                background: white;
                border-radius: 20px;
                box-shadow: 0 30px 50px rgba(0,0,0,0.2);
                position: relative;
                overflow: hidden;
            }
            
            /* Top decorative bar */
            .certificate::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 15px;
                background: linear-gradient(90deg, #8b4fa2, #4ECDC4);
            }
            
            /* Bottom decorative bar */
            .certificate::after {
                content: '';
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                height: 15px;
                background: linear-gradient(90deg, #8b4fa2, #4ECDC4);
            }
            
            .certificate-border {
                border: 20px solid #8b4fa2;
                border-radius: 20px;
                margin: 10px;
                padding: 40px;
                position: relative;
            }
            
            .certificate-header {
                text-align: center;
                margin-bottom: 30px;
            }
            
            .certificate-icon {
                font-size: 60px;
                margin-bottom: 10px;
            }
            
            .certificate-title {
                font-size: 38px;
                color: #8b4fa2;
                letter-spacing: 3px;
                font-weight: bold;
                text-transform: uppercase;
                margin-bottom: 10px;
            }
            
            .certificate-subtitle {
                font-size: 14px;
                color: #666;
                border-top: 2px solid #8b4fa2;
                border-bottom: 2px solid #8b4fa2;
                display: inline-block;
                padding: 5px 20px;
            }
            
            .certificate-body {
                text-align: center;
                margin: 40px 0;
            }
            
            .presented-to {
                font-size: 16px;
                color: #555;
                margin-bottom: 15px;
            }
            
            .student-name {
                font-size: 48px;
                color: #4ECDC4;
                font-weight: bold;
                margin: 20px 0;
                border-bottom: 3px dotted #8b4fa2;
                display: inline-block;
                padding-bottom: 10px;
            }
            
            .registration-id {
                background: #f0e6ff;
                display: inline-block;
                padding: 5px 15px;
                border-radius: 20px;
                font-size: 12px;
                color: #8b4fa2;
                margin-top: 10px;
            }
            
            .for-text {
                font-size: 16px;
                color: #555;
                margin: 20px 0 10px;
            }
            
            .event-title {
                font-size: 28px;
                color: #8b4fa2;
                font-weight: bold;
                margin: 15px 0;
            }
            
            .event-details {
                font-size: 13px;
                color: #888;
                margin-top: 15px;
            }
            
            .certificate-footer {
                text-align: center;
                margin-top: 40px;
                padding-top: 20px;
                border-top: 1px solid #eee;
            }
            
            .signature {
                display: flex;
                justify-content: space-between;
                margin: 20px 0;
                padding: 0 30px;
            }
            
            .signature-line {
                text-align: center;
            }
            
            .signature-line .line {
                width: 180px;
                border-top: 2px solid #333;
                margin-bottom: 8px;
            }
            
            .signature-line .name {
                font-size: 13px;
                font-weight: bold;
            }
            
            .signature-line .title {
                font-size: 10px;
                color: #888;
            }
            
            .stamp {
                display: inline-block;
                border: 2px solid #8b4fa2;
                border-radius: 50%;
                padding: 8px 15px;
                font-size: 10px;
                font-weight: bold;
                color: #8b4fa2;
                margin: 0 auto;
            }
            
            .certificate-id {
                font-size: 9px;
                color: #bbb;
                margin-top: 20px;
                text-align: center;
            }
            
            .verification {
                background: #f5f5f5;
                padding: 12px;
                margin-top: 20px;
                border-radius: 10px;
                text-align: center;
            }
            
            .verification p {
                font-size: 10px;
                color: #666;
            }
            
            .date {
                font-size: 11px;
                color: #888;
                text-align: center;
                margin-top: 15px;
            }
            
            @media print {
                body {
                    background: white;
                    padding: 0;
                }
                .certificate {
                    box-shadow: none;
                    width: 100%;
                }
                .verification {
                    display: none;
                }
            }
        </style>
    </head>
    <body>
        <div class="certificate">
            <div class="certificate-border">
                <div class="certificate-header">
                    <div class="certificate-icon">🏆</div>
                    <h1 class="certificate-title">Certificate of Participation</h1>
                    <div class="certificate-subtitle">Official Recognition of Achievement</div>
                </div>
                
                <div class="certificate-body">
                    <p class="presented-to">This certificate is proudly presented to</p>
                    <div class="student-name">${studentName}</div>
                    <div class="registration-id">Registration ID: ${studentReg}</div>
                    
                    <p class="for-text">for successfully completing the ${certificateType} program in</p>
                    <div class="event-title">${eventTitle}</div>
                    <div class="event-details">Held on: ${formattedDate}</div>
                </div>
                
                <div class="certificate-footer">
                    <div class="signature">
                        <div class="signature-line">
                            <div class="line"></div>
                            <div class="name">Event Coordinator</div>
                            <div class="title">College Event Management</div>
                        </div>
                        <div class="signature-line">
                            <div class="stamp">APPROVED</div>
                        </div>
                        <div class="signature-line">
                            <div class="line"></div>
                            <div class="name">Authorized Signatory</div>
                            <div class="title">Head of Department</div>
                        </div>
                    </div>
                </div>
                
                <div class="date">Issued on: ${formattedIssueDate}</div>
                <div class="certificate-id">Certificate ID: ${certificateId}</div>
                
                <div class="verification">
                    <p>🔗 Verify this certificate at: ${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify</p>
                </div>
            </div>
        </div>
    </body>
    </html>`;
};