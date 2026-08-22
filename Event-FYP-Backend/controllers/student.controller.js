const Student = require('../models/Student');
const bcrypt = require('bcryptjs');//bcyrptjs used for hashing passwords and comparing hashed passwords for authentication.
const jwt = require('jsonwebtoken'); 
const { sendNotification } = require('../utils/notification');

// ------------------ REGISTER STUDENT ------------------
exports.registerStudent = async (req, res) => {
    try {
        const { name, email, phone, grade, department, semester, password } = req.body; // ye data frontend se aa raha hai

        // Check if email already exists
        const existingEmail = await Student.findOne({ email });
        if (existingEmail) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        //  Phone check ONLY if phone is provided
        if (phone && phone.trim()) 
             {
            const existingPhone = await Student.findOne({ phone });//check if phone already exists in the database
            if (existingPhone) {
                return res.status(400).json({ message: 'Phone number already registered' });
            }
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        
      
        const student = await Student.create({
            name,
            email,
            phone: phone || null,  // Empty phone ko null set karein
            grade,
            department,
            semester,
            password: hashedPassword
        });

        // Send notification to student
        await sendNotification(
            student._id,
            'Welcome to Eventora! 🎉',
            `Hello ${name}, your student account has been created successfully. Start exploring events!`,
            'system', //Notification type
            student._id
        );

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

        // Send login notification
        await sendNotification(
            student._id,
            'New Login Detected 🔐',
            `You logged into your student account at ${new Date().toLocaleString()}`,
            'system',
            student._id
        );

        //after login token generate karna hai jo ki user ko milega aur uske sath hi user ka data bhi milega
        const token = jwt.sign(
            { id: student._id, role: 'Student' },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                _id: student._id,
                name: student.name,
                email: student.email,
                role: 'Student'
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ------------------ GET PROFILE (SELF) ------------------
exports.getProfile = async (req, res) => {
    try {
        const student = await Student.findById(req.user.id).select('-password');
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }
        res.json(student);
    } catch (error) {
        console.error("Get profile error:", error);
        res.status(500).json({ message: error.message });
    }
};

// ------------------ UPDATE PROFILE (SELF) ------------------
exports.updateProfile = async (req, res) => {
    try {
        const { name, phone, department, semester, password } = req.body;

        const updateData = { name, phone, department, semester };

        if (password) {
            updateData.password = await bcrypt.hash(password, 10);
        }

        const student = await Student.findByIdAndUpdate(
            req.user.id,
            updateData,
            { new: true }
        ).select('-password');

        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        // Send notification for profile update
        await sendNotification(
            req.user.id,
            'Profile Updated ✅',
            'Your profile information has been updated successfully.',
            'system',
            student._id
        );

        res.json({
            message: 'Profile updated successfully',
            student
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ------------------ GET ALL STUDENTS (ADMIN) ------------------
exports.getAllStudents = async (req, res) => {
    try {
        const students = await Student.find().select('-password');
        res.json(students);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ------------------ GET STUDENT BY ID (ADMIN) ------------------
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

// ------------------ UPDATE STUDENT (ADMIN) ------------------
exports.updateStudent = async (req, res) => {
    try {
        const { name, phone, grade, semester, department, password } = req.body;

        const updateData = { name, phone, grade, semester, department };

        if (password) 
             {
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

// ------------------ DELETE STUDENT (ADMIN) ------------------
exports.deleteStudent = async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        // Send notification before deletion
        await sendNotification(
            student._id,
            'Account Deleted ⚠️',
            'Your student account has been deleted. Contact support if this was a mistake.',
            'system',
            student._id
        );

        await Student.findByIdAndDelete(req.params.id);

        res.json({ message: 'Student deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};