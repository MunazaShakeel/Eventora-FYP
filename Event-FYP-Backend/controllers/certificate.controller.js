const Certificate = require('../models/Certificate');
const Registration = require('../models/Registration');
const Event = require('../models/Event');
const Organizer = require('../models/Organizer');
const Student = require('../models/Student');
const { generateCertificate } = require('../utils/certificate.util');
const { generateQR } = require('../utils/qr.util');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// ------------------ ISSUE CERTIFICATE (FIXED) ------------------
// ------------------ ISSUE CERTIFICATE (COMPLETELY FIXED) ------------------
exports.issueCertificate = async (req, res) => {
     try {
        console.log('========== CERTIFICATE ISSUE REQUEST ==========');
        console.log('📥 Request body:', req.body);
        console.log('👤 User:', req.user?.id, req.user?.role);
        
        const { student_id, event_id, certificate_type = 'Participation' } = req.body;
        const user = req.user;   // 👈 ADD KARO
        
        // Validate input
        if (!student_id || !event_id) {
            console.log('❌ Missing student_id or event_id');
            return res.status(400).json({
                success: false,
                message: 'student_id and event_id are required'
            });
        }

        console.log('1️⃣ Checking event...');
        const event = await Event.findById(event_id);
        if (!event) {
            console.log('❌ Event not found');
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }
        console.log('✅ Event found:', event.title);

        console.log('2️⃣ Checking organizer permission...');
        if (user.role === 'Organizer') {
            if (!event.organizer_id) {
                console.log('❌ Event has no organizer_id');
                return res.status(400).json({
                    success: false,
                    message: 'Event has no organizer assigned'
                });
            }
            if (event.organizer_id.toString() !== user.id.toString()) {
                console.log('❌ Organizer mismatch');
                return res.status(403).json({
                    success: false,
                    message: 'You can only issue certificates for your own events'
                });
            }
        }
        console.log('✅ Permission check passed');

        console.log('3️⃣ Checking registration...');
        const registration = await Registration.findOne({ student_id, event_id });
        if (!registration) {
            console.log('❌ No registration found');
            return res.status(400).json({
                success: false,
                message: 'Student is not registered for this event'
            });
        }
        if (registration.attendance_status !== 'Present') {
            console.log('❌ Student not present');
            return res.status(400).json({
                success: false,
                message: 'Certificate can only be issued to present students'
            });
        }
        console.log('✅ Registration found and present');

        console.log('4️⃣ Checking existing certificate...');
        const existingCertificate = await Certificate.findOne({ student_id, event_id });
        if (existingCertificate) {
            console.log('❌ Certificate already exists');
            return res.status(400).json({
                success: false,
                message: 'Certificate already issued'
            });
        }
        console.log('✅ No existing certificate');

        console.log('5️⃣ Getting student...');
        const student = await Student.findById(student_id);
        if (!student) {
            console.log('❌ Student not found');
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }
        console.log('✅ Student found:', student.name);

        console.log('6️⃣ Generating QR...');
        const qrData = `CERT-${student._id}-${event._id}-${Date.now()}`;
        let qrCode = null;
        try {
            qrCode = await generateQR(qrData);
            console.log('✅ QR generated');
        } catch (qrError) {
            console.log('⚠️ QR generation failed:', qrError.message);
        }

        console.log('7️⃣ Generating PDF...');
        let pdfPath = null;
        try {
            const organizerName = event.organizer_id ? 
                (await Organizer.findById(event.organizer_id))?.name || 'Organizer' : 
                'Organizer';
            
            pdfPath = await exports.generateCertificatePDF({
                studentName: student.name,
                studentReg: student.registration_no || student._id.toString(),
                eventTitle: event.title,
                eventDate: event.start_date || new Date(),
                certificateType: certificate_type,
                issueDate: new Date(),
                qrCode: qrCode || '',
                eventVenue: event.venue || 'College Campus',
                organizerName: organizerName
            });
            console.log('✅ PDF generated at:', pdfPath);
        } catch (pdfError) {
            console.log('⚠️ PDF generation failed:', pdfError.message);
        }

        console.log('8️⃣ Creating certificate...');
        const certificateData = {
            student_id: student._id,
            event_id: event._id,
            organizer_id: event.organizer_id || user.id,  // Fallback to current user
            certificate_type: certificate_type,
            issued_date: new Date(),
            qr_data: qrData,
            status: 'Active'
        };

        if (pdfPath) {
            certificateData.certificate_url = pdfPath;
        }

        const certificate = await Certificate.create(certificateData);
        console.log('✅ Certificate created with ID:', certificate._id);

        console.log('9️⃣ Populating certificate...');
        const populatedCertificate = await Certificate.findById(certificate._id)
            .populate('student_id', 'name email department grade')
            .populate('event_id', 'title start_date end_date venue')
            .populate('organizer_id', 'name email department');

        console.log('✅ Certificate issued successfully!');
        console.log('==========================================');

        res.status(201).json({
            success: true,
            message: 'Certificate issued successfully',
            data: populatedCertificate
        });

    } catch (error) {
        console.log('❌❌❌ CERTIFICATE ISSUE ERROR ❌❌❌');
        console.log('Error message:', error.message);
        console.log('Error stack:', error.stack);
        console.log('==========================================');
        
        res.status(500).json({
            success: false,
            message: 'Error issuing certificate',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};



// ------------------ BULK ISSUE CERTIFICATES ------------------
exports.issueBulkCertificates = async (req, res) => {
    try {
        console.log('========== BULK CERTIFICATE ISSUE REQUEST ==========');
        console.log('📥 Request body:', req.body);

        const { event_id, certificate_type = 'Participation', target, student_ids } = req.body;
        const user = req.user;

        if (!event_id) {
            return res.status(400).json({ success: false, message: 'event_id is required' });
        }

        const event = await Event.findById(event_id);
        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }

        // Organizer sirf apne event pe issue kar sake
        if (user.role === 'Organizer' && event.organizer_id?.toString() !== user.id.toString()) {
            return res.status(403).json({ success: false, message: 'You can only issue certificates for your own events' });
        }

        // ── Target decide karo: specific student_ids / All Students / All Volunteers ──
        let registrations = [];

        if (Array.isArray(student_ids) && student_ids.length > 0) {
            // Organizer ne khud checkbox se students select kiye
            registrations = await Registration.find({
                event_id,
                student_id: { $in: student_ids },
                attendance_status: 'Present'
            });
        } else if (target === 'Volunteer') {
            registrations = await Registration.find({
                event_id,
                role: 'Volunteer',
                attendance_status: 'Present'
            });
        } else if (target === 'Student') {
            registrations = await Registration.find({
                event_id,
                role: 'Student',
                attendance_status: 'Present'
            });
        } else {
            // target === 'All' → present sab (Students + Volunteers)
            registrations = await Registration.find({
                event_id,
                attendance_status: 'Present'
            });
        }

        if (registrations.length === 0) {
            return res.status(400).json({ success: false, message: 'No eligible present students/volunteers found' });
        }

        const organizerName = event.organizer_id
            ? (await Organizer.findById(event.organizer_id))?.name || 'Organizer'
            : 'Organizer';

        const results = { issued: [], skipped: [], failed: [] };

        for (const reg of registrations) {
            try {
                // Pehle se issued hai to skip karo
                const existing = await Certificate.findOne({ student_id: reg.student_id, event_id });
                if (existing) {
                    results.skipped.push(reg.student_id.toString());
                    continue;
                }

                const student = await Student.findById(reg.student_id);
                if (!student) {
                    results.failed.push(reg.student_id.toString());
                    continue;
                }

                const qrData = `CERT-${student._id}-${event._id}-${Date.now()}`;
                let qrCode = null;
                try {
                    qrCode = await generateQR(qrData);
                } catch (e) {
                    console.log('⚠️ QR failed for', student.name);
                }

                let pdfPath = null;
                try {
                    pdfPath = await exports.generateCertificatePDF({
                        studentName: student.name,
                        studentReg: student.registration_no || student._id.toString(),
                        eventTitle: event.title,
                        eventDate: event.start_date || new Date(),
                        certificateType: certificate_type,
                        issueDate: new Date(),
                        qrCode: qrCode || '',
                        eventVenue: event.venue || 'College Campus',
                        organizerName
                    });
                } catch (e) {
                    console.log('⚠️ PDF failed for', student.name);
                }

                const certData = {
                    student_id: student._id,
                    event_id: event._id,
                    organizer_id: event.organizer_id || user.id,
                    certificate_type,
                    issued_date: new Date(),
                    qr_data: qrData,
                    status: 'Active'
                };
                if (pdfPath) certData.certificate_url = pdfPath;

                const cert = await Certificate.create(certData);
                results.issued.push(cert._id);

            } catch (innerErr) {
                console.log('❌ Failed for student', reg.student_id, innerErr.message);
                results.failed.push(reg.student_id.toString());
            }
        }

        console.log('✅ Bulk issue done:', results);

        res.status(201).json({
            success: true,
            message: `${results.issued.length} certificate(s) issued, ${results.skipped.length} already had one, ${results.failed.length} failed`,
            data: results
        });

    } catch (error) {
        console.log('❌ Bulk certificate error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error issuing bulk certificates',
            error: error.message
        });
    }
};




// ------------------ GET STUDENT CERTIFICATES (FIXED) ------------------
exports.getCertificatesByStudent = async (req, res) => {
    try {
        const student_id = req.user.id;
        const certificates = await Certificate.find({ student_id })
            .populate('student_id', 'name email department grade')
            .populate('event_id', 'title start_date end_date venue')
            .populate('organizer_id', 'name email department');  // ✅ Organizer added

        res.status(200).json({ 
            success: true, 
            data: certificates 
        });
    } catch (error) {
        console.error('Get student certificates error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching certificates', 
            error: error.message 
        });
    }
};

