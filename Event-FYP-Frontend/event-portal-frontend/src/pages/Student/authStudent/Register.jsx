
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "../../../components/Navbar";
import campusBanner from "../../../assets/image1.jpg";

const Register = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    grade: "",
    semester: "",
    password: "",
    confirmPassword: ""
  });

  const [error, setError] = useState("");
  const [showSemester, setShowSemester] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));

    if (name === "grade") {
      if (value === "cs" || value === "math") {
        setShowSemester(true);
      } else {
        setShowSemester(false);
        setFormData((prev) => ({ ...prev, semester: "" }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      setError("");

      const payload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        department: formData.grade,
        semester: formData.semester ? Number(formData.semester) : undefined,
        phone: ""
      };

      const res = await axios.post(
        "http://localhost:5000/api/students/register",
        payload
      );

      navigate("/student-login");
    } catch (err) {
      setError(err?.response?.data?.message || "Registration failed");
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

            <div className="absolute inset-0 bg-linear-to-br from-[#9B59B6]/90 to-[#4ECDC4]//90" />

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


          <div className="w-full lg:w-1/2 p-8 sm:p-12">
            <h2 className="text-3xl text-center font-bold text-black mb-2">
              Student Registration
            </h2>

            <p className="text-gray-500 mb-6 text-center">
              Create your account to Empower Your Campus Life
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block mb-2 font-bold text-gray-700">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  placeholder="Enter Full Name"
                  onChange={handleChange}
                  className="w-full p-4 bg-slate-50 border rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block mb-2 font-bold text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  placeholder="Enter Email"
                  onChange={handleChange}
                  className="w-full p-4 bg-slate-50 border rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block mb-2 font-bold text-gray-700">
                  Grade
                </label>
                <select
                  name="grade"
                  onChange={handleChange}
                  className="w-full p-4 bg-slate-50 border rounded-xl"
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
                </select>
              </div>

              {showSemester && (
                <div>
                  <label className="block mb-2 font-bold text-gray-700">
                    Semester
                  </label>
                  <select
                    name="semester"
                    onChange={handleChange}
                    className="w-full p-4 bg-slate-50 border rounded-xl"
                    required
                  >
                    <option value="">Select Semester</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5">5</option>
                    <option value="6">6</option>
                    <option value="7">7</option>
                    <option value="8">8</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block mb-2 font-bold text-gray-700">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  placeholder="Enter Password"
                  onChange={handleChange}
                  className="w-full p-4 bg-slate-50 border rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block mb-2 font-bold text-gray-700">
                  Confirm Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Re-enter Password"
                  onChange={handleChange}
                  className={`w-full p-4 bg-slate-50 border rounded-xl ${
                    error ? "border-red-400" : ""
                  }`}
                  required
                />
              </div>

              {error && (
                <p className="text-red-500 text-sm font-semibold">{error}</p>
              )}

              <button
                type="submit"
                className="w-full bg-[#8b4fa2] hover:bg-[#724286] text-white py-4 rounded-xl font-bold"
              >
                Create Account
              </button>
            </form>

            <div className="text-center pt-6">
              <p className=" text-gray-500 text-sm">
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
