import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar"; // Make sure the path is correct

// ── Fixed Counter hook ──
const useCounter = (target, duration = 1800) => {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    // Reset count when target changes
    setCount(0);
    
    const steps = 60;
    const increment = target / steps;
    let current = 0;
    let step = 0;
    
    const timer = setInterval(() => {
      step++;
      current += increment;
      
      if (step >= steps) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
    
    return () => clearInterval(timer);
  }, [target, duration]);
  
  return count;
};

// ── Or even simpler version ──
const useCounterSimple = (target, duration = 1800) => {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    let start = 0;
    const stepTime = Math.abs(Math.floor(duration / target));
    
    const timer = setInterval(() => {
      start += 1;
      if (start <= target) {
        setCount(start);
      }
      if (start >= target) {
        clearInterval(timer);
      }
    }, stepTime);
    
    return () => clearInterval(timer);
  }, [target, duration]);
  
  return count;
};

// ── Reusable Components ──
const StatCard = ({ value, suffix = "", label, color }) => {
  const count = useCounterSimple(value);
  return (
    <div className="flex flex-col items-center justify-center p-6 rounded-3xl bg-white shadow-md border border-purple-100">
      <span className="text-4xl font-black mb-1" style={{ color }}>{count}{suffix}</span>
      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest text-center">{label}</span>
    </div>
  );
};

const SectionHeader = ({ title, subtitle, color }) => (
  <div className="text-center mb-14">
    <div className="flex items-center justify-center gap-2 mb-3">
      <div className="w-8 h-1 rounded-full" style={{ background: color }} />
      <span className="text-xs font-black uppercase tracking-widest" style={{ color }}>{subtitle}</span>
      <div className="w-8 h-1 rounded-full" style={{ background: color }} />
    </div>
    <h2 className="text-3xl font-black text-gray-800" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{title}</h2>
  </div>
);

const ValueCard = ({ icon, title, desc, color }) => (
  <div className="bg-white rounded-3xl p-6 text-center group hover:-translate-y-1 transition-all duration-300 shadow-md border border-purple-100">
    <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-transform duration-300 group-hover:scale-110"
      style={{ background: `${color}18` }}>
      <span className="material-symbols-outlined text-[28px]" style={{ color, fontVariationSettings: "'FILL' 1" }}>{icon}</span>
    </div>
    <h4 className="font-black text-gray-800 mb-2">{title}</h4>
    <p className="text-xs text-gray-400 leading-relaxed">{desc}</p>
  </div>
);

