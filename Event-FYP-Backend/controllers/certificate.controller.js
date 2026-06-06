const Certificate = require('../models/Certificate');
const Registration = require('../models/Registration');
const Event = require('../models/Event');
const Student = require('../models/Student');
const { generateCertificate } = require('../utils/certificate.util');
const { generateQR } = require('../utils/qr.util');

// ------------------ ISSUE CERTIFICATE (with organizer check) ------------------
exports.issueCertificate = async (req, res) => {
    try {
        const { student_id, event_id, certificate_type = 'Participation' } = req.body;
        const user = req.user; // Get logged-in user

        // ✅ CHECK: Organizer can only issue certificates for their own events
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

        // ✅ Check attendance
        const registration = await Registration.findOne({ student_id, event_id });
        if (!registration || registration.attendance_status !== 'Present') {
            return res.status(400).json({
                success: false,
                message: 'Certificate can only be issued to present students'
            });
        }

        // ✅ Prevent duplicate
        const existingCertificate = await Certificate.findOne({ student_id, event_id });
        if (existingCertificate) {
            return res.status(400).json({ success: false, message: 'Certificate already issued' });
        }

        const student = await Student.findById(student_id);
        const event = await Event.findById(event_id);

        // ✅ Generate QR for certificate verification
        const qrData = `CERT-${student._id}-${event._id}`;
        const qrCode = await generateQR(qrData);

        // ✅ Generate PDF certificate
        const pdfPath = await generateCertificate({
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
        
        // If user is Organizer, filter certificates by their events only
        if (user.role === 'Organizer') {
            // Get all events created by this organizer
            const organizerEvents = await Event.find({ 
                organizer_id: user.id 
            }).select('_id');
            
            const eventIds = organizerEvents.map(event => event._id);
            
            // Only show certificates for these events
            query.event_id = { $in: eventIds };
            
            console.log(`Organizer ${user.id} has ${eventIds.length} events`);
        }
        
        // If specific event_id is requested, add to query
        if (req.query.event_id) {
            query.event_id = req.query.event_id;
        }
        
        const certificates = await Certificate.find(query)
            .populate('student_id', 'name email')
            .populate('event_id', 'title start_date end_date')
            .sort({ issued_date: -1 }); // Latest first

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

// ------------------ GET ORGANIZER'S CERTIFICATES (Alternative endpoint) ------------------
exports.getOrganizerCertificates = async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Get all events by this organizer
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
        
        // Get certificates for these events
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