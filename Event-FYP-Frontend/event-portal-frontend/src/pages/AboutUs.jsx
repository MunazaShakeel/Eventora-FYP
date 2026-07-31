import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

// ── Counter hook ──
const useCounterSimple = (target, duration = 1800) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const stepTime = Math.max(1, Math.abs(Math.floor(duration / target)));

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

// ── Scroll reveal hook ──
const useRevealOnScroll = () => {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) {
      setVisible(true);
      return;
    }

    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return [ref, visible];
};

// ── Reusable Components ──
const StatCard = ({ value, suffix = "", label, color }) => {
  const count = useCounterSimple(value);
  return (
    <div className="flex flex-col items-center justify-center p-6 rounded-3xl bg-white shadow-md border border-purple-100">
      <span className="text-4xl font-black mb-1" style={{ color }}>
        {count}
        {suffix}
      </span>
      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest text-center">
        {label}
      </span>
    </div>
  );
};

const SectionHeader = ({ title, subtitle, color }) => (
  <div className="text-center mb-14">
    <div className="flex items-center justify-center gap-2 mb-3">
      <div className="w-8 h-1 rounded-full" style={{ background: color }} />
      <span
        className="text-xs font-black uppercase tracking-widest"
        style={{ color }}
      >
        {subtitle}
      </span>
      <div className="w-8 h-1 rounded-full" style={{ background: color }} />
    </div>
    <h2
      className="text-3xl font-black text-gray-800"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      {title}
    </h2>
  </div>
);

const ValueCard = ({ icon, title, desc, color }) => (
  <div className="bg-white rounded-3xl p-6 text-center group hover:-translate-y-1 transition-all duration-300 shadow-md border border-purple-100">
    <div
      className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-transform duration-300 group-hover:scale-110"
      style={{ background: `${color}18` }}
    >
      <span
        className="material-symbols-outlined text-[28px]"
        style={{ color, fontVariationSettings: "'FILL' 1" }}
      >
        {icon}
      </span>
    </div>
    <h4 className="font-black text-gray-800 mb-2">{title}</h4>
    <p className="text-xs text-gray-400 leading-relaxed">{desc}</p>
  </div>
);

// Small card used in the System Modules grid (documentation-accurate module names)
const ModuleCard = ({ icon, name, color }) => (
  <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300">
    <div
      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
      style={{ background: `${color}22` }}
    >
      <span
        className="material-symbols-outlined text-[20px]"
        style={{ color }}
      >
        {icon}
      </span>
    </div>
    <p className="text-sm font-bold text-white/90 leading-snug">{name}</p>
  </div>
);

