const Event = require('../models/Event');
const Registration = require('../models/Registration');
const Task = require('../models/Task');
const Feedback = require('../models/Feedback');
const Certificate = require('../models/Certificate');

const ExcelJS = require('exceljs');
// Correct PdfPrinter import for Node.js
const PdfPrinter = require('pdfmake/src/printer'); // <- yahi change important

// Fonts for PDF
const fonts = {
    Roboto: {
        normal: 'node_modules/pdfmake/fonts/Roboto-Regular.ttf',
        bold: 'node_modules/pdfmake/fonts/Roboto-Medium.ttf',
        italics: 'node_modules/pdfmake/fonts/Roboto-Italic.ttf',
        bolditalics: 'node_modules/pdfmake/fonts/Roboto-MediumItalic.ttf'
    }
};
const printer = new PdfPrinter(fonts);

// ------------------ GET DASHBOARD STATS ------------------
exports.getDashboardStats = async (req, res) => {
    try {
        // Events
        const totalEvents = await Event.countDocuments();
        const approvedEvents = await Event.countDocuments({ approved: true });
        const rejectedEvents = await Event.countDocuments({ approved: false });

        // Registrations
        const totalRegistrations = await Registration.countDocuments();
        const presentCount = await Registration.countDocuments({ attendance_status: 'Present' });
        const absentCount = await Registration.countDocuments({ attendance_status: 'Absent' });

        // Tasks
        const totalTasks = await Task.countDocuments();
        const completedTasks = await Task.countDocuments({ status: 'Completed' });
        const pendingTasks = await Task.countDocuments({ status: 'Pending' });

        // Certificates
        const totalCertificates = await Certificate.countDocuments();

        // Top 5 rated events
        const topEvents = await Feedback.aggregate([
            { $group: { _id: '$event_id', avgRating: { $avg: '$rating' }, totalFeedbacks: { $sum: 1 } } },
            { $sort: { avgRating: -1 } },
            { $limit: 5 }
        ]);

        res.json({
            events: { totalEvents, approvedEvents, rejectedEvents },
            registrations: { totalRegistrations, presentCount, absentCount },
            tasks: { totalTasks, completedTasks, pendingTasks },
            totalCertificates,
            topEvents
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ------------------ EXPORT DASHBOARD AS PDF ------------------
exports.exportDashboardPDF = async (req, res) => {
    try {
        // Fetch stats
        const totalEvents = await Event.countDocuments();
        const approvedEvents = await Event.countDocuments({ approved: true });
        const rejectedEvents = await Event.countDocuments({ approved: false });

        const totalRegistrations = await Registration.countDocuments();
        const presentCount = await Registration.countDocuments({ attendance_status: 'Present' });
        const absentCount = await Registration.countDocuments({ attendance_status: 'Absent' });

        const totalTasks = await Task.countDocuments();
        const completedTasks = await Task.countDocuments({ status: 'Completed' });
        const pendingTasks = await Task.countDocuments({ status: 'Pending' });

        const totalCertificates = await Certificate.countDocuments();

        const topEvents = await Feedback.aggregate([
            { $group: { _id: '$event_id', avgRating: { $avg: '$rating' }, totalFeedbacks: { $sum: 1 } } },
            { $sort: { avgRating: -1 } },
            { $limit: 5 }
        ]);

        // PDF Document Definition
        const docDefinition = {
            content: [
                { text: 'Dashboard Report', style: 'header' },
                { text: `Generated on: ${new Date().toLocaleString()}`, style: 'subheader' },

                { text: 'Events Summary', style: 'sectionHeader' },
                {
                    table: {
                        widths: ['*', '*', '*'],
                        body: [
                            ['Total Events', 'Approved', 'Rejected'],
                            [totalEvents, approvedEvents, rejectedEvents]
                        ]
                    }
                },

                { text: 'Registrations Summary', style: 'sectionHeader' },
                {
                    table: {
                        widths: ['*', '*', '*'],
                        body: [
                            ['Total Registrations', 'Present', 'Absent'],
                            [totalRegistrations, presentCount, absentCount]
                        ]
                    }
                },

                { text: 'Tasks Summary', style: 'sectionHeader' },
                {
                    table: {
                        widths: ['*', '*', '*'],
                        body: [
                            ['Total Tasks', 'Completed', 'Pending'],
                            [totalTasks, completedTasks, pendingTasks]
                        ]
                    }
                },

                { text: 'Certificates Summary', style: 'sectionHeader' },
                {
                    table: {
                        widths: ['*'],
                        body: [
                            ['Total Certificates'],
                            [totalCertificates]
                        ]
                    }
                },

                { text: 'Top Rated Events', style: 'sectionHeader' },
                {
                    table: {
                        widths: ['*', '*', '*'],
                        body: [
                            ['Event ID', 'Avg Rating', 'Total Feedbacks'],
                            ...topEvents.map(e => [e._id.toString(), e.avgRating.toFixed(2), e.totalFeedbacks])
                        ]
                    }
                }
            ],
            styles: {
                header: { fontSize: 22, bold: true, margin: [0, 0, 0, 10] },
                subheader: { fontSize: 12, italics: true, margin: [0, 0, 0, 10] },
                sectionHeader: { fontSize: 16, bold: true, margin: [0, 10, 0, 5] }
            }
        };

        const pdfDoc = printer.createPdfKitDocument(docDefinition);
        const chunks = [];
        pdfDoc.on('data', chunk => chunks.push(chunk));
        pdfDoc.on('end', () => {
            const result = Buffer.concat(chunks);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename=dashboard.pdf');
            res.send(result);
        });
        pdfDoc.end();

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ------------------ EXPORT DASHBOARD AS EXCEL (FUTURE HOOK) ------------------


exports.exportDashboardExcel = async (req, res) => {
    try {
        const workbook = new ExcelJS.Workbook();

        // -------- Sheet 1: Events --------
        const eventSheet = workbook.addWorksheet('Events Summary');
        eventSheet.columns = [
            { header: 'Total Events', key: 'total', width: 20 },
            { header: 'Approved', key: 'approved', width: 15 },
            { header: 'Rejected', key: 'rejected', width: 15 }
        ];

        eventSheet.addRow({
            total: await Event.countDocuments(),
            approved: await Event.countDocuments({ approved: true }),
            rejected: await Event.countDocuments({ approved: false })
        });

        // -------- Sheet 2: Attendance --------
        const attendanceSheet = workbook.addWorksheet('Attendance');
        attendanceSheet.columns = [
            { header: 'Total Registrations', key: 'total', width: 25 },
            { header: 'Present', key: 'present', width: 15 },
            { header: 'Absent', key: 'absent', width: 15 }
        ];

        attendanceSheet.addRow({
            total: await Registration.countDocuments(),
            present: await Registration.countDocuments({ attendance_status: 'Present' }),
            absent: await Registration.countDocuments({ attendance_status: 'Absent' })
        });

        // -------- Sheet 3: Tasks --------
        const taskSheet = workbook.addWorksheet('Tasks');
        taskSheet.columns = [
            { header: 'Total Tasks', key: 'total', width: 20 },
            { header: 'Completed', key: 'completed', width: 15 },
            { header: 'Pending', key: 'pending', width: 15 }
        ];

        taskSheet.addRow({
            total: await Task.countDocuments(),
            completed: await Task.countDocuments({ status: 'Completed' }),
            pending: await Task.countDocuments({ status: 'Pending' })
        });

        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
            'Content-Disposition',
            'attachment; filename=dashboard-report.xlsx'
        );

        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
