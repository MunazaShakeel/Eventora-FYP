const Certificate = require('../models/Certificate');
const Registration = require('../models/Registration');
const Event = require('../models/Event');
const Student = require('../models/Student');
const { generateCertificate } = require('../utils/certificate.util');
const { generateQR } = require('../utils/qr.util');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// ------------------ ISSUE CERTIFICATE (with organizer check) ------------------
exports.issueCertificate = async (req, res) => {
    try {
        const { student_id, event_id, certificate_type = 'Participation' } = req.body;
        const user = req.user;

        // CHECK: Organizer can only issue certificates for their own events
        if (user.role === 'Organizer') {
            const event = await Event.findOne({ 
                _id: event_id, 
                organizer_id: user.id 
            });
            
            if (!event) {
                return res.status(403).json({
                    success: false,
                    message: 'You can only issue certificates for your own events'
                });
            }
        }

        // Check attendance
        const registration = await Registration.findOne({ student_id, event_id });
        if (!registration || registration.attendance_status !== 'Present') {
            return res.status(400).json({
                success: false,
                message: 'Certificate can only be issued to present students'
            });
        }

        // Prevent duplicate
        const existingCertificate = await Certificate.findOne({ student_id, event_id });
        if (existingCertificate) {
            return res.status(400).json({ success: false, message: 'Certificate already issued' });
        }

        const student = await Student.findById(student_id);
        const event = await Event.findById(event_id);

        // Generate QR for certificate verification
        const qrData = `CERT-${student._id}-${event._id}`;
        const qrCode = await generateQR(qrData);

        // Generate PDF certificate
        const pdfPath = await exports.generateCertificatePDF({
            studentName: student.name,
            studentReg: student.registration_no || student._id.toString(),
            eventTitle: event.title,
            eventDate: event.start_date,
            certificateType: certificate_type,
            issueDate: new Date(),
            qrCode
        });

        const certificate = await Certificate.create({
            student_id,
            event_id,
            certificate_type,
            certificate_url: pdfPath,
            issued_date: new Date(),
            qr_data: qrData
        });

        res.status(201).json({
            success: true,
            message: 'Certificate issued successfully',
            data: { certificate, qrCode }
        });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Error issuing certificate', error: error.message });
    }
};

// ------------------ GET STUDENT CERTIFICATES ------------------
exports.getCertificatesByStudent = async (req, res) => {
    try {
        const student_id = req.user.id;
        const certificates = await Certificate.find({ student_id })
            .populate('event_id', 'title start_date end_date venue');

        res.status(200).json({ success: true, data: certificates });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching certificates', error: error.message });
    }
};

// ------------------ GET ALL CERTIFICATES (ADMIN sees all, ORGANIZER sees only their events) ------------------
exports.getAllCertificates = async (req, res) => {
    try {
        const user = req.user;
        let query = {};
        
        if (user.role === 'Organizer') {
            const organizerEvents = await Event.find({ 
                organizer_id: user.id 
            }).select('_id');
            
            const eventIds = organizerEvents.map(event => event._id);
            query.event_id = { $in: eventIds };
        }
        
        if (req.query.event_id) {
            query.event_id = req.query.event_id;
        }
        
        const certificates = await Certificate.find(query)
            .populate('student_id', 'name email')
            .populate('event_id', 'title start_date end_date')
            .sort({ issued_date: -1 });

        res.status(200).json({ 
            success: true, 
            count: certificates.length,
            data: certificates 
        });

    } catch (error) {
        console.error('Error in getAllCertificates:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching certificates', 
            error: error.message 
        });
    }
};

// ------------------ GET ORGANIZER'S CERTIFICATES ------------------
exports.getOrganizerCertificates = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const myEvents = await Event.find({ organizer_id: userId }).select('_id');
        const eventIds = myEvents.map(event => event._id);
        
        if (eventIds.length === 0) {
            return res.status(200).json({
                success: true,
                count: 0,
                data: [],
                message: 'No events found for this organizer'
            });
        }
        
        const certificates = await Certificate.find({ 
            event_id: { $in: eventIds } 
        })
        .populate('student_id', 'name email')
        .populate('event_id', 'title start_date end_date venue')
        .sort({ issued_date: -1 });
        
        res.status(200).json({
            success: true,
            count: certificates.length,
            data: certificates
        });
        
    } catch (error) {
        console.error('Error in getOrganizerCertificates:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching organizer certificates',
            error: error.message
        });
    }
};