// ------------------ GET ALL CERTIFICATES (FIXED) ------------------
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
            .populate('student_id', 'name email department grade')
            .populate('event_id', 'title start_date end_date venue')
            .populate('organizer_id', 'name email department')  // ✅ Organizer added
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

// ------------------ GET ORGANIZER'S CERTIFICATES (FIXED) ------------------
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
            .populate('student_id', 'name email department grade')
            .populate('event_id', 'title start_date end_date venue')
            .populate('organizer_id', 'name email department')  // ✅ Organizer added
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

// ------------------ DOWNLOAD CERTIFICATE (FIXED) ------------------
exports.downloadCertificate = async (req, res) => {
    try {
        const { id } = req.params;
        
        const certificate = await Certificate.findById(id)
            .populate('student_id', 'name email registration_no department grade')
            .populate('event_id', 'title start_date end_date venue')
            .populate('organizer_id', 'name email department');  // ✅ Organizer added
        
        if (!certificate) {
            return res.status(404).json({ 
                success: false, 
                message: 'Certificate not found' 
            });
        }
        
        const isAdmin = req.user.role === 'Admin';
        const isOrganizer = req.user.role === 'Organizer';
        const isOwner = certificate.student_id._id.toString() === req.user.id?.toString();
        
        if (!isAdmin && !isOrganizer && !isOwner) {
            return res.status(403).json({ 
                success: false, 
                message: 'Not authorized to download this certificate' 
            });
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
        res.status(500).json({ 
            success: false, 
            message: 'Failed to download certificate', 
            error: error.message 
        });
    }
};

// ------------------ DELETE CERTIFICATE (FIXED) ------------------
exports.deleteCertificate = async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.user;
        
        const certificate = await Certificate.findById(id)
            .populate('event_id', 'organizer_id title');
        
        if (!certificate) {
            return res.status(404).json({
                success: false,
                message: 'Certificate not found'
            });
        }
        
        const isAdmin = user.role === 'Admin';
        const isOrganizer = certificate.event_id?.organizer_id?.toString() === user.id?.toString();
        
        if (!isAdmin && !isOrganizer) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this certificate'
            });
        }
        
        if (certificate.certificate_url && fs.existsSync(certificate.certificate_url)) {
            try {
                fs.unlinkSync(certificate.certificate_url);
                console.log('Certificate file deleted:', certificate.certificate_url);
            } catch (fileError) {
                console.error('Error deleting certificate file:', fileError);
            }
        }
        
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

