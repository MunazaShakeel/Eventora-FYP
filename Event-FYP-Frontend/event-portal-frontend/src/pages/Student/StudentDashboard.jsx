import React, { useEffect, useState, useRef } from "react";
import StudentSidebar from "../../components/StudentSidebar";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell
} from "recharts";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

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

// Event Hover Card Component
const EventHoverCard = ({ event, position }) => {
  const [show, setShow] = useState(false);
  
  if (!event) return null;
  
  return (
    <div className="relative">
      <div
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        className="cursor-pointer"
      >
        {position === "upcoming" ? (
          <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-purple-50/30 transition-all">
            <div className="w-11 h-11 rounded-xl flex flex-col items-center justify-center text-white shadow-sm shrink-0"
              style={{ background: "linear-gradient(135deg, #8b4fa2, #6d28d9)" }}>
              <span className="text-[9px] font-bold uppercase opacity-80">
                {new Date(event.start_date).toLocaleString("en-PK", { month: "short" })}
              </span>
              <span className="text-base font-black leading-tight">{new Date(event.start_date).getDate()}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-800 truncate">{event.title}</p>
              <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                <span className="material-symbols-outlined text-[12px]">location_on</span>
                {event.venue || "Venue TBA"}
              </p>
            </div>
            <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-purple-100 text-[#8b4fa2]">Registered ✓</span>
          </div>
        ) : (
          <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-green-50/30 transition-all">
            <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px] text-green-600">check_circle</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-800 truncate">{event.title}</p>
              <p className="text-xs text-gray-400">Attended on {new Date(event.start_date).toLocaleDateString()}</p>
            </div>
            <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-green-100 text-green-600">Completed</span>
          </div>
        )}
      </div>
      
      {show && (
        <div className="absolute z-50 bottom-full left-0 mb-2 w-72 bg-white rounded-xl shadow-2xl border border-gray-100 p-4 transition-all duration-200 animate-fadeInUp">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-linear-to-br from-[#8b4fa2] to-[#4ECDC4] flex items-center justify-center text-white text-xl">
              📅
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-gray-800 text-sm">{event.title}</h4>
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-[12px]">calendar_today</span>
                {new Date(event.start_date).toLocaleDateString("en-PK", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
              </p>
              <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                <span className="material-symbols-outlined text-[12px]">schedule</span>
                {event.start_time || "Time TBA"} - {event.end_time || ""}
              </p>
              <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                <span className="material-symbols-outlined text-[12px]">location_on</span>
                {event.venue || "Venue TBA"}
              </p>
              {event.description && (
                <p className="text-xs text-gray-400 mt-2 line-clamp-2">{event.description}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StudentDashboard = () => {
  const navigate = useNavigate();
  const { user, token } = useAuth();

  const [studentName, setStudentName] = useState("");
  const [myRegistrations, setMyRegistrations] = useState([]);
  const [certificatesCount, setCertificatesCount] = useState(0);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [chartType, setChartType] = useState("weekly");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [animate, setAnimate] = useState(false);
  const [greeting, setGreeting] = useState("");
  const [currentTime, setCurrentTime] = useState("");
  const [currentDate, setCurrentDate] = useState("");

  // Greeting + Clock
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

  // Fetch Data
  useEffect(() => {
    if (!token || !user) return;

    const fetchData = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const studentId = user.id;

        const profileRes = await axios.get(`${API_URL}/students/me`, { headers });
        const profile = profileRes.data?.student || profileRes.data;
        if (profile?.name) setStudentName(profile.name);

        const regRes = await axios.get(`${API_URL}/registrations/my-registrations`, { headers });
        const regList = Array.isArray(regRes.data)
          ? regRes.data
          : Array.isArray(regRes.data?.data)
          ? regRes.data.data
          : Array.isArray(regRes.data?.registrations)
          ? regRes.data.registrations
          : [];
        setMyRegistrations(regList);

        try {
          const certRes = await axios.get(`${API_URL}/certificates/my-certificates`, { headers });
          const certs = certRes.data?.data || certRes.data || [];
          setCertificatesCount(certs.length);
        } catch (certErr) {
          console.error("Error fetching certificates:", certErr);
        }

        setTimeout(() => setAnimate(true), 200);
      } catch (err) {
        console.error(err);
        setError("Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, user]);

  // Process Data after fetch
  useEffect(() => {
    if (myRegistrations.length > 0) {
      const now = new Date();
      
      const upcoming = myRegistrations
        .filter(reg => new Date(reg?.event_id?.start_date) >= now)
        .sort((a, b) => new Date(a.event_id.start_date) - new Date(b.event_id.start_date))
        .slice(0, 5);
      setUpcomingEvents(upcoming);

      const recent = myRegistrations
        .filter(reg => reg.attendance_status === "Present")
        .sort((a, b) => new Date(b.event_id?.start_date) - new Date(a.event_id?.start_date))
        .slice(0, 5);
      setRecentActivities(recent);

      // Generate chart data based on type
      generateChartData(myRegistrations, chartType);
    }
  }, [myRegistrations, chartType]);

  const generateChartData = (registrations, type) => {
    if (type === "weekly") {
      const last7Days = [...Array(7)].map((_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date.toLocaleDateString("en-PK", { weekday: "short" });
      }).reverse();
      
      const activityMap = {};
      last7Days.forEach(day => { activityMap[day] = 0; });
      
      registrations.forEach(reg => {
        if (reg.registration_date) {
          const regDate = new Date(reg.registration_date).toLocaleDateString("en-PK", { weekday: "short" });
          if (activityMap[regDate] !== undefined) activityMap[regDate]++;
        }
      });
      
      setChartData(last7Days.map(day => ({ name: day, registrations: activityMap[day] })));
    } 
    else if (type === "monthly") {
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const monthlyMap = {};
      monthNames.forEach(month => { monthlyMap[month] = 0; });
      
      registrations.forEach(reg => {
        if (reg.registration_date) {
          const month = new Date(reg.registration_date).toLocaleString("en-PK", { month: "short" });
          if (monthlyMap[month] !== undefined) monthlyMap[month]++;
        }
      });
      
      setChartData(monthNames.map(month => ({ name: month, registrations: monthlyMap[month] })));
    }
    else if (type === "yearly") {
      const currentYear = new Date().getFullYear();
      const yearMap = {};
      for (let i = currentYear - 2; i <= currentYear; i++) {
        yearMap[i] = 0;
      }
      
      registrations.forEach(reg => {
        if (reg.registration_date) {
          const year = new Date(reg.registration_date).getFullYear();
          if (yearMap[year] !== undefined) yearMap[year]++;
        }
      });
      
      setChartData(Object.keys(yearMap).map(year => ({ name: year, registrations: yearMap[year] })));
    }
  };

  // Stats
  const totalRegistered = myRegistrations.length;
  const upcomingCount = upcomingEvents.length;
  const attendedCount = recentActivities.length;

  const statCards = [
    {
      label: "Registered Events", value: totalRegistered, icon: "app_registration", color: "#8b4fa2", bg: "#f5eefa", delay: 0,
      subStats: [{ label: `${totalRegistered} Total`, color: "#8b4fa2", bg: "#f5eefa" }],
    },
    {
      label: "Upcoming Events", value: upcomingCount, icon: "event", color: "#4ECDC4", bg: "#edfafa", delay: 100,
      subStats: [{ label: `${upcomingCount} Pending`, color: "#f59e0b", bg: "#fed7aa" }],
    },
    {
      label: "Events Attended", value: attendedCount, icon: "task_alt", color: "#10b981", bg: "#ecfdf5", delay: 200,
      subStats: [{ label: `${attendedCount} Completed`, color: "#10b981", bg: "#d1fae5" }],
    },
    {
      label: "Certificates", value: certificatesCount, icon: "workspace_premium", color: "#FF6B6B", bg: "#fff1f1", delay: 300,
      subStats: [{ label: `${certificatesCount} Earned`, color: "#FF6B6B", bg: "#ffe4e4" }],
    },
  ];

  const quickActions = [
    { label: "Browse Events", icon: "explore", path: "/student/browse-events", color: "#8b4fa2", bg: "#f5eefa" },
    { label: "My Registrations", icon: "app_registration", path: "/student/my-registrations", color: "#4ECDC4", bg: "#edfafa" },
    { label: "My Certificates", icon: "workspace_premium", path: "/student/certificates", color: "#f59e0b", bg: "#fffbeb" },
    { label: "My Profile", icon: "account_circle", path: "/student/profile", color: "#FF6B6B", bg: "#fff1f1" },
    { label: "Gallery", icon: "photo_library", path: "/student/gallery", color: "#6366f1", bg: "#eef2ff" },
  ];

  const displayName = studentName ? studentName.split(" ")[0] : "Student";

  if (loading) return (
    <div className="flex min-h-screen bg-linear-to-br from-gray-50 to-purple-50/20">
      <StudentSidebar />
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
    <div className="flex min-h-screen bg-linear-to-br from-gray-50 to-purple-50/20">
      <StudentSidebar />
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
        .animate-fadeInUp { animation: fadeInUp 0.2s ease-out forwards; }
      `}</style>

      <div className="flex min-h-screen bg-linear-to-br from-gray-50 to-purple-50/20">
        <StudentSidebar />

        <main className="flex-1 md:ml-64 p-6 md:p-8 pb-24 md:pb-8">

          {/* Header */}
          <div className="mb-8" style={{ animation: "fadeIn 0.6s ease forwards" }}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-3xl float-animation">🎓</span>
                  <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">{greeting}</p>
                </div>
                <h1 className="text-4xl md:text-5xl font-black text-gray-900 leading-tight">
                  {displayName}'s{" "}
                  <span className="shimmer-text">Journey</span>
                </h1>
                <p className="text-sm text-gray-400 mt-2">Track your events, certificates, and campus activities</p>
              </div>

              {/* Live Clock */}
              <div className="flex items-center gap-4">
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

          {/* Quick Actions */}
          <div className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">Quick Access</p>
                <h2 className="text-lg font-bold text-gray-800">Explore Features</h2>
              </div>
              <span className="material-symbols-outlined text-gray-300 text-2xl">rocket_launch</span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
              {quickActions.map((action, i) => (
                <QuickActionButton key={i} action={action} onClick={() => navigate(action.path)} index={i} />
              ))}
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Registration Analytics Chart */}
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all"
              style={{ animation: "slideUp 0.5s ease forwards 350ms", opacity: 0 }}>
              <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                <div>
                  <h3 className="text-lg font-black text-gray-800">📊 Registration Analytics</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Hover on bars to see which events you registered for</p>
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
              {chartData.length === 0 || chartData.every(d => d.registrations === 0) ? (
                <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                  <span className="material-symbols-outlined text-[40px] mb-2">bar_chart</span>
                  <p className="text-sm font-semibold">No registration data yet</p>
                  <p className="text-xs mt-1">Register for events to see your activity</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={chartData} barSize={chartType === "yearly" ? 60 : 35}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#9ca3af" }} />
                    <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} allowDecimals={false} />
                    <Tooltip 
                      contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", minWidth: "200px" }}
                      cursor={{ fill: "#f5eefa" }}
                      formatter={(value, name, props) => {
                        const label = props.payload.name;
                        const registrationsOnDate = myRegistrations.filter(reg => {
                          if (!reg.registration_date) return false;
                          const regDate = new Date(reg.registration_date);
                          if (chartType === "weekly") {
                            return regDate.toLocaleDateString("en-PK", { weekday: "short" }) === label;
                          } else if (chartType === "monthly") {
                            return regDate.toLocaleString("en-PK", { month: "short" }) === label;
                          } else {
                            return regDate.getFullYear().toString() === label;
                          }
                        });
                        return (
                          <div className="p-2">
                            <p className="font-bold text-gray-800 mb-2 border-b pb-1">
                              {chartType === "weekly" ? "Day" : chartType === "monthly" ? "Month" : "Year"}: {label}
                            </p>
                            <p className="text-sm text-[#8b4fa2] font-semibold mb-2">
                              📊 {value} registration{value !== 1 ? 's' : ''}
                            </p>
                            {registrationsOnDate.length > 0 ? (
                              <div className="space-y-1 max-h-32 overflow-y-auto">
                                <p className="text-xs font-semibold text-gray-500 mb-1">🎯 Events:</p>
                                {registrationsOnDate.map((reg, idx) => (
                                  <div key={idx} className="text-xs text-gray-600 py-0.5 border-l-2 border-[#8b4fa2] pl-2">
                                    • {reg.event_id?.title || "Unknown Event"}
                                    <span className="text-gray-400 text-[10px] ml-1">
                                      ({new Date(reg.registration_date).toLocaleDateString()})
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-gray-400">No registrations on this {chartType === "weekly" ? "day" : chartType === "monthly" ? "month" : "year"}</p>
                            )}
                          </div>
                        );
                      }}
                    />
                    <Bar dataKey="registrations" name="Registrations" fill="#8b4fa2" radius={[8, 8, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.registrations > 0 ? "#8b4fa2" : "#e5e7eb"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Progress Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all"
              style={{ animation: "slideUp 0.5s ease forwards 450ms", opacity: 0 }}>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-lg font-black text-gray-800">🎯 Your Progress</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Event participation stats</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                  <span className="material-symbols-outlined text-2xl text-[#8b4fa2]" style={{ fontVariationSettings: "'FILL' 1" }}>trending_up</span>
                </div>
              </div>
              <div className="space-y-5">
                {[
                  { label: "Registration to Attendance", value: totalRegistered > 0 ? Math.round((attendedCount / totalRegistered) * 100) : 0, color: "#8b4fa2", bg: "#f5eefa", icon: "event_repeat", sub: `${attendedCount} of ${totalRegistered} attended` },
                  { label: "Certificate Achievement", value: totalRegistered > 0 ? Math.round((certificatesCount / totalRegistered) * 100) : 0, color: "#4ECDC4", bg: "#edfafa", icon: "workspace_premium", sub: `${certificatesCount} of ${totalRegistered} certified` },
                  { label: "Upcoming Commitment", value: totalRegistered > 0 ? Math.round((upcomingCount / totalRegistered) * 100) : 0, color: "#f59e0b", bg: "#fffbeb", icon: "event", sub: `${upcomingCount} events pending` },
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
                <span className="text-gray-400">Overall Engagement</span>
                <span className="font-bold text-gray-700">
                  {totalRegistered > 0 ? Math.round(((attendedCount + certificatesCount) / (totalRegistered * 2)) * 100) : 0}% Active
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Upcoming Events with Hover */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all"
              style={{ animation: "slideUp 0.5s ease forwards 500ms", opacity: 0 }}>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-lg font-black text-gray-800">📅 Your Upcoming Events</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Hover on any event to see details</p>
                </div>
                <button onClick={() => navigate("/student/my-registrations")}
                  className="text-xs font-bold text-[#8b4fa2] hover:underline">View All</button>
              </div>
              {upcomingEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                  <span className="material-symbols-outlined text-5xl mb-3 opacity-50">event_busy</span>
                  <p className="text-sm font-semibold">No upcoming events</p>
                  <button onClick={() => navigate("/student/browse-events")}
                    className="mt-3 text-xs font-semibold text-[#8b4fa2] hover:underline">
                    Browse Events →
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {upcomingEvents.map((reg, i) => (
                    <EventHoverCard key={i} event={reg.event_id} position="upcoming" />
                  ))}
                </div>
              )}
            </div>

            {/* Recent Activity with Hover */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all"
              style={{ animation: "slideUp 0.5s ease forwards 600ms", opacity: 0 }}>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-lg font-black text-gray-800">🏆 Recent Achievements</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Hover on any event to see details</p>
                </div>
                <span className="material-symbols-outlined text-[#4ECDC4]" style={{ fontVariationSettings: "'FILL' 1" }}>celebration</span>
              </div>
              {recentActivities.length === 0 && certificatesCount === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                  <span className="material-symbols-outlined text-5xl mb-3 opacity-50">emoji_events</span>
                  <p className="text-sm font-semibold">No achievements yet</p>
                  <p className="text-xs mt-1">Attend events to earn certificates</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentActivities.slice(0, 3).map((reg, i) => (
                    <EventHoverCard key={i} event={reg.event_id} position="attended" />
                  ))}
                  {certificatesCount > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="flex items-center justify-between p-2">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-amber-500">workspace_premium</span>
                          <span className="text-sm font-semibold text-gray-700">{certificatesCount} Certificates Earned</span>
                        </div>
                        <button onClick={() => navigate("/student/certificates")}
                          className="text-xs font-semibold text-[#8b4fa2] hover:underline">
                          View All →
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* CTA Banner */}
          <div className="mt-6 rounded-2xl p-6 flex items-center justify-between flex-wrap gap-4 shadow-lg"
            style={{ background: "linear-gradient(135deg, #8b4fa2 0%, #4ECDC4 100%)" }}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                <span className="material-symbols-outlined text-white text-[28px]">rocket_launch</span>
              </div>
              <div>
                <p className="text-white font-bold text-lg">Ready for More Adventures?</p>
                <p className="text-purple-100 text-sm mt-0.5">
                  Discover new events and make the most of your campus life!
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate("/student/browse-events")}
              className="bg-white text-[#8b4fa2] text-sm font-bold px-6 py-3 rounded-xl hover:shadow-xl transition-all duration-300 flex items-center gap-2 group"
            >
              <span>Explore Events</span>
              <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition">arrow_forward</span>
            </button>
          </div>
        </main>
      </div>
    </>
  );
};

export default StudentDashboard;