const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// ------------------ GENERATE CERTIFICATE PDF ------------------
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
                fs.mkdirSync(certDir);
            }

            const fileName = `${studentName.replace(/ /g, '_')}_${eventTitle.replace(/ /g, '_')}.pdf`;
            const filePath = path.join(certDir, fileName);

            const doc = new PDFDocument({
                size: 'A4',
                layout: 'landscape',
                margin: 50
            });

            doc.pipe(fs.createWriteStream(filePath));

            // 🎨 BORDER
            doc
                .rect(20, 20, 800, 550)
                .lineWidth(3)
                .stroke('#2c3e50');

            // 🏆 TITLE
            doc
                .fontSize(32)
                .fillColor('#2c3e50')
                .text('Certificate of Participation', {
                    align: 'center'
                });

            doc.moveDown(1.5);

            // 📜 BODY TEXT
            doc
                .fontSize(18)
                .fillColor('#000')
                .text('This is proudly presented to', {
                    align: 'center'
                });

            doc.moveDown(1);

            // 👩‍🎓 STUDENT NAME
            doc
                .fontSize(28)
                .fillColor('#000')
                .font('Helvetica-Bold')
                .text(studentName, {
                    align: 'center'
                });

            doc.moveDown(0.5);

            // 🆔 REG / ID
            doc
                .fontSize(14)
                .font('Helvetica')
                .text(`Registration ID: ${studentReg}`, {
                    align: 'center'
                });

            doc.moveDown(1);

            // 📅 EVENT INFO
            doc
                .fontSize(18)
                .text(
                    `For ${certificateType.toLowerCase()} in`,
                    { align: 'center' }
                );

            doc.moveDown(0.5);

            doc
                .fontSize(22)
                .font('Helvetica-Bold')
                .text(eventTitle, {
                    align: 'center'
                });

            doc.moveDown(1);

            doc
                .fontSize(14)
                .font('Helvetica')
                .text(
                    `Event Date: ${new Date(eventDate).toDateString()}`,
                    { align: 'center' }
                );

            doc.moveDown(2);

            // ✍ SIGNATURE SECTION
            doc
                .fontSize(14)
                .text('______________________', 120, 470);

            doc.text('Event Organizer', 150, 490);

            doc
                .text('______________________', 520, 470);

            doc.text('Authorized Signature', 540, 490);

            // 📆 ISSUE DATE
            doc
                .fontSize(12)
                .text(
                    `Issued on: ${new Date(issueDate).toDateString()}`,
                    350,
                    520,
                    { align: 'center' }
                );

            // 🔳 QR CODE (BOTTOM RIGHT)
            if (qrCode) {
                const base64Data = qrCode.replace(/^data:image\/png;base64,/, '');
                const qrBuffer = Buffer.from(base64Data, 'base64');

                doc.image(qrBuffer, 700, 430, {
                    width: 90
                });

                doc
                    .fontSize(8)
                    .text('Scan to verify', 705, 525);
            }

            doc.end();

            resolve(filePath);

        } catch (error) {
            reject(error);
        }
    });
};