// Wrapper that applies the scroll-reveal animation to any section
const Reveal = ({ children, className = "" }) => {
  const [ref, visible] = useRevealOnScroll();
  return (
    <div
      ref={ref}
      className={`${className} transition-all duration-700 ease-out ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
    >
      {children}
    </div>
  );
};

// ── Main Component ──
const AboutUs = () => {
  const navigate = useNavigate();

  const stats = [
    { value: 200, suffix: "+", label: "Events Organized", color: "#8b4fa2" },
    { value: 1500, suffix: "+", label: "Students Registered", color: "#4ECDC4" },
    { value: 98, suffix: "%", label: "Satisfaction Rate", color: "#d97706" },
  ];

  const values = [
    {
      icon: "diversity_3",
      title: "Inclusivity",
      desc: "Built for the entire college community without exception.",
      color: "#8b4fa2",
    },
    {
      icon: "bolt",
      title: "Efficiency",
      desc: "Fast, automated, and paperless workflows for college events.",
      color: "#4ECDC4",
    },
    {
      icon: "verified",
      title: "Transparency",
      desc: "Real-time dashboards keep everyone in the college informed.",
      color: "#FF6B6B",
    },
  ];

  // Documentation-accurate system modules (matches FYP report exactly)
  const systemModules = [
    { name: "User Management", icon: "manage_accounts", color: "#8b4fa2" },
    { name: "Event Management", icon: "calendar_month", color: "#4ECDC4" },
    { name: "Task Management", icon: "checklist", color: "#FF6B6B" },
    { name: "Attendance Management", icon: "qr_code_scanner", color: "#FFE66D" },
    { name: "Certificate Management", icon: "workspace_premium", color: "#8b4fa2" },
    { name: "Feedback Management", icon: "reviews", color: "#4ECDC4" },
    { name: "Gallery Management", icon: "photo_library", color: "#FF6B6B" },
    { name: "Reporting & Dashboard", icon: "insights", color: "#FFE66D" },
  ];

  return (
    <div
      className="min-h-screen"
      style={{
        background: "#f7f4fb",
        fontFamily: "'Manrope', sans-serif",
      }}
    >
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

        @media (prefers-reduced-motion: reduce) {
          .anim { animation: none; opacity: 1; transform: none; }
        }
      `}</style>

      {/* ── HERO ── */}
      <div
        className="relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, #1A1A1A 0%, #2d1b3d 50%, #0f2d2b 100%)",
        }}
      >
        <div
          className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-10 blur-3xl"
          style={{ background: "#8b4fa2" }}
        />
        <div
          className="absolute bottom-0 left-0 w-72 h-72 rounded-full opacity-10 blur-3xl"
          style={{ background: "#4ECDC4" }}
        />

        <div className="relative z-10 max-w-4xl mx-auto px-8 py-28 text-center">
          <div className="anim anim-1 inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 bg-purple-900/30 border border-purple-400/30">
            <div className="w-2 h-2 rounded-full bg-purple-400" />
            <span className="text-xs font-black uppercase tracking-widest text-purple-300">
              About Eventora
            </span>
          </div>

          <h1 className="anim anim-2 text-5xl md:text-6xl font-black text-white leading-tight mb-6">
            Where College Life{" "}
            <span className="bg-linear-to-r from-purple-500 to-teal-400 bg-clip-text text-transparent">
              Comes Alive
            </span>
          </h1>

          <div className="anim anim-2 max-w-2xl mx-auto mb-8 p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
            <span className="text-4xl text-purple-400">"</span>
            <p className="text-purple-200 text-lg italic inline px-2">
              Events are the heartbeat of college culture — where memories are
              made, connections are forged, and futures begin.
            </p>
            <span className="text-4xl text-purple-400">"</span>
            <p className="text-purple-300 text-sm mt-2">— Eventora Team</p>
          </div>

          <p className="anim anim-3 text-gray-400 text-lg max-w-2xl mx-auto mb-10">
            Eventora is a college event management portal connecting students,
            organizers, and administrators — making college life more engaging
            and organized.
          </p>

          <div className="flex gap-4 justify-center flex-wrap">
            <button
              onClick={() => navigate("/")}
              className="px-7 py-3 rounded-2xl text-sm font-black text-white bg-linear-to-r from-purple-600 to-purple-800 hover:shadow-xl hover:-translate-y-0.5 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1A1A1A]"
            >
              Explore Events
            </button>
            <button
              onClick={() => navigate("/student-login")}
              className="px-7 py-3 rounded-2xl text-sm font-black text-white/80 border border-white/20 hover:border-white/40 hover:text-white transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1A1A1A]"
            >
              Student Login
            </button>
          </div>
        </div>
      </div>

      {/* ── STATS ── */}
      <Reveal className="max-w-4xl mx-auto px-6 -mt-10 relative z-10 mb-20">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {stats.map((stat, i) => (
            <StatCard key={i} {...stat} />
          ))}
        </div>
      </Reveal>

      {/* ── MISSION ── */}
      <Reveal className="max-w-4xl mx-auto px-6 mb-24">
        <SectionHeader
          title="Built for Students, by Students"
          subtitle="Our Mission"
          color="#8b4fa2"
        />
        <div className="bg-white rounded-3xl p-8 shadow-md border border-purple-100">
          <div className="flex gap-4 items-start">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 bg-purple-50">
              <span className="material-symbols-outlined text-[#8b4fa2]">
                lightbulb
              </span>
            </div>
            <p className="text-gray-500 leading-relaxed text-sm">
              College events are the heartbeat of college culture — but
              managing them was always messy. Eventora was born as a Final
              Year Project to fix that. A unified portal where students
              discover events, organizers manage everything, and
              administrators have full control. QR attendance, feedback,
              certificates — designed for real college needs.
            </p>
          </div>
        </div>
      </Reveal>

  

      {/* ── VALUES ── */}
      <Reveal className="max-w-5xl mx-auto px-6 mb-24">
        <SectionHeader title="What Drives Us" subtitle="Our Values" color="#FF6B6B" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {values.map((v, i) => (
            <ValueCard key={i} {...v} />
          ))}
        </div>
      </Reveal>

      {/* ── ROLE MODULES ── */}
      <Reveal className="relative py-20 px-6 mb-10 overflow-hidden">
        <div
          className="absolute inset-0 -z-10"
          style={{
            background: "linear-gradient(135deg, #1A1A1A 0%, #2d1b3d 100%)",
          }}
        />
        <div className="max-w-5xl mx-auto">
          <SectionHeader
          
            subtitle="Roles"
            color="#FFE66D"
          />
          <div className="grid md:grid-cols-3 gap-4">
            {[
         
              { name: "Student Portal", icon: "school", color: "#4ECDC4" },
              { name: "Organizer Tools", icon: "manage_accounts", color: "#FF6B6B" },
              { name: "Admin Control", icon: "admin_panel_settings", color: "#FFE66D" },
            ].map((role, i) => (
              <div
                key={i}
                className="flex flex-col items-center p-6 rounded-3xl bg-white text-center shadow-md hover:-translate-y-1 transition-all duration-300"
              >
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                  style={{ background: `${role.color}18` }}
                >
                  <span
                    className="material-symbols-outlined text-[32px]"
                    style={{ color: role.color }}
                  >
                    {role.icon}
                  </span>
                </div>
                <p className="font-black text-gray-800 text-sm">{role.name}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <p className="text-purple-200 text-sm max-w-2xl mx-auto">
              <span className="font-bold text-white">Eventora</span> is a
              comprehensive college event management portal designed to
              streamline the entire event lifecycle — from creation and
              registration to attendance tracking and certification.
            </p>
          </div>
        </div>
      </Reveal>

      {/* ── SYSTEM MODULES (documentation-accurate) ── */}
      <Reveal className="relative py-20 px-6 mb-10 overflow-hidden">
        <div
          className="absolute inset-0 -z-10"
          style={{
            background: "linear-gradient(135deg, #0f2d2b 0%, #1A1A1A 100%)",
          }}
        />
        <div className="max-w-5xl mx-auto">
          <SectionHeader
           
            subtitle="System Modules"
           color="#FFE66D"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {systemModules.map((mod, i) => (
              <ModuleCard key={i} {...mod} />
            ))}
          </div>
        </div>
      </Reveal>

      {/* ── CTA ── */}
      <Reveal className="max-w-4xl mx-auto px-6 pb-24">
        <div className="relative overflow-hidden rounded-4xl p-10 text-center bg-linear-to-r from-purple-600 to-teal-500">
          <div className="absolute -top-10 -right-10 w-44 h-44 rounded-full opacity-15 bg-yellow-300" />
          <div className="relative z-10">
            <h2 className="text-3xl font-black text-white mb-3">
              Ready to Get Involved?
            </h2>
            <p className="text-purple-100 text-sm mb-8 max-w-md mx-auto">
              Join thousands of college students using Eventora to discover
              events, earn certificates, and make the most of college life.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <button
                onClick={() => navigate("/student-register")}
                className="px-7 py-3 rounded-2xl text-sm font-black text-purple-600 bg-white hover:-translate-y-0.5 hover:shadow-xl transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-purple-600"
              >
                Sign Up as Student
              </button>
              <button
                onClick={() => navigate("/student-login")}
                className="px-7 py-3 rounded-2xl text-sm font-black text-white border-2 border-white/40 hover:border-white hover:bg-white/10 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-purple-600"
              >
                Browse Events
              </button>
            </div>
          </div>
        </div>
      </Reveal>
    </div>
  );
};

export default AboutUs;