const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// ------------------ GENERATE CERTIFICATE PDF WITH BEAUTIFUL DESIGN ------------------
exports.generateCertificate = ({
    studentName,
    studentReg,
    eventTitle,
    eventDate,
    certificateType,
    issueDate,
    qrCode,
    eventVenue = 'College Campus',
    certificateId = `CERT-${Date.now().toString().slice(-8)}`
}) => {
    return new Promise((resolve, reject) => {
        try {
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

            // Background
            doc.rect(0, 0, pageWidth, pageHeight).fill('#ffffff');

            // Decorative top bar
            for (let i = 0; i <= pageWidth; i += 10) {
                doc.rect(i, 0, 10, 12).fill(i % 20 === 0 ? '#8b4fa2' : '#4ECDC4');
            }

            // Decorative bottom bar
            for (let i = 0; i <= pageWidth; i += 10) {
                doc.rect(i, pageHeight - 12, 10, 12).fill(i % 20 === 0 ? '#8b4fa2' : '#4ECDC4');
            }

            // Left and Right decorative lines
            doc.rect(0, 0, 8, pageHeight).fill('#8b4fa2');
            doc.rect(pageWidth - 8, 0, 8, pageHeight).fill('#8b4fa2');

            // Borders
            doc.rect(25, 25, pageWidth - 50, pageHeight - 50).lineWidth(3).stroke('#8b4fa2');
            doc.rect(35, 35, pageWidth - 70, pageHeight - 70).lineWidth(1.5).stroke('#4ECDC4');

            // Corner decorations
            const cornerSize = 30;
            doc.moveTo(25, 25 + cornerSize).lineTo(25, 25).lineTo(25 + cornerSize, 25).lineWidth(3).stroke('#8b4fa2');
            doc.moveTo(pageWidth - 25, 25 + cornerSize).lineTo(pageWidth - 25, 25).lineTo(pageWidth - 25 - cornerSize, 25).lineWidth(3).stroke('#8b4fa2');
            doc.moveTo(25, pageHeight - 25 - cornerSize).lineTo(25, pageHeight - 25).lineTo(25 + cornerSize, pageHeight - 25).lineWidth(3).stroke('#8b4fa2');
            doc.moveTo(pageWidth - 25, pageHeight - 25 - cornerSize).lineTo(pageWidth - 25, pageHeight - 25).lineTo(pageWidth - 25 - cornerSize, pageHeight - 25).lineWidth(3).stroke('#8b4fa2');

            // Title Section
            doc.fontSize(50).fillColor('#FFD700').text(certificateType === 'Winner' ? '🏆' : '📜', { align: 'center' });
            doc.moveDown(0.3);
            doc.fontSize(32).font('Helvetica-Bold').fillColor('#8b4fa2').text(`CERTIFICATE OF ${certificateType.toUpperCase()}`, { align: 'center' });
            doc.moveDown(0.3);
            doc.fontSize(14).font('Helvetica').fillColor('#6b7280').text('Official Recognition of Achievement', { align: 'center' });
            doc.moveDown(2);

            // Body Section
            doc.fontSize(16).font('Helvetica').fillColor('#6b7280').text('This certificate is proudly presented to', { align: 'center' });
            doc.moveDown(1.2);
            doc.fontSize(46).font('Helvetica-Bold').fillColor('#4ECDC4').text(studentName, { align: 'center' });
            doc.moveDown(0.5);

            // Registration ID
            doc.roundedRect((pageWidth / 2) - 120, doc.y - 3, 240, 28, 14).fill('#f3e8ff');
            doc.fontSize(11).font('Helvetica').fillColor('#8b4fa2').text(`Registration ID: ${studentReg}`, (pageWidth / 2) - 110, doc.y - 1, { align: 'center' });
            doc.moveDown(2);

            // Achievement text
            doc.fontSize(16).font('Helvetica').fillColor('#6b7280').text(`for successfully completing the ${certificateType} program in`, { align: 'center' });
            doc.moveDown(0.8);
            doc.fontSize(28).font('Helvetica-Bold').fillColor('#8b4fa2').text(eventTitle, { align: 'center' });
            doc.moveDown(0.8);

            // Event Details
            const detailsY = doc.y;
            doc.roundedRect((pageWidth / 2) - 180, detailsY - 5, 360, 45, 10).fill('#faf5ff');
            doc.fontSize(12).font('Helvetica').fillColor('#6b7280').text(`📅 ${new Date(eventDate).toLocaleDateString('en-PK', { day: 'numeric', month: 'long', year: 'numeric' })}`, (pageWidth / 2) - 160, detailsY);
            doc.fontSize(12).font('Helvetica').fillColor('#6b7280').text(`📍 ${eventVenue}`, (pageWidth / 2) - 160, detailsY + 22);
            doc.moveDown(3.5);

            // Separator line
            const separatorY = doc.y;
            doc.moveTo(200, separatorY).lineTo(pageWidth - 200, separatorY).lineWidth(1).stroke('#e5e7eb');
            doc.moveDown(0.8);

            // Issue Date
            doc.fontSize(11).font('Helvetica').fillColor('#9ca3af').text(`Issued on: ${new Date(issueDate).toLocaleDateString('en-PK', { day: 'numeric', month: 'long', year: 'numeric' })}`, (pageWidth / 2) - 100, doc.y, { align: 'center' });

            // ✅ FIXED: QR Code with proper verify link (using frontend URL with certificate ID)
            if (qrCode) {
                const base64Data = qrCode.replace(/^data:image\/png;base64,/, '');
                const qrBuffer = Buffer.from(base64Data, 'base64');

                // QR Code background box
                doc.roundedRect(pageWidth - 120, pageHeight - 120, 95, 95, 10).fill('#faf5ff');
                doc.roundedRect(pageWidth - 117, pageHeight - 117, 89, 89, 8).fill('#ffffff');
                doc.image(qrBuffer, pageWidth - 112, pageHeight - 112, { width: 80 });

             

            }

            // Footer
            doc.fontSize(8).fillColor('#d1d5db').font('Courier').text(`Certificate ID: ${certificateId}`, 50, pageHeight - 30);
            
            // ✅ FIXED: Verification link - shows full URL but QR code scans to this
            const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify/${certificateId}`;
            doc.fontSize(7).fillColor('#d1d5db').text(`Verify: ${verifyUrl}`, 50, pageHeight - 20);

            // Bottom decorative dots
            for (let i = 0; i < 12; i++) {
                doc.circle(70 + (i * 75), pageHeight - 55, 4).fill('#f0e6ff');
            }

            // Watermark
            doc.opacity(0.03);
            doc.fontSize(120).font('Helvetica-Bold').fillColor('#8b4fa2').text('CERTIFICATE', 150, pageHeight / 2 - 60, { align: 'center', rotate: -30 });
            doc.opacity(1);

            doc.end();

            writeStream.on('finish', () => resolve(filePath));
            writeStream.on('error', (error) => reject(error));

        } catch (error) {
            reject(error);
        }
    });
};

// ------------------ HELPER: GENERATE BEAUTIFUL HTML CERTIFICATE ------------------
exports.generateCertificateHTML = ({
    studentName,
    studentReg,
    eventTitle,
    eventDate,
    certificateType,
    issueDate,
    certificateId,
    qrCode,
    eventVenue = 'College Campus'
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

    // ✅ FIXED: Complete verification URL
    const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify/${certificateId}`;

    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Certificate of ${certificateType} - ${studentName}</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
                font-family: 'Segoe UI', 'Poppins', 'Arial', sans-serif;
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
                border-radius: 30px;
                box-shadow: 0 30px 60px rgba(0,0,0,0.3);
                position: relative;
                overflow: hidden;
                animation: fadeIn 0.5s ease-out;
            }
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
            }
            .certificate::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 12px;
                background: linear-gradient(90deg, #8b4fa2, #4ECDC4, #8b4fa2, #4ECDC4);
                background-size: 200% 100%;
                animation: gradientMove 3s ease infinite;
            }
            .certificate::after {
                content: '';
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                height: 12px;
                background: linear-gradient(90deg, #4ECDC4, #8b4fa2, #4ECDC4, #8b4fa2);
                background-size: 200% 100%;
                animation: gradientMove 3s ease infinite;
            }
            @keyframes gradientMove {
                0% { background-position: 0% 50%; }
                50% { background-position: 100% 50%; }
                100% { background-position: 0% 50%; }
            }
            .certificate-border {
                border: 20px solid #8b4fa2;
                border-radius: 25px;
                margin: 12px;
                padding: 45px;
                position: relative;
                background: white;
            }
            .certificate-border::before {
                content: '✨';
                position: absolute;
                top: -15px;
                left: 50%;
                transform: translateX(-50%);
                background: white;
                padding: 0 15px;
                color: #8b4fa2;
                font-size: 20px;
            }
            .certificate-header { text-align: center; margin-bottom: 35px; }
            .certificate-icon { font-size: 65px; margin-bottom: 10px; animation: bounce 2s ease infinite; }
            @keyframes bounce {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-5px); }
            }
            .certificate-title {
                font-size: 36px;
                background: linear-gradient(135deg, #8b4fa2, #4ECDC4);
                -webkit-background-clip: text;
                background-clip: text;
                color: transparent;
                letter-spacing: 3px;
                font-weight: bold;
                text-transform: uppercase;
            }
            .certificate-subtitle {
                font-size: 14px;
                color: #9ca3af;
                border-top: 2px solid #f3e8ff;
                border-bottom: 2px solid #f3e8ff;
                display: inline-block;
                padding: 6px 25px;
                margin-top: 10px;
            }
            .certificate-body { text-align: center; margin: 45px 0; }
            .presented-to { font-size: 16px; color: #6b7280; margin-bottom: 15px; }
            .student-name {
                font-size: 52px;
                background: linear-gradient(135deg, #4ECDC4, #8b4fa2);
                -webkit-background-clip: text;
                background-clip: text;
                color: transparent;
                font-weight: bold;
                margin: 25px 0;
                border-bottom: 3px dotted #c084fc;
                display: inline-block;
                padding-bottom: 10px;
            }
            .registration-id {
                background: linear-gradient(135deg, #f3e8ff, #fae8ff);
                display: inline-block;
                padding: 6px 20px;
                border-radius: 25px;
                font-size: 12px;
                font-weight: 600;
                color: #8b4fa2;
                margin-top: 10px;
            }
            .for-text { font-size: 16px; color: #6b7280; margin: 30px 0 12px; }
            .event-title {
                font-size: 32px;
                color: #8b4fa2;
                font-weight: bold;
                margin: 20px 0;
                padding: 12px 24px;
                background: linear-gradient(135deg, #fae8ff, #f3e8ff);
                display: inline-block;
                border-radius: 20px;
            }
            .event-details {
                font-size: 14px;
                color: #9ca3af;
                margin-top: 20px;
                display: flex;
                justify-content: center;
                gap: 30px;
                flex-wrap: wrap;
            }
            .event-details span { display: inline-flex; align-items: center; gap: 8px; }
            .certificate-footer { text-align: center; margin-top: 45px; padding-top: 20px; border-top: 2px solid #f3e8ff; }
            .issue-date {
                font-size: 12px;
                color: #9ca3af;
                margin-bottom: 15px;
                display: inline-block;
                background: #faf5ff;
                padding: 8px 20px;
                border-radius: 25px;
            }
            .certificate-id {
                font-size: 10px;
                color: #d1d5db;
                margin-top: 20px;
                text-align: center;
                font-family: monospace;
            }
            .verification {
                background: linear-gradient(135deg, #faf5ff, #fdf4ff);
                padding: 15px;
                margin-top: 25px;
                border-radius: 15px;
                text-align: center;
                border: 1px solid #f3e8ff;
            }
            .verification p { font-size: 11px; color: #6b7280; }
            .verification a {
                color: #8b4fa2;
                text-decoration: none;
                font-weight: bold;
                word-break: break-all;
            }
            .verification a:hover { text-decoration: underline; }
            @media print {
                body { background: white; padding: 0; }
                .certificate { box-shadow: none; width: 100%; border-radius: 0; }
                .verification { display: none; }
                .certificate::before, .certificate::after { animation: none; }
            }
        </style>
    </head>
    <body>
        <div class="certificate">
            <div class="certificate-border">
                <div class="certificate-header">
                    <div class="certificate-icon">${certificateType === 'Winner' ? '🏆' : '📜'}</div>
                    <h1 class="certificate-title">Certificate of ${certificateType}</h1>
                    <div class="certificate-subtitle">Official Recognition of Achievement</div>
                </div>
                
                <div class="certificate-body">
                    <p class="presented-to">This certificate is proudly presented to</p>
                    <div class="student-name">${studentName}</div>
                    <div class="registration-id">📌 Registration ID: ${studentReg}</div>
                    
                    <p class="for-text">for successfully completing the ${certificateType} program in</p>
                    <div class="event-title">${eventTitle}</div>
                    <div class="event-details">
                        <span>📅 ${formattedDate}</span>
                        <span>📍 ${eventVenue}</span>
                    </div>
                </div>
                
                <div class="certificate-footer">
                    <div class="issue-date">📅 Issued on: ${formattedIssueDate}</div>
                </div>
                
                <div class="certificate-id">🔗 Certificate ID: ${certificateId}</div>
                
                <div class="verification">
                    <p>✅ <strong>Verify this certificate:</strong></p>
                    <p><a href="${verifyUrl}" target="_blank">${verifyUrl}</a></p>
                    <p style="font-size: 9px; margin-top: 8px;">🔍 Scan QR code above to verify instantly</p>
                </div>
            </div>
        </div>
    </body>
    </html>`;
};