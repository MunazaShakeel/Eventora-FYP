import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "../../../components/Navbar";
import campusBanner from "../../../assets/image1.jpg";
import { Eye, EyeOff, CheckCircle, XCircle, AlertCircle } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const Register = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    grade: "",
    semester: "",
    phone: "",
    password: "",
    confirmPassword: ""
  });

  const [error, setError] = useState("");
  const [showSemester, setShowSemester] = useState(false);
  const [showOtherDepartment, setShowOtherDepartment] = useState(false);
  const [otherDepartmentValue, setOtherDepartmentValue] = useState("");
  
  // Password show/hide states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Phone validation state
  const [phoneError, setPhoneError] = useState("");
  
  // Name validation state
  const [nameError, setNameError] = useState("");
  const [nameTouched, setNameTouched] = useState(false);
  // Password validation states
  const [passwordErrors, setPasswordErrors] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false
  });
  const [passwordTouched, setPasswordTouched] = useState(false);
  
  // Email validation state
  const [emailError, setEmailError] = useState("");
  const [isEmailChecking, setIsEmailChecking] = useState(false);
  const [emailAvailable, setEmailAvailable] = useState(null);
  const [emailTouched, setEmailTouched] = useState(false);

  // Name validation function
  const validateName = (name) => {
    if (!name.trim())//check if the name is empty or only whitespace
       {
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
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
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
      const studentRes = await axios.get(`${API_URL}/students/check-email?email=${email}`);
      const organizerRes = await axios.get(`${API_URL}/organizers/check-email?email=${email}`);
      const adminRes = await axios.get(`${API_URL}/admins/check-email?email=${email}`);

      if (studentRes.data.exists || organizerRes.data.exists || adminRes.data.exists)
        {
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

    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));

    if (name === "grade") {
      if (value === "cs" || value === "math") {
        setShowSemester(true);
        setShowOtherDepartment(false);
      } else if (value === "other") {
        setShowOtherDepartment(true);
        setShowSemester(true);
        setFormData((prev) => ({ ...prev, semester: "" }));
      } else {
        setShowSemester(false);
        setShowOtherDepartment(false);
        setFormData((prev) => ({ ...prev, semester: "" }));
      }
    }
  };

  const handleOtherDepartmentChange = (e) => {
    setOtherDepartmentValue(e.target.value);
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  // Validate name
  if (!validateName(formData.name)) {
    setError("Please enter a valid full name");
    return;
  }

  if (formData.grade === "other" && !otherDepartmentValue.trim()) {
    setError("Please specify your department");
    return;
  }

  const isPasswordValid = validatePassword(formData.password);
  if (!isPasswordValid) {
    setError("Password must meet all the requirements shown below");
    return;
  }

  if (formData.password !== formData.confirmPassword) {
    setError("Passwords do not match");
    return;
  }

  if (emailAvailable === false) {
    setError("This email is already registered. Please use a different email.");
    return;
  }

  if (showSemester && !formData.semester) {
    setError("Please select your semester");
    return;
  }

  if (!formData.name || !formData.email || !formData.grade) {
    setError("Please fill all required fields");
    return;
  }

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
    setError("");

    //Department ko properly set karo
    let finalDepartment = "";
    
    if (formData.grade === "other") {
      // Custom department
      finalDepartment = otherDepartmentValue.trim();
    } else if (formData.grade === "cs") {
      finalDepartment = "Computer Science";
    } else if (formData.grade === "math") {
      finalDepartment = "Mathematics";
    } else if (formData.grade === "hssc1") {
      finalDepartment = "HSSC I";
    } else if (formData.grade === "hssc2") {
      finalDepartment = "HSSC II";
    } else if (formData.grade === "10") {
      finalDepartment = "Grade 10";
    } else if (formData.grade === "9") {
      finalDepartment = "Grade 9";
    } else if (formData.grade === "8") {
      finalDepartment = "Grade 8";
    } else if (formData.grade === "7") {
      finalDepartment = "Grade 7";
    } else if (formData.grade === "6") {
      finalDepartment = "Grade 6";
    } else if (formData.grade === "5") {
      finalDepartment = "Grade 5";
    } else {
      finalDepartment = formData.grade; // fallback
    }

    const payload = {
      name: formData.name.trim(),
      email: formData.email,
      password: formData.password,
      department: finalDepartment,  // Department set karo
      grade: finalDepartment,       //Grade bhi set karo
      semester: formData.semester ? Number(formData.semester) : null,
      phone: formData.phone || ""
    };

    console.log("Sending payload:", payload);

    const res = await axios.post(`${API_URL}/students/register`, payload);
    navigate("/student-login");
  } catch (err) {
    console.error("Server response:", err.response?.data);
    
    if (err.response?.data?.message?.includes("email already exists")) {
      setError("This email is already registered. Please login or use a different email.");
    } else {
      setError(err?.response?.data?.message || "Registration failed. Please check all fields.");
    }
  }
};


  const getPasswordStrength = () => {
    const validCount = Object.values(passwordErrors).filter(val => val === true).length;
    if (validCount === 5) return { text: "Strong", color: "text-green-600", bg: "bg-green-100" };
    if (validCount >= 3) return { text: "Medium", color: "text-yellow-600", bg: "bg-yellow-100" };
    if (validCount >= 1) return { text: "Weak", color: "text-red-600", bg: "bg-red-100" };
    return { text: "", color: "", bg: "" };
  };

  const strength = getPasswordStrength();

  return (
    <div className="min-h-screen flex flex-col bg-linear-to-br from-[#F3E5FF] to-[#FFFFFF]">
      <Navbar />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-16">
        <div className="w-full max-w-5xl mx-auto bg-white rounded-2xl shadow-2xl flex overflow-hidden">
          {/* LEFT SIDE */}
          <div className="hidden lg:flex w-1/2 relative">
            <img
              src={campusBanner}
              alt="Campus"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-linear-to-br from-[#9B59B6]/90 to-[#4ECDC4]/90" />
            <div className="relative z-10 text-white text-center p-10 flex flex-col justify-center">
              <h2 className="text-5xl font-extrabold mb-4">
                Empower Your Campus Life
              </h2>
              <p className="text-white/90 text-lg mb-8">
                Join the most vibrant student community. Register now to manage
                and discover upcoming college events effortlessly.
              </p>
            </div>
          </div>

          {/* RIGHT SIDE */}
          <div className="w-full lg:w-1/2 p-6 sm:p-8 lg:p-12 overflow-y-auto max-h-[90vh] lg:max-h-full">
            <h2 className="text-3xl text-center font-bold text-black mb-2">
              Student Registration
            </h2>
            <p className="text-gray-500 mb-6 text-center text-sm">
              Create your account to Empower Your Campus Life
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
                    className={`w-full p-4 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-[#8b4fa2] focus:border-[#8b4fa2] outline-none transition pr-10 ${
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
                    className={`w-full p-4 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-[#8b4fa2] focus:border-[#8b4fa2] outline-none transition pr-12 ${
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

              {/* Phone */}
              <div>
                <label className="block mb-2 font-bold text-gray-700 text-sm">
                  Phone (Optional)
                </label>
                <input
                  type="tel"
                  name="phone"
                  placeholder="03XXXXXXXXX (11 digits)"
                  value={formData.phone}
                  onChange={handleChange}
                  className={`w-full p-4 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-[#8b4fa2] focus:border-[#8b4fa2] outline-none transition ${
                    phoneError ? "border-red-400 focus:ring-red-400" : ""
                  }`}
                  maxLength={11}
                />
                {phoneError && (
                  <p className="text-red-500 text-xs font-semibold mt-1">
                    {phoneError}
                  </p>
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

              {/* Grade */}
              <div>
                <label className="block mb-2 font-bold text-gray-700 text-sm">
                  Grade/Department *
                </label>
                <select
                  name="grade"
                  value={formData.grade}
                  onChange={handleChange}
                  className="w-full p-4 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-[#8b4fa2] focus:border-[#8b4fa2] outline-none transition"
                  required
                >
                  <option value="">Select Grade</option>
                  <option value="cs">Computer Science</option>
                  <option value="math">Mathematics</option>
                  <option value="hssc1">HSSC I</option>
                  <option value="hssc2">HSSC II</option>
                  <option value="10">10 Grade</option>
                  <option value="9">9 Grade</option>
                  <option value="8">8 Grade</option>
                  <option value="7">7 Grade</option>
                  <option value="6">6 Grade</option>
                  <option value="5">5 Grade</option>
                  <option value="other">Other Department</option>
                </select>
              </div>

              {/* Other Department */}
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

              {/* Semester */}
              {showSemester && (
                <div>
                  <label className="block mb-2 font-bold text-gray-700 text-sm">
                    Semester *
                  </label>
                  <select
                    name="semester"
                    value={formData.semester}
                    onChange={handleChange}
                    className="w-full p-4 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-[#8b4fa2] focus:border-[#8b4fa2] outline-none transition"
                    required={showSemester}
                  >
                    <option value="">Select Semester</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                      <option key={num} value={num}>{num}</option>
                    ))}
                  </select>
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
                    className={`w-full p-4 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-[#8b4fa2] focus:border-[#8b4fa2] outline-none transition pr-12 ${
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
                      <p className={`text-xs flex items-center gap-1.5 ${passwordErrors.lowercase ? "text-green-600" : "text-gray-400"}`}>
                        {passwordErrors.lowercase ? <CheckCircle size={12} /> : <XCircle size={12} />}
                        At least one lowercase letter (a-z)
                      </p>
                      <p className={`text-xs flex items-center gap-1.5 ${passwordErrors.number ? "text-green-600" : "text-gray-400"}`}>
                        {passwordErrors.number ? <CheckCircle size={12} /> : <XCircle size={12} />}
                        At least one number (0-9)
                      </p>
                      <p className={`text-xs flex items-center gap-1.5 ${passwordErrors.special ? "text-green-600" : "text-gray-400"}`}>
                        {passwordErrors.special ? <CheckCircle size={12} /> : <XCircle size={12} />}
                        At least one special character (!@#$%^&*)
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
                    className={`w-full p-4 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-[#8b4fa2] focus:border-[#8b4fa2] outline-none transition pr-12 ${
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
                <Link
                  to="/student-login"
                  className="text-[#8b4fa2] font-bold ml-1 cursor-pointer hover:underline"
                >
                  Login here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Register;