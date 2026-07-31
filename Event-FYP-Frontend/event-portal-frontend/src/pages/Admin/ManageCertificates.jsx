import React, { useEffect, useState } from "react";
import AdminSidebar from "../../components/AdminSidebar";
import axios from 'axios'; 
import { useAuth } from "../../context/AuthContext";
import {
  Award,
  Search,
  RefreshCw,
  Sparkles,
  AlertCircle,
  X,
  Download,
  Eye,
  User,
  Calendar,
  CheckCircle,
  ChevronDown,
  Clock,
  CalendarDays,
  GraduationCap,
  Building
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const COLORS = {
  purple: "#8b4fa2",
  purpleDeep: "#5B2C6F",
  turquoise: "#4ECDC4",
  coral: "#FF6B6B",
  yellow: "#FFE66D",
  ink: "#1A1A1A",
  paper: "#FAF9FC",
  line: "#ECE6F4",
  success: "#10b981",
  pending: "#f59e0b",
  danger: "#ef4444",
};

const ManageCertificates = () => {
  const { token } = useAuth();

  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toast, setToast] = useState(null);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [previewCertificate, setPreviewCertificate] = useState(null);
  const [events, setEvents] = useState([]);
  const [timeFilter, setTimeFilter] = useState("all");

  // Statistics
  const [stats, setStats] = useState({
    total: 0,
    today: 0
  });

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (token) {
      fetchCertificates();
      fetchEvents();
    } else {
      setLoading(false);
      setError("Please login to view certificates");
    }
  }, [token]);

  // ─── FETCH CERTIFICATES ───
  const fetchCertificates = async () => {
    try {
      setLoading(true);
      setError("");
      setIsRefreshing(true);

      if (!token) {
        setError("Authentication required.");
        setLoading(false);
        return;
      }

      const res = await axios.get(`${API_URL}/certificates`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      let list = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.data)
        ? res.data.data
        : [];

      // ✅ Time filter
      if (timeFilter !== "all") {
        const now = new Date();
        let startDate = new Date();
        
        if (timeFilter === "week") {
          startDate.setDate(now.getDate() - 7);
        } else if (timeFilter === "month") {
          startDate.setMonth(now.getMonth() - 1);
        }
        
        list = list.filter(c => {
          if (!c.issued_date) return false;
          const issueDate = new Date(c.issued_date);
          return issueDate >= startDate && issueDate <= now;
        });
      }

      // ✅ Search filter
      if (search) {
        const q = search.toLowerCase();
        list = list.filter(c =>
          c.student_id?.name?.toLowerCase().includes(q) ||
          c.event_id?.title?.toLowerCase().includes(q) ||
          c.certificate_type?.toLowerCase().includes(q) ||
          c.student_id?.email?.toLowerCase().includes(q)
        );
      }

      setCertificates(list);
      calculateStats(list);
    } catch (err) {
      console.error("Fetch certificates error:", err);
      if (err.response?.status === 401) {
        setError("Session expired. Please login again.");
      } else {
        setError("Failed to load certificates.");
      }
      setCertificates([]);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // ─── CALCULATE STATS ───
  const calculateStats = (data) => {
    const today = new Date().toDateString();
    const todayCount = data.filter(c => 
      c.issued_date && new Date(c.issued_date).toDateString() === today
    ).length;

    setStats({
      total: data.length,
      today: todayCount
    });
  };

  // ─── FETCH EVENTS ───
  const fetchEvents = async () => {
    try {
      const res = await axios.get(`${API_URL}/events/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
  
      const list = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.events)
        ? res.data.events
        : Array.isArray(res.data?.data)
        ? res.data.data
        : [];

      const approvedEvents = list.filter((e) => e.approved === true);
      setEvents(approvedEvents);
    } catch (err) {
      console.error("Failed to fetch events:", err);
      setEvents([]);
    }
  };

  // ─── DOWNLOAD CERTIFICATE ───
  const handleDownloadCertificate = async (certificateId) => {
    try {
      const response = await axios.get(
        `${API_URL}/certificates/download/${certificateId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `certificate_${certificateId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      showToast("Certificate downloaded successfully!", "success");
    } catch (err) {
      console.error("Download error:", err);
      showToast("Failed to download certificate", "error");
    }
  };

  // ─── CLEAR FILTERS ───
  const clearFilters = () => {
    setSearch("");
    setTimeFilter("all");
    fetchCertificates();
  };

  const formatDate = (d) => {
    if (!d) return "N/A";
    return new Date(d).toLocaleDateString("en-PK", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatDateLong = (d) => {
    if (!d) return "N/A";
    return new Date(d).toLocaleDateString("en-PK", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const formatTime = (d) => {
    if (!d) return "N/A";
    return new Date(d).toLocaleTimeString("en-PK", {
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const hasActiveFilters = search || timeFilter !== "all";

  if (!token) {
    return (
      <div className="flex min-h-screen" style={{ background: COLORS.paper }}>
        <AdminSidebar />
        <main className="flex-1 md:ml-64 flex items-center justify-center">
          <div className="text-center p-8">
            <div className="w-20 h-20 mx-auto rounded-full bg-red-100 flex items-center justify-center mb-4">
              <AlertCircle size={36} className="text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Authentication Required</h2>
            <p className="text-gray-500 mt-2">Please login to access certificates</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen" style={{ background: COLORS.paper }}>
      <AdminSidebar />

      <main className="flex-1 md:ml-64 pb-24 md:pb-6">

        {/* ── HEADER BANNER ── */}
        <div
          className="relative overflow-hidden px-6 pt-6 pb-10"
          style={{ background: "linear-gradient(135deg,#8b4fa2 0%,#6d3483 100%)" }}
        >


          <div className="relative z-10 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-4 rounded-full bg-[#FFE66D] text-[#1A1A1A] text-xs font-black tracking-widest uppercase shadow-lg">
              
                Admin Portal
              </div>
              <h1 className="text-4xl font-black text-white leading-tight tracking-tight">
                Certificate <span>Management</span>
              </h1>
              <p className="text-purple-200 text-sm mt-1 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FFE66D] animate-pulse" />
                View and manage all issued certificates
              </p>
            </div>

            <div className="flex gap-2 flex-wrap">
              {[
                { label: "Total", value: stats.total, color: "#FFE66D", icon: <Award size={14} /> },
                { label: "Today", value: stats.today, color: "#4ECDC4", icon: <Clock size={14} /> },
              ].map((s) => (
                <div
                  key={s.label}
                  className="flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 hover:scale-105 hover:shadow-lg"
                  style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(8px)" }}
                >
                  <span className="text-white/70">{s.icon}</span>
                  <span className="text-xl font-black" style={{ color: s.color }}>
                    {s.value}
                  </span>
                  <span className="text-white/70 text-xs font-semibold">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 pt-6">
          {/* ── TOAST ── */}
          {toast && (
            <div
              className={`fixed top-20 right-6 z-50 flex items-center gap-3 px-6 py-4 rounded-2xl text-sm font-semibold shadow-2xl animate-fadeIn border ${
                toast.type === "success"
                  ? "bg-[#1A1A1A] text-white border-[#333] shadow-purple-500/10"
                  : toast.type === "info"
                  ? "bg-blue-50 text-blue-800 border-blue-200 shadow-blue-500/10"
                  : "bg-[#3A1414] text-white border-[#5c2222] shadow-red-500/10"
              }`}
            >
              {toast.type === "success" ? (
                <CheckCircle size={20} style={{ color: COLORS.turquoise }} className="shrink-0" />
              ) : toast.type === "info" ? (
                <AlertCircle size={20} style={{ color: "#3b82f6" }} className="shrink-0" />
              ) : (
                <AlertCircle size={20} style={{ color: COLORS.coral }} className="shrink-0" />
              )}
              <span>{toast.msg}</span>
            </div>
          )}

          {/* ── STATISTICS CARDS ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Certificates</p>
                  <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                  <Award size={24} style={{ color: COLORS.purple }} />
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-400">
                All certificates issued
              </div>
            </div>
            
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Issued Today</p>
                  <p className="text-2xl font-bold text-teal-600">{stats.today}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center">
                  <Clock size={24} className="text-teal-600" />
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-400">
                {stats.today > 0 ? "📈 Active today" : "📊 No activity today"}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Events</p>
                  <p className="text-2xl font-bold text-gray-800">{events.length}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
                  <CalendarDays size={24} style={{ color: "#f59e0b" }} />
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-400">
                {events.length > 0 ? "Approved events" : "No events yet"}
              </div>
            </div>
          </div>

          {/* ── ACTION BAR ── */}
          <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100/80 mb-6 backdrop-blur-sm">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <Search size={20} />
                </div>
                <input
                  type="text"
                  placeholder="Search by student name, event, or certificate type..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    if (e.target.value === "") fetchCertificates();
                  }}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") fetchCertificates();
                  }}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-gray-100 bg-gray-50/50 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#8b4fa2] focus:border-transparent transition-all duration-300 hover:border-gray-200"
                />
              </div>

              <div className="relative min-w-40">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <CalendarDays size={18} />
                </div>
                <select
                  value={timeFilter}
                  onChange={(e) => {
                    setTimeFilter(e.target.value);
                    fetchCertificates();
                  }}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-gray-100 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#8b4fa2] focus:border-transparent appearance-none cursor-pointer transition-all duration-300"
                >
                  <option value="all">All Time</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                  <ChevronDown size={18} />
                </div>
              </div>

              <button
                onClick={() => fetchCertificates()}
                disabled={isRefreshing}
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white border-2 border-gray-100 text-gray-600 hover:border-[#8b4fa2] hover:text-[#8b4fa2] transition-all duration-300 disabled:opacity-50"
              >
                <RefreshCw size={18} className={`${isRefreshing ? "animate-spin" : ""}`} />
                <span className="font-medium">Refresh</span>
              </button>
            </div>
          </div>

          {/* ── ACTIVE FILTERS BADGES ── */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="text-xs text-gray-500 font-medium">Active Filters:</span>
              {search && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                  <Search size={12} />
                  {search}
                  <button onClick={() => { setSearch(""); fetchCertificates(); }} className="hover:text-purple-900">
                    <X size={14} />
                  </button>
                </span>
              )}
              {timeFilter !== "all" && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                  <CalendarDays size={12} />
                  {timeFilter === "week" ? "This Week" : "This Month"}
                  <button onClick={() => { setTimeFilter("all"); fetchCertificates(); }} className="hover:text-blue-900">
                    <X size={14} />
                  </button>
                </span>
              )}
              <button
                onClick={clearFilters}
                className="text-xs text-red-400 font-medium hover:text-red-600 transition"
              >
                Clear All
              </button>
            </div>
          )}

          {error && (
            <div
              className="flex items-center gap-3 rounded-xl px-5 py-3.5 mb-5 text-sm font-medium border border-red-200"
              style={{ background: "#FDF1F1", color: "#B23A3A" }}
            >
              <AlertCircle size={18} className="shrink-0" />
              {error}
            </div>
          )}

          {/* ── CERTIFICATES TABLE ── */}
          {loading ? (
            <div className="flex flex-col items-center justify-center h-72 gap-4">
              <div className="relative">
                <div
                  className="w-12 h-12 rounded-full border-[3px] animate-spin"
                  style={{ borderColor: COLORS.line, borderTopColor: COLORS.purple }}
                />
                <div
                  className="absolute inset-0 w-12 h-12 rounded-full border-[3px] animate-ping opacity-20"
                  style={{ borderColor: COLORS.purple }}
                />
              </div>
              <p className="text-sm font-medium" style={{ color: "#9A90A8" }}>
                Loading certificates…
              </p>
            </div>
          ) : certificates.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center h-72 rounded-2xl border-2 border-dashed text-center p-8"
              style={{ borderColor: "#DED4EA", background: "#ffffff" }}
            >
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
                style={{ background: "#F3ECFA" }}
              >
                <Award size={36} style={{ color: COLORS.purple }} />
              </div>
              <p className="text-lg font-bold" style={{ color: COLORS.ink }}>
                {search || timeFilter !== "all" ? "No certificates found" : "No certificates issued yet"}
              </p>
              <p className="text-sm mt-1.5" style={{ color: "#9A90A8" }}>
                {search || timeFilter !== "all" ? "Try adjusting your filters." : "Certificates issued by organizers will appear here."}
              </p>
              {(search || timeFilter !== "all") && (
                <button
                  onClick={clearFilters}
                  className="mt-4 text-sm font-semibold text-[#8b4fa2] hover:underline transition"
                >
                  Clear all filters
                </button>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-linear-to-r from-purple-50 to-pink-50 border-b border-gray-200">
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Student</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Event</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Organizer</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Department</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Issue Date</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {certificates.map((cert) => (
                    <tr
                      key={cert._id}
                      className="hover:bg-purple-50/30 transition-all duration-200 cursor-pointer group"
                      onClick={() => setSelectedCertificate(cert)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-sm group-hover:scale-110 transition-transform">
                            {cert.student_id?.name?.charAt(0)?.toUpperCase() || "S"}
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-gray-800">{cert.student_id?.name || "Unknown"}</p>
                            <p className="text-xs text-gray-400">{cert.student_id?.email || "No email"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-gray-700">{cert.event_id?.title || "Unknown"}</p>
                        <p className="text-xs text-gray-400 font-mono">#{cert.certificate_number || cert._id.slice(-6)}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-700">{cert.organizer_id?.name || "Unknown"}</p>
                        <p className="text-xs text-gray-400">{cert.organizer_id?.email || ""}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <p className="text-sm text-gray-700">{cert.student_id?.department || "N/A"}</p>
                          <p className="text-xs text-gray-400">{cert.student_id?.grade || ""}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-700">{formatDate(cert.issued_date)}</p>
                        <p className="text-xs text-gray-400">{formatTime(cert.issued_date)}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setPreviewCertificate(cert)}
                            className="p-2 rounded-lg bg-purple-50 hover:bg-purple-100 transition-all duration-300 hover:scale-110"
                            title="Preview"
                          >
                            <Eye size={16} className="text-[#8b4fa2]" />
                          </button>
                          <button
                            onClick={() => handleDownloadCertificate(cert._id)}
                            className="p-2 rounded-lg bg-blue-50 hover:bg-blue-100 transition-all duration-300 hover:scale-110"
                            title="Download"
                          >
                            <Download size={16} className="text-blue-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* ─── CERTIFICATE DETAILS MODAL ─── */}
      {selectedCertificate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md px-4"
          onClick={() => setSelectedCertificate(null)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fadeIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Award size={22} style={{ color: COLORS.purple }} />
                Certificate Details
              </h2>
              <button
                onClick={() => setSelectedCertificate(null)}
                className="p-2 rounded-xl hover:bg-gray-100 transition-all duration-300"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-gray-50">
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider flex items-center gap-1">
                    <User size={14} /> Student
                  </p>
                  <p className="font-semibold text-gray-800 mt-1">{selectedCertificate.student_id?.name || "N/A"}</p>
                  <p className="text-sm text-gray-500">{selectedCertificate.student_id?.email || "N/A"}</p>
                </div>
                <div className="p-4 rounded-xl bg-gray-50">
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider flex items-center gap-1">
                    <GraduationCap size={14} /> Department
                  </p>
                  <p className="font-semibold text-gray-800 mt-1">{selectedCertificate.student_id?.department || "N/A"}</p>
                  <p className="text-sm text-gray-500">Grade: {selectedCertificate.student_id?.grade || "N/A"}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-gray-50">
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider flex items-center gap-1">
                    <CalendarDays size={14} /> Event
                  </p>
                  <p className="font-semibold text-gray-800 mt-1">{selectedCertificate.event_id?.title || "N/A"}</p>
                  <p className="text-sm text-gray-500">{selectedCertificate.event_id?.venue || "N/A"}</p>
                </div>
                <div className="p-4 rounded-xl bg-gray-50">
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider flex items-center gap-1">
                    <Building size={14} /> Organizer
                  </p>
                  <p className="font-semibold text-gray-800 mt-1">{selectedCertificate.organizer_id?.name || "N/A"}</p>
                  <p className="text-sm text-gray-500">{selectedCertificate.organizer_id?.email || "N/A"}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-gray-50">
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Certificate ID</p>
                  <p className="font-semibold text-gray-800 mt-1 font-mono">{selectedCertificate.certificate_number || selectedCertificate._id}</p>
                  <p className="text-sm text-gray-500">Type: {selectedCertificate.certificate_type || "Standard"}</p>
                </div>
                <div className="p-4 rounded-xl bg-gray-50">
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Issue Date</p>
                  <p className="font-semibold text-gray-800 mt-1">{formatDateLong(selectedCertificate.issued_date)}</p>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                  onClick={() => {
                    handleDownloadCertificate(selectedCertificate._id);
                    setSelectedCertificate(null);
                  }}
                  className="flex-1 py-3 rounded-xl text-sm font-bold text-white transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 flex items-center justify-center gap-2"
                  style={{ background: "linear-gradient(135deg, #8b4fa2, #6d3483)" }}
                >
                  <Download size={18} />
                  Download PDF
                </button>
                <button
                  onClick={() => setSelectedCertificate(null)}
                  className="flex-1 py-3 rounded-xl text-sm font-bold border-2 border-gray-200 text-gray-600 hover:bg-gray-50 transition-all duration-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── PREVIEW CERTIFICATE MODAL ─── */}
      {previewCertificate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md px-4"
          onClick={() => setPreviewCertificate(null)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto animate-fadeIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative p-8">
              <button
                onClick={() => setPreviewCertificate(null)}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 hover:scale-110 transition-all duration-300"
              >
                <X size={20} />
              </button>

              <div className="text-center mb-6">
                <div
                  className="w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 shadow-lg"
                  style={{ background: "linear-gradient(135deg, #F3ECFA, #E8DCF5)" }}
                >
                  <Award size={36} style={{ color: COLORS.purple }} />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Certificate Preview</h2>
                <p className="text-sm text-gray-500 mt-1">ID: {previewCertificate.certificate_number || previewCertificate._id}</p>
              </div>

              <div
                className="rounded-3xl p-8 border-4"
                style={{ borderColor: COLORS.purple, background: "white" }}
              >
                <div className="text-center">
                  <div className="text-6xl mb-4">🏆</div>
                  <h1 className="text-3xl font-bold" style={{ color: COLORS.purple }}>
                    Certificate of {previewCertificate.certificate_type || "Participation"}
                  </h1>
                  <div className="w-24 h-1 mx-auto my-4 rounded-full" style={{ background: COLORS.purple }} />
                  <p className="text-gray-600">This certificate is proudly presented to</p>
                  <h2 className="text-4xl font-bold mt-3" style={{ color: COLORS.turquoise }}>
                    {previewCertificate.student_id?.name || "Student"}
                  </h2>
                  <p className="text-sm text-gray-400 mt-1">
                    {previewCertificate.student_id?.email || "No email"}
                  </p>
                  <p className="text-sm text-gray-400">
                    {previewCertificate.student_id?.department || "Department"} • {previewCertificate.student_id?.grade || "Grade"}
                  </p>
                  <div className="mt-6">
                    <p className="text-gray-600">for successfully participating in</p>
                    <h3 className="text-2xl font-bold mt-2" style={{ color: COLORS.purple }}>
                      {previewCertificate.event_id?.title || "Event"}
                    </h3>
                    <p className="text-sm text-gray-400 mt-2">
                      📅 {formatDate(previewCertificate.event_id?.start_date)} &nbsp;|&nbsp; 📍 {previewCertificate.event_id?.venue || "N/A"}
                    </p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-400">
                      Issued on: {formatDateLong(previewCertificate.issued_date)}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Organized by: {previewCertificate.organizer_id?.name || "Unknown"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    handleDownloadCertificate(previewCertificate._id);
                    setPreviewCertificate(null);
                  }}
                  className="flex-1 py-3.5 rounded-xl text-sm font-bold text-white transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 flex items-center justify-center gap-2"
                  style={{ background: "linear-gradient(135deg, #8b4fa2, #6d3483)" }}
                >
                  <Download size={18} />
                  Download PDF
                </button>
                <button
                  onClick={() => {
                    setSelectedCertificate(previewCertificate);
                    setPreviewCertificate(null);
                  }}
                  className="flex-1 py-3.5 rounded-xl text-sm font-bold transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 flex items-center justify-center gap-2 border"
                  style={{ background: "#FAF8FC", color: "#5A5164", borderColor: COLORS.line }}
                >
                  <Eye size={18} />
                  View Details
                </button>
                <button
                  onClick={() => setPreviewCertificate(null)}
                  className="flex-1 py-3.5 rounded-xl text-sm font-bold border-2 border-gray-200 text-gray-600 hover:bg-gray-50 transition-all duration-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.25s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default ManageCertificates;