// ── Main Component ──
const AboutUs = () => {
  const navigate = useNavigate();

  const stats = [
    { value: 200, suffix: "+", label: "Events Organized", color: "#9B59B6" },
    { value: 1500, suffix: "+", label: "Students Registered", color: "#4ECDC4" },
    { value: 50, suffix: "+", label: "Organizers Active", color: "#FF6B6B" },
    { value: 98, suffix: "%", label: "Satisfaction Rate", color: "#d97706" },
  ];

  const values = [
    { icon: "diversity_3", title: "Inclusivity", desc: "Built for the entire campus community without exception.", color: "#9B59B6" },
    { icon: "bolt", title: "Efficiency", desc: "Fast, automated, and paperless workflows.", color: "#4ECDC4" },
    { icon: "verified", title: "Transparency", desc: "Real-time dashboards keep everyone informed.", color: "#FF6B6B" },
  ];

  return (
    <div className="min-h-screen" style={{ background: "#f7f4fb", fontFamily: "'Manrope', sans-serif" }}>
      {/* Add Navbar at the top */}
      <Navbar />
      
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .anim { animation: fadeSlideUp 0.6s ease both; }
        .anim-1 { animation-delay: 0.1s; }
        .anim-2 { animation-delay: 0.2s; }
        .anim-3 { animation-delay: 0.3s; }
      `}</style>

      {/* ── HERO ── */}
      <div className="relative overflow-hidden" style={{ background: "linear-gradient(135deg, #1A1A1A 0%, #2d1b3d 50%, #0f2d2b 100%)" }}>
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-10 blur-3xl" style={{ background: "#9B59B6" }} />
        <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full opacity-10 blur-3xl" style={{ background: "#4ECDC4" }} />
        
        <div className="relative z-10 max-w-4xl mx-auto px-8 py-28 text-center">
          <div className="anim anim-1 inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 bg-purple-900/30 border border-purple-400/30">
            <div className="w-2 h-2 rounded-full bg-purple-400" />
            <span className="text-xs font-black uppercase tracking-widest text-purple-300">About Eventora</span>
          </div>

          <h1 className="anim anim-2 text-5xl md:text-6xl font-black text-white leading-tight mb-6">
            Where Campus Life{" "}
            <span className="bg-linear-to-r from-purple-500 to-teal-400 bg-clip-text text-transparent">
              Comes Alive
            </span>
          </h1>

          {/* ✨ Inspirational Quote */}
          <div className="anim anim-2 max-w-2xl mx-auto mb-8 p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
            <span className="text-4xl text-purple-400">"</span>
            <p className="text-purple-200 text-lg italic inline px-2">
              Events are the heartbeat of campus culture — where memories are made, connections are forged, and futures begin.
            </p>
            <span className="text-4xl text-purple-400">"</span>
            <p className="text-purple-300 text-sm mt-2">— Eventora Team</p>
          </div>

          <p className="anim anim-3 text-gray-400 text-lg max-w-2xl mx-auto mb-10">
            Eventora is a campus event management portal connecting students, organizers, and administrators — making university life more engaging and organized.
          </p>

          <div className="flex gap-4 justify-center flex-wrap">
            <button onClick={() => navigate("/")} 
              className="px-7 py-3 rounded-2xl text-sm font-black text-white bg-linear-to-r from-purple-600 to-purple-800 hover:shadow-xl hover:-translate-y-0.5 transition-all">
              Explore Events
            </button>
            <button onClick={() => navigate("/student-login")}
              className="px-7 py-3 rounded-2xl text-sm font-black text-white/80 border border-white/20 hover:border-white/40 hover:text-white transition-all">
              Student Login
            </button>
          </div>
        </div>
      </div>

      {/* ── STATS ── */}
      <div className="max-w-5xl mx-auto px-6 -mt-10 relative z-10 mb-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, i) => <StatCard key={i} {...stat} />)}
        </div>
      </div>

      {/* ── MISSION ── */}
      <div className="max-w-4xl mx-auto px-6 mb-24">
        <SectionHeader title="Built for Students, by Students" subtitle="Our Mission" color="#9B59B6" />
        <div className="bg-white rounded-3xl p-8 shadow-md border border-purple-100">
          <div className="flex gap-4 items-start">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 bg-purple-50">
              <span className="material-symbols-outlined text-[#9B59B6]">lightbulb</span>
            </div>
            <p className="text-gray-500 leading-relaxed text-sm">
              University events are the heartbeat of campus culture — but managing them was always messy. 
              Eventora was born as a Final Year Project to fix that. A unified portal where students discover events, 
              organizers manage everything, and administrators have full control. QR attendance, feedback, certificates — 
              designed for real campus needs.
            </p>
          </div>
        </div>
      </div>

      {/* ✨ Additional Quote Section */}
      <div className="max-w-4xl mx-auto px-6 mb-24">
        <div className="bg-linear-to-r from-purple-50 to-teal-50 rounded-3xl p-8 border border-purple-100">
          <div className="text-center">
            <span className="text-5xl text-purple-300">❝</span>
            <p className="text-gray-700 text-lg font-medium italic px-4 py-2">
              The only limit to the height of your achievements is the reach of your dreams and your willingness to work hard for them.
            </p>
            <span className="text-5xl text-purple-300">❞</span>
            <p className="text-purple-600 font-semibold mt-3">— Michelle Obama</p>
          </div>
        </div>
      </div>

      {/* ── VALUES ── */}
      <div className="max-w-5xl mx-auto px-6 mb-24">
        <SectionHeader title="What Drives Us" subtitle="Our Values" color="#FF6B6B" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {values.map((v, i) => <ValueCard key={i} {...v} />)}
        </div>
      </div>

      {/* ── ROLE MODULES ── */}
      <div className="py-20 px-6 mb-10" style={{ background: "linear-gradient(135deg, #1A1A1A 0%, #2d1b3d 100%)" }}>
        <div className="max-w-5xl mx-auto">
          <SectionHeader title="Roles & Portals" subtitle="Platform Modules" color="#FFE66D" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: "Event Management", icon: "calendar_month", color: "#9B59B6" },
              { name: "Student Portal", icon: "school", color: "#4ECDC4" },
              { name: "Organizer Tools", icon: "manage_accounts", color: "#FF6B6B" },
              { name: "Admin Control", icon: "admin_panel_settings", color: "#FFE66D" },
            ].map((role, i) => (
              <div key={i} className="flex flex-col items-center p-6 rounded-3xl bg-white text-center shadow-md">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: `${role.color}18` }}>
                  <span className="material-symbols-outlined text-[32px]" style={{ color: role.color }}>{role.icon}</span>
                </div>
                <p className="font-black text-gray-800 text-sm">{role.name}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── CTA ── */}
      <div className="max-w-4xl mx-auto px-6 pb-24">
        <div className="relative overflow-hidden rounded-4xl p-10 text-center bg-linear-to-r from-purple-600 to-teal-500">
          <div className="absolute -top-10 -right-10 w-44 h-44 rounded-full opacity-15 bg-yellow-300" />
          <div className="relative z-10">
            <h2 className="text-3xl font-black text-white mb-3">Ready to Get Involved?</h2>
            <p className="text-purple-100 text-sm mb-8 max-w-md mx-auto">
              Join thousands of students using Eventora to discover events, earn certificates, and make the most of campus life.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <button onClick={() => navigate("/student-register")}
                className="px-7 py-3 rounded-2xl text-sm font-black text-purple-600 bg-white hover:-translate-y-0.5 hover:shadow-xl transition-all">
                Sign Up as Student
              </button>
              <button onClick={() => navigate("/student-register")}
                className="px-7 py-3 rounded-2xl text-sm font-black text-white border-2 border-white/40 hover:border-white hover:bg-white/10 transition-all">
                Browse Events
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutUs;