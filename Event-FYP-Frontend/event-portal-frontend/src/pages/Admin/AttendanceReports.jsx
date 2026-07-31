import React, { useEffect, useState, useRef } from "react";
import AdminSidebar from "../../components/AdminSidebar";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend
} from "recharts";
import { Sparkles } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const AttendanceReports = () => {
  const { token } = useAuth();
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState("");
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [toast, setToast] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [animate, setAnimate] = useState(false);
  const [currentTime, setCurrentTime] = useState("");
  const [currentDate, setCurrentDate] = useState("");
  const [greeting, setGreeting] = useState("");
  const [expandedEvent, setExpandedEvent] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Live clock + greeting ──
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

  // Fetch events list for dropdown
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await axios.get(`${API_URL}/events/all`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const list = res.data?.data || res.data?.events || res.data || [];
        setEvents(Array.isArray(list) ? list : []);
      } catch (err) {
        showToast("Events load nahi hue", "error");
      } finally {
        setLoadingEvents(false);
      }
    };
    if (token) fetchEvents();
    setTimeout(() => setAnimate(true), 200);
  }, [token]);

  // Fetch preview whenever selection changes
  useEffect(() => {
    const fetchPreview = async () => {
      setLoadingPreview(true);
      setPreviewData(null);
      try {
        const url = selectedEvent
          ? `${API_URL}/registrations/attendance-report/preview?event_id=${selectedEvent}`
          : `${API_URL}/registrations/attendance-report/preview`;

        const res = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setPreviewData(res.data);
      } catch (err) {
        console.error(err);
        showToast("Preview load nahi hua", "error");
      } finally {
        setLoadingPreview(false);
      }
    };
    if (token) fetchPreview();
  }, [selectedEvent, token]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const url = selectedEvent
        ? `${API_URL}/registrations/attendance-report/export?event_id=${selectedEvent}`
        : `${API_URL}/registrations/attendance-report/export`;

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob",
      });

      const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = blobUrl;
      link.setAttribute(
        "download",
        selectedEvent
          ? `attendance-report-${Date.now()}.xlsx`
          : `attendance-report-all-events-${Date.now()}.xlsx`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);

      showToast("✅ Attendance report downloaded!", "success");
    } catch (err) {
      console.error(err);
      showToast("Report export nahi ho saka", "error");
    } finally {
      setExporting(false);
    }
  };

  const formatDate = (d) => {
    if (!d) return "TBA";
    return new Date(d).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" });
  };

  const filteredStudents = previewData?.students?.filter(s =>
    s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Pie chart colors
  const PIE_COLORS = ["#10b981", "#ef4444"];

  // Get attendance data for pie chart
  const getPieData = () => {
    if (!previewData?.stats) return [];
    return [
      { name: "Present", value: previewData.stats.present || 0 },
      { name: "Absent", value: previewData.stats.notPresent || 0 },
    ];
  };

  return (
    <>
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
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
        .shimmer-text {
          background: linear-gradient(90deg, #9B59B6, #4ECDC4, #FF6B6B, #9B59B6);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 4s linear infinite;
        }
        .animate-slideUp {
          animation: slideUp 0.5s ease forwards;
        }
        .stat-card {
          transition: all 0.3s ease;
        }
        .stat-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 40px rgba(155, 89, 182, 0.15);
        }
        @media (max-width: 640px) {
          .hide-mobile { display: none; }
          .table-wrap { font-size: 12px; }
          .table-wrap th, .table-wrap td { padding: 8px 10px; }
        }
      `}</style>

      <div className="flex min-h-screen" style={{ background: "#f7f4fb" }}>
        <AdminSidebar />

        <main className="flex-1 md:ml-64 pb-24 md:pb-8">
          {/* ── HEADER BANNER ── */}
          <div
            className="relative overflow-hidden px-6 pt-6 pb-8"
            style={{ background: "linear-gradient(135deg,#9B59B6 0%,#6d3483 100%)" }}
          >
            <div className="relative z-10 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-4 rounded-full bg-[#FFE66D] text-[#1A1A1A] text-xs font-black tracking-widest uppercase shadow-lg">
                  <Sparkles size={14} />
                  Admin Portal
                </div>
                <h1 className="text-4xl font-black text-white leading-tight tracking-tight">
                  Attendance <span className="text-[#FFE66D]">Reports</span>
                </h1>
                <p className="text-purple-200 text-sm mt-1 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FFE66D] animate-pulse" />
                  Preview and generate attendance reports for events
                </p>
              </div>

              <div className="flex flex-col items-end gap-2">
                <div className="flex items-center gap-3 bg-white/15 backdrop-blur-sm rounded-2xl px-5 py-2.5">
                  <div className="relative">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping opacity-75" />
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-purple-200 font-semibold uppercase tracking-wider">Live</p>
                    <p className="text-xl font-black text-white leading-tight font-mono">{currentTime}</p>
                  </div>
                </div>
                <p className="text-xs text-purple-200 font-medium">{currentDate}</p>
              </div>
            </div>
          </div>

          {/* Toast Notification */}
          {toast && (
            <div className="fixed top-20 right-6 z-50 px-5 py-3 rounded-xl text-white text-sm font-semibold shadow-lg transition-all animate-fadeIn max-w-[90%] sm:max-w-full"
              style={{ background: toast.type === "success" ? "linear-gradient(135deg,#9B59B6,#6d3483)" : "linear-gradient(135deg,#ef4444,#dc2626)" }}>
              {toast.msg}
            </div>
          )}

          <div className="px-6 pt-6 max-w-7xl mx-auto">

            {/* ── Event Selector Card ── */}
            <div className="bg-white rounded-2xl p-5 mb-5 animate-slideUp"
              style={{
                boxShadow: "0 4px 24px rgba(155,89,182,0.09)",
                border: "1px solid rgba(155,89,182,0.08)"
              }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[#8b4fa2] text-xl">fact_check</span>
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Select Event</p>
                  <p className="text-xs font-bold text-gray-700">Choose an event to view attendance</p>
                </div>
              </div>

              {loadingEvents ? (
                <div className="flex items-center justify-center py-6">
                  <div className="w-6 h-6 border-3 border-[#9B59B6] border-t-transparent rounded-full animate-spin" />
                  <span className="ml-3 text-xs text-gray-500">Loading events...</span>
                </div>
              ) : (
                <div className="relative">
                  <select
                    value={selectedEvent}
                    onChange={(e) => setSelectedEvent(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-purple-100 focus:border-[#8b4fa2] focus:outline-none transition-colors bg-white text-gray-700 text-sm appearance-none cursor-pointer"
                  >
                    <option value="">📊 All Events (Summary Report)</option>
                    {events.map((ev) => (
                      <option key={ev._id} value={ev._id}>
                        {ev.title} {!ev.approved && "(Pending)"}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <span className="material-symbols-outlined text-purple-500 text-xl">expand_more</span>
                  </div>
                </div>
              )}
            </div>

            {/* ── Preview Section ── */}
            {loadingPreview ? (
              <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl"
                style={{ boxShadow: "0 4px 24px rgba(155,89,182,0.09)" }}>
                <div className="relative">
                  <div className="w-10 h-10 rounded-full border-4 border-[#9B59B6] border-t-transparent animate-spin" />
                  <div className="absolute inset-0 w-10 h-10 rounded-full border-4 border-[#4ECDC4] border-b-transparent animate-spin opacity-50"
                    style={{ animationDirection: "reverse" }} />
                </div>
                <p className="text-sm text-gray-500 mt-3 font-semibold">Loading report preview...</p>
              </div>
            ) : previewData?.mode === "single" ? (
              <>
                {/* ── Stats Cards ── */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
                  {[
                    { label: "Total Registered", value: previewData.stats.total, color: "#8b4fa2", icon: "groups" },
                    { label: "Present", value: previewData.stats.present, color: "#10b981", icon: "check_circle" },
                    { label: "Absent", value: previewData.stats.notPresent, color: "#ef4444", icon: "do_not_disturb" },
                  ].map((stat, i) => (
                    <div
                      key={i}
                      className="bg-white rounded-2xl p-4 text-center stat-card"
                      style={{
                        boxShadow: "0 4px 20px rgba(155,89,182,0.08)",
                        border: "1px solid rgba(155,89,182,0.06)",
                        animation: `slideUp 0.5s ease forwards ${i * 100 + 300}ms`,
                        opacity: 0
                      }}
                    >
                      <div className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2"
                        style={{ background: `${stat.color}15` }}>
                        <span className="material-symbols-outlined text-xl" style={{ color: stat.color }}>{stat.icon}</span>
                      </div>
                      <p className="text-2xl font-black text-gray-800">{stat.value}</p>
                      <p className="text-[10px] text-gray-500 font-semibold mt-0.5">{stat.label}</p>
                    </div>
                  ))}
                </div>

                {/* ── Chart + Table ── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
                  {/* Pie Chart */}
                  <div
                    className="bg-white rounded-2xl p-5"
                    style={{
                      boxShadow: "0 4px 20px rgba(155,89,182,0.08)",
                      border: "1px solid rgba(155,89,182,0.06)",
                      animation: "slideUp 0.5s ease forwards 500ms",
                      opacity: 0
                    }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="text-sm font-black text-gray-800">📊 Attendance</h3>
                        <p className="text-[10px] text-gray-400 mt-0.5">Present vs Absent</p>
                      </div>
                    </div>
                    <ResponsiveContainer width="100%" height={160}>
                      <PieChart>
                        <Pie
                          data={getPieData()}
                          cx="50%"
                          cy="50%"
                          innerRadius={35}
                          outerRadius={65}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {getPieData().map((_, idx) => (
                            <Cell key={idx} fill={PIE_COLORS[idx]} stroke="none" />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex justify-center gap-4 mt-1">
                      {getPieData().map((item, i) => (
                        <div key={i} className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[i] }} />
                          <span className="text-[10px] text-gray-500 font-semibold">{item.name} ({item.value})</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Student List */}
                  <div
                    className="lg:col-span-2 bg-white rounded-2xl overflow-hidden"
                    style={{
                      boxShadow: "0 4px 20px rgba(155,89,182,0.08)",
                      border: "1px solid rgba(155,89,182,0.06)",
                      animation: "slideUp 0.5s ease forwards 550ms",
                      opacity: 0
                    }}
                  >
                    <div className="px-5 pt-4 pb-3 border-b border-purple-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                          {previewData.event?.title} — Registered Students
                        </p>
                        <p className="text-xs font-bold text-gray-700">{previewData.students.length} students</p>
                      </div>
                      <div className="relative w-full sm:w-auto">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">search</span>
                        <input
                          type="text"
                          placeholder="Search..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full sm:w-auto pl-8 pr-3 py-1.5 text-xs rounded-xl border-2 border-purple-100 focus:border-[#8b4fa2] focus:outline-none transition-colors"
                        />
                      </div>
                    </div>

                    {filteredStudents.length === 0 ? (
                      <div className="text-center py-8 text-gray-400">
                        <span className="material-symbols-outlined text-3xl mb-2 opacity-50">group_off</span>
                        <p className="text-sm font-semibold">No registrations found</p>
                      </div>
                    ) : (
                      <div className="max-h-60 overflow-y-auto table-wrap">
                        <table className="w-full text-xs">
                          <thead className="sticky top-0 bg-gray-50">
                            <tr className="text-left">
                              <th className="px-3 py-2 font-bold text-gray-600 text-[10px] uppercase">Name</th>
                              <th className="px-3 py-2 font-bold text-gray-600 text-[10px] uppercase hide-mobile">Email</th>
                              <th className="px-3 py-2 font-bold text-gray-600 text-[10px] uppercase">Role</th>
                              <th className="px-3 py-2 font-bold text-gray-600 text-[10px] uppercase">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {filteredStudents.map((s, idx) => (
                              <tr key={s._id} className="hover:bg-purple-50/30 transition">
                                <td className="px-3 py-2 font-semibold text-gray-800">
                                  <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                                      style={{ background: `linear-gradient(135deg, ${['#9B59B6','#4ECDC4','#FF6B6B','#f59e0b','#6366f1'][idx % 5]}, ${['#6d3483','#2e9b8a','#cc5555','#c47a08','#4f46e5'][idx % 5]})` }}>
                                      {s.name?.charAt(0)?.toUpperCase()}
                                    </div>
                                    <span className="truncate max-w-20">{s.name}</span>
                                  </div>
                                </td>
                                <td className="px-3 py-2 text-gray-500 text-[10px] hide-mobile">{s.email}</td>
                                <td className="px-3 py-2">
                                  <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${s.role === "Volunteer" ? "bg-teal-100 text-teal-600" : "bg-purple-100 text-[#8b4fa2]"}`}>
                                    {s.role}
                                  </span>
                                </td>
                                <td className="px-3 py-2">
                                  <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${s.status === "Present" ? "bg-green-100 text-green-600" : "bg-amber-100 text-amber-600"}`}>
                                    {s.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : previewData?.mode === "all" ? (
              <>
                {/* ── All Events Stats ── */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                  {[
                    { label: "Total Events", value: previewData.stats.totalEvents, color: "#8b4fa2", icon: "event" },
                    { label: "Registrations", value: previewData.stats.totalRegistrations, color: "#4ECDC4", icon: "app_registration" },
                    { label: "Present", value: previewData.stats.totalPresent, color: "#10b981", icon: "check_circle" },
                    { label: "Absent", value: previewData.stats.totalNotPresent, color: "#ef4444", icon: "do_not_disturb" },
                  ].map((stat, i) => (
                    <div
                      key={i}
                      className="bg-white rounded-2xl p-3 text-center stat-card"
                      style={{
                        boxShadow: "0 4px 20px rgba(155,89,182,0.08)",
                        border: "1px solid rgba(155,89,182,0.06)",
                        animation: `slideUp 0.5s ease forwards ${i * 100 + 300}ms`,
                        opacity: 0
                      }}
                    >
                      <div className="w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-1"
                        style={{ background: `${stat.color}15` }}>
                        <span className="material-symbols-outlined text-base" style={{ color: stat.color }}>{stat.icon}</span>
                      </div>
                      <p className="text-lg font-black text-gray-800">{stat.value}</p>
                      <p className="text-[8px] text-gray-500 font-semibold">{stat.label}</p>
                    </div>
                  ))}
                </div>

                {/* ── Events Table ── */}
                <div
                  className="bg-white rounded-2xl overflow-hidden"
                  style={{
                    boxShadow: "0 4px 24px rgba(155,89,182,0.09)",
                    border: "1px solid rgba(155,89,182,0.08)",
                    animation: "slideUp 0.5s ease forwards 500ms",
                    opacity: 0
                  }}
                >
                  <div className="px-5 pt-4 pb-3 border-b border-purple-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Event-wise Summary</p>
                      <p className="text-xs font-bold text-gray-700">{previewData.summary.length} events</p>
                    </div>
                    <span className="text-[8px] text-gray-400">Click row for details</span>
                  </div>

                  {previewData.summary.length === 0 ? (
                    <div className="text-center py-10 text-gray-400">
                      <span className="material-symbols-outlined text-4xl mb-2 opacity-50">event_busy</span>
                      <p className="text-sm font-semibold">No events found</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto table-wrap">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-purple-50/50 text-left">
                            <th className="px-3 py-2 font-bold text-gray-600 text-[10px] uppercase">Event</th>
                            <th className="px-3 py-2 font-bold text-gray-600 text-[10px] uppercase hide-mobile">Date</th>
                            <th className="px-3 py-2 font-bold text-gray-600 text-[10px] uppercase">Total</th>
                            <th className="px-3 py-2 font-bold text-gray-600 text-[10px] uppercase hide-mobile">Present</th>
                            <th className="px-3 py-2 font-bold text-gray-600 text-[10px] uppercase hide-mobile">Absent</th>
                            <th className="px-3 py-2 font-bold text-gray-600 text-[10px] uppercase">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {previewData.summary.map((s) => (
                            <React.Fragment key={s.event_id}>
                              <tr
                                className="hover:bg-purple-50/30 transition cursor-pointer"
                                onClick={() => {
                                  if (expandedEvent === s.event_id) {
                                    setExpandedEvent(null);
                                  } else {
                                    setExpandedEvent(s.event_id);
                                    setSelectedEvent(s.event_id);
                                  }
                                }}
                              >
                                <td className="px-3 py-2 font-semibold text-gray-800 truncate max-w-25">{s.title}</td>
                                <td className="px-3 py-2 text-gray-500 text-[10px] hide-mobile">{formatDate(s.date)}</td>
                                <td className="px-3 py-2 text-gray-600 font-bold">{s.total}</td>
                                <td className="px-3 py-2 text-emerald-600 font-bold hide-mobile">{s.present}</td>
                                <td className="px-3 py-2 text-red-500 font-bold hide-mobile">{s.notPresent}</td>
                                <td className="px-3 py-2">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedEvent(s.event_id);
                                    }}
                                    className="text-[10px] font-bold text-[#8b4fa2] hover:underline flex items-center gap-0.5"
                                  >
                                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                                    <span className="hidden sm:inline">View</span>
                                  </button>
                                </td>
                              </tr>
                              {expandedEvent === s.event_id && (
                                <tr className="bg-purple-50/20 sm:hidden">
                                  <td colSpan="6" className="px-3 py-2">
                                    <div className="grid grid-cols-2 gap-1 text-xs">
                                      <div><span className="text-gray-500">Date:</span> {formatDate(s.date)}</div>
                                      <div><span className="text-gray-500">Present:</span> <span className="text-emerald-600 font-bold">{s.present}</span></div>
                                      <div><span className="text-gray-500">Absent:</span> <span className="text-red-500 font-bold">{s.notPresent}</span></div>
                                      <div><span className="text-gray-500">Total:</span> <span className="font-bold">{s.total}</span></div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  <p className="text-[10px] text-gray-400 px-5 py-2 border-t border-gray-50">
                    💡 Tip: Click any event row or "View" button to see detailed attendance
                  </p>
                </div>
              </>
            ) : null}

            {/* ── Download Button ── */}
            <div
              className="bg-white rounded-2xl p-5 mt-5"
              style={{
                boxShadow: "0 4px 24px rgba(155,89,182,0.09)",
                border: "1px solid rgba(155,89,182,0.08)",
                animation: "slideUp 0.5s ease forwards 600ms",
                opacity: 0
              }}
            >
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-center sm:text-left">
                  <p className="text-sm font-bold text-gray-700">
                    {selectedEvent
                      ? `📄 ${previewData?.event?.title || 'Event'} Report`
                      : '📊 Complete Attendance Report'}
                  </p>
                  <p className="text-[10px] text-gray-400">
                    {selectedEvent
                      ? `${previewData?.students?.length || 0} students • ${previewData?.stats?.present || 0} present • ${previewData?.stats?.notPresent || 0} absent`
                      : `${previewData?.stats?.totalEvents || 0} events • ${previewData?.stats?.totalRegistrations || 0} registrations`}
                  </p>
                </div>
                <button
                  onClick={handleExport}
                  disabled={exporting || loadingPreview}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-white font-bold shadow-md hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transform hover:scale-105 text-sm"
                  style={{ background: "linear-gradient(135deg,#9B59B6,#6d3483)" }}
                >
                  {exporting ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-base">download</span>
                      <span className="hidden sm:inline">Download Excel Report</span>
                      <span className="sm:hidden">Download</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default AttendanceReports;