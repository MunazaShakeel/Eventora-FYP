import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "../../../components/Navbar";
import { useAuth } from "../../../context/AuthContext";  // ✅ ADD

const OrganizerLogin = () => {
  const navigate = useNavigate();
  const { login } = useAuth();  // ✅ ADD

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); //stop page from refreshing on submit
    try {
      setError("");
      const res = await axios.post("http://localhost:5000/api/organizers/login", formData);
      login(res.data.token);  //
      navigate("/organizer-dashboard");
    } catch (err) {
      setError(err?.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-linear-to-br from-[#F3E5FF] to-[#FFFFFF]">
      <Navbar />

      <main className="flex-1 flex items-center justify-center p-6 lg:p-16">
        <div className="w-full max-w-5xl mx-auto bg-white rounded-2xl shadow-2xl flex overflow-hidden">

          {/* LEFT SIDE — SVG Illustration */}
          <div className="hidden lg:flex w-1/2 bg-linear-to-br from-[#4ECDC4] to-[#9B59B6] flex-col items-center justify-center p-10">

            <svg viewBox="0 0 400 380" xmlns="http://www.w3.org/2000/svg" className="w-full max-w-xs mb-8">
              <circle cx="200" cy="190" r="150" fill="rgba(255,255,255,0.08)" />
              <circle cx="200" cy="190" r="110" fill="rgba(255,255,255,0.08)" />

              {/* Calendar */}
              <rect x="100" y="80" width="200" height="180" rx="16" fill="white" opacity="0.95" />
              <rect x="100" y="80" width="200" height="50" rx="16" fill="#4ECDC4" />
              <rect x="100" y="110" width="200" height="20" rx="0" fill="#4ECDC4" />

              {/* Calendar header dots */}
              <circle cx="140" cy="70" r="8" fill="#9B59B6" />
              <circle cx="260" cy="70" r="8" fill="#9B59B6" />
              <rect x="136" y="58" width="4" height="24" rx="2" fill="#9B59B6" />
              <rect x="256" y="58" width="4" height="24" rx="2" fill="#9B59B6" />

              {/* Calendar title */}
              <rect x="155" y="92" width="90" height="10" rx="5" fill="white" opacity="0.9" />

              {/* Calendar grid */}
              {[0, 1, 2, 3, 4, 5, 6].map((col) => (
                <rect key={col} x={115 + col * 26} y="148" width="14" height="8" rx="3" fill="#1A1A1A" opacity="0.12" />
              ))}
              {[0, 1, 2, 3, 4, 5, 6].map((col) => (
                <rect key={col} x={115 + col * 26} y="166" width="14" height="8" rx="3"
                  fill={col === 2 ? "#FF6B6B" : col === 4 ? "#9B59B6" : "#1A1A1A"}
                  opacity={col === 2 || col === 4 ? 1 : 0.12} />
              ))}
              {[0, 1, 2, 3, 4, 5, 6].map((col) => (
                <rect key={col} x={115 + col * 26} y="184" width="14" height="8" rx="3"
                  fill={col === 0 ? "#FFE66D" : "#1A1A1A"} opacity={col === 0 ? 1 : 0.12} />
              ))}
              {[0, 1, 2, 3].map((col) => (
                <rect key={col} x={115 + col * 26} y="202" width="14" height="8" rx="3" fill="#1A1A1A" opacity="0.12" />
              ))}

              {/* Star highlight on selected day */}
              <circle cx="148" cy="170" r="12" fill="#FF6B6B" opacity="0.2" />
              <text x="144" y="174" fontSize="10" fill="#FF6B6B" fontWeight="bold">★</text>

              {/* Person */}
              <circle cx="320" cy="160" r="26" fill="#FFE66D" />
              <circle cx="320" cy="148" r="13" fill="#FF6B6B" />
              <path d="M296 185 Q320 170 344 185" fill="#FF6B6B" />

              {/* Tick badge */}
              <circle cx="338" cy="140" r="10" fill="#4ECDC4" />
              <polyline points="333,140 337,144 344,136" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

              {/* Confetti */}
              {[[120, 300], [170, 320], [220, 308], [270, 325], [310, 300]].map(([cx, cy], i) => (
                <circle key={i} cx={cx} cy={cy} r="6"
                  fill={["#FFE66D", "#FF6B6B", "#4ECDC4", "#9B59B6", "#FFE66D"][i]} opacity="0.75" />
              ))}

              {/* Sparkles */}
              {[[80, 100], [340, 120], [75, 260], [345, 270]].map(([cx, cy], i) => (
                <circle key={i} cx={cx} cy={cy} r="4" fill="white" opacity="0.35" />
              ))}
            </svg>

            <div className="text-white text-center">
              <h2 className="text-4xl font-extrabold mb-3">Welcome Back!</h2>
              <p className="text-white/85 text-base">
                Login to manage your events, tasks, and volunteers all in one place.
              </p>
            </div>
          </div>

          {/* RIGHT SIDE — Form */}
          <div className="w-full lg:w-1/2 p-8 sm:p-12 flex flex-col justify-center">
            <h2 className="text-3xl text-center font-bold text-black mb-2">
              Organizer Login
            </h2>
            <p className="text-gray-500 mb-8 text-center">
              Welcome back! Login to manage your events
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block mb-2 font-bold text-gray-700">Email</label>
                <input type="email" name="email" placeholder="Enter Email" onChange={handleChange}
                  className="w-full p-4 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-[#8b4fa2] outline-none transition" required />
              </div>

              <div>
                <label className="block mb-2 font-bold text-gray-700">Password</label>
                <input type="password" name="password" placeholder="Enter Password" onChange={handleChange}
                  className={`w-full p-4 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-[#8b4fa2] outline-none transition ${error ? "border-red-400" : ""}`}
                  required />
              </div>

              {error && <p className="text-red-500 text-sm font-semibold">{error}</p>}

              <button type="submit"
                className="w-full bg-[#8b4fa2] hover:bg-[#724286] text-white py-4 rounded-xl font-bold transition duration-300">
                Login
              </button>
            </form>

            <div className="text-center pt-6">
              <p className="text-gray-500 text-sm">
                Don't have an account?
                <span onClick={() => navigate("/register-organizer")}
                  className="text-[#8b4fa2] font-bold ml-1 cursor-pointer hover:underline">
                  Register here
                </span>
              </p>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default OrganizerLogin;
