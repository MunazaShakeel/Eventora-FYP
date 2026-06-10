import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "../../../components/Navbar";
import campusBanner from "../../../assets/image1.jpg";
import { Eye, EyeOff } from "lucide-react"; // Icons for show/hide password

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

  const handleChange = (e) => {
    const { name, value } = e.target;

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

    // Validation checks
    if (formData.grade === "other" && !otherDepartmentValue.trim()) {
      setError("Please specify your department");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
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

    try {
      setError("");

      let finalDepartment = formData.grade;
      if (formData.grade === "other") {
        finalDepartment = otherDepartmentValue;
      }

      const payload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        department: finalDepartment,
        semester: formData.semester ? Number(formData.semester) : null,
        phone: formData.phone || ""
      };

      console.log("Sending payload:", payload);

      const res = await axios.post(`${API_URL}/students/register`, payload);
      navigate("/student-login");
    } catch (err) {
      console.error("Server response:", err.response?.data);
      setError(err?.response?.data?.message || "Registration failed. Please check all fields.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-linear-to-br from-[#F3E5FF] to-[#FFFFFF]">
      <Navbar />

      <main className="flex-1 flex items-center justify-center p-6 lg:p-16">
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
          <div className="w-full lg:w-1/2 p-8 sm:p-12">
            <h2 className="text-3xl text-center font-bold text-black mb-2">
              Student Registration
            </h2>
            <p className="text-gray-500 mb-6 text-center">
              Create your account to Empower Your Campus Life
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="block mb-2 font-bold text-gray-700">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  placeholder="Enter Full Name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full p-4 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-[#8b4fa2] focus:border-[#8b4fa2] outline-none transition"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label className="block mb-2 font-bold text-gray-700">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  placeholder="Enter Email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full p-4 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-[#8b4fa2] focus:border-[#8b4fa2] outline-none transition"
                  required
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block mb-2 font-bold text-gray-700">
                  Phone (Optional)
                </label>
                <input
                  type="tel"
                  name="phone"
                  placeholder="Enter Phone Number"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full p-4 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-[#8b4fa2] focus:border-[#8b4fa2] outline-none transition"
                />
              </div>

              {/* Grade */}
              <div>
                <label className="block mb-2 font-bold text-gray-700">
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

              {/* Other Department Text Input */}
              {showOtherDepartment && (
                <div>
                  <label className="block mb-2 font-bold text-gray-700">
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

              {/* Semester - Shows for CS, Math, and Other */}
              {showSemester && (
                <div>
                  <label className="block mb-2 font-bold text-gray-700">
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

              {/* Password with Show/Hide */}
              <div>
                <label className="block mb-2 font-bold text-gray-700">
                  Password *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Enter Password (min 6 characters)"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full p-4 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-[#8b4fa2] focus:border-[#8b4fa2] outline-none transition pr-12"
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
                <p className="text-xs text-gray-400 mt-1">Minimum 6 characters</p>
              </div>

              {/* Confirm Password with Show/Hide */}
              <div>
                <label className="block mb-2 font-bold text-gray-700">
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
                      error && error.includes("Passwords") ? "border-red-400" : ""
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
              </div>

              {/* Error Message */}
              {error && (
                <p className="text-red-500 text-sm font-semibold bg-red-50 p-3 rounded-xl">
                  {error}
                </p>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full bg-[#8b4fa2] hover:bg-[#724286] text-white py-4 rounded-xl font-bold transition transform hover:scale-105 active:scale-95 shadow-lg"
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