// ------------------ UPDATE CERTIFICATE (FIXED) ------------------
exports.updateCertificate = async (req, res) => {
    try {
        const { id } = req.params;
        const { certificate_type } = req.body;
        const user = req.user;

        const certificate = await Certificate.findById(id)
            .populate('event_id', 'organizer_id title start_date venue')
            .populate('student_id', 'name registration_no')
            .populate('organizer_id', 'name email');  // ✅ Organizer added

        if (!certificate) {
            return res.status(404).json({
                success: false,
                message: 'Certificate not found'
            });
        }

        const isAdmin = user.role === 'Admin';
        const isOrganizer = certificate.event_id?.organizer_id?.toString() === user.id?.toString();

        if (!isAdmin && !isOrganizer) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this certificate'
            });
        }

        if (!certificate_type) {
            return res.status(400).json({
                success: false,
                message: 'certificate_type is required to update'
            });
        }

        if (certificate.certificate_url && fs.existsSync(certificate.certificate_url)) {
            try {
                fs.unlinkSync(certificate.certificate_url);
            } catch (fileError) {
                console.error('Error deleting old certificate file:', fileError);
            }
        }

        const qrData = certificate.qr_data || `CERT-${certificate.student_id._id}-${certificate.event_id._id}`;
        const qrCode = await generateQR(qrData);

        const newPdfPath = await exports.generateCertificatePDF({
            studentName: certificate.student_id.name,
            studentReg: certificate.student_id.registration_no || certificate.student_id._id.toString(),
            eventTitle: certificate.event_id.title,
            eventDate: certificate.event_id.start_date,
            certificateType: certificate_type,
            issueDate: certificate.issued_date,
            qrCode,
            eventVenue: certificate.event_id.venue || 'College Campus',
            organizerName: certificate.organizer_id?.name || 'Organizer'  // ✅ Organizer name for PDF
        });

        certificate.certificate_type = certificate_type;
        certificate.certificate_url = newPdfPath;
        await certificate.save();

        // ✅ Populate before sending response
        const updatedCertificate = await Certificate.findById(certificate._id)
            .populate('student_id', 'name email department grade')
            .populate('event_id', 'title start_date end_date venue')
            .populate('organizer_id', 'name email department');

        res.status(200).json({
            success: true,
            message: 'Certificate updated successfully',
            data: updatedCertificate
        });

    } catch (error) {
        console.error('Update certificate error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating certificate',
            error: error.message
        });
    }
};

