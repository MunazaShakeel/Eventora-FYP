import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import OrganizerSidebar from "../../components/OrganizerSidebar";
import { useAuth } from "../../context/AuthContext";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from "recharts";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const useCounter = (target, duration = 1500, start = false) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start || target === 0) return;
    let startTime = null;
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, start]);
  return count;
};

const StatCard = ({ label, value, subStats, color, bg, icon, delay, animate }) => {
  const count = useCounter(value, 1400, animate);
  return (
    <div
      className="relative bg-white rounded-2xl p-6 overflow-hidden group transition-all duration-500 hover:shadow-xl"
      style={{
        boxShadow: `0 8px 30px ${color}10`,
        border: `1px solid ${color}15`,
        animation: animate ? `slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards ${delay}ms` : "none",
        opacity: animate ? 0 : 1,
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

const QuickActionButton = ({ action, onClick, index }) => (
  <button
    onClick={onClick}
    className="group flex flex-col items-center gap-2 p-4 bg-white rounded-2xl border border-gray-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
    style={{ animation: `fadeInUp 0.4s ease forwards ${index * 50}ms`, opacity: 0 }}
  >
    <div className="w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:shadow-md"
      style={{ backgroundColor: action.bg }}>
      <span className="material-symbols-outlined text-2xl" style={{ color: action.color, fontVariationSettings: "'FILL' 1" }}>
        {action.icon}
      </span>
    </div>
    <span className="text-xs font-semibold text-gray-700 text-center leading-tight group-hover:text-gray-900 transition-colors">
      {action.label}
    </span>
  </button>
);

const OrganizerDashboard = () => {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const notifRef = useRef(null);

  const [stats, setStats] = useState({
    events: { totalEvents: 0, approvedEvents: 0, rejectedEvents: 0 },
    registrations: { totalRegistrations: 0, presentCount: 0, absentCount: 0 },
    tasks: { totalTasks: 0, completedTasks: 0, pendingTasks: 0 },
    totalCertificates: 0,
    topEvents: []
  });
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [recentRegistrations, setRecentRegistrations] = useState([]);
  const [trends, setTrends] = useState([]);
  const [organizerName, setOrganizerName] = useState("Organizer");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [animate, setAnimate] = useState(false);
  const [greeting, setGreeting] = useState("");
  const [currentTime, setCurrentTime] = useState("");
  const [currentDate, setCurrentDate] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [chartType, setChartType] = useState("weekly");

  // ── Greeting + Clock ──
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good Morning");
    else if (hour < 17) setGreeting("Good Afternoon");
    else setGreeting("Good Evening");

    const updateDateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true }));
      setCurrentDate(now.toLocaleDateString("en-PK", { weekday: "long", year: "numeric", month: "long", day: "numeric" }));
    };
    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // ── Main Data Fetch (Safe API Calls) ──
  useEffect(() => {
    if (!token || !user) return;

    const fetchAll = async () => {
      try {
        setLoading(true);
        setError("");
        const headers = { Authorization: `Bearer ${token}` };
        const organizerId = user.id;

        // ✅ Safe API calls with fallback values
        const safeFetch = async (url, fallback = null) => {
          try {
            const res = await axios.get(url, { headers });
            return res.data;
          } catch (err) {
            console.warn(`⚠️ API failed: ${url}`, err.response?.status);
            return fallback;
          }
        };

        // Fetch all data in parallel
        const [
          statsData,
          upcomingData,
          recentData,
          trendsData,
          profileData
        ] = await Promise.all([
          safeFetch(`${API_URL}/api/organizer-dashboard/stats`, { 
            events: { totalEvents: 0, approvedEvents: 0, rejectedEvents: 0 },
            registrations: { totalRegistrations: 0, presentCount: 0, absentCount: 0 },
            tasks: { totalTasks: 0, completedTasks: 0, pendingTasks: 0 },
            totalCertificates: 0,
            topEvents: []
          }),
          safeFetch(`${API_URL}/api/organizer-dashboard/upcoming-events`, { upcomingEvents: [] }),
          safeFetch(`${API_URL}/api/organizer-dashboard/recent-registrations`, { recentRegistrations: [] }),
          safeFetch(`${API_URL}/api/organizer-dashboard/registration-trends`, { trends: [] }),
          safeFetch(`${API_URL}/api/organizers/${organizerId}`, { organizer: { name: "Organizer" } }),
        ]);

        // Set states with safe fallbacks
        setStats(statsData || { events: { totalEvents: 0, approvedEvents: 0, rejectedEvents: 0 }, registrations: { totalRegistrations: 0, presentCount: 0, absentCount: 0 }, tasks: { totalTasks: 0, completedTasks: 0, pendingTasks: 0 }, totalCertificates: 0, topEvents: [] });
        setUpcomingEvents(upcomingData?.upcomingEvents || []);
        setRecentRegistrations(recentData?.recentRegistrations || []);
        setTrends(trendsData?.trends || []);

        const profile = profileData?.organizer || profileData;
        if (profile?.name) setOrganizerName(profile.name);

        setTimeout(() => setAnimate(true), 200);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
        setError("Unable to load dashboard data. Please refresh.");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [token, user]);

  // ── Notifications Fetch ──
  useEffect(() => {
    if (!token) return;
    const fetchNotifs = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const notifs = [];

        // Try fetching upcoming events
        try {
          const upcomingRes = await axios.get(`${API_URL}/api/organizer-dashboard/upcoming-events`, { headers });
          (upcomingRes.data?.upcomingEvents || []).slice(0, 3).forEach((ev) => {
            notifs.push({
              id: `ev-${ev._id}`,
              icon: "event",
              color: "#8b4fa2",
              bg: "#f5eefa",
              message: `"${ev.title}" is coming up`,
              time: ev.start_date ? new Date(ev.start_date).toLocaleDateString("en-PK", { day: "numeric", month: "short" }) : "",
            });
          });
        } catch (e) { console.warn("Notif events failed:", e.message); }

        // Try fetching recent registrations
        try {
          const regsRes = await axios.get(`${API_URL}/api/organizer-dashboard/recent-registrations`, { headers });
          (regsRes.data?.recentRegistrations || []).slice(0, 3).forEach((reg) => {
            notifs.push({
              id: `reg-${reg._id}`,
              icon: "person_add",
              color: "#4ECDC4",
              bg: "#edfafa",
              message: `${reg?.student_id?.name || "A student"} registered for "${reg?.event_id?.title || "your event"}"`,
              time: reg.registration_date ? new Date(reg.registration_date).toLocaleDateString("en-PK", { day: "numeric", month: "short" }) : "",
            });
          });
        } catch (e) { console.warn("Notif registrations failed:", e.message); }

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

  if (loading) return (
    <div className="flex min-h-screen bg-gray-50">
      <OrganizerSidebar />
      <main className="flex-1 md:ml-64 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-[#8b4fa2] border-t-transparent animate-spin" />
            <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-[#4ECDC4] border-b-transparent animate-spin opacity-50"
              style={{ animationDirection: "reverse" }} />
          </div>
          <p className="text-[#8b4fa2] font-semibold text-sm animate-pulse">Loading your dashboard...</p>
        </div>
      </main>
    </div>
  );

  if (error) return (
    <div className="flex min-h-screen bg-gray-50">
      <OrganizerSidebar />
      <main className="flex-1 md:ml-64 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 text-center shadow-xl max-w-md">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <span className="material-symbols-outlined text-4xl text-red-500">error</span>
          </div>
          <p className="text-red-500 font-semibold">{error}</p>
          <button onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-[#8b4fa2] text-white rounded-xl text-sm font-semibold hover:bg-[#7a3f91] transition-colors">
            Retry
          </button>
        </div>
      </main>
    </div>
  );

  const { events, registrations, tasks, totalCertificates, topEvents } = stats;

  const statCards = [
    {
      label: "Total Events", value: events?.totalEvents || 0, icon: "event", color: "#8b4fa2", bg: "#f5eefa", delay: 0,
      subStats: [
        { label: `${events?.approvedEvents || 0} Approved`, color: "#10b981", bg: "#d1fae5" },
        { label: `${events?.rejectedEvents || 0} Rejected`, color: "#ef4444", bg: "#fee2e2" },
        { label: `${Math.max(0, (events?.totalEvents || 0) - (events?.approvedEvents || 0) - (events?.rejectedEvents || 0))} Pending`, color: "#f59e0b", bg: "#fed7aa" },
      ],
    },
    {
      label: "Registrations", value: registrations?.totalRegistrations || 0, icon: "app_registration", color: "#4ECDC4", bg: "#edfafa", delay: 100,
      subStats: [
        { label: `${registrations?.presentCount || 0} Present`, color: "#10b981", bg: "#d1fae5" },
        { label: `${registrations?.absentCount || 0} Absent`, color: "#ef4444", bg: "#fee2e2" },
      ],
    },
    {
      label: "Tasks", value: tasks?.totalTasks || 0, icon: "task_alt", color: "#f59e0b", bg: "#fffbeb", delay: 200,
      subStats: [
        { label: `${tasks?.completedTasks || 0} Completed`, color: "#10b981", bg: "#d1fae5" },
        { label: `${tasks?.pendingTasks || 0} Pending`, color: "#f59e0b", bg: "#fed7aa" },
      ],
    },
    {
      label: "Certificates", value: totalCertificates || 0, icon: "workspace_premium", color: "#FF6B6B", bg: "#fff1f1", delay: 300,
      subStats: [{ label: "Total Issued", color: "#FF6B6B", bg: "#ffe4e4" }],
    },
  ];

  const quickActions = [
    { label: "Create Event", icon: "add_circle", path: "/organizer/create-event", color: "#8b4fa2", bg: "#f5eefa" },
    { label: "My Events", icon: "calendar_month", path: "/organizer/my-events", color: "#4ECDC4", bg: "#edfafa" },
    { label: "Tasks", icon: "task_alt", path: "/organizer/tasks", color: "#f59e0b", bg: "#fffbeb" },
    { label: "Volunteers", icon: "volunteer_activism", path: "/organizer/volunteers", color: "#FF6B6B", bg: "#fff1f1" },
    { label: "Attendance", icon: "fact_check", path: "/organizer/my-events", color: "#10b981", bg: "#ecfdf5" },
    { label: "Scan QR", icon: "qr_code_scanner", path: "/organizer/scan-attendance", color: "#6366f1", bg: "#eef2ff" },
    { label: "Gallery", icon: "photo_library", path: "/organizer/gallery", color: "#10b981", bg: "#ecfdf5" },
    { label: "Feedback", icon: "rate_review", path: "/organizer/feedback", color: "#f43f5e", bg: "#fff1f2" },
    { label: "Certificates", icon: "workspace_premium", path: "/organizer/certificates", color: "#0ea5e9", bg: "#f0f9ff" },
  ];

  const medalGradients = [
    "linear-gradient(135deg, #f59e0b, #ea580c)",
    "linear-gradient(135deg, #94a3b8, #64748b)",
    "linear-gradient(135deg, #b45309, #92400e)",
    "linear-gradient(135deg, #8b4fa2, #6d28d9)",
  ];

  const NotifDropdown = () => (
    <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <p className="text-sm font-black text-gray-800">Notifications</p>
        <span className="text-[10px] font-bold text-[#8b4fa2] bg-purple-50 px-2 py-0.5 rounded-full">
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
  );

  return (
    <>
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-5px); }
        }
        .shimmer-text {
          background: linear-gradient(90deg, #8b4fa2, #4ECDC4, #FF6B6B, #8b4fa2);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 4s linear infinite;
        }
        .float-animation { animation: float 3s ease-in-out infinite; }
      `}</style>

      <div className="flex min-h-screen bg-gray-50">
        <OrganizerSidebar />

        <main className="flex-1 md:ml-64 p-6 md:p-8 pb-24 md:pb-8">

          {/* ── HEADER ── */}
          <div className="mb-8" style={{ animation: "fadeIn 0.6s ease forwards" }}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-3xl float-animation">👋</span>
                  <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">{greeting}</p>
                </div>
                <h1 className="text-4xl md:text-5xl font-black text-gray-900 leading-tight">
                  {organizerName.split(" ")[0]}'s{" "}
                  <span className="shimmer-text">Dashboard</span>
                </h1>
                <p className="text-sm text-gray-400 mt-2">Track, manage, and grow your events effortlessly</p>
              </div>

              {/* Right Side — Bell + Clock */}
              <div className="flex items-center gap-4">

                {/* Notification Bell */}
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
                  {notifOpen && <NotifDropdown />}
                </div>

                {/* Live Clock */}
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

          {/* ── QUICK ACTIONS ── */}
          <div className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">Quick Access</p>
                <h2 className="text-lg font-bold text-gray-800">Common Actions</h2>
              </div>
              <span className="material-symbols-outlined text-gray-300 text-2xl">bolt</span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-3">
              {quickActions.map((action, i) => (
                <QuickActionButton key={i} action={action} onClick={() => navigate(action.path)} index={i} />
              ))}
            </div>
          </div>

          {/* ── CHARTS ROW ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all"
              style={{ animation: "slideUp 0.5s ease forwards 350ms", opacity: 0 }}>
              <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                <div>
                  <h3 className="text-lg font-black text-gray-800">📈 Registration Trends</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Weekly / Monthly / Yearly view</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setChartType("weekly")}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${chartType === "weekly" ? "bg-[#8b4fa2] text-white shadow-md" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
                  >
                    Weekly
                  </button>
                  <button
                    onClick={() => setChartType("monthly")}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${chartType === "monthly" ? "bg-[#8b4fa2] text-white shadow-md" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => setChartType("yearly")}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${chartType === "yearly" ? "bg-[#8b4fa2] text-white shadow-md" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
                  >
                    Yearly
                  </button>
                </div>
              </div>

              {trends.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                  <span className="material-symbols-outlined text-[40px] mb-2">bar_chart</span>
                  <p className="text-sm font-semibold">No registration data yet</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={trends} barSize={chartType === "yearly" ? 60 : 32}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9ca3af" }} />
                    <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} allowDecimals={false} />
                    <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }} cursor={{ fill: "#f5eefa" }} />
                    <Bar dataKey="count" name="Registrations" fill="#8b4fa2" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all"
              style={{ animation: "slideUp 0.5s ease forwards 450ms", opacity: 0 }}>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-lg font-black text-gray-800">📊 Progress</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Performance metrics</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                  <span className="material-symbols-outlined text-2xl text-[#8b4fa2]" style={{ fontVariationSettings: "'FILL' 1" }}>trending_up</span>
                </div>
              </div>
              <div className="space-y-5">
                {[
                  { label: "Task Completion", value: tasks?.totalTasks > 0 ? Math.round((tasks.completedTasks / tasks.totalTasks) * 100) : 0, color: "#8b4fa2", bg: "#f5eefa", icon: "check_circle", sub: `${tasks?.completedTasks || 0} of ${tasks?.totalTasks || 0} done` },
                  { label: "Attendance Rate", value: registrations?.totalRegistrations > 0 ? Math.round((registrations.presentCount / registrations.totalRegistrations) * 100) : 0, color: "#4ECDC4", bg: "#edfafa", icon: "group", sub: `${registrations?.presentCount || 0} of ${registrations?.totalRegistrations || 0} present` },
                  { label: "Approval Rate", value: events?.totalEvents > 0 ? Math.round((events.approvedEvents / events.totalEvents) * 100) : 0, color: "#f59e0b", bg: "#fffbeb", icon: "verified", sub: `${events?.approvedEvents || 0} of ${events?.totalEvents || 0} approved` },
                ].map((item, i) => (
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
                        style={{ width: animate ? `${item.value}%` : "0%", backgroundColor: item.color, boxShadow: `0 0 8px ${item.color}80` }} />
                    </div>
                    <p className="text-[10px] text-gray-400 font-medium">{item.sub}</p>
                  </div>
                ))}
              </div>
              <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between text-xs">
                <span className="text-gray-400">Overall Performance</span>
                <span className="font-bold text-gray-700">
                  {Math.round(
                    ((tasks?.completedTasks || 0) / ((tasks?.totalTasks || 1)) * 100 +
                    (registrations?.presentCount || 0) / ((registrations?.totalRegistrations || 1)) * 100 +
                    (events?.approvedEvents || 0) / ((events?.totalEvents || 1)) * 100) / 3
                  )}% Avg
                </span>
              </div>
            </div>
          </div>

          {/* ── BOTTOM ROW ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Top Rated */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all"
              style={{ animation: "slideUp 0.5s ease forwards 500ms", opacity: 0 }}>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-lg font-black text-gray-800">🏆 Top Rated</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Click to view all feedback</p>
                </div>
                <button
                  onClick={() => navigate("/organizer/feedback")}
                  className="text-xs font-bold text-[#8b4fa2] hover:underline flex items-center gap-1"
                >
                  View All
                </button>
              </div>
              {!topEvents || topEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                  <span className="material-symbols-outlined text-5xl mb-3 opacity-50">reviews</span>
                  <p className="text-sm font-semibold">No feedback yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {topEvents.slice(0, 3).map((ev, i) => (
                    <div
                      key={i}
                      onClick={() => navigate("/organizer/feedback")}
                      className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black text-white shadow-md shrink-0"
                          style={{ background: medalGradients[Math.min(i, 3)] }}>
                          {i + 1}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-gray-700 truncate">
                            {ev.title || ev.eventTitle || `Event #${ev._id?.toString().slice(-6)}`}
                          </p>
                          <p className="text-[10px] text-gray-400">{ev.totalFeedbacks || 0} reviews</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-full shadow-sm shrink-0">
                        <span className="material-symbols-outlined text-sm text-amber-400" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                        <span className="text-sm font-black text-amber-600">{(ev.avgRating || 0).toFixed(1)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Upcoming Events */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all"
              style={{ animation: "slideUp 0.5s ease forwards 600ms", opacity: 0 }}>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-lg font-black text-gray-800">📅 Upcoming</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Your approved future events</p>
                </div>
                <button onClick={() => navigate("/organizer/my-events")}
                  className="text-xs font-bold text-[#8b4fa2] hover:underline">View All</button>
              </div>
              {upcomingEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                  <span className="material-symbols-outlined text-5xl mb-3 opacity-50">event_busy</span>
                  <p className="text-sm font-semibold">No upcoming events</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingEvents.slice(0, 4).map((event, i) => {
                    const date = new Date(event.start_date);
                    return (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-all cursor-pointer group">
                        <div className="w-11 h-11 rounded-xl flex flex-col items-center justify-center text-white shadow-sm shrink-0"
                          style={{ background: "linear-gradient(135deg, #8b4fa2, #6d28d9)" }}>
                          <span className="text-[9px] font-bold uppercase opacity-80">
                            {date.toLocaleString("en-PK", { month: "short" })}
                          </span>
                          <span className="text-base font-black leading-tight">{date.getDate()}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-800 truncate group-hover:text-[#8b4fa2] transition-colors">
                            {event.title}
                          </p>
                          <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                            <span className="material-symbols-outlined text-[12px]">location_on</span>
                            {event.venue || "TBA"}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Recent Registrations */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all"
              style={{ animation: "slideUp 0.5s ease forwards 700ms", opacity: 0 }}>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-lg font-black text-gray-800">👥 Recent Registrations</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Click to view all registrations</p>
                </div>
                <button
                  onClick={() => navigate("/organizer/my-events")}
                  className="text-xs font-bold text-[#8b4fa2] hover:underline">View All</button>
              </div>
              {recentRegistrations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                  <span className="material-symbols-outlined text-5xl mb-3 opacity-50">group</span>
                  <p className="text-sm font-semibold">No registrations yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentRegistrations.slice(0, 5).map((reg, i) => {
                    const name = reg?.student_id?.name || "Unknown";
                    const avatarColors = ["#8b4fa2", "#4ECDC4", "#FF6B6B", "#f59e0b", "#6366f1"];
                    return (
                      <div
                        key={i}
                        onClick={() => navigate("/organizer/my-events")}
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-all cursor-pointer"
                      >
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-black shrink-0"
                          style={{ backgroundColor: avatarColors[i % avatarColors.length] }}>
                          {name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-800 truncate">{name}</p>
                          <p className="text-xs text-gray-400 truncate">{reg?.event_id?.title || "Event"}</p>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full whitespace-nowrap
                          ${reg.role === "Volunteer" ? "bg-[#edfafa] text-[#4ECDC4]" : "bg-[#f5eefa] text-[#8b4fa2]"}`}>
                          {reg.role}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default OrganizerDashboard;