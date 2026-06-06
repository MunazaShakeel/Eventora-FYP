



const Admin = require('../models/Admin');
const Student = require('../models/Student');
const Organizer = require('../models/Organizer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');


// ===============================
// 🔐 ADMIN LOGIN
// ===============================
exports.loginAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find admin
        const admin = await Admin.findOne({ email });
        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Generate JWT (IMPORTANT: using type)
        const token = jwt.sign(
            { id: admin._id, type: 'Admin' },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        res.json({
            message: 'Login successful',
            token
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// ===============================
// 📊 ADMIN DASHBOARD
// ===============================
exports.getDashboard = async (req, res) => {
    try {
        const totalStudents = await Student.countDocuments();
        const totalOrganizers = await Organizer.countDocuments();
        const totalAdmins = await Admin.countDocuments();

        res.json({
            message: 'Admin Dashboard Data',
            totalStudents,
            totalOrganizers,
            totalAdmins
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// ===============================
// 👥 GET ALL USERS
// ===============================
exports.getAllUsers = async (req, res) => {
    try {
        const students = await Student.find().select('-password');
        const organizers = await Organizer.find().select('-password');

        res.json({
            students,
            organizers
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// ===============================
// 👑 GET ALL ADMINS
// ===============================
exports.getAllAdmins = async (req, res) => {
    try {
        const admins = await Admin.find().select('-password');
        res.json(admins);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// ===============================
// 🔍 GET ADMIN BY ID
// ===============================
exports.getAdminById = async (req, res) => {
    try {
        const admin = await Admin.findById(req.params.id).select('-password');

        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        res.json(admin);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// ===============================
// ✏ UPDATE ADMIN
// ===============================
exports.updateAdmin = async (req, res) => {
    try {
        const { name, password } = req.body;

        const updateData = { name };

        if (password) {
            updateData.password = await bcrypt.hash(password, 10);
        }

        const admin = await Admin.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        ).select('-password');

        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        res.json({
            message: 'Admin updated successfully',
            admin
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// ===============================
// ❌ DELETE ADMIN
// ===============================
exports.deleteAdmin = async (req, res) => {
    try {
        const admin = await Admin.findByIdAndDelete(req.params.id);

        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        res.json({ message: 'Admin deleted successfully' });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};