// ------------------ VERIFY CERTIFICATE (FIXED) ------------------
exports.verifyCertificate = async (req, res) => {
    try {
        const { certificate_id } = req.params;
        const certificate = await Certificate.findById(certificate_id)
            .populate('student_id', 'name email department grade')
            .populate('event_id', 'title start_date end_date venue')
            .populate('organizer_id', 'name email department');  // ✅ Organizer added

        if (!certificate) {
            return res.status(404).json({ 
                success: false, 
                message: 'Invalid certificate' 
            });
        }

        res.status(200).json({ 
            success: true, 
            message: 'Certificate is valid', 
            data: certificate 
        });
    } catch (error) {
        console.error('Verify certificate error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error verifying certificate', 
            error: error.message 
        });
    }
};

// ------------------ GENERATE CERTIFICATE PDF (FIXED) ------------------
exports.generateCertificatePDF = ({
    studentName,
    studentReg,
    eventTitle,
    eventDate,
    certificateType,
    issueDate,
    qrCode,
    eventVenue,
    organizerName = 'Organizer'  // ✅ Default value
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

            const pageWidth = doc.page.width;
            const pageHeight = doc.page.height;

            // Background and borders
            doc.rect(0, 0, pageWidth, pageHeight).fill('#ffffff');
            doc.rect(0, 0, pageWidth, 12).fill('#8b4fa2');
            doc.rect(0, pageHeight - 12, pageWidth, 12).fill('#8b4fa2');
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
            doc.fontSize(11).fillColor('#8b4fa2').text(`Registration ID: ${studentReg}`, { align: 'center' });
            doc.moveDown(1.5);

            // Event Details
            doc.fontSize(16).fillColor('#6b7280').text(`for successfully completing the ${certificateType} program in`, { align: 'center' });
            doc.moveDown(0.8);
            doc.fontSize(26).font('Helvetica-Bold').fillColor('#8b4fa2').text(eventTitle, { align: 'center' });
            doc.moveDown(0.8);
            doc.fontSize(12).fillColor('#9ca3af').text(`Date: ${new Date(eventDate).toLocaleDateString()} | Venue: ${eventVenue}`, { align: 'center' });
            
            // ✅ Organizer name added to PDF
            doc.moveDown(0.5);
            doc.fontSize(11).fillColor('#8b4fa2').text(`Organized by: ${organizerName}`, { align: 'center' });
            doc.moveDown(2);

            // Issue date
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

// ------------------ ADMIN: GET ALL CERTIFICATES (FIXED) ------------------
exports.getAdminCertificates = async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 10, 
            search = '', 
            event_id = '', 
            organizer_id = '', 
            date_from = '', 
            date_to = '' 
        } = req.query;

        const query = {};

        if (search) {
            query.$or = [
                { certificate_number: { $regex: search, $options: 'i' } }
            ];
        }

        if (event_id) {
            query.event_id = event_id;
        }

        if (organizer_id) {
            query.organizer_id = organizer_id;
        }

        if (date_from || date_to) {
            query.issued_date = {};
            if (date_from) query.issued_date.$gte = new Date(date_from);
            if (date_to) query.issued_date.$lte = new Date(date_to);
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [certificates, total] = await Promise.all([
            Certificate.find(query)
                .populate('student_id', 'name email department grade')
                .populate('event_id', 'title venue start_date')
                .populate('organizer_id', 'name email department')  // ✅ Organizer added
                .sort({ issued_date: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            Certificate.countDocuments(query)
        ]);

        res.status(200).json({
            success: true,
            data: certificates,
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(total / parseInt(limit))
        });
    } catch (error) {
        console.error('Get admin certificates error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch certificates',
            error: error.message
        });
    }
};

// ------------------ ADMIN: GET SINGLE CERTIFICATE (FIXED) ------------------
exports.getAdminCertificateById = async (req, res) => {
    try {
        const certificate = await Certificate.findById(req.params.id)
            .populate('student_id', 'name email department grade')
            .populate('event_id', 'title venue start_date end_date')
            .populate('organizer_id', 'name email department');  // ✅ Organizer added

        if (!certificate) {
            return res.status(404).json({
                success: false,
                message: 'Certificate not found'
            });
        }

        res.status(200).json({
            success: true,
            data: certificate
        });
    } catch (error) {
        console.error('Get admin certificate error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch certificate',
            error: error.message
        });
    }
};

