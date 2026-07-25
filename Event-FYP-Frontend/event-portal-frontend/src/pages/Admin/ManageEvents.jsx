import React, { useEffect, useState } from "react";
import AdminSidebar from "../../components/AdminSidebar";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import {
  Calendar,
  MapPin,
  User,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Search,
  RefreshCw,
  Filter,
  ChevronDown,
  Sparkles,
  AlertCircle,
  Award,
  Users,
  Building,
  FileText,
  ExternalLink,
  TrendingUp,
  CalendarDays,
  CalendarRange,
  CalendarClock
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

const ManageEvents = () => {
  const { token } = useAuth();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [actioningId, setActioningId] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toast, setToast] = useState(null);
  const [timeFilter, setTimeFilter] = useState("all"); // all, week, month, year
  const [showTimeFilter, setShowTimeFilter] = useState(false);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError("");
      setIsRefreshing(true);
      
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
      setEvents(list);
    } catch (err) {
      console.error(err);
      setError("Failed to load events.");
      showToast("Failed to load events", "error");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleApprove = async (eventId, approved) => {
    try {
      setActioningId(eventId);

      const response = await axios.put(
        `${API_URL}/events/${eventId}/approve`,
        { approved },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const message = approved ? "Event approved successfully!" : "Event rejected successfully!";
      showToast(message, "success");

      setEvents((prev) =>
        prev.map((e) => (e._id === eventId ? { ...e, approved } : e))
      );

      if (selectedEvent?._id === eventId) {
        setSelectedEvent((prev) => ({ ...prev, approved }));
      }
    } catch (err) {
      console.error("API Error:", err);
      const errorMsg = err.response?.data?.message || "Action failed. Please try again.";
      showToast(errorMsg, "error");
    } finally {
      setActioningId(null);
    }
  };

  // ── Time Filter Functions ──
  const getDateRange = (filter) => {
    const now = new Date();
    const start = new Date(now);
    const end = new Date(now);

    switch(filter) {
      case "week":
        start.setDate(now.getDate() - 7);
        end.setDate(now.getDate() + 7);
        break;
      case "month":
        start.setMonth(now.getMonth() - 1);
        end.setMonth(now.getMonth() + 1);
        break;
      case "year":
        start.setFullYear(now.getFullYear() - 1);
        end.setFullYear(now.getFullYear() + 1);
        break;
      default:
        return null;
    }
    return { start, end };
  };

  const isEventInRange = (eventDate, filter) => {
    if (filter === "all") return true;
    const range = getDateRange(filter);
    if (!range) return true;
    const date = new Date(eventDate);
    return date >= range.start && date <= range.end;
  };

  const tabs = [
    { key: "all", label: "All Events", count: events.length, icon: "📋" },
    { key: "pending", label: "Pending", count: events.filter((e) => !e.approved).length, icon: "⏳" },
    { key: "approved", label: "Approved", count: events.filter((e) => e.approved).length, icon: "✅" },
  ];

  const timeFilterOptions = [
    { key: "all", label: "All Time", icon: <CalendarDays size={14} /> },
    { key: "week", label: "This Week", icon: <CalendarClock size={14} /> },
    { key: "month", label: "This Month", icon: <CalendarRange size={14} /> },
    { key: "year", label: "This Year", icon: <CalendarDays size={14} /> },
  ];

  const filtered = events.filter((e) => {
    const matchTab =
      activeTab === "all" ||
      (activeTab === "pending" && !e.approved) ||
      (activeTab === "approved" && e.approved);
    
    const matchSearch =
      e.title?.toLowerCase().includes(search.toLowerCase()) ||
      e.venue?.toLowerCase().includes(search.toLowerCase()) ||
      e.organizer_id?.name?.toLowerCase().includes(search.toLowerCase()) ||
      e.category?.toLowerCase().includes(search.toLowerCase());
    
    const matchTime = isEventInRange(e.start_date, timeFilter);
    
    return matchTab && matchSearch && matchTime;
  });

  const formatDate = (d) => {
    if (!d) return "TBA";
    return new Date(d).toLocaleDateString("en-PK", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatDateLong = (d) => {
    if (!d) return "TBA";
    return new Date(d).toLocaleDateString("en-PK", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatTimeWithAMPM = (timeString) => {
    if (!timeString) return "";
    if (typeof timeString === 'string' && timeString.match(/^([01]\d|2[0-3]):([0-5]\d)$/)) {
      let [hours, minutes] = timeString.split(':');
      hours = parseInt(hours);
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const hours12 = hours % 12 || 12;
      return `${hours12}:${minutes} ${ampm}`;
    }
    return timeString;
  };

  const getStatusColor = (approved) => {
    return approved
      ? { bg: "bg-green-50", text: "text-green-700", border: "border-green-200", dot: "bg-green-500" }
      : { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", dot: "bg-amber-500" };
  };

  const getStatusLabel = (approved) => {
    return approved ? "Approved" : "Pending";
  };

  // ── Stats Calculation ──
  const totalEvents = events.length;
  const pendingEvents = events.filter((e) => !e.approved).length;
  const approvedEvents = events.filter((e) => e.approved).length;
  const approvalRate = totalEvents > 0 ? Math.round((approvedEvents / totalEvents) * 100) : 0;

  return (
    <div className="flex min-h-screen" style={{ background: COLORS.paper }}>
      <AdminSidebar />

      <main className="flex-1 md:ml-64 pb-24 md:pb-6">
        {/* ── HEADER BANNER (Consistent with other pages) ── */}
        <div
          className="relative overflow-hidden px-6 pt-6 pb-10"
          style={{ background: "linear-gradient(135deg,#9B59B6 0%,#6d3483 100%)" }}
        >
          <div className="relative z-10 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-4 rounded-full bg-[#FFE66D] text-[#1A1A1A] text-xs font-black tracking-widest uppercase">
                <Sparkles size={14} />
                Admin Portal
              </div>
              <h1 className="text-4xl font-black text-white leading-tight tracking-tight">
                Manage <span className="text-[#FFE66D]">Events</span>
              </h1>
              <p className="text-purple-200 text-sm mt-1">
                Review, approve, and oversee all submitted events
              </p>
            </div>

            {/* Stats Pills */}
            <div className="flex gap-2 flex-wrap">
              {[
                { label: "Total", value: totalEvents, color: "#FFE66D", icon: <Calendar size={14} /> },
                { label: "Pending", value: pendingEvents, color: "#f59e0b", icon: <Clock size={14} /> },
                { label: "Approved", value: approvedEvents, color: "#4ECDC4", icon: <CheckCircle size={14} /> },
                { label: "Rate", value: `${approvalRate}%`, color: "#FFB347", icon: <TrendingUp size={14} /> },
              ].map((s) => (
                <div
                  key={s.label}
                  className="flex items-center gap-2 px-4 py-2 rounded-full transition-transform hover:scale-105 duration-200"
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
              className={`fixed top-20 right-6 z-50 flex items-center gap-2.5 px-5 py-3.5 rounded-xl text-sm font-semibold shadow-xl animate-fadeIn ${
                toast.type === "success"
                  ? "bg-[#1A1A1A] text-white border border-[#333]"
                  : "bg-[#3A1414] text-white border border-[#5c2222]"
              }`}
            >
              {toast.type === "success" ? (
                <CheckCircle size={17} style={{ color: COLORS.turquoise }} />
              ) : (
                <AlertCircle size={17} style={{ color: COLORS.coral }} />
              )}
              {toast.msg}
            </div>
          )}

          {/* ── ACTION BAR ── */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-gray-100 mb-6">
            <div className="flex flex-col md:flex-row gap-3">
              {/* Search Input */}
              <div className="relative flex-1">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <Search size={20} />
                </div>
                <input
                  type="text"
                  placeholder="🔍 Search by title, venue, organizer, or category..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-gray-100 bg-white text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#8b4fa2] focus:border-transparent transition-all"
                />
              </div>

              {/* Time Filter Dropdown */}
              <div className="relative min-w-40">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <CalendarDays size={18} />
                </div>
                <select
                  value={timeFilter}
                  onChange={(e) => setTimeFilter(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-gray-100 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#8b4fa2] focus:border-transparent appearance-none cursor-pointer transition-all"
                >
                  {timeFilterOptions.map((opt) => (
                    <option key={opt.key} value={opt.key}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                  <ChevronDown size={18} />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={fetchEvents}
                  disabled={isRefreshing}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white border-2 border-gray-100 text-gray-600 hover:border-[#8b4fa2] hover:text-[#8b4fa2] transition-all disabled:opacity-50"
                >
                  <RefreshCw size={18} className={`${isRefreshing ? "animate-spin" : ""}`} />
                  <span className="font-medium">Refresh</span>
                </button>
              </div>
            </div>
          </div>

          {/* ── TABS ── */}
          <div className="flex gap-2 mb-6 flex-wrap">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                  activeTab === tab.key
                    ? "text-white shadow-lg"
                    : "bg-white text-gray-500 border border-gray-100 hover:border-purple-200 hover:text-[#8b4fa2]"
                }`}
                style={
                  activeTab === tab.key
                    ? { background: "linear-gradient(135deg, #9B59B6, #6d3483)", boxShadow: "0 4px 15px rgba(139,79,162,0.35)" }
                    : {}
                }
              >
                <span>{tab.icon}</span>
                {tab.label}
                <span
                  className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full min-w-5 text-center ${
                    activeTab === tab.key ? "bg-white/25 text-white" : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* ── TIME FILTER BADGE ── */}
          {timeFilter !== "all" && (
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs text-gray-500 font-medium">Time Filter:</span>
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                <CalendarDays size={12} />
                {timeFilterOptions.find(o => o.key === timeFilter)?.label}
                <button onClick={() => setTimeFilter("all")} className="hover:text-blue-900">
                  <XCircle size={14} />
                </button>
              </span>
              <span className="text-xs text-gray-400">
                Showing {filtered.length} events
              </span>
            </div>
          )}

          {error && (
            <div
              className="flex items-center gap-2.5 rounded-xl px-4 py-3 mb-5 text-sm font-medium"
              style={{ background: "#FDF1F1", color: "#B23A3A", border: "1px solid #F5D6D6" }}
            >
              <AlertCircle size={17} />
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center h-72 gap-4">
              <div
                className="w-10 h-10 rounded-full border-[3px] animate-spin"
                style={{ borderColor: COLORS.line, borderTopColor: COLORS.purple }}
              />
              <p className="text-sm font-medium" style={{ color: "#9A90A8" }}>
                Loading events…
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center h-72 rounded-2xl border border-dashed text-center"
              style={{ borderColor: "#DED4EA", background: "#ffffff" }}
            >
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
                style={{ background: "#F3ECFA" }}
              >
                <Calendar size={26} style={{ color: COLORS.purple }} />
              </div>
              <p className="text-base font-bold" style={{ color: COLORS.ink }}>
                {search ? "No matches found" : "No events yet"}
              </p>
              <p className="text-sm mt-1" style={{ color: "#9A90A8" }}>
                {search ? "Try a different title, venue, or organizer." : "Events submitted by organizers will appear here."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((event) => {
                const isPending = !event.approved;
                const isActioning = actioningId === event._id;
                const status = getStatusColor(event.approved);

                return (
                  <div
                    key={event._id}
                    onClick={() => setSelectedEvent(event)}
                    className="group bg-white rounded-2xl border overflow-hidden flex flex-col transition-all duration-300 cursor-pointer hover:shadow-xl hover:-translate-y-1"
                    style={{ borderColor: COLORS.line }}
                  >
                    {/* Image / Banner */}
                    <div className="relative h-48 overflow-hidden">
                      {event.image_url ? (
                        <img
                          src={event.image_url}
                          alt={event.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                        />
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center"
                          style={{ background: "#F3ECFA" }}
                        >
                          <Calendar size={56} style={{ color: COLORS.purple, opacity: 0.3 }} />
                        </div>
                      )}

                      {/* Status Badge */}
                      <div
                        className={`absolute top-3 right-3 flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-full border ${status.border} ${status.bg} ${status.text} shadow-sm`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                        {getStatusLabel(event.approved)}
                      </div>

                      {/* Category Badge */}
                      {event.category && (
                        <div className="absolute bottom-3 left-3 text-[10px] font-bold px-3 py-1 rounded-full bg-black/60 text-white backdrop-blur-sm">
                          {event.category}
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-5 flex flex-col flex-1">
                      <h3 className="text-base font-bold text-gray-800 mb-2 line-clamp-2 group-hover:text-[#8b4fa2] transition-colors">
                        {event.title}
                      </h3>

                      <div className="space-y-1.5 text-xs text-gray-500 mb-4">
                        <p className="flex items-center gap-2">
                          <Calendar size={14} style={{ color: COLORS.purple }} />
                          {formatDate(event.start_date)}
                          {event.end_date && event.end_date !== event.start_date && (
                            <span>→ {formatDate(event.end_date)}</span>
                          )}
                        </p>
                        <p className="flex items-center gap-2">
                          <MapPin size={14} style={{ color: COLORS.purple }} />
                          {event.venue || "TBA"}
                        </p>
                        {event.organizer_id?.name && (
                          <p className="flex items-center gap-2">
                            <User size={14} style={{ color: COLORS.purple }} />
                            {event.organizer_id.name}
                          </p>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 mt-auto" onClick={(e) => e.stopPropagation()}>
                        {isPending ? (
                          <>
                            <button
                              onClick={() => handleApprove(event._id, true)}
                              disabled={isActioning}
                              className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50 hover:shadow-lg flex items-center justify-center gap-1.5"
                              style={{ background: "linear-gradient(135deg, #8b4fa2, #6d3483)" }}
                            >
                              {isActioning ? (
                                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <>
                                  <CheckCircle size={15} />
                                  Approve
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => handleApprove(event._id, false)}
                              disabled={isActioning}
                              className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                              style={{ background: "#FDF1F1", color: COLORS.coral }}
                            >
                              <XCircle size={15} />
                              Reject
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleApprove(event._id, false)}
                            disabled={isActioning}
                            className="w-full py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 border"
                            style={{ background: "#FAF8FC", color: "#5A5164", borderColor: COLORS.line }}
                          >
                            <XCircle size={15} />
                            Revoke Approval
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* ── EVENT DETAIL MODAL ── */}
      {selectedEvent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md px-4"
          onClick={() => setSelectedEvent(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Image */}
            <div className="relative h-56">
              {selectedEvent.image_url ? (
                <img
                  src={selectedEvent.image_url}
                  alt={selectedEvent.title}
                  className="w-full h-full object-cover rounded-t-2xl"
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center rounded-t-2xl"
                  style={{ background: "#F3ECFA" }}
                >
                  <Calendar size={80} style={{ color: COLORS.purple, opacity: 0.3 }} />
                </div>
              )}

              {/* Close Button */}
              <button
                onClick={() => setSelectedEvent(null)}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition"
              >
                <XCircle size={20} />
              </button>

              {/* Status Badge */}
              <div
                className={`absolute bottom-4 left-4 flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-full border ${getStatusColor(selectedEvent.approved).bg} ${getStatusColor(selectedEvent.approved).text} ${getStatusColor(selectedEvent.approved).border} shadow-lg`}
              >
                <span className={`w-2 h-2 rounded-full ${getStatusColor(selectedEvent.approved).dot}`} />
                {getStatusLabel(selectedEvent.approved)}
              </div>
            </div>

            {/* Content */}
            <div className="p-7">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">{selectedEvent.title}</h2>

              {/* Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="p-4 rounded-xl" style={{ background: "#FAF8FC" }}>
                  <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#9A90A8" }}>
                    <Calendar size={14} className="inline mr-1.5" style={{ color: COLORS.purple }} />
                    Date
                  </p>
                  <p className="text-sm font-semibold mt-1" style={{ color: COLORS.ink }}>
                    {formatDateLong(selectedEvent.start_date)}
                    {selectedEvent.end_date && selectedEvent.end_date !== selectedEvent.start_date &&
                      ` — ${formatDateLong(selectedEvent.end_date)}`}
                  </p>
                </div>

                <div className="p-4 rounded-xl" style={{ background: "#FAF8FC" }}>
                  <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#9A90A8" }}>
                    <Clock size={14} className="inline mr-1.5" style={{ color: COLORS.purple }} />
                    Time
                  </p>
                  <p className="text-sm font-semibold mt-1" style={{ color: COLORS.ink }}>
                    {selectedEvent.start_time ? formatTimeWithAMPM(selectedEvent.start_time) : "TBA"}
                    {selectedEvent.end_time && ` — ${formatTimeWithAMPM(selectedEvent.end_time)}`}
                  </p>
                </div>

                <div className="p-4 rounded-xl" style={{ background: "#FAF8FC" }}>
                  <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#9A90A8" }}>
                    <MapPin size={14} className="inline mr-1.5" style={{ color: COLORS.purple }} />
                    Venue
                  </p>
                  <p className="text-sm font-semibold mt-1" style={{ color: COLORS.ink }}>
                    {selectedEvent.venue || "TBA"}
                  </p>
                </div>

                <div className="p-4 rounded-xl" style={{ background: "#FAF8FC" }}>
                  <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#9A90A8" }}>
                    <User size={14} className="inline mr-1.5" style={{ color: COLORS.purple }} />
                    Organizer
                  </p>
                  <p className="text-sm font-semibold mt-1" style={{ color: COLORS.ink }}>
                    {selectedEvent.organizer_id?.name || "N/A"}
                  </p>
                </div>
              </div>

              {/* Description */}
              {selectedEvent.description && (
                <div className="mb-6">
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: "#9A90A8" }}>
                    <FileText size={14} className="inline mr-1.5" style={{ color: COLORS.purple }} />
                    Description
                  </p>
                  <p className="text-sm text-gray-600 leading-relaxed">{selectedEvent.description}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                {!selectedEvent.approved ? (
                  <>
                    <button
                      onClick={() => handleApprove(selectedEvent._id, true)}
                      disabled={actioningId === selectedEvent._id}
                      className="flex-1 py-3 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50 hover:shadow-lg flex items-center justify-center gap-2"
                      style={{ background: "linear-gradient(135deg, #8b4fa2, #6d3483)" }}
                    >
                      {actioningId === selectedEvent._id ? (
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <CheckCircle size={18} />
                          Approve Event
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleApprove(selectedEvent._id, false)}
                      disabled={actioningId === selectedEvent._id}
                      className="flex-1 py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                      style={{ background: "#FDF1F1", color: COLORS.coral }}
                    >
                      <XCircle size={18} />
                      Reject Event
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleApprove(selectedEvent._id, false)}
                    disabled={actioningId === selectedEvent._id}
                    className="w-full py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2 border"
                    style={{ background: "#FAF8FC", color: "#5A5164", borderColor: COLORS.line }}
                  >
                    <XCircle size={18} />
                    Revoke Approval
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.25s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default ManageEvents;