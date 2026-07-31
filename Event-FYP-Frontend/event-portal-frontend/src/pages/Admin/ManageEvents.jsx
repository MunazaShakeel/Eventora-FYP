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
  Search,
  RefreshCw,
  ChevronDown,
  Sparkles,
  AlertCircle,
  FileText,
  TrendingUp,
  CalendarDays,
  CalendarRange,
  CalendarClock,
  Trash2,
  Edit,
  Loader,
  AlertTriangle,
  X,
  Eye,
  Users,
  Building,
  Tag,
  Calendar as CalendarIcon,
  Clock as ClockIcon,
  MapPin as MapPinIcon,
  User as UserIcon,
  MoreVertical
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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toast, setToast] = useState(null);
  const [timeFilter, setTimeFilter] = useState("all");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);
  const [editFormData, setEditFormData] = useState(null);
  const [showEditConfirm, setShowEditConfirm] = useState(false);

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

  // ─── APPROVE / REJECT ───
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

  // ─── DELETE EVENT ───
  const handleDeleteEvent = async (eventId) => {
    try {
      setActioningId(eventId);
      
      const event = events.find(e => e._id === eventId);

      await axios.delete(
       `${API_URL}/events/admin/${eventId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      showToast("Event deleted successfully!", "success");
      
      setEvents(prev => prev.filter(e => e._id !== eventId));
      
      if (selectedEvent?._id === eventId) {
        setSelectedEvent(null);
      }
      
      setShowDeleteConfirm(null);
    } catch (err) {
      console.error("Delete error:", err);
      if (err.response?.status === 403) {
        showToast("You don't have permission to delete events. Only super admins can delete.", "error");
      } else {
        const errorMsg = err.response?.data?.message || "Failed to delete event. Please try again.";
        showToast(errorMsg, "error");
      }
    } finally {
      setActioningId(null);
    }
  };

  // ─── EDIT EVENT ───
  const handleEditClick = (event) => {
    setEditingEvent(event._id);
    setEditFormData({
      title: event.title || "",
      description: event.description || "",
      venue: event.venue || "",
      category: event.category || "",
      start_date: event.start_date ? new Date(event.start_date).toISOString().split('T')[0] : "",
      end_date: event.end_date ? new Date(event.end_date).toISOString().split('T')[0] : "",
      start_time: event.start_time || "",
      end_time: event.end_time || "",
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    
    // Show confirmation dialog
    setShowEditConfirm(true);
  };

  const confirmEdit = async () => {
    try {
      setActioningId(editingEvent);
      setShowEditConfirm(false);

      const res = await axios.put(
        `${API_URL}/events/admin/${editingEvent}`,
        editFormData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const updatedEvent = res.data.event;

      setEvents((prev) =>
        prev.map((item) =>
          item._id === editingEvent ? updatedEvent : item
        )
      );

      if (selectedEvent?._id === editingEvent) {
        setSelectedEvent(updatedEvent);
      }

      showToast("Event updated successfully");

      setEditingEvent(null);
      setEditFormData(null);

    } catch (err) {
      console.error(err);
      showToast(
        err.response?.data?.message || "Failed to update event",
        "error"
      );
    } finally {
      setActioningId(null);
    }
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  // ─── Time Filter ───
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
      ? { bg: "bg-gradient-to-r from-green-50 to-emerald-50", text: "text-green-700", border: "border-green-200", dot: "bg-green-500" }
      : { bg: "bg-gradient-to-r from-amber-50 to-yellow-50", text: "text-amber-700", border: "border-amber-200", dot: "bg-amber-500" };
  };

  const getStatusLabel = (approved) => {
    return approved ? "Approved" : "Pending";
  };

  const totalEvents = events.length;
  const pendingEvents = events.filter((e) => !e.approved).length;
  const approvedEvents = events.filter((e) => e.approved).length;
  const approvalRate = totalEvents > 0 ? Math.round((approvedEvents / totalEvents) * 100) : 0;

  return (
    <div className="flex min-h-screen" style={{ background: COLORS.paper }}>
      <AdminSidebar />

      <main className="flex-1 md:ml-64 pb-24 md:pb-6">

        {/* ── HEADER BANNER ── */}
        <div
          className="relative overflow-hidden px-6 pt-6 pb-10"
          style={{ background: "linear-gradient(135deg,#9B59B6 0%,#6d3483 100%)" }}
        >

          
          <div className="relative z-10 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-4 rounded-full bg-[#FFE66D] text-[#1A1A1A] text-xs font-black tracking-widest uppercase shadow-lg">
              
                Admin Portal
              </div>
              <h1 className="text-4xl font-black text-white leading-tight tracking-tight">
                Manage <span> Events</span>
              </h1>
              <p className="text-purple-200 text-sm mt-1 flex items-center gap-2">
       
                Review, approve, edit, and manage all events
              </p>
            </div>

            {/* Stats Pills */}
            <div className="flex gap-2 flex-wrap">
              {[
                { label: "Total", value: totalEvents, color: "#FFE66D", icon: <Calendar size={14} /> },
                { label: "Pending", value: pendingEvents, color: "#fbbf24", icon: <Clock size={14} /> },
                { label: "Approved", value: approvedEvents, color: "#34d399", icon: <CheckCircle size={14} /> },
                { label: "Rate", value: `${approvalRate}%`, color: "#f472b6", icon: <TrendingUp size={14} /> },
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
                  : "bg-[#3A1414] text-white border-[#5c2222] shadow-red-500/10"
              }`}
            >
              {toast.type === "success" ? (
                <CheckCircle size={20} style={{ color: COLORS.turquoise }} className="shrink-0" />
              ) : (
                <AlertCircle size={20} style={{ color: COLORS.coral }} className="shrink-0" />
              )}
              <span>{toast.msg}</span>
            </div>
          )}

          {/* ── ACTION BAR ── */}
          <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100/80 mb-6 backdrop-blur-sm">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <Search size={20} />
                </div>
                <input
                  type="text"
                  placeholder=" Search by title, venue, organizer, or category..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-gray-100 bg-gray-50/50 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#8b4fa2] focus:border-transparent transition-all duration-300 hover:border-gray-200"
                />
              </div>

              <div className="relative min-w-40">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <CalendarDays size={18} />
                </div>
                <select
                  value={timeFilter}
                  onChange={(e) => setTimeFilter(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-gray-100 bg-gray-50/50 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#8b4fa2] focus:border-transparent appearance-none cursor-pointer transition-all duration-300 hover:border-gray-200"
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

              <button
                onClick={fetchEvents}
                disabled={isRefreshing}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-linear-to-r from-[#8b4fa2] to-[#6d3483] text-white font-semibold shadow-lg shadow-purple-500/20 hover:shadow-xl hover:shadow-purple-500/30 transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw size={18} className={`${isRefreshing ? "animate-spin" : ""}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* ── TABS ── */}
          <div className="flex gap-2 mb-6 flex-wrap">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                  activeTab === tab.key
                    ? "text-white shadow-lg shadow-purple-500/25"
                    : "bg-white text-gray-500 border border-gray-100 hover:border-purple-200 hover:text-[#8b4fa2] hover:shadow-md"
                }`}
                style={
                  activeTab === tab.key
                    ? { background: "linear-gradient(135deg, #9B59B6, #6d3483)" }
                    : {}
                }
              >
                <span className="text-base">{tab.icon}</span>
                {tab.label}
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full min-w-5 text-center transition-all ${
                    activeTab === tab.key ? "bg-white/20 text-white" : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* ── TIME FILTER BADGE ── */}
          {timeFilter !== "all" && (
            <div className="flex items-center gap-3 mb-4 p-3 bg-linear-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
              <span className="text-xs text-gray-600 font-medium">📅 Time Filter:</span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white text-blue-700 rounded-full text-xs font-medium shadow-sm">
                <CalendarDays size={12} />
                {timeFilterOptions.find(o => o.key === timeFilter)?.label}
                <button onClick={() => setTimeFilter("all")} className="hover:text-blue-900 transition-colors ml-1">
                  <XCircle size={14} />
                </button>
              </span>
              <span className="text-xs text-gray-400 ml-auto">
                Showing <span className="font-bold text-gray-600">{filtered.length}</span> events
              </span>
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
                Loading events…
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center h-72 rounded-2xl border-2 border-dashed text-center p-8"
              style={{ borderColor: "#DED4EA", background: "#ffffff" }}
            >
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
                style={{ background: "#F3ECFA" }}
              >
                <Calendar size={36} style={{ color: COLORS.purple }} />
              </div>
              <p className="text-lg font-bold" style={{ color: COLORS.ink }}>
                {search ? "No matches found" : "No events yet"}
              </p>
              <p className="text-sm mt-1.5" style={{ color: "#9A90A8" }}>
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
                    className="group bg-white rounded-2xl border overflow-hidden flex flex-col transition-all duration-300 cursor-pointer hover:shadow-2xl hover:-translate-y-1"
                    style={{ borderColor: COLORS.line }}
                  >
                    <div className="relative h-52 overflow-hidden">
                      {event.image_url ? (
                        <img
                          src={event.image_url}
                          alt={event.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                        />
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center"
                          style={{ background: "linear-gradient(135deg, #F3ECFA, #E8DCF5)" }}
                        >
                          <Calendar size={64} style={{ color: COLORS.purple, opacity: 0.3 }} />
                        </div>
                      )}
                      
                      {/* Overlay gradient */}
                      <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                      <div
                        className={`absolute top-3 right-3 flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-full border shadow-lg backdrop-blur-sm ${status.border} ${status.bg} ${status.text}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${status.dot} animate-pulse`} />
                        {getStatusLabel(event.approved)}
                      </div>

                      {event.category && (
                        <div className="absolute bottom-3 left-3 text-[10px] font-bold px-3 py-1.5 rounded-full bg-black/70 text-white backdrop-blur-sm border border-white/10">
                          <Tag size={10} className="inline mr-1" />
                          {event.category}
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="absolute top-3 left-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditClick(event);
                          }}
                          className="w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-gray-700 hover:bg-white hover:scale-110 transition-all shadow-lg"
                          title="Edit Event"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowDeleteConfirm(event._id);
                          }}
                          className="w-9 h-9 rounded-full bg-red-500/90 backdrop-blur-sm flex items-center justify-center text-white hover:bg-red-600 hover:scale-110 transition-all shadow-lg"
                          title="Delete Event"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="p-5 flex flex-col flex-1">
                      <h3 className="text-base font-bold text-gray-800 mb-2 line-clamp-2 group-hover:text-[#8b4fa2] transition-colors">
                        {event.title}
                      </h3>

                      <div className="space-y-1.5 text-xs text-gray-500 mb-4">
                        <p className="flex items-center gap-2">
                          <CalendarIcon size={14} style={{ color: COLORS.purple }} className="shrink-0" />
                          <span>{formatDate(event.start_date)}</span>
                          {event.end_date && event.end_date !== event.start_date && (
                            <span className="text-gray-400">→ {formatDate(event.end_date)}</span>
                          )}
                        </p>
                        <p className="flex items-center gap-2">
                          <MapPinIcon size={14} style={{ color: COLORS.purple }} className="shrink-0" />
                          <span className="truncate">{event.venue || "TBA"}</span>
                        </p>
                        {event.organizer_id?.name && (
                          <p className="flex items-center gap-2">
                            <UserIcon size={14} style={{ color: COLORS.purple }} className="shrink-0" />
                            <span className="truncate">{event.organizer_id.name}</span>
                          </p>
                        )}
                      </div>

                      <div className="flex gap-2 mt-auto" onClick={(e) => e.stopPropagation()}>
                        {isPending ? (
                          <>
                            <button
                              onClick={() => handleApprove(event._id, true)}
                              disabled={isActioning}
                              className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all duration-300 disabled:opacity-50 hover:shadow-lg hover:-translate-y-0.5 flex items-center justify-center gap-1.5"
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
                              className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 disabled:opacity-50 hover:shadow-lg hover:-translate-y-0.5 flex items-center justify-center gap-1.5"
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
                            className="w-full py-2.5 rounded-xl text-sm font-bold transition-all duration-300 disabled:opacity-50 hover:shadow-lg hover:-translate-y-0.5 flex items-center justify-center gap-1.5 border"
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

      {/* ─── EVENT DETAIL MODAL ─── */}
      {selectedEvent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md px-4"
          onClick={() => setSelectedEvent(null)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fadeIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative h-64">
              {selectedEvent.image_url ? (
                <img
                  src={selectedEvent.image_url}
                  alt={selectedEvent.title}
                  className="w-full h-full object-cover rounded-t-3xl"
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center rounded-t-3xl"
                  style={{ background: "linear-gradient(135deg, #F3ECFA, #E8DCF5)" }}
                >
                  <Calendar size={80} style={{ color: COLORS.purple, opacity: 0.3 }} />
                </div>
              )}
              
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent rounded-t-3xl" />

              <button
                onClick={() => setSelectedEvent(null)}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/80 hover:scale-110 transition-all duration-300 shadow-lg"
              >
                <X size={20} />
              </button>

              {/* Action buttons in modal */}
              <div className="absolute bottom-4 left-4 flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditClick(selectedEvent);
                    setSelectedEvent(null);
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/95 backdrop-blur-sm text-gray-700 hover:bg-white hover:scale-105 transition-all duration-300 text-xs font-bold shadow-lg"
                >
                  <Edit size={14} />
                  Edit
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDeleteConfirm(selectedEvent._id);
                    setSelectedEvent(null);
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/95 backdrop-blur-sm text-white hover:bg-red-600 hover:scale-105 transition-all duration-300 text-xs font-bold shadow-lg"
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              </div>

              <div
                className={`absolute bottom-4 right-4 flex items-center gap-2 text-sm font-bold px-4 py-2.5 rounded-full border shadow-2xl backdrop-blur-sm ${getStatusColor(selectedEvent.approved).bg} ${getStatusColor(selectedEvent.approved).text} ${getStatusColor(selectedEvent.approved).border}`}
              >
                <span className={`w-2 h-2 rounded-full ${getStatusColor(selectedEvent.approved).dot} animate-pulse`} />
                {getStatusLabel(selectedEvent.approved)}
              </div>
            </div>

            <div className="p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">{selectedEvent.title}</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="p-4 rounded-2xl" style={{ background: "#FAF8FC" }}>
                  <p className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: "#9A90A8" }}>
                    <CalendarIcon size={14} style={{ color: COLORS.purple }} />
                    Date
                  </p>
                  <p className="text-sm font-semibold mt-1.5" style={{ color: COLORS.ink }}>
                    {formatDateLong(selectedEvent.start_date)}
                    {selectedEvent.end_date && selectedEvent.end_date !== selectedEvent.start_date &&
                      ` — ${formatDateLong(selectedEvent.end_date)}`}
                  </p>
                </div>

                <div className="p-4 rounded-2xl" style={{ background: "#FAF8FC" }}>
                  <p className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: "#9A90A8" }}>
                    <ClockIcon size={14} style={{ color: COLORS.purple }} />
                    Time
                  </p>
                  <p className="text-sm font-semibold mt-1.5" style={{ color: COLORS.ink }}>
                    {selectedEvent.start_time ? formatTimeWithAMPM(selectedEvent.start_time) : "TBA"}
                    {selectedEvent.end_time && ` — ${formatTimeWithAMPM(selectedEvent.end_time)}`}
                  </p>
                </div>

                <div className="p-4 rounded-2xl" style={{ background: "#FAF8FC" }}>
                  <p className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: "#9A90A8" }}>
                    <MapPinIcon size={14} style={{ color: COLORS.purple }} />
                    Venue
                  </p>
                  <p className="text-sm font-semibold mt-1.5" style={{ color: COLORS.ink }}>
                    {selectedEvent.venue || "TBA"}
                  </p>
                </div>

                <div className="p-4 rounded-2xl" style={{ background: "#FAF8FC" }}>
                  <p className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: "#9A90A8" }}>
                    <UserIcon size={14} style={{ color: COLORS.purple }} />
                    Organizer
                  </p>
                  <p className="text-sm font-semibold mt-1.5" style={{ color: COLORS.ink }}>
                    {selectedEvent.organizer_id?.name || "N/A"}
                  </p>
                </div>
              </div>

              {selectedEvent.description && (
                <div className="mb-6 p-4 rounded-2xl" style={{ background: "#FAF8FC" }}>
                  <p className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 mb-2" style={{ color: "#9A90A8" }}>
                    <FileText size={14} style={{ color: COLORS.purple }} />
                    Description
                  </p>
                  <p className="text-sm text-gray-600 leading-relaxed">{selectedEvent.description}</p>
                </div>
              )}

              <div className="flex gap-3">
                {!selectedEvent.approved ? (
                  <>
                    <button
                      onClick={() => handleApprove(selectedEvent._id, true)}
                      disabled={actioningId === selectedEvent._id}
                      className="flex-1 py-3.5 rounded-xl text-sm font-bold text-white transition-all duration-300 disabled:opacity-50 hover:shadow-lg hover:-translate-y-0.5 flex items-center justify-center gap-2"
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
                      className="flex-1 py-3.5 rounded-xl text-sm font-bold transition-all duration-300 disabled:opacity-50 hover:shadow-lg hover:-translate-y-0.5 flex items-center justify-center gap-2"
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
                    className="w-full py-3.5 rounded-xl text-sm font-bold transition-all duration-300 disabled:opacity-50 hover:shadow-lg hover:-translate-y-0.5 flex items-center justify-center gap-2 border"
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

      {/* ─── EDIT CONFIRMATION MODAL ─── */}
      {showEditConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md px-4"
          onClick={() => setShowEditConfirm(false)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 animate-fadeIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-6">
              <div className="w-20 h-20 mx-auto rounded-full bg-purple-100 flex items-center justify-center mb-4 shadow-lg shadow-purple-200">
                <Edit size={36} className="text-purple-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">Confirm Edit</h3>
              <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                Are you sure you want to update this event?
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowEditConfirm(false)}
                className="flex-1 py-3.5 rounded-xl text-sm font-bold border-2 border-gray-200 text-gray-600 hover:bg-gray-50 transition-all duration-300 hover:shadow-md"
              >
                Cancel
              </button>
              <button
                onClick={confirmEdit}
                disabled={actioningId === editingEvent}
                className="flex-1 py-3.5 rounded-xl text-sm font-bold text-white transition-all duration-300 disabled:opacity-50 hover:shadow-lg hover:-translate-y-0.5 flex items-center justify-center gap-2"
                style={{ background: "linear-gradient(135deg, #8b4fa2, #6d3483)" }}
              >
                {actioningId === editingEvent ? (
                  <Loader size={18} className="animate-spin" />
                ) : (
                  <>
                    <CheckCircle size={18} />
                    Update Event
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── EDIT EVENT MODAL ─── */}
      {editingEvent && editFormData && !showEditConfirm && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-md px-4"
          onClick={() => {
            setEditingEvent(null);
            setEditFormData(null);
          }}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fadeIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Edit size={22} style={{ color: COLORS.purple }} />
                Edit Event
              </h2>
              <button
                onClick={() => {
                  setEditingEvent(null);
                  setEditFormData(null);
                }}
                className="p-2 rounded-xl hover:bg-gray-100 transition-all duration-300 hover:scale-110"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Title *</label>
                <input
                  type="text"
                  name="title"
                  value={editFormData.title}
                  onChange={handleEditChange}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#8b4fa2] focus:ring-2 focus:ring-[#8b4fa2]/20 transition-all duration-300"
                  required
                  placeholder="Enter event title"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
                <textarea
                  name="description"
                  value={editFormData.description}
                  onChange={handleEditChange}
                  rows="3"
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#8b4fa2] focus:ring-2 focus:ring-[#8b4fa2]/20 transition-all duration-300"
                  placeholder="Enter event description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Venue</label>
                  <input
                    type="text"
                    name="venue"
                    value={editFormData.venue}
                    onChange={handleEditChange}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#8b4fa2] focus:ring-2 focus:ring-[#8b4fa2]/20 transition-all duration-300"
                    placeholder="Enter venue"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Category</label>
                  <input
                    type="text"
                    name="category"
                    value={editFormData.category}
                    onChange={handleEditChange}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#8b4fa2] focus:ring-2 focus:ring-[#8b4fa2]/20 transition-all duration-300"
                    placeholder="Enter category"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Start Date *</label>
                  <input
                    type="date"
                    name="start_date"
                    value={editFormData.start_date}
                    onChange={handleEditChange}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#8b4fa2] focus:ring-2 focus:ring-[#8b4fa2]/20 transition-all duration-300"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">End Date</label>
                  <input
                    type="date"
                    name="end_date"
                    value={editFormData.end_date}
                    onChange={handleEditChange}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#8b4fa2] focus:ring-2 focus:ring-[#8b4fa2]/20 transition-all duration-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Start Time</label>
                  <input
                    type="time"
                    name="start_time"
                    value={editFormData.start_time}
                    onChange={handleEditChange}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#8b4fa2] focus:ring-2 focus:ring-[#8b4fa2]/20 transition-all duration-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">End Time</label>
                  <input
                    type="time"
                    name="end_time"
                    value={editFormData.end_time}
                    onChange={handleEditChange}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#8b4fa2] focus:ring-2 focus:ring-[#8b4fa2]/20 transition-all duration-300"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 py-3.5 rounded-xl text-sm font-bold text-white transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 flex items-center justify-center gap-2"
                  style={{ background: "linear-gradient(135deg, #8b4fa2, #6d3483)" }}
                >
                  <CheckCircle size={18} />
                  Update Event
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingEvent(null);
                    setEditFormData(null);
                  }}
                  className="flex-1 py-3.5 rounded-xl text-sm font-bold border-2 border-gray-200 text-gray-600 hover:bg-gray-50 transition-all duration-300 hover:shadow-md"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── DELETE CONFIRMATION MODAL ─── */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md px-4"
          onClick={() => setShowDeleteConfirm(null)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 animate-fadeIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-6">
              <div className="w-20 h-20 mx-auto rounded-full bg-red-100 flex items-center justify-center mb-4 shadow-lg shadow-red-200">
                <Trash2 size={36} className="text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">Delete Event?</h3>
              <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                This will permanently delete the event and all associated data including registrations, feedback, certificates, and tasks.
              </p>
              <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-200 shadow-sm">
                <p className="text-xs text-amber-700 font-medium flex items-center justify-center gap-2">
                  <AlertTriangle size={14} />
                  This action cannot be undone
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 py-3.5 rounded-xl text-sm font-bold border-2 border-gray-200 text-gray-600 hover:bg-gray-50 transition-all duration-300 hover:shadow-md"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteEvent(showDeleteConfirm)}
                disabled={actioningId === showDeleteConfirm}
                className="flex-1 py-3.5 rounded-xl text-sm font-bold text-white transition-all duration-300 disabled:opacity-50 hover:shadow-lg hover:-translate-y-0.5 flex items-center justify-center gap-2"
                style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)" }}
              >
                {actioningId === showDeleteConfirm ? (
                  <Loader size={18} className="animate-spin" />
                ) : (
                  <>
                    <Trash2 size={18} />
                    Delete Permanently
                  </>
                )}
              </button>
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
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default ManageEvents;