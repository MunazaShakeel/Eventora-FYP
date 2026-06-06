import React, { useEffect, useState, useRef } from "react";
import AdminSidebar from "../../components/AdminSidebar";
import { useAuth } from "../../context/AuthContext";

import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
  RadialBarChart, RadialBar,
} from "recharts";
import axios from "axios";

/* ─── Animated Counter (same as OrganizerDashboard) ─── */
const useCounter = (target, duration = 1400, start = false) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start || !target) return;
    let startTime = null;
    const step = (ts) => {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, start]);
  return count;
};

/* ─── Stat Card (same pattern as OrganizerDashboard) ─── */
const StatCard = ({ label, value, subStats, color, bg, icon, delay, animate }) => {
  const count = useCounter(value, 1400, animate);
  return (
    <div
      className="relative bg-white rounded-2xl p-6 overflow-hidden group transition-all duration-500 hover:shadow-xl"
      style={{
        boxShadow: `0 8px 30px ${color}10`,
        border: `1px solid ${color}15`,
        animation: animate ? `slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards ${delay}ms` : "none",
        opacity: animate ? undefined : 0,
      }}
    >
      <div className="absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-700"
        style={{ background: `radial-gradient(circle at top right, ${color}, transparent 70%)` }} />
      <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full opacity-5 group-hover:opacity-15 transition-all duration-500 group-hover:scale-150"
        style={{ backgroundColor: color }} />
      <div className="absolute bottom-0 left-0 h-1 w-full rounded-b-2xl transition-all duration-500 group-hover:h-1.5"
        style={{ backgroundColor: color }} />

      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 duration-300"
          style={{ backgroundColor: bg }}>
          <span className="material-symbols-outlined text-2xl" style={{ color, fontVariationSettings: "'FILL' 1" }}>{icon}</span>
        </div>
        <span className="text-3xl font-black tracking-tight" style={{ color }}>{count.toLocaleString()}</span>
      </div>

      <p className="text-sm font-bold text-gray-700 mb-3 tracking-wide">{label}</p>

      {subStats && subStats.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {subStats.map((s, i) => (
            <span key={i} className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
              style={{ backgroundColor: s.bg, color: s.color }}>
              {s.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

/* ─── Custom Dark Tooltip ─── */
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div style={{
        background: "#1A1A1A", border: "1px solid #333", borderRadius: 10,
        padding: "8px 14px", color: "#fff", fontSize: 12,
        boxShadow: "0 4px 20px rgba(0,0,0,0.3)"
      }}>
        {label && <p style={{ color: "#9B59B6", marginBottom: 4, fontWeight: 700 }}>{label}</p>}
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }}>{p.name}: <strong>{p.value}</strong></p>
        ))}
      </div>
    );
  }
  return null;
};

const AdminDashboard = () => {
  
const { token } = useAuth();
const notifRef = useRef(null);
const [notifications, setNotifications] = useState([]);
const [notifOpen, setNotifOpen] = useState(false);
const [unreadCount, setUnreadCount] = useState(0);

  const [adminStats, setAdminStats] = useState(null);
  const [dashStats, setDashStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [animate, setAnimate] = useState(false);
  const [currentTime, setCurrentTime] = useState("");
  const [currentDate, setCurrentDate] = useState("");
  const [greeting, setGreeting] = useState("");

  /* Live clock + greeting */
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good Morning");
    else if (hour < 17) setGreeting("Good Afternoon");
    else setGreeting("Good Evening");

    const tick = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true }));
      setCurrentDate(now.toLocaleDateString("en-PK", { weekday: "long", year: "numeric", month: "long", day: "numeric" }));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  /* Data fetch */
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [adminRes, dashRes] = await Promise.all([
          axios.get("http://localhost:5000/api/admin/dashboard", { headers }),
          axios.get("http://localhost:5000/api/dashboard", { headers }),
        ]);
        setAdminStats(adminRes.data);
        setDashStats(dashRes.data);
        setTimeout(() => setAnimate(true), 200);
      } catch (err) {
        console.error(err);
        setError("Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [token]);

  // ── Notifications Fetch ──
useEffect(() => {
  if (!token) return;
  const fetchNotifs = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [eventsRes, usersRes] = await Promise.all([
        axios.get("http://localhost:5000/api/admin/dashboard", { headers }),
        axios.get("http://localhost:5000/api/dashboard", { headers }),
      ]);
      const notifs = [];
      const pendingEvents = (eventsRes.data?.pendingEvents || []);
      pendingEvents.slice(0, 3).forEach((ev) => {
        notifs.push({
          id: `ev-${ev._id}`, icon: "pending_actions", color: "#f59e0b", bg: "#fffbeb",
          message: `"${ev.title}" is waiting for approval`,
          time: ev.createdAt ? new Date(ev.createdAt).toLocaleDateString("en-PK", { day: "numeric", month: "short" }) : "",
        });
      });
      const totalStudents = eventsRes.data?.totalStudents ?? 0;
      const totalOrganizers = eventsRes.data?.totalOrganizers ?? 0;
      notifs.push({
        id: "users-summary", icon: "group", color: "#9B59B6", bg: "#f5eefa",
        message: `${totalStudents} students & ${totalOrganizers} organizers on platform`,
        time: "Now",
      });
      setNotifications(notifs);
      setUnreadCount(notifs.length);
    } catch (err) { console.error(err); }
  };
  fetchNotifs();
  const interval = setInterval(fetchNotifs, 30000);
  return () => clearInterval(interval);
}, [token]);

// ── Outside Click ──
useEffect(() => {
  const handleClick = (e) => {
    if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
  };
  document.addEventListener("mousedown", handleClick);
  return () => document.removeEventListener("mousedown", handleClick);
}, []);

  /* ── Loading ── */
  if (loading) return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <main className="flex-1 md:ml-64 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-[#9B59B6] border-t-transparent animate-spin" />
            <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-[#4ECDC4] border-b-transparent animate-spin opacity-50"
              style={{ animationDirection: "reverse" }} />
          </div>
          <p className="text-[#9B59B6] font-semibold text-sm animate-pulse">Loading dashboard...</p>
        </div>
      </main>
    </div>
  );

  /* ── Error ── */
  if (error) return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <main className="flex-1 md:ml-64 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 text-center shadow-xl max-w-md">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <span className="material-symbols-outlined text-4xl text-red-500">error</span>
          </div>
          <p className="text-red-500 font-semibold">{error}</p>
          <button onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-[#9B59B6] text-white rounded-xl text-sm font-semibold hover:bg-[#7a3f91] transition-colors">
            Retry
          </button>
        </div>
      </main>
    </div>
  );

  /* ── Derived data ── */
  const ev  = dashStats?.events        ?? {};
  const reg = dashStats?.registrations ?? {};
  const tsk = dashStats?.tasks         ?? {};

  const statCards = [
    {
      label: "Total Students", value: adminStats?.totalStudents ?? 0,
      icon: "school", color: "#9B59B6", bg: "#f5eefa", delay: 0,
      subStats: [{ label: `${adminStats?.totalOrganizers ?? 0} Organizers`, color: "#4ECDC4", bg: "#e6fafa" }],
    },
    {
      label: "Total Events", value: ev.totalEvents ?? 0,
      icon: "event", color: "#4ECDC4", bg: "#e6fafa", delay: 100,
      subStats: [
        { label: `${ev.approvedEvents ?? 0} Approved`, color: "#10b981", bg: "#d1fae5" },
        { label: `${ev.rejectedEvents ?? 0} Pending`,  color: "#f59e0b", bg: "#fed7aa" },
      ],
    },
    {
      label: "Registrations", value: reg.totalRegistrations ?? 0,
      icon: "app_registration", color: "#FF6B6B", bg: "#fff0f0", delay: 200,
      subStats: [
        { label: `${reg.presentCount ?? 0} Present`, color: "#10b981", bg: "#d1fae5" },
        { label: `${reg.absentCount  ?? 0} Absent`,  color: "#ef4444", bg: "#fee2e2" },
      ],
    },
    {
      label: "Certificates Issued", value: dashStats?.totalCertificates ?? 0,
      icon: "workspace_premium", color: "#FFE66D", bg: "#fffce8", delay: 300,
      subStats: [{ label: `${tsk.completedTasks ?? 0} Tasks done`, color: "#f59e0b", bg: "#fed7aa" }],
    },
  ];

  const axisStyle = { fontSize: 11, fill: "#9ca3af", fontFamily: "Plus Jakarta Sans, sans-serif" };

  const eventsPieData = [
    { name: "Approved", value: ev.approvedEvents ?? 0 },
    { name: "Pending",  value: ev.rejectedEvents ?? 0 },
  ];
  const PIE_COLORS = ["#9B59B6", "#FF6B6B"];

  const attendanceBarData = [{ name: "Attendance", Present: reg.presentCount ?? 0, Absent: reg.absentCount ?? 0 }];
  const tasksBarData      = [{ name: "Tasks", Completed: tsk.completedTasks ?? 0, Pending: tsk.pendingTasks ?? 0 }];

  const usersRadialData = [
    { name: "Students",   value: adminStats?.totalStudents   ?? 0, fill: "#9B59B6" },
    { name: "Organizers", value: adminStats?.totalOrganizers ?? 0, fill: "#4ECDC4" },
    { name: "Admins",     value: adminStats?.totalAdmins     ?? 0, fill: "#FF6B6B" },
  ];

  const progressItems = [
    {
      label: "Task Completion",
      value: tsk.totalTasks > 0 ? Math.round((tsk.completedTasks / tsk.totalTasks) * 100) : 0,
      color: "#9B59B6", bg: "#f5eefa", icon: "check_circle",
      sub: `${tsk.completedTasks ?? 0} of ${tsk.totalTasks ?? 0} done`,
    },
    {
      label: "Attendance Rate",
      value: reg.totalRegistrations > 0 ? Math.round((reg.presentCount / reg.totalRegistrations) * 100) : 0,
      color: "#4ECDC4", bg: "#e6fafa", icon: "group",
      sub: `${reg.presentCount ?? 0} of ${reg.totalRegistrations ?? 0} present`,
    },
    {
      label: "Approval Rate",
      value: ev.totalEvents > 0 ? Math.round((ev.approvedEvents / ev.totalEvents) * 100) : 0,
      color: "#FF6B6B", bg: "#fff0f0", icon: "verified",
      sub: `${ev.approvedEvents ?? 0} of ${ev.totalEvents ?? 0} approved`,
    },
  ];

  const medalGradients = [
    "linear-gradient(135deg, #f59e0b, #ea580c)",
    "linear-gradient(135deg, #94a3b8, #64748b)",
    "linear-gradient(135deg, #b45309, #92400e)",
    "linear-gradient(135deg, #9B59B6, #6d28d9)",
  ];

  return (
    <>
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-5px); }
        }
        .shimmer-text {
          background: linear-gradient(90deg, #9B59B6, #4ECDC4, #FF6B6B, #9B59B6);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 4s linear infinite;
        }
        .float-anim { animation: float 3s ease-in-out infinite; }
      `}</style>

      <div className="flex min-h-screen bg-gray-50" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        <AdminSidebar />

        <main className="flex-1 md:ml-64 p-6 md:p-8 pb-28 md:pb-8">

          {/* ── HEADER ── */}
          <div className="mb-8" style={{ animation: "fadeIn 0.6s ease forwards" }}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-3xl float-anim">👋</span>
                  <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">{greeting}</p>
                </div>
                <h1 className="text-4xl md:text-5xl font-black text-gray-900 leading-tight">
                  Admin{" "}
                  <span className="shimmer-text">Dashboard</span>
                </h1>
                <p className="text-sm text-gray-400 mt-2">Monitor, manage, and keep campus running smoothly.</p>
              </div>

           {/* Live Clock + Bell */}
<div className="flex items-center gap-4">

  {/* 🔔 Notification Bell */}
  <div className="relative hidden md:block" ref={notifRef}>
    <button
      onClick={() => { setNotifOpen(!notifOpen); setUnreadCount(0); }}
      className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition relative"
    >
      <span className="material-symbols-outlined text-[22px] text-gray-600">notifications</span>
      {unreadCount > 0 && (
        <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </button>

    {notifOpen && (
      <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <p className="text-sm font-black text-gray-800">Notifications</p>
          <span className="text-[10px] font-bold text-[#9B59B6] bg-purple-50 px-2 py-0.5 rounded-full">
            {notifications.length} new
          </span>
        </div>
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-gray-400">
            <span className="material-symbols-outlined text-[36px] mb-2">notifications_none</span>
            <p className="text-sm font-semibold">No notifications</p>
          </div>
        ) : (
          <div className="max-h-72 overflow-y-auto divide-y divide-gray-50">
            {notifications.map((n) => (
              <div key={n.id} className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition cursor-pointer">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                  style={{ backgroundColor: n.bg }}>
                  <span className="material-symbols-outlined text-[16px]"
                    style={{ color: n.color, fontVariationSettings: "'FILL' 1" }}>
                    {n.icon}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-700 leading-snug">{n.message}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{n.time}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )}
  </div>

  {/* Live Clock — same as before */}
  <div className="flex flex-col items-end gap-2">
    <div className="flex items-center gap-3 bg-white rounded-2xl px-6 py-3 shadow-lg border border-gray-100">
      <div className="relative">
        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
        <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping opacity-75" />
      </div>
      <div className="text-right">
        <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Live</p>
        <p className="text-xl font-black text-gray-800 leading-tight font-mono">{currentTime}</p>
      </div>
    </div>
    <p className="text-xs text-gray-400 font-medium">{currentDate}</p>
  </div>
  </div>
</div>
            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-8">
              {statCards.map((card, i) => <StatCard key={i} {...card} animate={animate} />)}
            </div>
          </div>

          {/* ── ROW 1: Pie + Attendance + Progress ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

            {/* Left: Pie + Attendance stacked */}
            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">

              {/* Events Pie */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all"
                style={{ animation: "slideUp 0.5s ease forwards 350ms", opacity: 0 }}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-black text-gray-800">📊 Events</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Approval overview</p>
                  </div>
                  <span className="material-symbols-outlined text-[#9B59B6]" style={{ fontVariationSettings: "'FILL' 1" }}>pie_chart</span>
                </div>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={eventsPieData} cx="50%" cy="50%"
                      innerRadius={45} outerRadius={68} paddingAngle={4} dataKey="value">
                      {eventsPieData.map((_, idx) => (
                        <Cell key={idx} fill={PIE_COLORS[idx]} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-4 mt-2">
                  {eventsPieData.map((e, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[i] }} />
                      <span className="text-[11px] text-gray-500 font-semibold">{e.name} ({e.value})</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Attendance Bar */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all"
                style={{ animation: "slideUp 0.5s ease forwards 400ms", opacity: 0 }}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-black text-gray-800">📋 Attendance</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Present vs Absent</p>
                  </div>
                  <span className="material-symbols-outlined text-[#4ECDC4]" style={{ fontVariationSettings: "'FILL' 1" }}>fact_check</span>
                </div>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={attendanceBarData} barSize={36}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis dataKey="name" tick={axisStyle} axisLine={false} tickLine={false} />
                    <YAxis tick={axisStyle} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f5eefa" }} />
                    <Legend wrapperStyle={{ fontSize: 11, color: "#9ca3af" }} />
                    <Bar dataKey="Present" fill="#9B59B6" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="Absent"  fill="#FF6B6B" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Progress Panel */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all"
              style={{ animation: "slideUp 0.5s ease forwards 450ms", opacity: 0 }}>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-lg font-black text-gray-800">📈 Progress</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Performance metrics</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                  <span className="material-symbols-outlined text-2xl text-[#9B59B6]" style={{ fontVariationSettings: "'FILL' 1" }}>trending_up</span>
                </div>
              </div>

              <div className="space-y-5">
                {progressItems.map((item, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ backgroundColor: item.bg }}>
                          <span className="material-symbols-outlined text-sm" style={{ color: item.color, fontVariationSettings: "'FILL' 1" }}>{item.icon}</span>
                        </div>
                        <p className="text-xs font-bold text-gray-600">{item.label}</p>
                      </div>
                      <span className="text-sm font-black" style={{ color: item.color }}>{item.value}%</span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-gray-100 overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-1000 ease-out"
                        style={{
                          width: animate ? `${item.value}%` : "0%",
                          backgroundColor: item.color,
                          boxShadow: `0 0 8px ${item.color}80`,
                        }} />
                    </div>
                    <p className="text-[10px] text-gray-400 font-medium">{item.sub}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between text-xs">
                <span className="text-gray-400">Overall Performance</span>
                <span className="font-bold text-gray-700">
                  {Math.round(progressItems.reduce((s, p) => s + p.value, 0) / progressItems.length)}% Avg
                </span>
              </div>
            </div>
          </div>

          {/* ── ROW 2: Tasks + Radial + Top Rated ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Tasks Bar */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all"
              style={{ animation: "slideUp 0.5s ease forwards 500ms", opacity: 0 }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-black text-gray-800">✅ Tasks Status</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Completed vs Pending</p>
                </div>
                <span className="material-symbols-outlined text-[#4ECDC4]" style={{ fontVariationSettings: "'FILL' 1" }}>task_alt</span>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={tasksBarData} barSize={38}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="name" tick={axisStyle} axisLine={false} tickLine={false} />
                  <YAxis tick={axisStyle} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f5eefa" }} />
                  <Legend wrapperStyle={{ fontSize: 11, color: "#9ca3af" }} />
                  <Bar dataKey="Completed" fill="#4ECDC4" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="Pending"   fill="#FFE66D" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* User Distribution Radial */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all"
              style={{ animation: "slideUp 0.5s ease forwards 580ms", opacity: 0 }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-black text-gray-800">👥 Users</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Students · Organizers · Admins</p>
                </div>
                <span className="material-symbols-outlined text-[#4ECDC4]" style={{ fontVariationSettings: "'FILL' 1" }}>donut_large</span>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="90%"
                  data={usersRadialData} startAngle={180} endAngle={0}>
                  <RadialBar minAngle={15} dataKey="value" clockWise />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconSize={10} layout="vertical" verticalAlign="middle" align="right"
                    wrapperStyle={{ fontSize: 11, color: "#6b7280" }} />
                </RadialBarChart>
              </ResponsiveContainer>
            </div>

            {/* Top Rated Events */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all"
              style={{ animation: "slideUp 0.5s ease forwards 660ms", opacity: 0 }}>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-lg font-black text-gray-800">🏆 Top Rated</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Based on student feedback</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                  <span className="material-symbols-outlined text-2xl text-amber-400" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                </div>
              </div>

              {!dashStats?.topEvents?.length ? (
                <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                  <span className="material-symbols-outlined text-5xl mb-3 opacity-50">reviews</span>
                  <p className="text-sm font-semibold">No feedback data yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {dashStats.topEvents.map((ev, i) => (
                    <div key={i}
                      className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-all cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black text-white shadow-md shrink-0"
                          style={{ background: medalGradients[Math.min(i, 3)] }}>
                          {i + 1}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-gray-700 truncate max-w-27.5">
                            {ev.title || ev.eventTitle || `Event #${ev._id?.toString().slice(-6)}`}
                          </p>
                          <p className="text-[10px] text-gray-400">{ev.totalFeedbacks} reviews</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-full shadow-sm shrink-0">
                        <span className="material-symbols-outlined text-sm text-amber-400" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                        <span className="text-sm font-black text-amber-600">{ev.avgRating?.toFixed(1)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </main>
      </div>
    </>
  );
};

export default AdminDashboard;