// ------------------ ✅ NEW: DOWNLOAD CERTIFICATE ------------------
exports.downloadCertificate = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Find certificate with populated data
        const certificate = await Certificate.findById(id)
            .populate('student_id', 'name email registration_no')
            .populate('event_id', 'title start_date end_date venue');
        
        if (!certificate) {
            return res.status(404).json({ success: false, message: 'Certificate not found' });
        }
        
        // Check authorization
        const isAdmin = req.user.role === 'Admin';
        const isOrganizer = req.user.role === 'Organizer';
        const isOwner = certificate.student_id._id.toString() === req.user.id?.toString();
        
        if (!isAdmin && !isOrganizer && !isOwner) {
            return res.status(403).json({ success: false, message: 'Not authorized to download this certificate' });
        }
        
        // If certificate has stored PDF file, serve it
        if (certificate.certificate_url && fs.existsSync(certificate.certificate_url)) {
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=certificate_${certificate.student_id.name.replace(/\s/g, '_')}.pdf`);
            return res.sendFile(certificate.certificate_url);
        }
        
        // Otherwise generate HTML certificate
        const htmlContent = generateCertificateHTML(certificate);
        
        res.setHeader('Content-Type', 'text/html');
        res.setHeader('Content-Disposition', `attachment; filename=certificate_${certificate.student_id.name.replace(/\s/g, '_')}.html`);
        
        res.send(htmlContent);
        
    } catch (error) {
        console.error('Download certificate error:', error);
        res.status(500).json({ success: false, message: 'Failed to download certificate', error: error.message });
    }
};

// ------------------ VERIFY CERTIFICATE ------------------
exports.verifyCertificate = async (req, res) => {
    try {
        const { certificate_id } = req.params;
        const certificate = await Certificate.findById(certificate_id)
            .populate('student_id', 'name email')
            .populate('event_id', 'title start_date end_date');

        if (!certificate) {
            return res.status(404).json({ success: false, message: 'Invalid certificate' });
        }

        res.status(200).json({ success: true, message: 'Certificate is valid', data: certificate });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Error verifying certificate', error: error.message });
    }
};

// ------------------ GENERATE CERTIFICATE PDF ------------------
exports.generateCertificatePDF = ({
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
            const certDir = path.join(__dirname, '../certificates');
            if (!fs.existsSync(certDir)) {
                fs.mkdirSync(certDir, { recursive: true });
            }

            const fileName = `${studentName.replace(/ /g, '_')}_${eventTitle.replace(/ /g, '_')}.pdf`;
            const filePath = path.join(certDir, fileName);

            const doc = new PDFDocument({
                size: 'A4',
                layout: 'landscape',
                margin: 50
            });

            const writeStream = fs.createWriteStream(filePath);
            doc.pipe(writeStream);

            // Border
            doc
                .rect(20, 20, 800, 550)
                .lineWidth(3)
                .stroke('#8b4fa2');

            // Title
            doc
                .fontSize(32)
                .fillColor('#8b4fa2')
                .text('Certificate of Participation', {
                    align: 'center'
                });

            doc.moveDown(1.5);

            // Body Text
            doc
                .fontSize(18)
                .fillColor('#333')
                .text('This is proudly presented to', {
                    align: 'center'
                });

            doc.moveDown(1);

            // Student Name
            doc
                .fontSize(28)
                .fillColor('#4ECDC4')
                .font('Helvetica-Bold')
                .text(studentName, {
                    align: 'center'
                });

            doc.moveDown(0.5);

            // Registration ID
            doc
                .fontSize(14)
                .font('Helvetica')
                .fillColor('#666')
                .text(`Registration ID: ${studentReg}`, {
                    align: 'center'
                });

            doc.moveDown(1);

            // Event Info
            doc
                .fontSize(18)
                .fillColor('#333')
                .text(
                    `For ${certificateType.toLowerCase()} in`,
                    { align: 'center' }
                );

            doc.moveDown(0.5);

            doc
                .fontSize(22)
                .font('Helvetica-Bold')
                .fillColor('#8b4fa2')
                .text(eventTitle, {
                    align: 'center'
                });

            doc.moveDown(1);

            doc
                .fontSize(14)
                .font('Helvetica')
                .fillColor('#666')
                .text(
                    `Event Date: ${new Date(eventDate).toLocaleDateString()}`,
                    { align: 'center' }
                );

            doc.moveDown(2);

            // Signature Section
            doc
                .fontSize(14)
                .fillColor('#333')
                .text('______________________', 120, 470);

            doc.text('Event Organizer', 150, 490);

            doc
                .text('______________________', 520, 470);

            doc.text('Authorized Signature', 540, 490);

            // Issue Date
            doc
                .fontSize(12)
                .fillColor('#666')
                .text(
                    `Issued on: ${new Date(issueDate).toLocaleDateString()}`,
                    350,
                    520,
                    { align: 'center' }
                );

            // QR Code
            if (qrCode) {
                const base64Data = qrCode.replace(/^data:image\/png;base64,/, '');
                const qrBuffer = Buffer.from(base64Data, 'base64');

                doc.image(qrBuffer, 700, 430, {
                    width: 90
                });

                doc
                    .fontSize(8)
                    .fillColor('#999')
                    .text('Scan to verify', 705, 525);
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

// ------------------ HELPER: Generate HTML Certificate ------------------
const generateCertificateHTML = (certificate) => {
    const studentName = certificate.student_id?.name || 'Student';
    const eventTitle = certificate.event_id?.title || 'Event';
    const eventDate = certificate.event_id?.start_date 
        ? new Date(certificate.event_id.start_date).toLocaleDateString() 
        : 'N/A';
    const issuedDate = new Date(certificate.issued_date).toLocaleDateString();
    const certificateId = certificate._id;
    
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Certificate of Participation - ${studentName}</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
                font-family: 'Segoe UI', Arial, sans-serif;
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
                overflow: hidden;
            }
            .certificate-border {
                border: 20px solid #8b4fa2;
                border-radius: 20px;
                margin: 10px;
                padding: 40px;
            }
            .certificate-header { text-align: center; margin-bottom: 30px; }
            .certificate-icon { font-size: 60px; margin-bottom: 10px; }
            .certificate-title { font-size: 42px; color: #8b4fa2; letter-spacing: 4px; font-weight: bold; text-transform: uppercase; }
            .certificate-subtitle { font-size: 18px; color: #666; border-top: 2px solid #8b4fa2; border-bottom: 2px solid #8b4fa2; display: inline-block; padding: 8px 30px; }
            .certificate-body { text-align: center; margin: 40px 0; }
            .presented-to { font-size: 18px; color: #555; margin-bottom: 15px; }
            .student-name { font-size: 48px; color: #4ECDC4; font-weight: bold; margin: 20px 0; border-bottom: 3px dotted #8b4fa2; display: inline-block; padding-bottom: 10px; }
            .for-text { font-size: 18px; color: #555; margin: 20px 0 10px; }
            .event-title { font-size: 32px; color: #8b4fa2; font-weight: bold; margin: 15px 0; }
            .event-details { font-size: 14px; color: #888; margin-top: 15px; }
            .certificate-footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; }
            .signature { display: flex; justify-content: space-between; margin: 30px 0 20px; }
            .signature-line { text-align: center; }
            .signature-line .line { width: 200px; border-top: 2px solid #333; margin-bottom: 8px; }
            .signature-line .name { font-size: 14px; font-weight: bold; }
            .signature-line .title { font-size: 12px; color: #888; }
            .certificate-id { font-size: 11px; color: #aaa; margin-top: 20px; text-align: center; }
            .verification { background: #f5f5f5; padding: 15px; margin-top: 20px; border-radius: 10px; text-align: center; }
            .verification p { font-size: 12px; color: #666; }
            @media print {
                body { background: white; padding: 0; }
                .certificate { box-shadow: none; width: 100%; }
                .verification { display: none; }
            }
        </style>
    </head>
    <body>
        <div class="certificate">
            <div class="certificate-border">
                <div class="certificate-header">
                    <div class="certificate-icon">🏆</div>
                    <h1 class="certificate-title">Certificate of Participation</h1>
                    <div class="certificate-subtitle">Proudly Presents</div>
                </div>
                <div class="certificate-body">
                    <p class="presented-to">This certificate is awarded to</p>
                    <div class="student-name">${studentName}</div>
                    <p class="for-text">for successfully participating in</p>
                    <div class="event-title">${eventTitle}</div>
                    <div class="event-details">Held on: ${eventDate}</div>
                </div>
                <div class="certificate-footer">
                    <div class="signature">
                        <div class="signature-line"><div class="line"></div><div class="name">Event Coordinator</div><div class="title">College Event Management</div></div>
                        <div class="signature-line"><div class="line"></div><div class="name">Issued Date</div><div class="title">${issuedDate}</div></div>
                    </div>
                </div>
                <div class="certificate-id">Certificate ID: ${certificateId}</div>
                <div class="verification"><p>🔗 Verify this certificate at: ${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify/${certificateId}</p></div>
            </div>
        </div>
    </body>
    </html>`;
};