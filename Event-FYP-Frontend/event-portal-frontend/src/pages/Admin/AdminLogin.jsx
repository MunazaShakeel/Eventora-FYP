import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";
import { useAuth } from "../../context/AuthContext";  // ✅ ADD

const AdminLogin = () => {
  const navigate = useNavigate();
  const { login } = useAuth();  // ✅ ADD

  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setError("");

      const res = await axios.post(
        "http://localhost:5000/api/admin/login",
        formData
      );
      login(res.data.token); 
  

      navigate("/admin-dashboard");
    } catch (err) {
      setError(err?.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-linear-to-br from-[#F3E5FF] to-[#FFFFFF]">

      <Navbar />

      <main className="flex-1 flex items-center justify-center p-6">

        {/* Center Card */}
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-10">

          <h2 className="text-3xl text-center font-bold text-black mb-2">
            Admin Login
          </h2>

          <p className="text-gray-500 mb-8 text-center">
            Restricted access — Admins only
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Email */}
            <div>
              <label className="block mb-2 font-semibold text-gray-700">
                Email
              </label>
              <input
                type="email"
                name="email"
                placeholder="Enter Admin Email"
                onChange={handleChange}
                className="w-full p-4 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-[#8b4fa2] outline-none transition"
                required
              />
            </div>

            {/* Password */}
            <div>
              <label className="block mb-2 font-semibold text-gray-700">
                Password
              </label>
              <input
                type="password"
                name="password"
                placeholder="Enter Password"
                onChange={handleChange}
                className={`w-full p-4 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-[#8b4fa2] outline-none transition ${
                  error ? "border-red-400" : ""
                }`}
                required
              />
            </div>

            {error && (
              <p className="text-red-500 text-sm font-semibold">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="w-full bg-[#8b4fa2] hover:bg-[#724286] text-white py-4 rounded-xl font-bold transition duration-300"
            >
              Login as Admin
            </button>
          </form>

        </div>
      </main>
    </div>
  );
};

export default AdminLogin;