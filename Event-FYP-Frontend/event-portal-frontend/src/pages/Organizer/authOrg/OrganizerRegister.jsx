import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "../../../components/Navbar";
import { Eye, EyeOff, CheckCircle, XCircle, AlertCircle } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

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
  const [showOtherDepartment, setShowOtherDepartment] = useState(false);
  const [otherDepartmentValue, setOtherDepartmentValue] = useState("");
  
  // Password show/hide states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Name validation state
  const [nameError, setNameError] = useState("");
  const [nameTouched, setNameTouched] = useState(false);
  
  // Phone validation state
  const [phoneError, setPhoneError] = useState("");
  
  // Password validation states
  const [passwordErrors, setPasswordErrors] = useState({
    length: false,
    uppercase: false,
    number: false
  });
  const [passwordTouched, setPasswordTouched] = useState(false);
  
  // Email validation state
  const [emailError, setEmailError] = useState("");
  const [isEmailChecking, setIsEmailChecking] = useState(false);
  const [emailAvailable, setEmailAvailable] = useState(null);
  const [emailTouched, setEmailTouched] = useState(false);

  // Name validation function
  const validateName = (name) => {
    if (!name.trim()) {
      setNameError("Name is required");
      return false;
    }
    if (name.trim().length < 2) {
      setNameError("Minimum 2 characters");
      return false;
    }
    if (name.trim().length > 50) {
      setNameError("Maximum 50 characters");
      return false;
    }
    if (!/^[a-zA-Z\s\-']+$/.test(name.trim())) {
      setNameError("Only letters, spaces, hyphens, apostrophes");
      return false;
    }
    setNameError("");
    return true;
  };

  // Password validation function
  const validatePassword = (password) => {
    const errors = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      number: /[0-9]/.test(password)
    };
    setPasswordErrors(errors);
    return Object.values(errors).every(val => val === true);
  };

  // Check email uniqueness
  const checkEmailAvailability = async (email) => {
    if (!email || !email.includes('@')) {
      setEmailAvailable(null);
      setEmailError("");
      return;
    }

    setIsEmailChecking(true);
    setEmailError("");
    
    try {
      // Check if email exists in students
      const studentRes = await axios.get(`${API_URL}/students/check-email?email=${email}`);
      
      // Check if email exists in organizers
      const organizerRes = await axios.get(`${API_URL}/organizers/check-email?email=${email}`);
      
      // Check if email exists in admins
      const adminRes = await axios.get(`${API_URL}/admins/check-email?email=${email}`);

      if (studentRes.data.exists || organizerRes.data.exists || adminRes.data.exists) {
        setEmailAvailable(false);
        setEmailError("This email is already registered. Please use a different email or login.");
      } else {
        setEmailAvailable(true);
        setEmailError("");
      }
    } catch (err) {
      console.error("Email check error:", err);
      setEmailAvailable(null);
      setEmailError("");
    } finally {
      setIsEmailChecking(false);
    }
  };

  // Debounce email check
  useEffect(() => {
    if (emailTouched && formData.email) {
      const timer = setTimeout(() => {
        checkEmailAvailability(formData.email);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [formData.email, emailTouched]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Phone validation
    if (name === "phone") {
      const cleanedValue = value.replace(/\D/g, '');
      
      if (cleanedValue.length <= 11) {
        setFormData((prev) => ({
          ...prev,
          [name]: cleanedValue
        }));
        
        if (cleanedValue.length === 0) {
          setPhoneError("");
        } else if (cleanedValue.length < 11) {
          setPhoneError("Phone number must be exactly 11 digits");
        } else if (cleanedValue.length === 11) {
          if (cleanedValue.startsWith('03')) {
            setPhoneError("");
          } else {
            setPhoneError("Pakistani number must start with 03 (e.g., 03XXXXXXXXX)");
          }
        }
      }
      return;
    }

    // Name validation
    if (name === "name") {
      setNameTouched(true);
      validateName(value);
    }

    // Password validation
    if (name === "password") {
      setPasswordTouched(true);
      validatePassword(value);
    }

    // Email validation
    if (name === "email") {
      setEmailTouched(true);
      setEmailAvailable(null);
      setEmailError("");
    }

    setFormData({ ...formData, [name]: value });

    // Department logic
    if (name === "department") {
      if (value === "other") {
        setShowOtherDepartment(true);
      } else {
        setShowOtherDepartment(false);
        setOtherDepartmentValue("");
      }
    }
  };

  const handleOtherDepartmentChange = (e) => {
    setOtherDepartmentValue(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validate name
    if (!validateName(formData.name)) {
      setError("Please enter a valid full name");
      return;
    }

    // Department validation
    if (formData.department === "other") {
      if (!otherDepartmentValue.trim()) {
        setError("Please specify your department.");
        return;
      }
    } else if (!formData.department) {
      setError("Please select a department.");
      return;
    }

    // Password validation
    const isPasswordValid = validatePassword(formData.password);
    if (!isPasswordValid) {
      setError("Password must meet all the requirements shown below");
      return;
    }

    // Confirm password
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    // Email validation
    if (emailAvailable === false) {
      setError("This email is already registered. Please use a different email.");
      return;
    }

    // Phone validation
    if (formData.phone) {
      if (formData.phone.length !== 11) {
        setError("Phone number must be exactly 11 digits");
        return;
      }
      if (!formData.phone.startsWith('03')) {
        setError("Pakistani number must start with 03 (e.g., 03XXXXXXXXX)");
        return;
      }
    }

    try {
      let finalDepartment = formData.department;
      if (formData.department === "other") {
        finalDepartment = otherDepartmentValue;
      }

      await axios.post(`${API_URL}/organizers/register`, {
        name: formData.name.trim(),
        email: formData.email,
        phone: formData.phone,
        department: finalDepartment,
        password: formData.password
      });

      navigate("/login-organizer");
    } catch (err) {
      console.error("Server response:", err.response?.data);
      
      if (err.response?.data?.message?.includes("email already exists")) {
        setError("This email is already registered. Please login or use a different email.");
      } else {
        setError(err?.response?.data?.message || "Registration failed. Please check all fields.");
      }
    }
  };

  // Get password strength
  const getPasswordStrength = () => {
    const validCount = Object.values(passwordErrors).filter(val => val === true).length;
    if (validCount === 3) return { text: "Strong", color: "text-green-600", bg: "bg-green-100" };
    if (validCount >= 2) return { text: "Medium", color: "text-yellow-600", bg: "bg-yellow-100" };
    if (validCount >= 1) return { text: "Weak", color: "text-red-600", bg: "bg-red-100" };
    return { text: "", color: "", bg: "" };
  };

  const strength = getPasswordStrength();

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

  return (
    <div className="min-h-screen flex flex-col bg-linear-to-br from-[#F3E5FF] to-[#FFFFFF]">
      <Navbar />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-16">
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
          <div className="w-full lg:w-1/2 p-6 sm:p-8 lg:p-12 overflow-y-auto max-h-[90vh] lg:max-h-full">
            <h2 className="text-3xl text-center font-bold text-black mb-2">
              Organizer Registration
            </h2>
            <p className="text-gray-500 mb-6 text-center text-sm">
              Create your account to start organizing events
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Full Name with validation */}
              <div>
                <label className="block mb-2 font-bold text-gray-700 text-sm">
                  Full Name *
                </label>
                <div className="relative">
                  <input 
                    type="text" 
                    name="name" 
                    placeholder="Enter Full Name" 
                    value={formData.name}
                    onChange={handleChange}
                    className={`w-full p-4 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-[#8b4fa2] outline-none transition pr-10 ${
                      nameTouched && !nameError && formData.name.length > 0 ? "border-green-400" : ""
                    } ${
                      nameTouched && nameError ? "border-red-400" : ""
                    }`}
                    required 
                  />
                  {nameTouched && !nameError && formData.name.length > 0 && (
                    <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500" size={18} />
                  )}
                  {nameTouched && nameError && (
                    <XCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500" size={18} />
                  )}
                </div>
                {nameTouched && nameError && (
                  <p className="text-red-500 text-xs font-semibold mt-1 flex items-center gap-1">
                    <AlertCircle size={12} />
                    {nameError}
                  </p>
                )}
              </div>

              {/* Email with availability check */}
              <div>
                <label className="block mb-2 font-bold text-gray-700 text-sm">
                  Email *
                </label>
                <div className="relative">
                  <input 
                    type="email" 
                    name="email" 
                    placeholder="Enter Email" 
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full p-4 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-[#8b4fa2] outline-none transition pr-12 ${
                      emailError ? "border-red-400 focus:ring-red-400" : 
                      emailAvailable === true && emailTouched ? "border-green-400" : ""
                    }`}
                    required 
                  />
                  {isEmailChecking && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="w-5 h-5 border-2 border-[#8b4fa2] border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                  {!isEmailChecking && emailTouched && emailAvailable === true && (
                    <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500" size={20} />
                  )}
                  {!isEmailChecking && emailTouched && emailAvailable === false && (
                    <XCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500" size={20} />
                  )}
                </div>
                {emailError && (
                  <p className="text-red-500 text-xs font-semibold mt-1 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {emailError}
                  </p>
                )}
                {emailTouched && emailAvailable === true && !emailError && (
                  <p className="text-green-500 text-xs font-semibold mt-1 flex items-center gap-1">
                    <CheckCircle size={14} />
                    Email is available ✅
                  </p>
                )}
              </div>

              {/* Phone with validation */}
              <div>
                <label className="block mb-2 font-bold text-gray-700 text-sm">
                  Phone *
                </label>
                <div className="relative">
                  <input 
                    type="text" 
                    name="phone" 
                    placeholder="03XXXXXXXXX (11 digits)" 
                    value={formData.phone}
                    onChange={handleChange}
                    maxLength={11}
                    className={`w-full p-4 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-[#8b4fa2] outline-none transition pr-10 ${
                      phoneError ? "border-red-400 focus:ring-red-400" : ""
                    } ${
                      formData.phone && formData.phone.length === 11 && formData.phone.startsWith('03') ? "border-green-400" : ""
                    }`}
                    required 
                  />
                  {formData.phone && formData.phone.length === 11 && formData.phone.startsWith('03') && (
                    <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500" size={18} />
                  )}
                  {phoneError && (
                    <XCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500" size={18} />
                  )}
                </div>
                {phoneError && (
                  <p className="text-red-500 text-xs font-semibold mt-1">{phoneError}</p>
                )}
                {formData.phone && formData.phone.length === 11 && formData.phone.startsWith('03') && (
                  <p className="text-green-500 text-xs font-semibold mt-1 flex items-center gap-1">
                    <CheckCircle size={14} />
                    Valid Pakistani number ✅
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  Enter 11 digits starting with 03 (e.g., 03331234567)
                </p>
              </div>

              {/* Department Dropdown */}
              <div>
                <label className="block mb-2 font-bold text-gray-700 text-sm">
                  Department *
                </label>
                <select 
                  name="department" 
                  value={formData.department}
                  onChange={handleChange}
                  className="w-full p-4 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-[#8b4fa2] outline-none transition" 
                  required
                >
                  {departments.map((d) => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                  <option value="other">Other Department</option>
                </select>
              </div>

              {/* Other Department Text Input */}
              {showOtherDepartment && (
                <div>
                  <label className="block mb-2 font-bold text-gray-700 text-sm">
                    Specify Department *
                  </label>
                  <input
                    type="text"
                    value={otherDepartmentValue}
                    onChange={handleOtherDepartmentChange}
                    placeholder="Enter your department name"
                    className="w-full p-4 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-[#8b4fa2] focus:border-[#8b4fa2] outline-none transition"
                    required
                  />
                </div>
              )}

              {/* Password with validation */}
              <div>
                <label className="block mb-2 font-bold text-gray-700 text-sm">
                  Password *
                </label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    name="password" 
                    placeholder="Enter Password" 
                    value={formData.password}
                    onChange={handleChange}
                    className={`w-full p-4 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-[#8b4fa2] outline-none transition pr-12 ${
                      passwordTouched && !Object.values(passwordErrors).every(val => val === true) ? "border-yellow-400" : 
                      passwordTouched && Object.values(passwordErrors).every(val => val === true) ? "border-green-400" : ""
                    }`}
                    required 
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-[#8b4fa2] transition"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {passwordTouched && formData.password.length > 0 && (
                  <div className="mt-2">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className={`text-xs font-bold px-2 py-0.5 rounded-full ${strength.color} ${strength.bg}`}>
                        {strength.text}
                      </div>
                    </div>
                    <div className="flex gap-1 mb-2">
                      {Object.values(passwordErrors).map((valid, index) => (
                        <div
                          key={index}
                          className={`h-1 flex-1 rounded-full transition-all ${
                            valid ? "bg-green-500" : "bg-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                    <div className="space-y-1">
                      <p className={`text-xs flex items-center gap-1.5 ${passwordErrors.length ? "text-green-600" : "text-gray-400"}`}>
                        {passwordErrors.length ? <CheckCircle size={12} /> : <XCircle size={12} />}
                        At least 8 characters
                      </p>
                      <p className={`text-xs flex items-center gap-1.5 ${passwordErrors.uppercase ? "text-green-600" : "text-gray-400"}`}>
                        {passwordErrors.uppercase ? <CheckCircle size={12} /> : <XCircle size={12} />}
                        At least one uppercase letter (A-Z)
                      </p>
                      <p className={`text-xs flex items-center gap-1.5 ${passwordErrors.number ? "text-green-600" : "text-gray-400"}`}>
                        {passwordErrors.number ? <CheckCircle size={12} /> : <XCircle size={12} />}
                        At least one number (0-9)
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block mb-2 font-bold text-gray-700 text-sm">
                  Confirm Password *
                </label>
                <div className="relative">
                  <input 
                    type={showConfirmPassword ? "text" : "password"} 
                    name="confirmPassword" 
                    placeholder="Re-enter Password" 
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`w-full p-4 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-[#8b4fa2] outline-none transition pr-12 ${
                      formData.confirmPassword && formData.password !== formData.confirmPassword ? "border-red-400" :
                      formData.confirmPassword && formData.password === formData.confirmPassword ? "border-green-400" : ""
                    }`}
                    required 
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-[#8b4fa2] transition"
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {formData.confirmPassword && formData.password === formData.confirmPassword && (
                  <p className="text-green-500 text-xs font-semibold mt-1 flex items-center gap-1">
                    <CheckCircle size={14} />
                    Passwords match ✅
                  </p>
                )}
                {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                  <p className="text-red-500 text-xs font-semibold mt-1 flex items-center gap-1">
                    <XCircle size={14} />
                    Passwords do not match
                  </p>
                )}
              </div>

              {/* Error Message */}
              {error && (
                <p className="text-red-500 text-sm font-semibold bg-red-50 p-3 rounded-xl flex items-center gap-2">
                  <AlertCircle size={18} />
                  {error}
                </p>
              )}

              {/* Submit Button */}
              <button 
                type="submit"
                disabled={emailAvailable === false || isEmailChecking || !Object.values(passwordErrors).every(val => val === true)}
                className="w-full bg-[#8b4fa2] hover:bg-[#724286] text-white py-4 rounded-xl font-bold transition transform hover:scale-105 active:scale-95 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                Create Account
              </button>
            </form>

            {/* Login Link */}
            <div className="text-center pt-6">
              <p className="text-gray-500 text-sm">
                Already have an account?
                <span 
                  onClick={() => navigate("/login-organizer")}
                  className="text-[#8b4fa2] font-bold ml-1 cursor-pointer hover:underline"
                >
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