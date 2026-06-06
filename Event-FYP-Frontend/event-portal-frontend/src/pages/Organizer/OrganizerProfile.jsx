import { useState, useEffect } from "react";
import axios from "axios";
import OrganizerSidebar from "../../components/OrganizerSidebar";
import { Lock } from "lucide-react";

export default function OrganizerProfile() {
  const [form, setForm] = useState({
    name: "", 
    phone: "", 
    department: "", 
    password: "", 
    confirmPassword: ""
  });
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState({ text: "", error: false });
  const [showPassword, setShowPassword] = useState(false);

  // Get API URL from env with fallback
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        
        if (!token) {
          setMsg({ text: "No authentication token found. Please login again.", error: true });
          setLoading(false);
          return;
        }

        const { data } = await axios.get(
          `${API_URL}/organizers/me`,
          { 
            headers: { 
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            } 
          }
        );
        
        setEmail(data.email);
        setForm(f => ({
          ...f,
          name: data.name || "",
          phone: data.phone || "",
          department: data.department || "",
        }));
      } catch (err) {
        console.error("Profile fetch error:", err);
        if (err.response?.status === 401) {
          setMsg({ text: "Session expired. Please login again.", error: true });
        } else if (err.response?.status === 404) {
          setMsg({ text: "API endpoint not found. Please check backend server.", error: true });
        } else {
          setMsg({ text: err.response?.data?.message || "Failed to load profile", error: true });
        }
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [API_URL]);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (form.password && form.password !== form.confirmPassword) {
      setMsg({ text: "Passwords do not match!", error: true });
      setTimeout(() => setMsg({ text: "", error: false }), 3000);
      return;
    }
    
    try {
      const token = localStorage.getItem("token");
      const payload = {
        name: form.name,
        phone: form.phone,
        department: form.department,
      };
      if (form.password) payload.password = form.password;

      await axios.put(
        `${API_URL}/organizers/me`,
        payload,
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          } 
        }
      );
      
      setMsg({ text: "Profile updated successfully!", error: false });
      setForm(f => ({ ...f, password: "", confirmPassword: "" }));
      setShowPassword(false);
    } catch (err) {
      setMsg({ text: err.response?.data?.message || "Update failed", error: true });
    }
    
    setTimeout(() => setMsg({ text: "", error: false }), 3000);
  };

  const getInitials = () => {
    if (!form.name) return "?";
    const nameParts = form.name.trim().split(" ");
    if (nameParts.length === 1) return nameParts[0].charAt(0).toUpperCase();
    return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[#f8f3fd]">
        <OrganizerSidebar />
        <div className="md:ml-64 flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-purple-200 border-t-[#8b4fa2] rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#f8f3fd] font-sans text-[#1A1A1A]">
      <OrganizerSidebar />
      <main className="md:ml-64 flex-1 pb-20 px-6 md:px-10 pt-10 flex justify-center">
        <div className="w-full max-w-4xl">
          {/* Error/Success Messages */}
          {msg.text && (
            <div className={`mb-6 border-l-4 p-4 rounded-xl text-sm font-semibold ${
              msg.error 
                ? "bg-red-50 border-red-500 text-red-600" 
                : "bg-green-50 border-green-500 text-green-600"
            }`}>
              {msg.text}
            </div>
          )}

          {/* Header */}
          <div className="mb-10 text-center">
            <h1 className="text-5xl font-extrabold mb-3">
              My <span className="text-[#8b4fa2]">Profile</span>
            </h1>
            <p className="text-gray-600 text-lg">
              Manage your account information and settings
            </p>
          </div>

          {/* Card */}
          <div className="bg-white border-8 border-yellow-400 rounded-2xl shadow-lg overflow-hidden">
            <form onSubmit={handleSubmit} className="p-8 md:p-12 space-y-10">
              
              {/* Avatar Section */}
              <div className="flex flex-col items-center space-y-4">
                <div className="w-24 h-24 rounded-full bg-linear-to-br from-purple-100 to-purple-200 flex items-center justify-center text-purple-600 text-2xl font-bold border-4 border-[#8b4fa2] shadow-md">
                  {getInitials()}
                </div>
                <div className="text-center">
                  <p className="font-medium text-gray-800">{form.name || "Organizer"}</p>
                  <p className="text-sm text-gray-500">Organizer</p>
                </div>
              </div>

              {/* Form Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Name */}
                <div className="md:col-span-2">
                  <label className="font-bold text-gray-700">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    className="w-full mt-2 px-4 py-3 rounded-xl border-2 border-gray-300 bg-white focus:ring-2 focus:ring-[#8b4fa2] focus:border-[#8b4fa2] outline-none transition"
                    required
                  />
                </div>

                {/* Email - Read Only */}
                <div className="md:col-span-2">
                  <label className="font-bold text-gray-700">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    disabled
                    className="w-full mt-2 px-4 py-3 rounded-xl border-2 border-gray-300 bg-gray-100 text-gray-500 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
                </div>

                {/* Phone */}
                <div>
                  <label className="font-bold text-gray-700">Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="Enter your phone number"
                    className="w-full mt-2 px-4 py-3 rounded-xl border-2 border-gray-300 bg-white focus:ring-2 focus:ring-[#8b4fa2] focus:border-[#8b4fa2] outline-none transition"
                  />
                </div>

                {/* Department */}
                <div>
                  <label className="font-bold text-gray-700">Department</label>
                  <input
                    type="text"
                    name="department"
                    value={form.department}
                    onChange={handleChange}
                    placeholder="e.g., Computer Science"
                    className="w-full mt-2 px-4 py-3 rounded-xl border-2 border-gray-300 bg-white focus:ring-2 focus:ring-[#8b4fa2] focus:border-[#8b4fa2] outline-none transition"
                  />
                </div>

              </div>

              {/* Password Change Section */}
              <div className="space-y-4 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="flex items-center gap-2 text-sm font-semibold text-[#8b4fa2] hover:text-[#724286] transition"
                >
                  <Lock size={16} />
                  {showPassword ? "Cancel password change" : "Change password"}
                </button>

                {showPassword && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 animate-fadeIn">
                    <div>
                      <label className="font-bold text-gray-700 text-sm">New Password</label>
                      <input
                        type="password"
                        name="password"
                        value={form.password}
                        onChange={handleChange}
                        placeholder="Enter new password"
                        className="w-full mt-2 px-4 py-3 rounded-xl border-2 border-gray-300 bg-white focus:ring-2 focus:ring-[#8b4fa2] focus:border-[#8b4fa2] outline-none transition"
                      />
                      <p className="text-xs text-gray-400 mt-1">Minimum 6 characters</p>
                    </div>
                    <div>
                      <label className="font-bold text-gray-700 text-sm">Confirm Password</label>
                      <input
                        type="password"
                        name="confirmPassword"
                        value={form.confirmPassword}
                        onChange={handleChange}
                        placeholder="Confirm new password"
                        className="w-full mt-2 px-4 py-3 rounded-xl border-2 border-gray-300 bg-white focus:ring-2 focus:ring-[#8b4fa2] focus:border-[#8b4fa2] outline-none transition"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-4 pt-8 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setForm(f => ({ ...f, password: "", confirmPassword: "" }));
                    setShowPassword(false);
                  }}
                  className="px-6 py-3 border border-gray-300 rounded-xl font-semibold text-gray-600 hover:bg-gray-100 hover:border-gray-400 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-10 py-3 rounded-xl text-white font-bold shadow-lg bg-[#8b4fa2] hover:bg-[#724286] transition transform hover:scale-105 active:scale-95"
                >
                  Save Changes
                </button>
              </div>

            </form>
          </div>

          {/* Info Card */}
          <div className="mt-6 p-4 bg-linear-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100">
            <div className="flex items-start gap-3">
              <span className="text-xl">💡</span>
              <div>
                <p className="text-sm font-semibold text-gray-700">Quick Tips:</p>
                <p className="text-xs text-gray-600 mt-1">
                  Keep your profile information up to date. Your department and contact details help 
                  students and other organizers connect with you easily for event coordination.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}