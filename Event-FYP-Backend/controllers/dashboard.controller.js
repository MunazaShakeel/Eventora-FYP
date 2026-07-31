// const Event = require('../models/Event');
// const Registration = require('../models/Registration');
// const Task = require('../models/Task');
// const Feedback = require('../models/Feedback');
// const Certificate = require('../models/Certificate');

// const ExcelJS = require('exceljs');
// // Correct PdfPrinter import for Node.js
// const PdfPrinter = require('pdfmake/src/printer'); // <- yahi change important

// // Fonts for PDF
// const fonts = {
//     Roboto: {
//         normal: 'node_modules/pdfmake/fonts/Roboto-Regular.ttf',
//         bold: 'node_modules/pdfmake/fonts/Roboto-Medium.ttf',
//         italics: 'node_modules/pdfmake/fonts/Roboto-Italic.ttf',
//         bolditalics: 'node_modules/pdfmake/fonts/Roboto-MediumItalic.ttf'
//     }
// };
// const printer = new PdfPrinter(fonts);

// // ------------------ GET DASHBOARD STATS ------------------
// exports.getDashboardStats = async (req, res) => {
//     try {
//         // Events
//         const totalEvents = await Event.countDocuments();
//         const approvedEvents = await Event.countDocuments({ approved: true });
//         const rejectedEvents = await Event.countDocuments({ approved: false });

//         // Registrations - Updated attendance calculation
//         const totalRegistrations = await Registration.countDocuments();
//         const presentCount = await Registration.countDocuments({ attendance_status: 'Present' });
//         const absentCount = totalRegistrations - presentCount; // Remaining = Absent

//         // Tasks
//         const totalTasks = await Task.countDocuments();
//         const completedTasks = await Task.countDocuments({ status: 'Completed' });
//         const pendingTasks = await Task.countDocuments({ status: 'Pending' });

//         // Certificates
//         const totalCertificates = await Certificate.countDocuments();

//         // Top 5 rated events with Event Title - Updated aggregation
//         const topEvents = await Feedback.aggregate([
//             {
//                 $group: {
//                     _id: "$event_id",
//                     avgRating: { $avg: "$rating" },
//                     totalFeedbacks: { $sum: 1 }
//                 }
//             },
//             {
//                 $lookup: {
//                     from: "events",
//                     localField: "_id",
//                     foreignField: "_id",
//                     as: "event"
//                 }
//             },
//             {
//                 $unwind: "$event"
//             },
//             {
//                 $project: {
//                     _id: 1,
//                     title: "$event.title",
//                     avgRating: 1,
//                     totalFeedbacks: 1
//                 }
//             },
//             {
//                 $sort: {
//                     avgRating: -1
//                 }
//             },
//             {
//                 $limit: 5
//             }
//         ]);

//         res.json({
//             events: { totalEvents, approvedEvents, rejectedEvents },
//             registrations: { totalRegistrations, presentCount, absentCount },
//             tasks: { totalTasks, completedTasks, pendingTasks },
//             totalCertificates,
//             topEvents
//         });

//     } catch (error) {
//         res.status(500).json({ message: error.message });
//     }
// };

// // ------------------ EXPORT DASHBOARD AS PDF ------------------
// exports.exportDashboardPDF = async (req, res) => {
//     try {
//         // Fetch stats
//         const totalEvents = await Event.countDocuments();
//         const approvedEvents = await Event.countDocuments({ approved: true });
//         const rejectedEvents = await Event.countDocuments({ approved: false });

//         // Registrations - Updated attendance calculation
//         const totalRegistrations = await Registration.countDocuments();
//         const presentCount = await Registration.countDocuments({ attendance_status: 'Present' });
//         const absentCount = totalRegistrations - presentCount; // Remaining = Absent

//         const totalTasks = await Task.countDocuments();
//         const completedTasks = await Task.countDocuments({ status: 'Completed' });
//         const pendingTasks = await Task.countDocuments({ status: 'Pending' });

//         const totalCertificates = await Certificate.countDocuments();

