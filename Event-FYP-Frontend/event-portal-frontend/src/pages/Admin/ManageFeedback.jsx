import React, { useEffect, useState } from "react";
import AdminSidebar from "../../components/AdminSidebar";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import {
  Star,
  Calendar,
  User,
  X,
  Search,
  RefreshCw,
  Sparkles,
  AlertCircle,
  Trash2,
  Eye,
  MessageSquare,
  Award,
  Filter,
  ChevronDown,
  Users,
  Calendar as CalendarIcon,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const COLORS = {
  purple: "#8b4fa2",
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

const ManageFeedbacks = () => {
  const { token } = useAuth();

  const [feedbacks, setFeedbacks] = useState([]);
  const [topEvents, setTopEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toast, setToast] = useState(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState("");
  const [events, setEvents] = useState([]);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    fetchAll();
    fetchEvents();
  }, []);

  // ── Fetch Events for Filter ──
  const fetchEvents = async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${API_URL}/events/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Handle different response formats
      const list = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.events)
        ? res.data.events
        : Array.isArray(res.data?.data)
        ? res.data.data
        : [];
      setEvents(list);
    } catch (err) {
      console.error("Failed to fetch events:", err);
      // Fallback: try without /all
      try {
        const res2 = await axios.get(`${API_URL}/events`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const list2 = Array.isArray(res2.data)
          ? res2.data
          : Array.isArray(res2.data?.data)
          ? res2.data.data
          : [];
        setEvents(list2);
      } catch (err2) {
        console.error("Fallback fetch events also failed:", err2);
      }
    }
  };

  const fetchAll = async () => {
    if (!token) {
      setError("Authentication token not found. Please login again.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");
      setIsRefreshing(true);

      const headers = { Authorization: `Bearer ${token}` };

      const feedbacksRes = await axios.get(`${API_URL}/feedbacks/admin/all`, {
        headers,
      });

      const topEventsRes = await axios.get(`${API_URL}/feedbacks/top-rated`, {
        headers,
      });

      if (feedbacksRes.data?.success) {
        setFeedbacks(feedbacksRes.data.data || []);
      } else {
        setFeedbacks([]);
        setError(feedbacksRes.data?.message || "Failed to load feedbacks");
      }

      if (Array.isArray(topEventsRes.data)) {
        setTopEvents(topEventsRes.data);
      } else if (topEventsRes.data?.data) {
        setTopEvents(topEventsRes.data.data);
      } else {
        setTopEvents([]);
      }

    } catch (err) {
      console.error("Fetch error:", err);
      
      if (err.response?.status === 401) {
        setError("Session expired. Please login again.");
        showToast("Session expired. Please login again.", "error");
      } else if (err.response?.status === 404) {
        setError("API endpoint not found. Please check server configuration.");
        showToast("API endpoint not found", "error");
      } else {
        setError(err?.response?.data?.message || "Failed to load feedbacks.");
        showToast("Failed to load feedbacks", "error");
      }
      
      setFeedbacks([]);
      setTopEvents([]);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleDelete = async (id) => {
    if (!token) {
      showToast("Please login again", "error");
      return;
    }

    try {
      setDeletingId(id);
      await axios.delete(`${API_URL}/feedbacks/admin/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      setFeedbacks((prev) => prev.filter((f) => f._id !== id));
      setConfirmDelete(null);
      if (selectedFeedback?._id === id) setSelectedFeedback(null);
      showToast("Feedback deleted successfully!", "success");
    } catch (err) {
      console.error("Delete error:", err);
      showToast(err?.response?.data?.message || "Failed to delete feedback.", "error");
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (d) => {
    if (!d) return "N/A";
    try {
      return new Date(d).toLocaleDateString("en-PK", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "Invalid Date";
    }
  };

  const renderStars = (rating) => {
    const numRating = typeof rating === 'number' ? rating : parseFloat(rating) || 0;
    return (
      <div className="flex items-center gap-0.5 whitespace-nowrap">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={14}
            className={`${star <= Math.round(numRating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
          />
        ))}
        <span className="ml-1 text-xs font-bold text-gray-700">{numRating.toFixed(1)}</span>
      </div>
    );
  };

  // ── Enhanced Filter Function ──
  const getFilteredFeedbacks = () => {
    let filtered = [...feedbacks];

    if (search) {
      const q = search.toLowerCase().trim();
      filtered = filtered.filter(
        (f) =>
          f.event_id?.title?.toLowerCase().includes(q) ||
          f.student_id?.name?.toLowerCase().includes(q) ||
          f.student_id?.email?.toLowerCase().includes(q) ||
          f.comments?.toLowerCase().includes(q)
      );
    }

    if (selectedEvent) {
      filtered = filtered.filter(
        (f) => f.event_id?._id === selectedEvent || f.event_id === selectedEvent
      );
    }

    if (activeFilter !== "all") {
      const rating = parseInt(activeFilter);
      filtered = filtered.filter((f) => Math.round(f.rating || 0) === rating);
    }

    return filtered;
  };

  const filteredFeedbacks = getFilteredFeedbacks();

  const totalFeedbacks = feedbacks.length;
  const avgRating = totalFeedbacks > 0
    ? (feedbacks.reduce((sum, f) => sum + (f.rating || 0), 0) / totalFeedbacks)
    : 0;

  const ratingDistribution = [1, 2, 3, 4, 5].map((r) => ({
    rating: r,
    count: feedbacks.filter((f) => Math.round(f.rating || 0) === r).length,
  }));

  if (loading) {
    return (
      <div className="flex min-h-screen" style={{ background: COLORS.paper }}>
        <AdminSidebar />
        <div className="flex-1 md:ml-64 flex items-center justify-center">
          <div className="text-center">
            <div
              className="w-12 h-12 rounded-full border-[3px] animate-spin mx-auto mb-4"
              style={{ borderColor: COLORS.line, borderTopColor: COLORS.purple }}
            />
            <p className="text-sm font-medium" style={{ color: "#9A90A8" }}>
              Loading feedbacks...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen" style={{ background: COLORS.paper }}>
      <AdminSidebar />

      <main className="flex-1 md:ml-64 pb-24 md:pb-6">
        {/* HEADER BANNER */}
        <div
          className="relative overflow-hidden px-6 pt-6 pb-8"
          style={{ background: "linear-gradient(135deg,#9B59B6 0%,#6d3483 100%)" }}
        >
          <div className="relative z-10 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-4 rounded-full bg-[#FFE66D] text-[#1A1A1A] text-xs font-black tracking-widest uppercase">
                <Sparkles size={14} />
                Admin Portal
              </div>
              <h1 className="text-4xl font-black text-white leading-tight tracking-tight">
                Feedback <span className="text-white">Management</span>
              </h1>
              <p className="text-purple-200 text-sm mt-1">
                View and manage all event feedbacks
              </p>
            </div>

            <div className="flex gap-2 flex-wrap">
              {[
                { label: "Total", value: totalFeedbacks, color: "#FFE66D", icon: <MessageSquare size={14} /> },
                { label: "Avg Rating", value: avgRating.toFixed(1), color: "#4ECDC4", icon: <Star size={14} /> },
                { label: "Top Events", value: topEvents.length, color: "#FFB347", icon: <Award size={14} /> },
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
          {/* TOAST */}
          {toast && (
            <div
              className={`fixed top-20 right-6 z-50 flex items-center gap-2.5 px-5 py-3.5 rounded-xl text-sm font-semibold shadow-xl animate-fadeIn ${
                toast.type === "success"
                  ? "bg-[#1A1A1A] text-white border border-[#333]"
                  : "bg-[#3A1414] text-white border border-[#5c2222]"
              }`}
            >
              {toast.type === "success" ? (
                <MessageSquare size={17} style={{ color: COLORS.turquoise }} />
              ) : (
                <AlertCircle size={17} style={{ color: COLORS.coral }} />
              )}
              {toast.msg}
            </div>
          )}

          {/* ACTION BAR */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-gray-100 mb-6">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <Search size={20} />
                </div>
                <input
                  type="text"
                  placeholder=" Search by event name, student name, email, or comment..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-gray-100 bg-white text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#8b4fa2] focus:border-transparent transition-all"
                />
              </div>

              <div className="relative min-w-50">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <CalendarIcon size={18} />
                </div>
                <select
                  value={selectedEvent}
                  onChange={(e) => setSelectedEvent(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-gray-100 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#8b4fa2] focus:border-transparent appearance-none cursor-pointer transition-all"
                >
                  <option value="">All Events</option>
                  {events.map((event) => (
                    <option key={event._id} value={event._id}>
                      {event.title}
                    </option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                  <ChevronDown size={18} />
                </div>
              </div>

              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl transition-all ${
                    showFilters
                      ? "bg-[#8b4fa2] text-white shadow-[0_4px_15px_rgba(139,79,162,0.35)]"
                      : "bg-white border-2 border-gray-100 text-gray-600 hover:border-[#8b4fa2] hover:text-[#8b4fa2]"
                  }`}
                >
                  <Filter size={18} />
                  <span className="font-medium">Filters</span>
                  <ChevronDown size={16} className={`transition-transform duration-300 ${showFilters ? "rotate-180" : ""}`} />
                </button>

                <button
                  onClick={fetchAll}
                  disabled={isRefreshing}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white border-2 border-gray-100 text-gray-600 hover:border-[#8b4fa2] hover:text-[#8b4fa2] transition-all disabled:opacity-50"
                >
                  <RefreshCw size={18} className={`${isRefreshing ? "animate-spin" : ""}`} />
                  <span className="font-medium">Refresh</span>
                </button>
              </div>
            </div>
          </div>

          {/* FILTERS PANEL */}
          {showFilters && (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 mb-6 shadow-lg border border-gray-100 animate-fadeIn">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-black text-gray-500 uppercase tracking-wider flex items-center gap-1">
                    <Star size={14} /> Rating
                  </label>
                  <select
                    value={activeFilter}
                    onChange={(e) => setActiveFilter(e.target.value)}
                    className="w-full mt-1.5 px-4 py-2.5 rounded-xl border-2 border-gray-100 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#8b4fa2] focus:border-transparent"
                  >
                    <option value="all">All Ratings</option>
                    <option value="5">⭐⭐⭐⭐⭐ (5)</option>
                    <option value="4">⭐⭐⭐⭐ (4)</option>
                    <option value="3">⭐⭐⭐ (3)</option>
                    <option value="2">⭐⭐ (2)</option>
                    <option value="1">⭐ (1)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-black text-gray-500 uppercase tracking-wider flex items-center gap-1">
                    <CalendarIcon size={14} /> Event
                  </label>
                  <select
                    value={selectedEvent}
                    onChange={(e) => setSelectedEvent(e.target.value)}
                    className="w-full mt-1.5 px-4 py-2.5 rounded-xl border-2 border-gray-100 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#8b4fa2] focus:border-transparent"
                  >
                    <option value="">All Events</option>
                    {events.map((event) => (
                      <option key={event._id} value={event._id}>
                        {event.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setActiveFilter("all");
                      setSelectedEvent("");
                      setSearch("");
                    }}
                    className="w-full py-2.5 rounded-xl bg-gray-100 text-gray-600 font-semibold hover:bg-gray-200 transition text-sm"
                  >
                    Clear All Filters
                  </button>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-4 text-sm font-semibold">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          {/* ACTIVE FILTERS BADGES */}
          {(search || selectedEvent || activeFilter !== "all") && (
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="text-xs text-gray-500 font-medium">Active Filters:</span>
              {search && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                  <Search size={12} />
                  {search}
                  <button onClick={() => setSearch("")} className="hover:text-purple-900">
                    <X size={14} />
                  </button>
                </span>
              )}
              {selectedEvent && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                  <CalendarIcon size={12} />
                  {events.find(e => e._id === selectedEvent)?.title || "Event"}
                  <button onClick={() => setSelectedEvent("")} className="hover:text-blue-900">
                    <X size={14} />
                  </button>
                </span>
              )}
              {activeFilter !== "all" && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                  <Star size={12} />
                  {activeFilter} ★
                  <button onClick={() => setActiveFilter("all")} className="hover:text-yellow-900">
                    <X size={14} />
                  </button>
                </span>
              )}
              <button
                onClick={() => {
                  setActiveFilter("all");
                  setSelectedEvent("");
                  setSearch("");
                }}
                className="text-xs text-red-400 font-medium hover:text-red-600 transition"
              >
                Clear All
              </button>
            </div>
          )}

          {/* RATING DISTRIBUTION */}
          {totalFeedbacks > 0 && (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 mb-6 shadow-lg border border-gray-100">
              <div className="flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-3xl font-black text-gray-800">{avgRating.toFixed(1)}</p>
                    <div className="flex items-center gap-0.5">
                      {renderStars(Math.round(avgRating))}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{totalFeedbacks} reviews</p>
                  </div>
                  <div className="w-px h-12 bg-gray-200" />
                </div>
                <div className="flex-1 space-y-1.5">
                  {ratingDistribution.map((item) => (
                    <div key={item.rating} className="flex items-center gap-3">
                      <span className="text-xs font-semibold text-gray-500 w-3">{item.rating}</span>
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${totalFeedbacks > 0 ? (item.count / totalFeedbacks) * 100 : 0}%`,
                            backgroundColor: item.rating >= 4 ? "#10b981" : item.rating >= 3 ? "#f59e0b" : "#ef4444",
                          }}
                        />
                      </div>
                      <span className="text-xs text-gray-400 w-8">{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TOP RATED EVENTS */}
          {topEvents.length > 0 && (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 mb-6 shadow-lg border border-gray-100">
              <div className="flex items-center gap-2 mb-4">
                <Award size={20} className="text-[#FFE66D]" />
                <h3 className="text-sm font-bold text-gray-700">Top Rated Events</h3>
                <span className="text-xs text-gray-400 ml-2">(Based on student feedback)</span>
              </div>
              <div className="flex flex-wrap gap-3">
                {topEvents.slice(0, 5).map((event, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-50 border border-gray-100 hover:border-[#8b4fa2] transition cursor-pointer"
                    onClick={() => setSelectedEvent(event._id)}
                  >
                    <span className="text-xs font-bold text-gray-700">{event.title || 'Unnamed Event'}</span>
                    <div className="flex items-center gap-0.5">
                      <Star size={12} className="fill-yellow-400 text-yellow-400" />
                      <span className="text-xs font-bold text-yellow-600">{event.avgRating?.toFixed(1) || '0.0'}</span>
                    </div>
                    <span className="text-xs text-gray-400">({event.totalFeedbacks || 0})</span>
                    <span className="text-[10px] text-purple-500">📌</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── FEEDBACKS TABLE ── */}
          {filteredFeedbacks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400 bg-white/80 backdrop-blur-sm rounded-3xl border-2 border-dashed border-gray-200">
              <MessageSquare className="text-[56px] mb-3" style={{ color: "#d8b4fe" }} />
              <p className="text-base font-bold text-gray-600">No feedbacks found</p>
              <p className="text-sm mt-1 text-gray-400">
                {search || selectedEvent || activeFilter !== "all" ? "Try adjusting your filters" : "No feedbacks submitted yet"}
              </p>
              {(search || selectedEvent || activeFilter !== "all") && (
                <button
                  onClick={() => {
                    setActiveFilter("all");
                    setSelectedEvent("");
                    setSearch("");
                  }}
                  className="mt-4 text-sm text-[#8b4fa2] font-semibold hover:underline transition"
                >
                  Clear all filters
                </button>
              )}
            </div>
          ) : (
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-gray-100 overflow-x-auto">
              {/* Table - Using fixed grid template to prevent overlap */}
              <div className="min-w-225">
                {/* Table Header */}
                <div 
                  className="grid px-6 py-4 bg-linear-to-r from-purple-50 to-pink-50 border-b border-gray-100 text-xs font-black text-gray-500 uppercase tracking-widest"
                  style={{ gridTemplateColumns: "2.5fr 1.8fr 1.8fr 1.2fr 1.5fr 1.2fr" }}
                >
                  <div className="flex items-center gap-1.5">
                    <MessageSquare size={14} /> Feedback
                  </div>
                  <div className="flex items-center gap-1.5">
                    <User size={14} /> Student
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar size={14} /> Event
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Star size={14} /> Rating
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar size={14} /> Date
                  </div>
                  <div className="text-right">Actions</div>
                </div>

                {/* Rows */}
                <div className="divide-y divide-gray-50">
                  {filteredFeedbacks.map((feedback) => (
                    <div
                      key={feedback._id}
                      className="grid px-6 py-4 hover:bg-purple-50/40 transition-all duration-200 items-center"
                      style={{ gridTemplateColumns: "2.5fr 1.8fr 1.8fr 1.2fr 1.5fr 1.2fr" }}
                    >
                      {/* Comment */}
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {feedback.comments || "No comment"}
                        </p>
                      </div>

                      {/* Student */}
                      <div className="min-w-0">
                        <p className="text-sm text-gray-500 truncate">{feedback.student_id?.name || "Unknown"}</p>
                        <p className="text-xs text-gray-400 truncate">{feedback.student_id?.email || ''}</p>
                      </div>

                      {/* Event */}
                      <div className="min-w-0">
                        <span className="text-xs font-semibold px-2 py-1 rounded-full bg-purple-50 text-purple-700 truncate block max-w-full">
                          {feedback.event_id?.title || "N/A"}
                        </span>
                      </div>

                      {/* Rating - FIXED OVERLAP */}
                      <div className="flex items-center">
                        <div className="flex items-center gap-0.5 whitespace-nowrap">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              size={14}
                              className={`${star <= Math.round(feedback.rating || 0) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                            />
                          ))}
                          <span className="ml-1 text-xs font-bold text-gray-700">
                            {(feedback.rating || 0).toFixed(1)}
                          </span>
                        </div>
                      </div>

                      {/* Date - FIXED OVERLAP */}
                      <div className="flex items-center">
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          {formatDate(feedback.createdAt || feedback.submitted_at)}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedFeedback(feedback)}
                          className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center hover:bg-purple-100 transition-colors"
                          title="View Details"
                        >
                          <Eye size={16} className="text-[#8b4fa2]" />
                        </button>
                        <button
                          onClick={() => setConfirmDelete(feedback)}
                          className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center hover:bg-red-100 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} className="text-red-400 hover:text-red-500 transition-colors" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-gray-50/80 border-t border-gray-100 flex justify-between items-center text-xs text-gray-400">
                <span className="font-medium">
                  Showing <span className="text-gray-600 font-bold">{filteredFeedbacks.length}</span> of{" "}
                  <span className="text-gray-600 font-bold">{feedbacks.length}</span> feedbacks
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-gray-300">|</span>
                  <span className="flex items-center gap-1">
                    <Users size={12} />
                    {new Set(feedbacks.map(f => f.student_id?._id)).size} students
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* FEEDBACK DETAIL MODAL */}
      {selectedFeedback && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
          onClick={() => setSelectedFeedback(null)}
        >
          <div
            className="bg-white rounded-3xl border-8 border-yellow-400 shadow-2xl w-full max-w-md p-6 transform transition-all duration-200 scale-100 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xl font-black text-gray-800 flex items-center gap-2">
                <MessageSquare size={22} className="text-[#8b4fa2]" />
                Feedback Details
              </h3>
              <button
                onClick={() => setSelectedFeedback(null)}
                className="text-gray-400 hover:text-gray-600 transition p-1 hover:bg-gray-100 rounded-full"
              >
                <X size={22} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-wider">Rating</p>
                <div className="mt-1">{renderStars(selectedFeedback.rating || 0)}</div>
              </div>

              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-wider">Comment</p>
                <p className="text-sm text-gray-700 mt-1 leading-relaxed">
                  {selectedFeedback.comments || "No comment provided"}
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-wider">Student</p>
                <p className="text-sm font-semibold text-gray-800">{selectedFeedback.student_id?.name || "Unknown"}</p>
                <p className="text-xs text-gray-400">{selectedFeedback.student_id?.email || ''}</p>
              </div>

              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-wider">Event</p>
                <p className="text-sm font-semibold text-gray-800">{selectedFeedback.event_id?.title || "N/A"}</p>
                <p className="text-xs text-gray-400">{selectedFeedback.event_id?.venue || ''}</p>
              </div>

              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-wider">Submitted</p>
                <p className="text-sm font-semibold text-gray-800">{formatDate(selectedFeedback.createdAt || selectedFeedback.submitted_at)}</p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setSelectedFeedback(null)}
                className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => { setSelectedFeedback(null); setConfirmDelete(selectedFeedback); }}
                className="flex-1 py-2.5 rounded-xl text-white font-bold transition-all flex items-center justify-center gap-2 bg-linear-to-r from-red-500 to-rose-500 hover:shadow-lg"
              >
                <Trash2 size={16} />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-7 text-center">
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={36} className="text-red-400" />
            </div>
            <h3 className="text-lg font-black text-gray-800 mb-2">Delete Feedback?</h3>
            <p className="text-sm text-gray-500 mb-1">Are you sure you want to delete</p>
            <p className="text-sm font-bold text-[#8b4fa2] mb-6">
              "{confirmDelete.comments?.slice(0, 50) || "this feedback"}..."
            </p>

            <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-2xl px-4 py-3 mb-6 text-left">
              <AlertCircle size={18} className="text-red-500 shrink-0" />
              <p className="text-xs text-red-700 font-medium">
                This action cannot be undone. The feedback will be permanently deleted.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-3 rounded-2xl border-2 border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDelete._id)}
                disabled={deletingId === confirmDelete._id}
                className="flex-1 py-3 rounded-2xl text-white text-sm font-black transition-all disabled:opacity-60 bg-linear-to-r from-red-500 to-rose-500 hover:shadow-lg"
              >
                {deletingId === confirmDelete._id ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Deleting...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Trash2 size={16} />
                    Yes, Delete
                  </span>
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
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default ManageFeedbacks;