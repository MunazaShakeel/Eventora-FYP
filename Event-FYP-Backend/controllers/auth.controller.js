const Student = require('../models/Student');
const Organizer = require('../models/Organizer');
const Admin = require('../models/Admin');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// ------------------ REGISTER USER ------------------
exports.registerUser = async (req, res) => {
    try {
        const { role, name, email, password, phone, department, year } = req.body;

        // Role-based user model
        let UserModel;
        if (role === 'Student' || role === 'Volunteer') UserModel = Student;
        else if (role === 'Organizer') UserModel = Organizer;
        else if (role === 'Admin') UserModel = Admin;
        else return res.status(400).json({ message: 'Invalid role' });

        // Check existing user
        const existingUser = await UserModel.findOne({ email });
        if (existingUser) return res.status(400).json({ message: 'Email already exists' });

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const userData = { name, email, password: hashedPassword };
        if (role === 'Student' || role === 'Volunteer') {
            userData.phone = phone;
            userData.department = department;
            userData.year = year;
        } else if (role === 'Organizer') {
            userData.phone = phone;
            userData.department = department;
        }

        const user = await UserModel.create(userData);

        // Generate JWT
       const token = jwt.sign({ id: user._id, role, name: user.name, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' })

        res.status(201).json({ message: 'User registered successfully', token, user });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ------------------ LOGIN USER ------------------
exports.loginUser = async (req, res) => {
    try {
        const { email, password, role } = req.body;

        // Role-based model
        let UserModel;
        if (role === 'Student' || role === 'Volunteer') UserModel = Student;
        else if (role === 'Organizer') UserModel = Organizer;
        else if (role === 'Admin') UserModel = Admin;
        else return res.status(400).json({ message: 'Invalid role' });

        const user = await UserModel.findOne({ email });
        if (!user) return res.status(404).json({ message: 'User not found' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ message: 'Incorrect password' });

        // Generate JWT
      const token = jwt.sign({ id: user._id, role, name: user.name, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.json({ message: 'Login successful', token, user });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