//         // Top 5 rated events with Event Title - Updated aggregation
//         const topEvents = await Feedback.aggregate([
//             {
//                 $group: {
//                     _id: "$event_id",
//                     avgRating: { $avg: "$rating" },
//                     totalFeedbacks: { $sum: 1 }
//                 }
//             },
//             {
//                 $lookup: {
//                     from: "events",
//                     localField: "_id",
//                     foreignField: "_id",
//                     as: "event"
//                 }
//             },
//             {
//                 $unwind: "$event"
//             },
//             {
//                 $project: {
//                     _id: 1,
//                     title: "$event.title",
//                     avgRating: 1,
//                     totalFeedbacks: 1
//                 }
//             },
//             {
//                 $sort: {
//                     avgRating: -1
//                 }
//             },
//             {
//                 $limit: 5
//             }
//         ]);

//         // PDF Document Definition
//         const docDefinition = {
//             content: [
//                 { text: 'Dashboard Report', style: 'header' },
//                 { text: `Generated on: ${new Date().toLocaleString()}`, style: 'subheader' },

//                 { text: 'Events Summary', style: 'sectionHeader' },
//                 {
//                     table: {
//                         widths: ['*', '*', '*'],
//                         body: [
//                             ['Total Events', 'Approved', 'Rejected'],
//                             [totalEvents, approvedEvents, rejectedEvents]
//                         ]
//                     }
//                 },

//                 { text: 'Registrations Summary', style: 'sectionHeader' },
//                 {
//                     table: {
//                         widths: ['*', '*', '*'],
//                         body: [
//                             ['Total Registrations', 'Present', 'Absent'],
//                             [totalRegistrations, presentCount, absentCount]
//                         ]
//                     }
//                 },

//                 { text: 'Tasks Summary', style: 'sectionHeader' },
//                 {
//                     table: {
//                         widths: ['*', '*', '*'],
//                         body: [
//                             ['Total Tasks', 'Completed', 'Pending'],
//                             [totalTasks, completedTasks, pendingTasks]
//                         ]
//                     }
//                 },

//                 { text: 'Certificates Summary', style: 'sectionHeader' },
//                 {
//                     table: {
//                         widths: ['*'],
//                         body: [
//                             ['Total Certificates'],
//                             [totalCertificates]
//                         ]
//                     }
//                 },

//                 { text: 'Top Rated Events', style: 'sectionHeader' },
//                 {
//                     table: {
//                         widths: ['*', '*', '*'],
//                         body: [
//                             ['Event Name', 'Avg Rating', 'Total Feedbacks'], // Changed from 'Event ID' to 'Event Name'
//                             ...topEvents.map(e => [
//                                 e.title, // Using title instead of _id
//                                 e.avgRating.toFixed(2),
//                                 e.totalFeedbacks
//                             ])
//                         ]
//                     }
//                 }
//             ],
//             styles: {
//                 header: { fontSize: 22, bold: true, margin: [0, 0, 0, 10] },
//                 subheader: { fontSize: 12, italics: true, margin: [0, 0, 0, 10] },
//                 sectionHeader: { fontSize: 16, bold: true, margin: [0, 10, 0, 5] }
//             }
//         };

//         const pdfDoc = printer.createPdfKitDocument(docDefinition);
//         const chunks = [];
//         pdfDoc.on('data', chunk => chunks.push(chunk));
//         pdfDoc.on('end', () => {
//             const result = Buffer.concat(chunks);
//             res.setHeader('Content-Type', 'application/pdf');
//             res.setHeader('Content-Disposition', 'attachment; filename=dashboard.pdf');
//             res.send(result);
//         });
//         pdfDoc.end();

//     } catch (error) {
//         res.status(500).json({ message: error.message });
//     }
// };

// // ------------------ EXPORT DASHBOARD AS EXCEL ------------------
// exports.exportDashboardExcel = async (req, res) => {
//     try {
//         const workbook = new ExcelJS.Workbook();

//         // -------- Sheet 1: Events --------
//         const eventSheet = workbook.addWorksheet('Events Summary');
//         eventSheet.columns = [
//             { header: 'Total Events', key: 'total', width: 20 },
//             { header: 'Approved', key: 'approved', width: 15 },
//             { header: 'Rejected', key: 'rejected', width: 15 }
//         ];

//         eventSheet.addRow({
//             total: await Event.countDocuments(),
//             approved: await Event.countDocuments({ approved: true }),
//             rejected: await Event.countDocuments({ approved: false })
//         });

//         // -------- Sheet 2: Attendance - Updated calculation --------
//         const attendanceSheet = workbook.addWorksheet('Attendance');
//         attendanceSheet.columns = [
//             { header: 'Total Registrations', key: 'total', width: 25 },
//             { header: 'Present', key: 'present', width: 15 },
//             { header: 'Absent', key: 'absent', width: 15 }
//         ];

//         const totalRegistrations = await Registration.countDocuments();
//         const presentCount = await Registration.countDocuments({ attendance_status: 'Present' });
//         const absentCount = totalRegistrations - presentCount; // Remaining = Absent

//         attendanceSheet.addRow({
//             total: totalRegistrations,
//             present: presentCount,
//             absent: absentCount
//         });

//         // -------- Sheet 3: Tasks --------
//         const taskSheet = workbook.addWorksheet('Tasks');
//         taskSheet.columns = [
//             { header: 'Total Tasks', key: 'total', width: 20 },
//             { header: 'Completed', key: 'completed', width: 15 },
//             { header: 'Pending', key: 'pending', width: 15 }
//         ];

//         taskSheet.addRow({
//             total: await Task.countDocuments(),
//             completed: await Task.countDocuments({ status: 'Completed' }),
//             pending: await Task.countDocuments({ status: 'Pending' })
//         });

//         res.setHeader(
//             'Content-Type',
//             'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
//         );
//         res.setHeader(
//             'Content-Disposition',
//             'attachment; filename=dashboard-report.xlsx'
//         );

//         await workbook.xlsx.write(res);
//         res.end();

//     } catch (error) {
//         res.status(500).json({ message: error.message });
//     }
// };


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
// ------------------ GET DASHBOARD STATS ------------------
exports.getDashboardStats = async (req, res) => {
    try {
        // Events
        const totalEvents = await Event.countDocuments();
        const approvedEvents = await Event.countDocuments({ approved: true });
        const rejectedEvents = await Event.countDocuments({ approved: false });

        // ✅ NEW: Upcoming Events (approved + future date)
        const upcomingEvents = await Event.find({
            approved: true,
            start_date: { $gte: new Date() }
        })
        .populate('organizer_id', 'name')
        .sort({ start_date: 1 })
        .limit(5);

        // Registrations
        const totalRegistrations = await Registration.countDocuments();
        const presentCount = await Registration.countDocuments({ attendance_status: 'Present' });
        const absentCount = totalRegistrations - presentCount;

        // Tasks
        const totalTasks = await Task.countDocuments();
        const completedTasks = await Task.countDocuments({ status: 'Completed' });
        const pendingTasks = await Task.countDocuments({ status: 'Pending' });

        // Certificates
        const totalCertificates = await Certificate.countDocuments();

        // Top 5 rated events
        const topEvents = await Feedback.aggregate([
            { $group: { _id: "$event_id", avgRating: { $avg: "$rating" }, totalFeedbacks: { $sum: 1 } } },
            { $lookup: { from: "events", localField: "_id", foreignField: "_id", as: "event" } },
            { $unwind: "$event" },
            { $project: { _id: 1, title: "$event.title", avgRating: 1, totalFeedbacks: 1 } },
            { $sort: { avgRating: -1 } },
            { $limit: 5 }
        ]);

        res.json({
            events: { 
                totalEvents, 
                approvedEvents, 
                rejectedEvents,
                upcomingEvents   // ✅ ab ye include ho raha hai
            },
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

        // Registrations - Updated attendance calculation
        const totalRegistrations = await Registration.countDocuments();
        const presentCount = await Registration.countDocuments({ attendance_status: 'Present' });
        const absentCount = totalRegistrations - presentCount; // Remaining = Absent

        const totalTasks = await Task.countDocuments();
        const completedTasks = await Task.countDocuments({ status: 'Completed' });
        const pendingTasks = await Task.countDocuments({ status: 'Pending' });

        const totalCertificates = await Certificate.countDocuments();

        // Top 5 rated events with Event Title - Updated aggregation
        const topEvents = await Feedback.aggregate([
            {
                $group: {
                    _id: "$event_id",
                    avgRating: { $avg: "$rating" },
                    totalFeedbacks: { $sum: 1 }
                }
            },
            {
                $lookup: {
                    from: "events",
                    localField: "_id",
                    foreignField: "_id",
                    as: "event"
                }
            },
            {
                $unwind: "$event"
            },
            {
                $project: {
                    _id: 1,
                    title: "$event.title",
                    avgRating: 1,
                    totalFeedbacks: 1
                }
            },
            {
                $sort: {
                    avgRating: -1
                }
            },
            {
                $limit: 5
            }
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
                            ['Event Name', 'Avg Rating', 'Total Feedbacks'],
                            ...topEvents.map(e => [
                                e.title,
                                e.avgRating.toFixed(2),
                                e.totalFeedbacks
                            ])
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

// ------------------ EXPORT DASHBOARD AS EXCEL ------------------
// ------------------ EXPORT DASHBOARD AS EXCEL ------------------
exports.exportDashboardExcel = async (req, res) => {
    try {
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'Eventora Admin';
        workbook.created = new Date();

        // -------- Sheet 1: Events --------
        const eventSheet = workbook.addWorksheet('Events Summary');
        eventSheet.columns = [
            { header: 'Total Events', key: 'total', width: 20 },
            { header: 'Approved', key: 'approved', width: 15 },
            { header: 'Pending', key: 'pending', width: 15 }
        ];
        eventSheet.getRow(1).font = { bold: true };
        eventSheet.addRow({
            total: await Event.countDocuments(),
            approved: await Event.countDocuments({ approved: true }),
            pending: await Event.countDocuments({ approved: false })
        });

        // -------- Sheet 2: Attendance --------
        const attendanceSheet = workbook.addWorksheet('Attendance');
        attendanceSheet.columns = [
            { header: 'Total Registrations', key: 'total', width: 25 },
            { header: 'Present', key: 'present', width: 15 },
            { header: 'Absent', key: 'absent', width: 15 }
        ];
        attendanceSheet.getRow(1).font = { bold: true };

        const totalRegistrations = await Registration.countDocuments();
        const presentCount = await Registration.countDocuments({ attendance_status: 'Present' });
        const absentCount = totalRegistrations - presentCount;

        attendanceSheet.addRow({
            total: totalRegistrations,
            present: presentCount,
            absent: absentCount
        });

        // -------- Sheet 3: Tasks --------
        const taskSheet = workbook.addWorksheet('Tasks');
        taskSheet.columns = [
            { header: 'Total Tasks', key: 'total', width: 20 },
            { header: 'Completed', key: 'completed', width: 15 },
            { header: 'Pending', key: 'pending', width: 15 }
        ];
        taskSheet.getRow(1).font = { bold: true };
        taskSheet.addRow({
            total: await Task.countDocuments(),
            completed: await Task.countDocuments({ status: 'Completed' }),
            pending: await Task.countDocuments({ status: 'Pending' })
        });

        // -------- Sheet 4: Certificates (NEW) --------
        const certSheet = workbook.addWorksheet('Certificates');
        certSheet.columns = [
            { header: 'Total Certificates Issued', key: 'total', width: 25 }
        ];
        certSheet.getRow(1).font = { bold: true };
        certSheet.addRow({
            total: await Certificate.countDocuments()
        });

        // -------- Sheet 5: Top Rated Events (NEW) --------
        const topEvents = await Feedback.aggregate([
            { $group: { _id: "$event_id", avgRating: { $avg: "$rating" }, totalFeedbacks: { $sum: 1 } } },
            { $lookup: { from: "events", localField: "_id", foreignField: "_id", as: "event" } },
            { $unwind: "$event" },
            { $project: { _id: 1, title: "$event.title", avgRating: 1, totalFeedbacks: 1 } },
            { $sort: { avgRating: -1 } },
            { $limit: 5 }
        ]);

        const topEventsSheet = workbook.addWorksheet('Top Rated Events');
        topEventsSheet.columns = [
            { header: 'Event Name', key: 'title', width: 30 },
            { header: 'Avg Rating', key: 'avgRating', width: 15 },
            { header: 'Total Feedbacks', key: 'totalFeedbacks', width: 18 }
        ];
        topEventsSheet.getRow(1).font = { bold: true };
        topEvents.forEach(e => {
            topEventsSheet.addRow({
                title: e.title,
                avgRating: e.avgRating.toFixed(2),
                totalFeedbacks: e.totalFeedbacks
            });
        });

        // -------- Response --------
        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
            'Content-Disposition',
            `attachment; filename=dashboard-report-${new Date().toISOString().split('T')[0]}.xlsx`
        );

        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error('Excel export error:', error);
        res.status(500).json({ message: error.message });
    }
};