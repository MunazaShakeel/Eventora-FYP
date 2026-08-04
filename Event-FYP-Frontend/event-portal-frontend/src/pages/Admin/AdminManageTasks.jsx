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
  Eye,
  UserPlus,
  CalendarCheck,
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
  
  // New state for modals
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskToDelete, setTaskToDelete] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchOverview = async () => {
    setLoading(true);
    setError("");
    try {
      const [statsRes, progressRes] = await axios.all([
        axios.get(`${API_URL}/api/tasks/admin/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API_URL}/api/tasks/admin/event-progress`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      
      setStats(statsRes.data?.data || null);
      
      let progressData = progressRes.data?.data || [];
      
      const eventsRes = await axios.get(`${API_URL}/api/events/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      let allEvents = Array.isArray(eventsRes.data)
        ? eventsRes.data
        : Array.isArray(eventsRes.data?.events)
        ? eventsRes.data.events
        : [];
      const approvedEventIds = new Set(
        allEvents.filter(e => e.approved === true).map(e => e._id)
      );
      
      progressData = progressData.filter(item => 
        approvedEventIds.has(item.event?._id)
      );
      
      setEventProgress(progressData);
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
      let list = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.events)
        ? res.data.events
        : [];
      
      list = list.filter(event => event.approved === true);
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
    
    const event = events.find(e => e._id === eventId);
    if (!event || !event.approved) {
      setVolunteerTasks([]);
      showToast("This event is not approved yet.", "error");
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

  const handleDeleteTask = async () => {
    if (!taskToDelete) return;
    
    setDeletingId(taskToDelete);
    try {
      await axios.delete(`${API_URL}/api/tasks/${taskToDelete}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAllTasks((prev) => prev.filter((t) => t._id !== taskToDelete));
      showToast("Task deleted successfully.", "success");
      fetchOverview();
      setShowDeleteModal(false);
      setTaskToDelete(null);
    } catch (err) {
      showToast(err?.response?.data?.message || "Failed to delete task.", "error");
    } finally {
      setDeletingId(null);
    }
  };

  const openDeleteModal = (taskId) => {
    setTaskToDelete(taskId);
    setShowDeleteModal(true);
  };

  const openViewModal = (task) => {
    setSelectedTask(task);
    setShowViewModal(true);
  };

 useEffect(() => {
  if (!token) return;
  fetchOverview();
  fetchEvents();
}, [token]);

  useEffect(() => {
    if (activeTab === "allTasks") fetchAllTasks();
  }, [activeTab, filters.status, filters.event_id, filters.search]);

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
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const hasActiveFilters = filters.status || filters.search || filters.event_id;

  // Custom loading component with improved animation
  const LoadingSpinner = () => (
    <div className="flex items-center justify-center py-16">
      <div className="relative">
        <div
          className="w-12 h-12 rounded-full border-4 animate-spin"
          style={{ borderColor: COLORS.line, borderTopColor: COLORS.purple }}
        />
        <div
          className="absolute inset-0 w-12 h-12 rounded-full border-4 animate-pulse opacity-50"
          style={{ borderColor: COLORS.turquoise }}
        />
      </div>
    </div>
  );

  // Empty state component
  const EmptyState = ({ icon: Icon, title, message, iconColor = COLORS.purple }) => (
    <div className="flex flex-col items-center justify-center h-64 text-center">
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
        style={{ background: `${iconColor}15` }}
      >
        <Icon size={32} style={{ color: iconColor }} />
      </div>
      <p className="font-bold text-lg" style={{ color: COLORS.ink }}>{title}</p>
      <p className="text-sm mt-1 max-w-sm" style={{ color: "#9A90A8" }}>
        {message}
      </p>
    </div>
  );

  if (loading) {
    return (
      <div className="flex min-h-screen" style={{ background: COLORS.paper }}>
        <AdminSidebar />
        <div className="flex-1 md:ml-64 flex items-center justify-center">
          <div className="text-center">
            <div className="relative">
              <div
                className="w-14 h-14 rounded-full border-[3px] animate-spin mx-auto mb-4"
                style={{ borderColor: COLORS.line, borderTopColor: COLORS.purple }}
              />
              <div
                className="absolute inset-0 w-14 h-14 rounded-full border-[3px] animate-pulse mx-auto opacity-50"
                style={{ borderColor: COLORS.turquoise }}
              />
            </div>
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
                    onClick={() => s.key === "volunteers" || s.key === "events" ? null : handleStatCardClick(s.key)}
                    className={`flex items-center gap-2.5 px-5 py-2.5 rounded-full transition-all duration-300 hover:scale-105 ${
                      s.key === "volunteers" || s.key === "events" ? "cursor-default" : "cursor-pointer"
                    }`}
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
                <EmptyState
                  icon={ListTodo}
                  title="No tasks yet"
                  message="Tasks assigned by organizers will appear here once events are approved."
                />
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
                      placeholder="Search by task title, description, volunteer, or event name..."
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
                  <LoadingSpinner />
                ) : allTasks.length === 0 ? (
                  <EmptyState
                    icon={ListTodo}
                    title="No tasks found"
                    message="Try adjusting your search or filters to find what you're looking for."
                  />
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

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openViewModal(task)}
                              className="p-2 rounded-lg transition hover:bg-purple-50"
                              style={{ color: COLORS.purple }}
                              title="View task details"
                            >
                              <Eye size={18} />
                            </button>
                            <button
                              onClick={() => openDeleteModal(task._id)}
                              disabled={deletingId === task._id}
                              className="p-2 rounded-lg transition hover:bg-red-50 disabled:opacity-50"
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
                  <EmptyState
                    icon={Users}
                    title="Select an event"
                    message="Choose an event above to view its volunteers and their assigned tasks."
                  />
                ) : loadingVolunteers ? (
                  <LoadingSpinner />
                ) : volunteerTasks.length === 0 ? (
                  <EmptyState
                    icon={Users}
                    title="No volunteers"
                    message="No volunteers registered for this event yet."
                    iconColor="#FF6B6B"
                  />
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

      {/* ── DELETE CONFIRMATION MODAL ── */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full mx-4 p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "#FDF1F1" }}>
                <AlertCircle size={20} style={{ color: COLORS.coral }} />
              </div>
              <h3 className="text-lg font-bold" style={{ color: COLORS.ink }}>Delete Task</h3>
            </div>
            <p className="text-sm" style={{ color: "#5A5164" }}>
              Are you sure you want to permanently delete this task? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setTaskToDelete(null);
                }}
                className="px-4 py-2 rounded-xl border text-sm font-bold transition hover:bg-gray-50"
                style={{ borderColor: COLORS.line, color: "#5A5164" }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteTask}
                disabled={deletingId === taskToDelete}
                className="px-4 py-2 rounded-xl text-white text-sm font-bold transition hover:shadow-lg disabled:opacity-50"
                style={{ background: COLORS.coral }}
              >
                {deletingId === taskToDelete ? (
                  <Loader size={16} className="animate-spin" />
                ) : (
                  "Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── VIEW TASK MODAL ── */}
      {showViewModal && selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full mx-4 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: `${COLORS.purple}15` }}>
                  <Eye size={20} style={{ color: COLORS.purple }} />
                </div>
                <h3 className="text-lg font-bold" style={{ color: COLORS.ink }}>Task Details</h3>
              </div>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedTask(null);
                }}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition"
              >
                <X size={18} style={{ color: "#9A90A8" }} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#9A90A8" }}>Task Title</label>
                <p className="font-bold" style={{ color: COLORS.ink }}>{selectedTask.title}</p>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#9A90A8" }}>Description</label>
                <p className="text-sm" style={{ color: "#5A5164" }}>{selectedTask.description || "No description provided"}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#9A90A8" }}>Event</label>
                  <p className="font-medium" style={{ color: COLORS.ink }}>{selectedTask.event_id?.title || "Unknown"}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#9A90A8" }}>Status</label>
                  <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full border mt-1 ${getStatusClass(selectedTask.status)}`}>
                    {getStatusIcon(selectedTask.status)}
                    {selectedTask.status}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#9A90A8" }}>Assigned To</label>
                <p className="font-medium" style={{ color: COLORS.ink }}>
                  {selectedTask.assigned_to?.student_id?.name || "Unassigned"}
                  {selectedTask.assigned_to?.student_id?.email && (
                    <span className="ml-2 text-xs font-normal" style={{ color: "#9A90A8" }}>
                      ({selectedTask.assigned_to.student_id.email})
                    </span>
                  )}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t" style={{ borderColor: COLORS.line }}>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#9A90A8" }}>Created</label>
                  <p className="text-sm" style={{ color: "#5A5164" }}>{formatDate(selectedTask.createdAt)}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#9A90A8" }}>Last Updated</label>
                  <p className="text-sm" style={{ color: "#5A5164" }}>{formatDate(selectedTask.updatedAt)}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedTask(null);
                }}
                className="px-6 py-2.5 rounded-xl text-white text-sm font-bold transition hover:shadow-lg"
                style={{ background: "linear-gradient(135deg, #8b4fa2, #6d3483)" }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

     <style>{`
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