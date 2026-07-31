const Registration = require('../models/Registration');
const Event = require('../models/Event');
const Student = require('../models/Student');
const { generateRegistrationQR } = require('../utils/registration.utils');

// ------------------ REGISTER STUDENT / VOLUNTEER ------------------
exports.registerForEvent = async (req, res) => {
    try {
        const { event_id, role } = req.body;
        const student_id = req.user.id;

        const event = await Event.findById(event_id);
        if (!event) return res.status(404).json({ message: 'Event not found' });

        const existing = await Registration.findOne({ student_id, event_id });
        if (existing) return res.status(400).json({ message: 'Already registered for this event' });

        const registration = await Registration.create({
            student_id,
            event_id,
            role,
            registration_date: new Date(),
            attendance_status: 'Not Marked'
        });

        const qrCode = await generateRegistrationQR(registration._id);
        registration.qrCode = qrCode;
        await registration.save();

        res.status(201).json({ message: 'Registration successful', registration, qrCode });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ------------------ CANCEL REGISTRATION ------------------
exports.cancelRegistration = async (req, res) => {
    try {
        const { id } = req.params;
        const student_id = req.user.id;

        const registration = await Registration.findById(id).populate('event_id', 'start_date title');
        if (!registration) return res.status(404).json({ message: 'Registration not found' });

        if (registration.student_id.toString() !== student_id)
            return res.status(403).json({ message: 'Not authorized to cancel this registration' });

        if (new Date(registration.event_id.start_date) < new Date())
            return res.status(400).json({ message: 'Cannot cancel registration for a past event' });

        if (registration.attendance_status === 'Present')
            return res.status(400).json({ message: 'Cannot cancel registration after attendance is marked' });

        await Registration.findByIdAndDelete(id);
        res.json({ success: true, message: 'Registration cancelled successfully' });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ------------------ MARK ATTENDANCE BY QR ------------------
exports.markAttendanceByQR = async (req, res) => {
    try {
        const { qrData } = req.body;
        const userRole = req.user.role;

        if (!['Admin', 'Organizer'].includes(userRole))
            return res.status(403).json({ message: 'Not authorized to mark attendance' });

        if (!qrData || !qrData.startsWith('REGISTRATION:'))
            return res.status(400).json({ message: 'Invalid QR code format. QR must start with REGISTRATION:' });

        const registrationId = qrData.split(':')[1];
        console.log('Looking for registration ID:', registrationId);

        const registration = await Registration.findById(registrationId)
            .populate({ path: 'student_id', select: 'name email studentId phone' })
            .populate({ path: 'event_id', select: 'title start_date end_date venue image_url' });

        if (!registration)
            return res.status(404).json({ message: 'Registration not found.' });

        if (registration.attendance_status === 'Present')
            return res.status(400).json({ message: 'Attendance already marked for this student' });

        registration.attendance_status = 'Present';
        registration.attendance_time = new Date();
        await registration.save();

        res.json({
            success: true,
            message: 'Attendance marked successfully',
            registration: {
                _id: registration._id,
                student_id: registration.student_id,
                event_id: registration.event_id,
                attendance_status: registration.attendance_status,
                attendance_time: registration.attendance_time
            }
        });

    } catch (error) {
        console.error('Error in markAttendanceByQR:', error);
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
};

// ------------------ GET EVENT ATTENDANCE ------------------
exports.getEventAttendance = async (req, res) => {
    try {
        const { event_id } = req.params;

        const registrations = await Registration.find({ event_id })
            .populate('student_id', 'name email department grade semester')
            .populate('event_id', 'title start_date end_date venue image_url');

        res.json({ success: true, data: registrations });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ------------------ GET STUDENT REGISTRATIONS ------------------
exports.getStudentRegistrations = async (req, res) => {
    try {
        const student_id = req.user.id;

        const registrations = await Registration.find({ student_id })
            .populate('event_id', 'title start_date end_date venue image_url')
            .populate('student_id', 'name email')
            .sort({ registration_date: -1 });

        const formattedData = registrations.map(reg => ({
            _id: reg._id,
            event_id: {
                _id: reg.event_id._id,
                title: reg.event_id.title,
                start_date: reg.event_id.start_date,
                end_date: reg.event_id.end_date,
                venue: reg.event_id.venue,
                image_url: reg.event_id.image_url || null
            },
            student_id: reg.student_id,
            role: reg.role,
            registration_date: reg.registration_date,
            attendance_status: reg.attendance_status,
            qrCode: reg.qrCode || null
        }));

        res.json({ success: true, data: formattedData });

    } catch (error) {
        console.error("MY-REGISTRATIONS ERROR:", error.message); // ✅
        res.status(500).json({ message: error.message });
    }
};


// ------------------ GET VOLUNTEERS BY EVENT ------------------
exports.getVolunteersByEvent = async (req, res) => {
  try {
    const { event_id } = req.params;

    const volunteers = await Registration.find({
      event_id: event_id,
      role: 'Volunteer'
    })
    .populate('student_id', 'name email department phone')
    .populate('event_id', 'title start_date venue');

    res.status(200).json({
      success: true,
      count: volunteers.length,
      data: volunteers
    });
  } catch (error) {
    console.error('Get volunteers error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};


// ------------------ EXPORT ATTENDANCE REPORT (EXCEL) ------------------
const ExcelJS = require('exceljs');

exports.exportAttendanceReport = async (req, res) => {
    try {
        const { event_id } = req.query;
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'Eventora Admin';
        workbook.created = new Date();

        if (event_id) {
            // ── SINGLE EVENT REPORT ──
            const event = await Event.findById(event_id);
            if (!event) {
                return res.status(404).json({ success: false, message: 'Event not found' });
            }

            const registrations = await Registration.find({ event_id })
                .populate('student_id', 'name email department semester')
                .sort({ role: 1, 'student_id.name': 1 });

            const sheet = workbook.addWorksheet(event.title.substring(0, 28) || 'Attendance');
            sheet.columns = [
                { header: 'Name', key: 'name', width: 25 },
                { header: 'Email', key: 'email', width: 30 },
                { header: 'Department', key: 'department', width: 20 },
                { header: 'Role', key: 'role', width: 12 },
                { header: 'Attendance Status', key: 'status', width: 18 },
                { header: 'Registration Date', key: 'regDate', width: 20 },
            ];
            sheet.getRow(1).font = { bold: true };
            sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6D9F2' } };

            registrations.forEach(reg => {
                sheet.addRow({
                    name: reg.student_id?.name || 'N/A',
                    email: reg.student_id?.email || 'N/A',
                    department: reg.student_id?.department || 'N/A',
                    role: reg.role,
                    status: reg.attendance_status,
                    regDate: reg.registration_date ? new Date(reg.registration_date).toLocaleDateString() : 'N/A',
                });
            });

            // Summary row
            const present = registrations.filter(r => r.attendance_status === 'Present').length;
            const absent = registrations.filter(r => r.attendance_status !== 'Present').length;
            sheet.addRow({});
            sheet.addRow({ name: 'Total', email: registrations.length });
            sheet.addRow({ name: 'Present', email: present });
            sheet.addRow({ name: 'Absent/Not Marked', email: absent });

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=attendance-${event.title.replace(/\s/g, '_')}.xlsx`);
            await workbook.xlsx.write(res);
            return res.end();

        } else {
            // ── ALL EVENTS REPORT (summary sheet + per-event sheets) ──
            const events = await Event.find().sort({ start_date: -1 });

            const summarySheet = workbook.addWorksheet('Summary');
            summarySheet.columns = [
                { header: 'Event Title', key: 'title', width: 30 },
                { header: 'Date', key: 'date', width: 15 },
                { header: 'Total Registered', key: 'total', width: 18 },
                { header: 'Present', key: 'present', width: 12 },
                { header: 'Absent', key: 'absent', width: 12 },
            ];
            summarySheet.getRow(1).font = { bold: true };
            summarySheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6D9F2' } };

            for (const event of events) {
                const regs = await Registration.find({ event_id: event._id });
                const present = regs.filter(r => r.attendance_status === 'Present').length;
                const absent = regs.length - present;

                summarySheet.addRow({
                    title: event.title,
                    date: event.start_date ? new Date(event.start_date).toLocaleDateString() : 'TBA',
                    total: regs.length,
                    present,
                    absent,
                });
            }

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=attendance-all-events-${new Date().toISOString().split('T')[0]}.xlsx`);
            await workbook.xlsx.write(res);
            return res.end();
        }

    } catch (error) {
        console.error('Attendance report export error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};



// ------------------ PREVIEW ATTENDANCE REPORT (JSON) ------------------
exports.previewAttendanceReport = async (req, res) => {
    try {
        const { event_id } = req.query;

        if (event_id) {
            // ── SINGLE EVENT PREVIEW ──
            const event = await Event.findById(event_id).select('title start_date venue');
            if (!event) {
                return res.status(404).json({ success: false, message: 'Event not found' });
            }

            const registrations = await Registration.find({ event_id })
                .populate('student_id', 'name email department semester')
                .sort({ role: 1 });

            const present = registrations.filter(r => r.attendance_status === 'Present').length;
            const notPresent = registrations.length - present;

            const students = registrations.map(reg => ({
                _id: reg._id,
                name: reg.student_id?.name || 'N/A',
                email: reg.student_id?.email || 'N/A',
                department: reg.student_id?.department || 'N/A',
                role: reg.role,
                status: reg.attendance_status,
                registration_date: reg.registration_date,
            }));

            return res.status(200).json({
                success: true,
                mode: 'single',
                event,
                stats: {
                    total: registrations.length,
                    present,
                    notPresent,
                },
                students,
            });

        } else {
            // ── ALL EVENTS PREVIEW (summary only) ──
            const events = await Event.find().sort({ start_date: -1 }).select('title start_date');

            const summary = [];
            let grandTotal = 0, grandPresent = 0;

            for (const event of events) {
                const regs = await Registration.find({ event_id: event._id });
                const present = regs.filter(r => r.attendance_status === 'Present').length;
                grandTotal += regs.length;
                grandPresent += present;

                summary.push({
                    event_id: event._id,
                    title: event.title,
                    date: event.start_date,
                    total: regs.length,
                    present,
                    notPresent: regs.length - present,
                });
            }

            return res.status(200).json({
                success: true,
                mode: 'all',
                stats: {
                    totalEvents: events.length,
                    totalRegistrations: grandTotal,
                    totalPresent: grandPresent,
                    totalNotPresent: grandTotal - grandPresent,
                },
                summary,
            });
        }

    } catch (error) {
        console.error('Attendance preview error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};