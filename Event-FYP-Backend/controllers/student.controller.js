const Student = require('../models/Student');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// ------------------ REGISTER STUDENT ------------------
exports.registerStudent = async (req, res) => {
    try {
        const { name, email, phone, grade, semester, password } = req.body;

        const existing = await Student.findOne({ email });
        if (existing) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const student = await Student.create({
            name,
            email,
            phone,
            grade,
            semester,
            password: hashedPassword
        });

        res.status(201).json({
            message: 'Student registered successfully',
            student
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ------------------ LOGIN STUDENT ------------------
exports.loginStudent = async (req, res) => {
    try {
        const { email, password } = req.body;

        const student = await Student.findOne({ email });
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        const isMatch = await bcrypt.compare(password, student.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: student._id, role: 'Student' },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        res.json({
            message: 'Login successful',
            token
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ------------------ GET ALL STUDENTS ------------------
exports.getAllStudents = async (req, res) => {
    try {
        const students = await Student.find().select('-password');
        res.json(students);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ------------------ GET STUDENT BY ID ------------------
exports.getStudentById = async (req, res) => {
    try {
        const student = await Student.findById(req.params.id).select('-password');
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }
        res.json(student);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ------------------ UPDATE STUDENT ------------------
exports.updateStudent = async (req, res) => {
    try {
        const { name, phone, grade, semester, password } = req.body;

        const updateData = { name, phone, grade, semester };

        if (password) {
            updateData.password = await bcrypt.hash(password, 10);
        }

        const student = await Student.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        ).select('-password');

        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        res.json({
            message: 'Student updated successfully',
            student
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ------------------ DELETE STUDENT ------------------
exports.deleteStudent = async (req, res) => {
    try {
        const student = await Student.findByIdAndDelete(req.params.id);
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        res.json({ message: 'Student deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
