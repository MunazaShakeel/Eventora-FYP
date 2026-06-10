const Certificate = require('../models/Certificate');
const Registration = require('../models/Registration');
const Event = require('../models/Event');
const Student = require('../models/Student');
const { generateCertificate } = require('../utils/certificate.util');
const { generateQR } = require('../utils/qr.util');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// ------------------ ISSUE CERTIFICATE ------------------
exports.issueCertificate = async (req, res) => {
    try {
        const { student_id, event_id, certificate_type = 'Participation' } = req.body;
        const user = req.user;

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

        const registration = await Registration.findOne({ student_id, event_id });
        if (!registration || registration.attendance_status !== 'Present') {
            return res.status(400).json({
                success: false,
                message: 'Certificate can only be issued to present students'
            });
        }

        const existingCertificate = await Certificate.findOne({ student_id, event_id });
        if (existingCertificate) {
            return res.status(400).json({ success: false, message: 'Certificate already issued' });
        }

        const student = await Student.findById(student_id);
        const event = await Event.findById(event_id);

        const qrData = `CERT-${student._id}-${event._id}`;
        const qrCode = await generateQR(qrData);

        const pdfPath = await exports.generateCertificatePDF({
            studentName: student.name,
            studentReg: student.registration_no || student._id.toString(),
            eventTitle: event.title,
            eventDate: event.start_date,
            certificateType: certificate_type,
            issueDate: new Date(),
            qrCode,
            eventVenue: event.venue || 'College Campus'
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
            .populate('event_id', 'title start_date end_date venue')
            .populate('student_id', 'name email');

        res.status(200).json({ success: true, data: certificates });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching certificates', error: error.message });
    }
};

// ------------------ GET ALL CERTIFICATES ------------------
exports.getAllCertificates = async (req, res) => {
    try {
        const user = req.user;
        let query = {};
        
        if (user.role === 'Organizer') {
            const organizerEvents = await Event.find({ organizer_id: user.id }).select('_id');
            const eventIds = organizerEvents.map(event => event._id);
            query.event_id = { $in: eventIds };
        }
        
        if (req.query.event_id) {
            query.event_id = req.query.event_id;
        }
        
        const certificates = await Certificate.find(query)
            .populate('student_id', 'name email')
            .populate('event_id', 'title start_date end_date venue')
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
        
        const certificates = await Certificate.find({ event_id: { $in: eventIds } })
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

// ------------------ DOWNLOAD CERTIFICATE ------------------
exports.downloadCertificate = async (req, res) => {
    try {
        const { id } = req.params;
        
        const certificate = await Certificate.findById(id)
            .populate('student_id', 'name email registration_no')
            .populate('event_id', 'title start_date end_date venue');
        
        if (!certificate) {
            return res.status(404).json({ success: false, message: 'Certificate not found' });
        }
        
        const isAdmin = req.user.role === 'Admin';
        const isOrganizer = req.user.role === 'Organizer';
        const isOwner = certificate.student_id._id.toString() === req.user.id?.toString();
        
        if (!isAdmin && !isOrganizer && !isOwner) {
            return res.status(403).json({ success: false, message: 'Not authorized to download this certificate' });
        }
        
        if (certificate.certificate_url && fs.existsSync(certificate.certificate_url)) {
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=certificate_${certificate.student_id.name.replace(/\s/g, '_')}.pdf`);
            return res.sendFile(certificate.certificate_url);
        }
        
        const htmlContent = generateCertificateHTML(certificate);
        res.setHeader('Content-Type', 'text/html');
        res.setHeader('Content-Disposition', `attachment; filename=certificate_${certificate.student_id.name.replace(/\s/g, '_')}.html`);
        res.send(htmlContent);
        
    } catch (error) {
        console.error('Download certificate error:', error);
        res.status(500).json({ success: false, message: 'Failed to download certificate', error: error.message });
    }
};

// ------------------ ✅ DELETE CERTIFICATE (FIXED) ------------------
exports.deleteCertificate = async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.user;
        
        console.log('Delete request for certificate:', id);
        console.log('User:', user.id, user.role);
        
        // Find certificate with populated data
        const certificate = await Certificate.findById(id)
            .populate('event_id', 'organizer_id title');
        
        if (!certificate) {
            return res.status(404).json({
                success: false,
                message: 'Certificate not found'
            });
        }
        
        // Check authorization
        const isAdmin = user.role === 'Admin';
        const isOrganizer = certificate.event_id?.organizer_id?.toString() === user.id?.toString();
        
        console.log('Is Admin:', isAdmin);
        console.log('Is Organizer:', isOrganizer);
        console.log('Certificate organizer:', certificate.event_id?.organizer_id?.toString());
        
        if (!isAdmin && !isOrganizer) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this certificate'
            });
        }
        
        // Delete the certificate file if exists
        if (certificate.certificate_url && fs.existsSync(certificate.certificate_url)) {
            try {
                fs.unlinkSync(certificate.certificate_url);
                console.log('Certificate file deleted:', certificate.certificate_url);
            } catch (fileError) {
                console.error('Error deleting certificate file:', fileError);
            }
        }
        
        // Delete certificate from database
        await Certificate.findByIdAndDelete(id);
        
        res.status(200).json({
            success: true,
            message: 'Certificate deleted successfully'
        });
        
    } catch (error) {
        console.error('Delete certificate error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting certificate',
            error: error.message
        });
    }
};

// ------------------ VERIFY CERTIFICATE ------------------
exports.verifyCertificate = async (req, res) => {
    try {
        const { certificate_id } = req.params;
        const certificate = await Certificate.findById(certificate_id)
            .populate('student_id', 'name email')
            .populate('event_id', 'title start_date end_date venue');

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
    qrCode,
    eventVenue
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

            // Beautiful PDF Design (No Signatures)
            const pageWidth = doc.page.width;
            const pageHeight = doc.page.height;

            // Background
            doc.rect(0, 0, pageWidth, pageHeight).fill('#ffffff');
            
            // Decorative top bar
            doc.rect(0, 0, pageWidth, 12).fill('#8b4fa2');
            doc.rect(0, pageHeight - 12, pageWidth, 12).fill('#8b4fa2');
            
            // Borders
            doc.rect(25, 25, pageWidth - 50, pageHeight - 50).lineWidth(3).stroke('#8b4fa2');
            doc.rect(35, 35, pageWidth - 70, pageHeight - 70).lineWidth(1).stroke('#4ECDC4');

            // Title
            doc.fontSize(32).font('Helvetica-Bold').fillColor('#8b4fa2')
               .text(`CERTIFICATE OF ${certificateType.toUpperCase()}`, { align: 'center' });
            
            doc.moveDown(0.5);
            doc.fontSize(14).fillColor('#6b7280').text('Official Recognition of Achievement', { align: 'center' });
            doc.moveDown(1.5);

            // Student Name
            doc.fontSize(16).fillColor('#6b7280').text('This certificate is proudly presented to', { align: 'center' });
            doc.moveDown(1);
            doc.fontSize(46).font('Helvetica-Bold').fillColor('#4ECDC4').text(studentName, { align: 'center' });
            doc.moveDown(0.5);
            
            // Registration ID
            doc.fontSize(11).fillColor('#8b4fa2').text(`Registration ID: ${studentReg}`, { align: 'center' });
            doc.moveDown(1.5);

            // Event Details
            doc.fontSize(16).fillColor('#6b7280').text(`for successfully completing the ${certificateType} program in`, { align: 'center' });
            doc.moveDown(0.8);
            doc.fontSize(26).font('Helvetica-Bold').fillColor('#8b4fa2').text(eventTitle, { align: 'center' });
            doc.moveDown(0.8);
            doc.fontSize(12).fillColor('#9ca3af').text(`Date: ${new Date(eventDate).toLocaleDateString()} | Venue: ${eventVenue}`, { align: 'center' });
            doc.moveDown(2);

            // Issue Date (No signatures)
            doc.fontSize(10).fillColor('#9ca3af').text(`Issued on: ${new Date(issueDate).toLocaleDateString()}`, { align: 'center' });

            // QR Code
            if (qrCode) {
                const base64Data = qrCode.replace(/^data:image\/png;base64,/, '');
                const qrBuffer = Buffer.from(base64Data, 'base64');
                doc.image(qrBuffer, pageWidth - 120, pageHeight - 120, { width: 80 });
                
            }

            doc.end();

            writeStream.on('finish', () => resolve(filePath));
            writeStream.on('error', (error) => reject(error));

        } catch (error) {
            reject(error);
        }
    });
};

// ------------------ HELPER: Generate HTML Certificate ------------------
const generateCertificateHTML = (certificate) => {
    const studentName = certificate.student_id?.name || 'Student';
    const eventTitle = certificate.event_id?.title || 'Event';
    const eventDate = certificate.event_id?.start_date ? new Date(certificate.event_id.start_date).toLocaleDateString() : 'N/A';
    const issuedDate = new Date(certificate.issued_date).toLocaleDateString();
    const eventVenue = certificate.event_id?.venue || 'College Campus';
    
    return `<!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Certificate - ${studentName}</title>
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
                border-radius: 30px;
                box-shadow: 0 30px 60px rgba(0,0,0,0.3);
                overflow: hidden;
            }
            .certificate-border {
                border: 20px solid #8b4fa2;
                border-radius: 25px;
                margin: 15px;
                padding: 45px;
                background: white;
            }
            .certificate-header { text-align: center; margin-bottom: 35px; }
            .certificate-icon { font-size: 65px; margin-bottom: 10px; }
            .certificate-title { font-size: 38px; background: linear-gradient(135deg, #8b4fa2, #4ECDC4); -webkit-background-clip: text; background-clip: text; color: transparent; font-weight: bold; }
            .student-name { font-size: 52px; background: linear-gradient(135deg, #4ECDC4, #8b4fa2); -webkit-background-clip: text; background-clip: text; color: transparent; font-weight: bold; margin: 25px 0; }
            .event-title { font-size: 28px; color: #8b4fa2; font-weight: bold; margin: 20px 0; }
            .event-details { font-size: 14px; color: #9ca3af; margin-top: 15px; }
            .issue-date { font-size: 12px; color: #9ca3af; margin-top: 30px; padding-top: 20px; border-top: 2px solid #f3e8ff; }
        </style>
    </head>
    <body>
        <div class="certificate">
            <div class="certificate-border">
                <div class="certificate-header">
                    <div class="certificate-icon">🏆</div>
                    <h1 class="certificate-title">Certificate of ${certificate.certificate_type}</h1>
                </div>
                <div class="certificate-body" style="text-align: center;">
                    <p style="color: #6b7280;">This certificate is proudly presented to</p>
                    <div class="student-name">${studentName}</div>
                    <p style="color: #6b7280;">for successfully participating in</p>
                    <div class="event-title">${eventTitle}</div>
                    <div class="event-details">📅 ${eventDate} &nbsp;|&nbsp; 📍 ${eventVenue}</div>
                </div>
                <div class="issue-date" style="text-align: center;">Issued on: ${issuedDate}</div>
                <div style="text-align: center; font-size: 10px; color: #d1d5db; margin-top: 15px;">Certificate ID: ${certificate._id}</div>
            </div>
        </div>
    </body>
    </html>`;
};