// ------------------ ADMIN: DOWNLOAD CERTIFICATE (FIXED) ------------------
exports.downloadAdminCertificate = async (req, res) => {
    try {
        const certificate = await Certificate.findById(req.params.id)
            .populate('student_id', 'name email department grade')
            .populate('event_id', 'title')
            .populate('organizer_id', 'name email');  // ✅ Organizer added

        if (!certificate) {
            return res.status(404).json({
                success: false,
                message: 'Certificate not found'
            });
        }

        // Check file existence
        if (certificate.certificate_url && fs.existsSync(certificate.certificate_url)) {
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=certificate_${certificate.certificate_number || certificate._id}.pdf`);
            return res.sendFile(certificate.certificate_url);
        }

        // Generate HTML if PDF not found
        const htmlContent = generateCertificateHTML(certificate);
        res.setHeader('Content-Type', 'text/html');
        res.setHeader('Content-Disposition', `attachment; filename=certificate_${certificate.certificate_number || certificate._id}.html`);
        res.send(htmlContent);

    } catch (error) {
        console.error('Download certificate error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to download certificate',
            error: error.message
        });
    }
};

// ------------------ ADMIN: DELETE/REVOKE CERTIFICATE (FIXED) ------------------
exports.deleteAdminCertificate = async (req, res) => {
    try {
        const certificate = await Certificate.findById(req.params.id);

        if (!certificate) {
            return res.status(404).json({
                success: false,
                message: 'Certificate not found'
            });
        }

        // Soft delete - update status
        certificate.status = 'Revoked';
        await certificate.save();

        res.status(200).json({
            success: true,
            message: 'Certificate revoked successfully',
            data: certificate
        });
    } catch (error) {
        console.error('Delete certificate error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete certificate',
            error: error.message
        });
    }
};

// ------------------ HELPER: Generate HTML Certificate (FIXED) ------------------
const generateCertificateHTML = (certificate) => {
    const studentName = certificate.student_id?.name || 'Student';
    const studentDept = certificate.student_id?.department || '';
    const studentGrade = certificate.student_id?.grade || '';
    const eventTitle = certificate.event_id?.title || 'Event';
    const eventDate = certificate.event_id?.start_date ? new Date(certificate.event_id.start_date).toLocaleDateString() : 'N/A';
    const issuedDate = new Date(certificate.issued_date).toLocaleDateString();
    const eventVenue = certificate.event_id?.venue || 'College Campus';
    const organizerName = certificate.organizer_id?.name || 'Organizer';  // ✅ Organizer name
    const organizerDept = certificate.organizer_id?.department || '';
    
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
            .certificate-title { 
                font-size: 38px; 
                background: linear-gradient(135deg, #8b4fa2, #4ECDC4); 
                -webkit-background-clip: text; 
                background-clip: text; 
                color: transparent; 
                font-weight: bold; 
            }
            .student-name { 
                font-size: 52px; 
                background: linear-gradient(135deg, #4ECDC4, #8b4fa2); 
                -webkit-background-clip: text; 
                background-clip: text; 
                color: transparent; 
                font-weight: bold; 
                margin: 25px 0; 
            }
            .student-details { font-size: 16px; color: #6b7280; margin-bottom: 20px; }
            .event-title { font-size: 28px; color: #8b4fa2; font-weight: bold; margin: 20px 0; }
            .event-details { font-size: 14px; color: #9ca3af; margin-top: 15px; }
            .organizer-info { 
                font-size: 14px; 
                color: #8b4fa2; 
                margin-top: 15px;
                padding: 10px;
                background: #f5eefa;
                border-radius: 10px;
                display: inline-block;
            }
            .issue-date { 
                font-size: 12px; 
                color: #9ca3af; 
                margin-top: 30px; 
                padding-top: 20px; 
                border-top: 2px solid #f3e8ff; 
            }
        </style>
    </head>
    <body>
        <div class="certificate">
            <div class="certificate-border">
                <div class="certificate-header">
                    <div class="certificate-icon">🏆</div>
                    <h1 class="certificate-title">Certificate of ${certificate.certificate_type || 'Participation'}</h1>
                </div>
                <div class="certificate-body" style="text-align: center;">
                    <p style="color: #6b7280;">This certificate is proudly presented to</p>
                    <div class="student-name">${studentName}</div>
                    <div class="student-details">${studentDept} ${studentGrade ? '• Grade: ' + studentGrade : ''}</div>
                    <p style="color: #6b7280;">for successfully participating in</p>
                    <div class="event-title">${eventTitle}</div>
                    <div class="event-details">📅 ${eventDate} &nbsp;|&nbsp; 📍 ${eventVenue}</div>
                    <div class="organizer-info">🏛️ Organized by: ${organizerName} ${organizerDept ? '• ' + organizerDept : ''}</div>
                </div>
                <div class="issue-date" style="text-align: center;">Issued on: ${issuedDate}</div>
                <div style="text-align: center; font-size: 10px; color: #d1d5db; margin-top: 15px;">Certificate ID: ${certificate._id}</div>
            </div>
        </div>
    </body>
    </html>`;
};