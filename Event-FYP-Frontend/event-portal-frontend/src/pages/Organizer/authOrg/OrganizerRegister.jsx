import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "../../../components/Navbar";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";  // ✅ ADD

const OrganizerRegister = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    department: "",
    password: "",
    confirmPassword: ""
  });

  const [error, setError] = useState("");

  const departments = [
    { value: "", label: "Select Department" },
    { value: "cs", label: "Computer Science" },
    { value: "math", label: "Mathematics" },
    { value: "hssc2", label: "HSSC II" },
    { value: "hssc1", label: "HSSC I" },
    { value: "10", label: "Grade 10" },
    { value: "9", label: "Grade 9" },
    { value: "8", label: "Grade 8" },
    { value: "7", label: "Grade 7" },
    { value: "6", label: "Grade 6" },
    { value: "5", label: "Grade 5" },
  ];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validate = () => {
    const { name, email, phone, department, password, confirmPassword } = formData;

    // Name — only letters and spaces
    if (!/^[a-zA-Z\s]{3,}$/.test(name.trim())) {
      return "Name must be at least 3 characters and contain only letters.";
    }

    // Email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return "Please enter a valid email address.";
    }

    // Phone — exactly 11 digits, starts with 03
    if (!/^03[0-9]{9}$/.test(phone)) {
      return "Phone must be 11 digits and start with 03 (e.g. 03001234567).";
    }

    // Department
    if (!department) {
      return "Please select a department.";
    }

    // Password — min 8 chars, 1 uppercase, 1 number
    if (!/^(?=.*[A-Z])(?=.*\d).{8,}$/.test(password)) {
      return "Password must be at least 8 characters, include 1 uppercase letter and 1 number.";
    }

    // Confirm password
    if (password !== confirmPassword) {
      return "Passwords do not match!";
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const validationError = validate();
    if (validationError) return setError(validationError);

    try {
      await axios.post(`${API_URL}/organizers/register`, {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        department: formData.department,
        password: formData.password
      });

   
      navigate("/login-organizer");
    } catch (err) {
      setError(err?.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-linear-to-br from-[#F3E5FF] to-[#FFFFFF]">
      <Navbar />

      <main className="flex-1 flex items-center justify-center p-6 lg:p-16">
        <div className="w-full max-w-5xl mx-auto bg-white rounded-2xl shadow-2xl flex overflow-hidden">

          {/* LEFT SIDE — SVG Illustration */}
          <div className="hidden lg:flex w-1/2 relative bg-linear-to-br from-[#90e3f0] to-[#8b4fa2] flex-col items-center justify-center p-10">

            <svg viewBox="0 0 400 380" xmlns="http://www.w3.org/2000/svg" className="w-full max-w-xs mb-8">
              <circle cx="200" cy="180" r="150" fill="rgba(255,255,255,0.08)" />
              <circle cx="200" cy="180" r="110" fill="rgba(255,255,255,0.08)" />

              {/* Clipboard */}
              <rect x="110" y="60" width="180" height="220" rx="14" fill="white" opacity="0.95" />
              <rect x="110" y="60" width="180" height="40" rx="14" fill="#4ECDC4" />
              <rect x="110" y="86" width="180" height="14" rx="0" fill="#4ECDC4" />

              {/* Clipboard clip */}
              <rect x="170" y="48" width="60" height="22" rx="11" fill="#9B59B6" />
              <rect x="185" y="54" width="30" height="10" rx="5" fill="white" opacity="0.5" />

              {/* Text lines */}
              <rect x="130" y="120" width="140" height="10" rx="5" fill="#9B59B6" opacity="0.8" />
              <rect x="130" y="140" width="100" height="8" rx="4" fill="#4ECDC4" opacity="0.6" />

              {/* List items */}
              {[160, 182, 204, 226].map((y, i) => (
                <g key={i}>
                  <rect x="130" y={y} width="10" height="10" rx="3" fill="#FFE66D" />
                  <rect x="148" y={y + 1} width={80 + i * 10} height="8" rx="4" fill="#1A1A1A" opacity="0.15" />
                </g>
              ))}
              <polyline points="131,165 134,168 139,163" fill="none" stroke="#9B59B6" strokeWidth="2" strokeLinecap="round" />

              {/* Person */}
              <circle cx="310" cy="170" r="28" fill="#FFE66D" />
              <circle cx="310" cy="158" r="14" fill="#FF6B6B" />
              <path d="M285 198 Q310 182 335 198" fill="#FF6B6B" />

              {/* Megaphone */}
              <polygon points="270,210 295,200 295,230 270,220" fill="#FFE66D" />
              <rect x="295" y="205" width="18" height="20" rx="4" fill="#4ECDC4" />
              <line x1="270" y1="222" x2="262" y2="235" stroke="#FFE66D" strokeWidth="3" strokeLinecap="round" />
              <line x1="270" y1="226" x2="260" y2="242" stroke="#FFE66D" strokeWidth="3" strokeLinecap="round" />

              {/* Stars */}
              {[[80, 80], [330, 100], [70, 270], [340, 260]].map(([cx, cy], i) => (
                <circle key={i} cx={cx} cy={cy} r="5" fill="white" opacity="0.4" />
              ))}

              {/* Confetti */}
              {[[150, 310], [200, 330], [250, 315], [175, 345], [225, 348]].map(([cx, cy], i) => (
                <circle key={i} cx={cx} cy={cy} r="5" fill={["#FFE66D", "#FF6B6B", "#4ECDC4", "#9B59B6", "#FFE66D"][i]} opacity="0.7" />
              ))}
            </svg>

            <div className="text-white text-center">
              <h2 className="text-4xl font-extrabold mb-3">Become an Organizer</h2>
              <p className="text-white/85 text-lg">
                Create, manage and inspire with unforgettable campus events. Your stage awaits!
              </p>
            </div>
          </div>

          {/* RIGHT SIDE — Form */}
          <div className="w-full lg:w-1/2 p-8 sm:p-12">
            <h2 className="text-3xl text-center font-bold text-black mb-2">
              Organizer Registration
            </h2>
            <p className="text-gray-500 mb-6 text-center">
              Create your account to start organizing events
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Name */}
              <div>
                <label className="block mb-2 font-bold text-gray-700">Full Name</label>
                <input type="text" name="name" placeholder="Enter Full Name" onChange={handleChange}
                  className="w-full p-4 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-[#8b4fa2] outline-none transition" required />
              </div>

              {/* Email */}
              <div>
                <label className="block mb-2 font-bold text-gray-700">Email</label>
                <input type="email" name="email" placeholder="Enter Email" onChange={handleChange}
                  className="w-full p-4 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-[#8b4fa2] outline-none transition" required />
              </div>

              {/* Phone */}
              <div>
                <label className="block mb-2 font-bold text-gray-700">Phone</label>
                <input type="text" name="phone" placeholder="e.g. 03001234567" onChange={handleChange}
                  maxLength={11}
                  className="w-full p-4 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-[#8b4fa2] outline-none transition" required />
              </div>

              {/* Department Dropdown */}
              <div>
                <label className="block mb-2 font-bold text-gray-700">Department</label>
                <select name="department" onChange={handleChange}
                  className="w-full p-4 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-[#8b4fa2] outline-none transition" required>
                  {departments.map((d) => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>
              </div>

              {/* Password */}
              <div>
                <label className="block mb-2 font-bold text-gray-700">Password</label>
                <input type="password" name="password" placeholder="Min 8 chars, 1 uppercase, 1 number" onChange={handleChange}
                  className="w-full p-4 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-[#8b4fa2] outline-none transition" required />
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block mb-2 font-bold text-gray-700">Confirm Password</label>
                <input type="password" name="confirmPassword" placeholder="Re-enter Password" onChange={handleChange}
                  className={`w-full p-4 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-[#8b4fa2] outline-none transition ${error ? "border-red-400" : ""}`}
                  required />
              </div>

              {error && <p className="text-red-500 text-sm font-semibold">{error}</p>}

              <button type="submit"
                className="w-full bg-[#8b4fa2] hover:bg-[#724286] text-white py-4 rounded-xl font-bold transition duration-300">
                Create Account
              </button>
            </form>

            <div className="text-center pt-6">
              <p className="text-gray-500 text-sm">
                Already have an account?
                <span onClick={() => navigate("/login-organizer")}
                  className="text-[#8b4fa2] font-bold ml-1 cursor-pointer hover:underline">
                  Login here
                </span>
              </p>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default OrganizerRegister;