import React, { useEffect, useState } from "react";
import axios from "axios";
import AdminSidebar from "../../components/AdminSidebar";
import { useAuth } from "../../context/AuthContext";
import {
  ListTodo,
  CheckCircle,
  Clock,
  AlertCircle,
  Search,
  Calendar,
  UserCheck,
  Users,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Mail,
  Phone,
  Building,
  Sparkles,
  Loader,
  Trash2,
  X,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const COLORS = {
  purple: "#8b4fa2",
  purpleDeep: "#5B2C6F",
  turquoise: "#4ECDC4",
  coral: "#FF6B6B",
  yellow: "#FFE66D",
  ink: "#1A1A1A",
  paper: "#FAF9FC",
  line: "#ECE6F4",
};

const AdminTasks = () => {
  const { token } = useAuth();

  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState(null);
  const [eventProgress, setEventProgress] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState("");
  const [volunteerTasks, setVolunteerTasks] = useState([]);
  const [expandedVolunteer, setExpandedVolunteer] = useState(null);

  const [loading, setLoading] = useState(true);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [loadingVolunteers, setLoadingVolunteers] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [filters, setFilters] = useState({ status: "", search: "", event_id: "" });

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchOverview = async () => {
    setLoading(true);
    setError("");
    try {
      const [statsRes, progressRes] = await Promise.all([
        axios.get(`${API_URL}/api/tasks/admin/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API_URL}/api/tasks/admin/event-progress`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      setStats(statsRes.data?.data || null);
      setEventProgress(progressRes.data?.data || []);
    } catch (err) {
      console.error("Fetch overview error:", err);
      setError(err?.response?.data?.message || "Failed to load task stats.");
      showToast("Failed to load task stats", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchAllTasks = async () => {
    setLoadingTasks(true);
    try {
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.search) params.search = filters.search;
      if (filters.event_id) params.event_id = filters.event_id;

      const res = await axios.get(`${API_URL}/api/tasks/admin/all`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
      setAllTasks(res.data?.data || []);
    } catch (err) {
      console.error("Fetch tasks error:", err);
      setError(err?.response?.data?.message || "Failed to load tasks.");
      showToast("Failed to load tasks", "error");
    } finally {
      setLoadingTasks(false);
    }
  };

  const fetchEvents = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/events/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const list = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.events)
        ? res.data.events
        : [];
      setEvents(list);
    } catch (err) {
      console.error("Failed to fetch events:", err);
    }
  };

  const fetchEventVolunteersTasks = async (eventId) => {
    if (!eventId) {
      setVolunteerTasks([]);
      return;
    }
    setLoadingVolunteers(true);
    try {
      const res = await axios.get(
        `${API_URL}/api/tasks/admin/event/${eventId}/volunteers-tasks`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setVolunteerTasks(res.data?.data || []);
    } catch (err) {
      console.error("Failed to fetch volunteers tasks:", err);
      showToast("Failed to load volunteers data", "error");
    } finally {
      setLoadingVolunteers(false);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm("Delete this task permanently? This cannot be undone.")) return;
    setDeletingId(taskId);
    try {
      await axios.delete(`${API_URL}/api/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAllTasks((prev) => prev.filter((t) => t._id !== taskId));
      showToast("Task deleted successfully.", "success");
      fetchOverview();
    } catch (err) {
      showToast(err?.response?.data?.message || "Failed to delete task.", "error");
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    fetchOverview();
    fetchEvents();
  }, []);

  useEffect(() => {
    if (activeTab === "allTasks") fetchAllTasks();
  }, [activeTab, filters.status, filters.event_id]);

  useEffect(() => {
    if (activeTab === "volunteers" && selectedEvent) {
      fetchEventVolunteersTasks(selectedEvent);
    }
  }, [activeTab, selectedEvent]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchAllTasks();
  };

  const handleStatCardClick = (status) => {
    setFilters({ status, search: "", event_id: "" });
    setActiveTab("allTasks");
  };

  const clearFilters = () => setFilters({ status: "", search: "", event_id: "" });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchOverview();
    if (activeTab === "allTasks") await fetchAllTasks();
    if (activeTab === "volunteers" && selectedEvent) await fetchEventVolunteersTasks(selectedEvent);
    setIsRefreshing(false);
    showToast("Refreshed successfully!", "success");
  };

  const toggleVolunteerExpand = (id) =>
    setExpandedVolunteer(expandedVolunteer === id ? null : id);

  const getStatusClass = (status) => {
    switch (status) {
      case "Completed":
        return "bg-green-50 text-green-700 border-green-200";
      case "In Progress":
        return "bg-blue-50 text-blue-700 border-blue-200";
      default:
        return "bg-amber-50 text-amber-700 border-amber-200";
    }
  };

  const getStatusAccent = (status) => {
    switch (status) {
      case "Completed":
        return "#10b981";
      case "In Progress":
        return COLORS.turquoise;
      default:
        return "#f59e0b";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Completed":
        return <CheckCircle size={14} />;
      case "In Progress":
        return <Clock size={14} />;
      default:
        return <AlertCircle size={14} />;
    }
  };

  const formatDate = (d) => {
    if (!d) return "N/A";
    return new Date(d).toLocaleDateString("en-PK", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const hasActiveFilters = filters.status || filters.search || filters.event_id;

  if (loading) {
    return (
      <div className="flex min-h-screen" style={{ background: COLORS.paper }}>
        <AdminSidebar />
        <div className="flex-1 md:ml-64 flex items-center justify-center">
          <div className="text-center">
            <div
              className="w-14 h-14 rounded-full border-[3px] animate-spin mx-auto mb-4"
              style={{ borderColor: COLORS.line, borderTopColor: COLORS.purple }}
            />
            <p className="text-sm font-medium" style={{ color: "#9A90A8" }}>
              Loading task progress…
            </p>
          </div>
        </div>
      </div>
    );
  }

    return (
    <div className="flex min-h-screen" style={{ background: "#f7f4fb" }}>
      <AdminSidebar />

      <main className="flex-1 md:ml-64 pb-24 md:pb-6">
        {/* ── HEADER BANNER ── */}
        <div
          className="relative overflow-hidden px-6 pt-6 pb-10"
          style={{ background: "linear-gradient(135deg,#9B59B6 0%,#6d3483 100%)" }}
        >
          <div className="relative z-10 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-4 rounded-full bg-[#FFE66D] text-[#1A1A1A] text-xs font-black tracking-widest uppercase">
  
                Admin Portal
              </div>
              <h1 className="text-4xl font-black text-white leading-tight tracking-tight">
                Task <span className="text-white">Progress</span>
              </h1>
              <p className="text-purple-200 text-sm mt-1">
                Track task assignment and completion across all events
              </p>
            </div>

            {stats && (
              <div className="flex gap-3 flex-wrap">
                {[
                  { key: "", label: "Total", value: stats.totalTasks, color: "#FFE66D", icon: <ListTodo size={16} /> },
                  { key: "Pending", label: "Pending", value: stats.pendingTasks, color: "#f59e0b", icon: <AlertCircle size={16} /> },
                  { key: "In Progress", label: "In Progress", value: stats.inProgressTasks, color: "#4ECDC4", icon: <Clock size={16} /> },
                  { key: "Completed", label: "Completed", value: stats.completedTasks, color: "#10b981", icon: <CheckCircle size={16} /> },
                ].map((s) => (
                  <button
                    key={s.label}
                    onClick={() => handleStatCardClick(s.key)}
                    className="flex items-center gap-2.5 px-5 py-2.5 rounded-full transition-all duration-300 hover:scale-105"
                    style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(12px)" }}
                  >
                    <span className="text-white/80">{s.icon}</span>
                    <span className="text-2xl font-black" style={{ color: s.color }}>
                      {s.value}
                    </span>
                    <span className="text-white/70 text-xs font-semibold tracking-wide">{s.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="px-8 pt-8">
          {/* ── TOAST ── */}
          {toast && (
            <div
              className={`fixed top-6 right-6 z-50 flex items-center gap-2.5 px-5 py-3.5 rounded-xl text-sm font-semibold shadow-xl animate-fadeIn ${
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

          {error && (
            <div
              className="flex items-center gap-2.5 rounded-xl px-4 py-3 mb-5 text-sm font-medium"
              style={{ background: "#FDF1F1", color: "#B23A3A", border: "1px solid #F5D6D6" }}
            >
              <AlertCircle size={17} />
              {error}
            </div>
          )}

          {/* ── TABS + REFRESH ── */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="flex gap-2 flex-wrap">
              {[
                { key: "overview", label: "Event Progress", icon: "📊" },
                { key: "allTasks", label: "All Tasks", icon: "📋" },
                { key: "volunteers", label: "Volunteers & Tasks", icon: "👥" },
              ].map((tab) => (
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
                </button>
              ))}
            </div>

            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border text-sm font-semibold transition-all disabled:opacity-50 self-start md:self-auto"
              style={{ borderColor: COLORS.line, color: "#5A5164" }}
            >
              <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>

          {/* ════════ TAB 1: EVENT PROGRESS ════════ */}
          {activeTab === "overview" && (
            <div className="bg-white rounded-2xl border p-6" style={{ borderColor: COLORS.line }}>
              {eventProgress.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
                    style={{ background: "#F3ECFA" }}
                  >
                    <ListTodo size={26} style={{ color: COLORS.purple }} />
                  </div>
                  <p className="font-bold" style={{ color: COLORS.ink }}>No tasks yet</p>
                  <p className="text-sm mt-1" style={{ color: "#9A90A8" }}>
                    Tasks assigned by organizers will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  {eventProgress.map((item) => (
                    <div
                      key={item.event._id}
                      className="rounded-xl p-5 border transition-all hover:shadow-md"
                      style={{ borderColor: COLORS.line, background: "#FAF8FC" }}
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                            style={{ background: "linear-gradient(135deg, #8b4fa2, #4ECDC4)" }}
                          >
                            <Calendar size={18} className="text-white" />
                          </div>
                          <div>
                            <h3 className="font-extrabold" style={{ color: COLORS.ink }}>{item.event.title}</h3>
                            <p className="text-xs mt-0.5" style={{ color: "#9A90A8" }}>
                              {item.event.venue || "TBA"} •{" "}
                              {item.event.start_date ? new Date(item.event.start_date).toLocaleDateString() : "N/A"}
                            </p>
                          </div>
                        </div>
                        <span className="text-lg font-black" style={{ color: COLORS.purple }}>
                          {item.completionRate}%
                        </span>
                      </div>

                      <div className="w-full h-2.5 bg-white rounded-full overflow-hidden mb-3 border" style={{ borderColor: COLORS.line }}>
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${item.completionRate}%`, background: "linear-gradient(90deg, #8b4fa2, #4ECDC4)" }}
                        />
                      </div>

                      <div className="flex flex-wrap gap-2 text-xs font-bold">
                        <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                          Pending {item.pending}
                        </span>
                        <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                          In Progress {item.inProgress}
                        </span>
                        <span className="px-3 py-1 rounded-full bg-green-50 text-green-700 border border-green-200">
                          Completed {item.completed}
                        </span>
                        <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                          Total {item.totalTasks}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ════════ TAB 2: ALL TASKS ════════ */}
          {activeTab === "allTasks" && (
            <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: COLORS.line }}>
              <div className="p-5 border-b" style={{ borderColor: COLORS.line, background: "#FAF8FC" }}>
                <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "#B3A9C2" }} />
                    <input
                      type="text"
                      placeholder="Search by task title or description..."
                      value={filters.search}
                      onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border bg-white text-sm outline-none focus:ring-2 transition"
                      style={{ borderColor: COLORS.line, "--tw-ring-color": COLORS.purple }}
                    />
                  </div>

                  <select
                    value={filters.event_id}
                    onChange={(e) => setFilters((p) => ({ ...p, event_id: e.target.value }))}
                    className="px-4 py-2.5 rounded-xl border bg-white text-sm cursor-pointer outline-none max-w-45"
                    style={{ borderColor: COLORS.line }}
                  >
                    <option value="">All Events</option>
                    {events.map((ev) => (
                      <option key={ev._id} value={ev._id}>{ev.title}</option>
                    ))}
                  </select>

                  <select
                    value={filters.status}
                    onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}
                    className="px-4 py-2.5 rounded-xl border bg-white text-sm cursor-pointer outline-none"
                    style={{ borderColor: COLORS.line }}
                  >
                    <option value="">All Status</option>
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>

                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl text-white text-sm font-bold transition hover:shadow-lg"
                    style={{ background: "linear-gradient(135deg, #8b4fa2, #6d3483)" }}
                  >
                    Search
                  </button>

                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white border text-sm font-bold transition"
                      style={{ borderColor: COLORS.line, color: "#5A5164" }}
                    >
                      <X size={14} />
                      Clear
                    </button>
                  )}
                </form>
              </div>

              <div className="p-6">
                {loadingTasks ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader size={30} style={{ color: COLORS.purple }} className="animate-spin" />
                  </div>
                ) : allTasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-56 text-center">
                    <ListTodo size={36} className="mb-3" style={{ color: "#DED4EA" }} />
                    <p className="font-bold" style={{ color: COLORS.ink }}>No tasks found</p>
                    <p className="text-sm mt-1" style={{ color: "#9A90A8" }}>Try adjusting your filters.</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-150 overflow-y-auto pr-2">
                    {allTasks.map((task) => (
                      <div
                        key={task._id}
                        className="rounded-xl overflow-hidden border transition-all hover:shadow-md flex"
                        style={{ borderColor: COLORS.line }}
                      >
                        <div className="w-1.5 shrink-0" style={{ background: getStatusAccent(task.status) }} />
                        <div className="flex items-start justify-between gap-4 flex-wrap p-4 flex-1">
                          <div className="flex-1 min-w-50">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <h3 className="font-bold" style={{ color: COLORS.ink }}>{task.title}</h3>
                              <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full border ${getStatusClass(task.status)}`}>
                                {getStatusIcon(task.status)}
                                {task.status}
                              </span>
                            </div>
                            <p className="text-sm" style={{ color: "#8A8094" }}>{task.description || "No description"}</p>
                            <div className="flex flex-wrap items-center gap-4 mt-2 text-xs" style={{ color: "#9A90A8" }}>
                              <span className="flex items-center gap-1">
                                <Calendar size={12} />
                                {task.event_id?.title || "Unknown Event"}
                              </span>
                              <span className="flex items-center gap-1">
                                <UserCheck size={12} />
                                {task.assigned_to?.student_id?.name || "Unassigned"}
                              </span>
                              <span>•</span>
                              <span>{formatDate(task.createdAt)}</span>
                            </div>
                          </div>

                          <button
                            onClick={() => handleDeleteTask(task._id)}
                            disabled={deletingId === task._id}
                            className="p-2 rounded-lg transition disabled:opacity-50"
                            style={{ color: COLORS.coral }}
                            title="Delete task"
                          >
                            {deletingId === task._id ? (
                              <Loader size={18} className="animate-spin" />
                            ) : (
                              <Trash2 size={18} />
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ════════ TAB 3: VOLUNTEERS & TASKS ════════ */}
          {activeTab === "volunteers" && (
            <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: COLORS.line }}>
              <div className="p-5 border-b" style={{ borderColor: COLORS.line, background: "#FAF8FC" }}>
                <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
                  <label className="text-sm font-bold flex items-center gap-2" style={{ color: "#5A5164" }}>
                    <Calendar size={16} style={{ color: COLORS.purple }} />
                    Select Event:
                  </label>
                  <select
                    value={selectedEvent}
                    onChange={(e) => setSelectedEvent(e.target.value)}
                    className="flex-1 px-4 py-2.5 rounded-xl border bg-white text-sm cursor-pointer outline-none"
                    style={{ borderColor: COLORS.line }}
                  >
                    <option value="">Choose an event...</option>
                    {events.map((event) => (
                      <option key={event._id} value={event._id}>
                        {event.title} ({event.start_date ? new Date(event.start_date).toLocaleDateString() : "N/A"})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-6">
                {!selectedEvent ? (
                  <div className="flex flex-col items-center justify-center h-56 text-center">
                    <Users size={36} className="mb-3" style={{ color: "#DED4EA" }} />
                    <p className="font-bold" style={{ color: COLORS.ink }}>Select an event</p>
                    <p className="text-sm mt-1" style={{ color: "#9A90A8" }}>Choose an event above to view its volunteers.</p>
                  </div>
                ) : loadingVolunteers ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader size={30} style={{ color: COLORS.purple }} className="animate-spin" />
                  </div>
                ) : volunteerTasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-56 text-center">
                    <Users size={36} className="mb-3" style={{ color: "#DED4EA" }} />
                    <p className="font-bold" style={{ color: COLORS.ink }}>No volunteers</p>
                    <p className="text-sm mt-1" style={{ color: "#9A90A8" }}>No volunteers registered for this event yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {volunteerTasks.map((item) => {
                      const pct = item.taskCount > 0 ? Math.round((item.completedCount / item.taskCount) * 100) : 0;
                      const isExpanded = expandedVolunteer === item.volunteer._id;
                      return (
                        <div
                          key={item.volunteer._id}
                          className="rounded-xl overflow-hidden border transition-all"
                          style={{ borderColor: isExpanded ? COLORS.purple : COLORS.line }}
                        >
                          <div
                            className="p-4 cursor-pointer transition"
                            style={{ background: isExpanded ? "#F3ECFA" : "#FAF8FC" }}
                            onClick={() => toggleVolunteerExpand(item.volunteer._id)}
                          >
                            <div className="flex items-center justify-between gap-3 flex-wrap">
                              <div className="flex items-center gap-3">
                                <div
                                  className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                                  style={{ background: "linear-gradient(135deg, #8b4fa2, #4ECDC4)" }}
                                >
                                  {item.volunteer.student?.name?.charAt(0)?.toUpperCase() || "V"}
                                </div>
                                <div>
                                  <p className="font-bold" style={{ color: COLORS.ink }}>
                                    {item.volunteer.student?.name || "Unknown Volunteer"}
                                  </p>
                                  <div className="flex flex-wrap items-center gap-3 text-xs mt-0.5" style={{ color: "#9A90A8" }}>
                                    <span className="flex items-center gap-1">
                                      <Mail size={12} />
                                      {item.volunteer.student?.email || "No email"}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Building size={12} />
                                      {item.volunteer.student?.department || "N/A"}
                                    </span>
                                    {item.volunteer.student?.phone && (
                                      <span className="flex items-center gap-1">
                                        <Phone size={12} />
                                        {item.volunteer.student.phone}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="flex gap-2 text-xs font-bold">
                                  <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                                    {item.taskCount} tasks
                                  </span>
                                  <span
                                    className={`px-2.5 py-1 rounded-full border ${
                                      item.completedCount === item.taskCount && item.taskCount > 0
                                        ? "bg-green-50 text-green-700 border-green-200"
                                        : "bg-blue-50 text-blue-700 border-blue-200"
                                    }`}
                                  >
                                    {item.completedCount} done
                                  </span>
                                </div>
                                {isExpanded ? (
                                  <ChevronDown size={20} style={{ color: COLORS.purple }} />
                                ) : (
                                  <ChevronRight size={20} className="text-gray-400" />
                                )}
                              </div>
                            </div>

                            {item.taskCount > 0 && (
                              <div className="w-full h-1.5 bg-white rounded-full overflow-hidden mt-3 border" style={{ borderColor: COLORS.line }}>
                                <div
                                  className="h-full rounded-full transition-all"
                                  style={{ width: `${pct}%`, background: "linear-gradient(90deg, #8b4fa2, #4ECDC4)" }}
                                />
                              </div>
                            )}
                          </div>

                          {isExpanded && (
                            <div className="p-4 border-t" style={{ borderColor: COLORS.line }}>
                              {item.tasks.length === 0 ? (
                                <p className="text-sm text-center py-4" style={{ color: "#9A90A8" }}>
                                  No tasks assigned to this volunteer
                                </p>
                              ) : (
                                <div className="space-y-2">
                                  {item.tasks.map((task) => (
                                    <div
                                      key={task._id}
                                      className="rounded-lg p-3 border transition flex items-center"
                                      style={{ borderColor: COLORS.line }}
                                    >
                                      <div className="w-1 self-stretch rounded-full mr-3" style={{ background: getStatusAccent(task.status) }} />
                                      <div className="flex items-center justify-between gap-2 flex-wrap flex-1">
                                        <div>
                                          <p className="font-semibold text-sm" style={{ color: COLORS.ink }}>{task.title}</p>
                                          <p className="text-xs" style={{ color: "#9A90A8" }}>{task.description || "No description"}</p>
                                        </div>
                                        <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full border ${getStatusClass(task.status)}`}>
                                          {getStatusIcon(task.status)}
                                          {task.status}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.25s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default AdminTasks;