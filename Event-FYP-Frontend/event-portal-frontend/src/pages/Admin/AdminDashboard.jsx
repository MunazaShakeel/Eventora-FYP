import React, { useEffect, useState, useRef } from "react";
import AdminSidebar from "../../components/AdminSidebar";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import DownloadCSVAdvanced from "../../components/DownloadCSVAdvanced";

import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
  RadialBarChart, RadialBar,
} from "recharts";

// ==================== NOTIFICATION BELL COMPONENT ====================
// ==================== NOTIFICATION BELL COMPONENT ====================
const NotificationBell = ({ 
  notifications, 
  unreadCount, 
  loadingNotifs, 
  onToggle, 
  isOpen, 
  onMarkRead, 
  onMarkAllRead, 
  onDelete, 
  dropdownRef 
}) => {
  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
    return date.toLocaleDateString('en-PK', { day: 'numeric', month: 'short' });
  };

  const getIconByType = (type) => {
    switch (type) {
      case 'event': return '📅';
      case 'certificate': return '🏆';
      case 'task': return '📋';
      case 'attendance': return '✅';
      default: return '📢';
    }
  };

  const getBgByType = (type) => {
    switch (type) {
      case 'event': return '#f5eefa';
      case 'certificate': return '#fffce8';
      case 'task': return '#e6faf8';
      case 'attendance': return '#d1fae5';
      default: return '#f3f4f6';
    }
  };

  const getColorByType = (type) => {
    switch (type) {
      case 'event': return '#9B59B6';
      case 'certificate': return '#FFE66D';
      case 'task': return '#4ECDC4';
      case 'attendance': return '#10b981';
      default: return '#6b7280';
    }
  };

  return (
    <div className="relative hidden md:block" ref={dropdownRef}>
      <button
        onClick={onToggle}
        className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition relative"
      >
        <span className="material-symbols-outlined text-[22px] text-gray-600">
          {unreadCount > 0 ? 'notifications_active' : 'notifications'}
        </span>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-linear-to-r from-purple-50 to-teal-50">
            <p className="text-sm font-black text-gray-800">Notifications</p>
            <div className="flex items-center gap-2">
              {/* ✅ MARK ALL READ - HAMESHA DIKHEGA */}
              <button 
                onClick={onMarkAllRead}
                disabled={unreadCount === 0}
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition
                  ${unreadCount > 0 
                    ? 'text-[#9B59B6] bg-purple-100 hover:bg-purple-200 cursor-pointer' 
                    : 'text-gray-400 bg-gray-100 cursor-not-allowed'
                  }`}
              >
                Mark all read
              </button>
              <span className="text-[10px] font-bold text-[#9B59B6] bg-purple-50 px-2 py-0.5 rounded-full">
                {unreadCount} new
              </span>
            </div>
          </div>

          {loadingNotifs ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-400">
              <span className="material-symbols-outlined text-[36px] mb-2">notifications_none</span>
              <p className="text-sm font-semibold">No notifications</p>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
              {notifications.slice(0, 10).map((n) => (
                <div
                  key={n.id}
                  className={`flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition cursor-pointer ${!n.isRead ? 'bg-purple-50/30' : ''}`}
                  onClick={() => !n.isRead && onMarkRead(n._id)}
                >
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: getBgByType(n.type) }}>
                    <span className="text-lg">{getIconByType(n.type)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-700 leading-snug">{n.title}</p>
                    <p className="text-[11px] text-gray-500 leading-relaxed mt-0.5">{n.message}</p>
                    <p className="text-[10px] text-gray-400 mt-1">{formatTime(n.time)}</p>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onDelete(n._id); }} 
                    className="text-gray-300 hover:text-red-400 transition shrink-0 ml-1"
                  >
                    <span className="material-symbols-outlined text-[14px]">close</span>
                  </button>
                  {!n.isRead && (
                    <div className="w-1.5 h-1.5 rounded-full bg-[#9B59B6] shrink-0 mt-1" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ==================== ADMIN DASHBOARD ====================
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

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
  const navigate = useNavigate();
  const { token } = useAuth();
  const notifRef = useRef(null);
  
  const [notifications, setNotifications] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  
  const [adminStats, setAdminStats] = useState(null);
  const [dashStats, setDashStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [animate, setAnimate] = useState(false);
  const [currentTime, setCurrentTime] = useState("");
  const [currentDate, setCurrentDate] = useState("");
  const [greeting, setGreeting] = useState("");
  const [recentActivities, setRecentActivities] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [exportingExcel, setExportingExcel] = useState(false);

  const getExportData = () => {
    const data = [];
    if (dashStats?.events) {
      data.push({ "Category": "Total Events", "Value": dashStats.events.totalEvents || 0 });
      data.push({ "Category": "Approved Events", "Value": dashStats.events.approvedEvents || 0 });
      data.push({ "Category": "Pending Events", "Value": dashStats.events.rejectedEvents || 0 });
    }
    if (dashStats?.registrations) {
      data.push({ "Category": "Total Registrations", "Value": dashStats.registrations.totalRegistrations || 0 });
      data.push({ "Category": "Present", "Value": dashStats.registrations.presentCount || 0 });
      data.push({ "Category": "Absent", "Value": dashStats.registrations.absentCount || 0 });
    }
    if (dashStats?.tasks) {
      data.push({ "Category": "Completed Tasks", "Value": dashStats.tasks.completedTasks || 0 });
      data.push({ "Category": "Pending Tasks", "Value": dashStats.tasks.pendingTasks || 0 });
    }
    data.push({ "Category": "Total Students", "Value": adminStats?.totalStudents || 0 });
    data.push({ "Category": "Total Organizers", "Value": adminStats?.totalOrganizers || 0 });
    data.push({ "Category": "Certificates Issued", "Value": dashStats?.totalCertificates || 0 });
    return data;
  };

  const customHeaders = ["Metric", "Value"];
  const mapData = (item) => [item.Category, item.Value];

  // ==================== NOTIFICATION FUNCTIONS ====================
  const fetchNotifications = async () => {
    if (!token) return;
    setLoadingNotifs(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get(`${API_URL}/notifications`, { headers });
      if (response.data.success) {
        const notifs = response.data.notifications.map(notif => ({
          id: notif._id,
          _id: notif._id,
          title: notif.title,
          message: notif.message,
          type: notif.type || 'system',
          isRead: notif.isRead || false,
          time: notif.createdAt || new Date().toISOString(),
        }));
        setNotifications(notifs);
        setUnreadCount(response.data.unreadCount || 0);
      }
    } catch (err) {
      console.error("Notification fetch failed:", err);
    } finally {
      setLoadingNotifs(false);
    }
  };

  const markAsRead = async (notificationId) => {
    if (!token) return;
    try {
      await axios.put(`${API_URL}/notifications/${notificationId}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(prev =>
        prev.map(n => n._id === notificationId ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Error marking as read:", err);
    }
  };
  

const markAllAsRead = async () => {
  if (!token) return;
  try {
    await axios.put(`${API_URL}/notifications/read-all`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
    
  } catch (err) {
    console.error("Error marking all as read:", err);
  }
};

  const deleteNotification = async (notificationId) => {
    if (!token) return;
    try {
      await axios.delete(`${API_URL}/notifications/${notificationId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const deleted = notifications.find(n => n._id === notificationId);
      setNotifications(prev => prev.filter(n => n._id !== notificationId));
      if (!deleted?.isRead) setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Error deleting notification:", err);
    }
  };

  // ==================== CLOCK & GREETING ====================
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

  // ==================== DATA FETCH ====================
  const fetchAllData = async () => {
    try {
      setError(""); 
      const headers = { Authorization: `Bearer ${token}` };
      const [adminRes, dashRes] = await Promise.all([
        axios.get(`${API_URL}/admin/dashboard`, { headers }),
        axios.get(`${API_URL}/dashboard`, { headers }),
      ]);
      setAdminStats(adminRes.data);
      setDashStats(dashRes.data);
      
      const activities = [];
      const now = new Date();
      
      if (adminRes.data?.pendingEvents?.length) {
        adminRes.data.pendingEvents.slice(0, 2).forEach(ev => {
          activities.push({
            id: `ev-${ev._id}`,
            type: 'event_pending',
            message: `Event "${ev.title}" is pending approval`,
            time: ev.createdAt || new Date(now.getTime() - Math.random() * 86400000 * 2).toISOString(),
            icon: 'event_note',
            color: '#f59e0b'
          });
        });
      }
      
      if (adminRes.data?.totalStudents > 0) {
        activities.push({
          id: 'student-reg',
          type: 'student_registered',
          message: `${adminRes.data.totalStudents} students registered on platform`,
          time: new Date(now.getTime() - 3600000 * 2).toISOString(),
          icon: 'school',
          color: '#9B59B6'
        });
      }
      
      if (adminRes.data?.totalOrganizers > 0) {
        activities.push({
          id: 'organizer-reg',
          type: 'organizer_registered',
          message: `${adminRes.data.totalOrganizers} organizers registered`,
          time: new Date(now.getTime() - 3600000 * 5).toISOString(),
          icon: 'group',
          color: '#4ECDC4'
        });
      }
      
      if (dashRes.data?.totalCertificates > 0) {
        activities.push({
          id: 'cert-issued',
          type: 'certificate_issued',
          message: `${dashRes.data.totalCertificates} certificates issued`,
          time: new Date(now.getTime() - 86400000).toISOString(),
          icon: 'workspace_premium',
          color: '#FFE66D'
        });
      }
      
      if (dashRes.data?.tasks?.completedTasks > 0) {
        activities.push({
          id: 'task-complete',
          type: 'task_completed',
          message: `${dashRes.data.tasks.completedTasks} tasks completed`,
          time: new Date(now.getTime() - 3600000 * 12).toISOString(),
          icon: 'task_alt',
          color: '#4ECDC4'
        });
      }
      
      setRecentActivities(activities.slice(0, 10));
      
      if (dashRes.data?.events?.upcomingEvents) {
        setUpcomingEvents(dashRes.data.events.upcomingEvents.slice(0, 5));
      }
      
    } catch (err) {
      console.error(err);
      setError("Failed to load dashboard data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!token) return;  
    fetchAllData();
    fetchNotifications();
    setTimeout(() => setAnimate(true), 200);
    
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [token]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAllData();
  };

  // ==================== CLICK OUTSIDE ====================
  useEffect(() => {
    const handleClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // ==================== LOADING & ERROR ====================
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

  if (error) return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <main className="flex-1 md:ml-64 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 text-center shadow-xl max-w-md">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <span className="material-symbols-outlined text-4xl text-red-500">error</span>
          </div>
          <p className="text-red-500 font-semibold">{error}</p>
          <button onClick={handleRefresh}
            className="mt-4 px-4 py-2 bg-[#9B59B6] text-white rounded-xl text-sm font-semibold hover:bg-[#7a3f91] transition-colors">
            Retry
          </button>
        </div>
      </main>
    </div>
  );

  // ==================== DERIVED DATA ====================
  const ev = dashStats?.events || {};
  const reg = dashStats?.registrations || {};
  const tsk = dashStats?.tasks || {};

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
        { label: `${ev.rejectedEvents ?? 0} Pending`, color: "#f59e0b", bg: "#fed7aa" },
      ],
    },
    {
      label: "Registrations", value: reg.totalRegistrations ?? 0,
      icon: "app_registration", color: "#FF6B6B", bg: "#fff0f0", delay: 200,
      subStats: [
        { label: `${reg.presentCount ?? 0} Present`, color: "#10b981", bg: "#d1fae5" },
        { label: `${reg.absentCount ?? 0} Absent`, color: "#ef4444", bg: "#fee2e2" },
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
    { name: "Pending", value: ev.rejectedEvents ?? 0 },
  ];
  const PIE_COLORS = ["#9B59B6", "#FF6B6B"];

  const attendanceBarData = [{ name: "Attendance", Present: reg.presentCount ?? 0, Absent: reg.absentCount ?? 0 }];
  const tasksBarData = [{ name: "Tasks", Completed: tsk.completedTasks ?? 0, Pending: tsk.pendingTasks ?? 0 }];

  const usersRadialData = [
    { name: "Students", value: adminStats?.totalStudents ?? 0, fill: "#9B59B6" },
    { name: "Organizers", value: adminStats?.totalOrganizers ?? 0, fill: "#4ECDC4" },
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

  const quickActions = [
    { label: "Manage Events", icon: "event", color: "#9B59B6", bg: "#f5eefa", path: "/admin/events" },
    { label: "Manage Students", icon: "school", color: "#4ECDC4", bg: "#e6fafa", path: "/admin/students" },
    { label: "Manage Organizers", icon: "badge", color: "#FF6B6B", bg: "#fff0f0", path: "/admin/organizers" },
    { label: "Generate Reports", icon: "analytics", color: "#4B5563", bg: "#f3f4f6", path: "/admin/attendance-reports" },
    { label: "Task Management", icon: "task", color: "#f59e0b", bg: "#fff8e6", path: "/admin/manage-tasks" },
    { label: "Gallery", icon: "photo_library", color: "#10b981", bg: "#e6faf0", path: "/admin/gallery" },
    { label: "Certificates", icon: "workspace_premium", color: "#FFE66D", bg: "#fffce8", path: "/admin/certificates" },
    { label: "Feedback", icon: "rate_review", color: "#8b4fa2", bg: "#f5eefa", path: "/admin/feedback" },
  ];

  // ==================== RENDER ====================
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

      <div className="flex min-h-screen bg-gray-50">
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

              <div className="flex items-center gap-4">
                {/* Refresh Button */}
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition relative disabled:opacity-50"
                  title="Refresh Dashboard"
                >
                  <span className={`material-symbols-outlined text-[22px] text-gray-600 ${refreshing ? 'animate-spin' : ''}`}>
                    refresh
                  </span>
                </button>

                {/* Export Button */}
                <DownloadCSVAdvanced
                  data={getExportData()}
                  filename="dashboard_report"
                  buttonText="Export"
                  buttonIcon="spreadsheet"
                  customHeaders={["Metric", "Value"]}
                  mapData={mapData}
                  size="sm"
                  className="shadow-[0_4px_15px_rgba(139,79,162,0.25)] hover:shadow-[0_4px_20px_rgba(139,79,162,0.4)]"
                />

                {/*NOTIFICATION BELL */}
                <NotificationBell
                  notifications={notifications}
                  unreadCount={unreadCount}
                  loadingNotifs={loadingNotifs}
                  isOpen={notifOpen}
                  onToggle={() => {
  setNotifOpen(!notifOpen);
}}
                  onMarkRead={markAsRead}
                  onMarkAllRead={markAllAsRead}
                  onDelete={deleteNotification}
                  dropdownRef={notifRef}
                />

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
          <div className="mt-8 mb-10">
            <h3 className="text-sm font-bold text-gray-600 mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#9B59B6] text-lg">bolt</span>
              Quick Actions
            </h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-8 gap-3 justify-items-center">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => navigate(action.path)}
                  className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105 flex flex-col items-center gap-2 group w-full max-w-22.5"
                  style={{
                    animation: `slideUp 0.5s ease forwards ${index * 50 + 400}ms`,
                    opacity: 0,
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                    style={{ backgroundColor: action.bg }}
                  >
                    <span className="material-symbols-outlined text-xl" style={{ color: action.color }}>
                      {action.icon}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-gray-600 text-center leading-tight">
                    {action.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* ── REMAINING DASHBOARD CONTENT (SAME AS BEFORE) ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4 mb-6">
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
                {attendanceBarData[0].Present === 0 && attendanceBarData[0].Absent === 0 ? (
                  <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                    <span className="material-symbols-outlined text-4xl mb-2 opacity-50">no_meeting_room</span>
                    <p className="text-sm font-semibold">No attendance data</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart data={attendanceBarData} barSize={36}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                      <XAxis dataKey="name" tick={axisStyle} axisLine={false} tickLine={false} />
                      <YAxis tick={axisStyle} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f5eefa" }} />
                      <Legend wrapperStyle={{ fontSize: 11, color: "#9ca3af" }} />
                      <Bar dataKey="Present" fill="#9B59B6" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="Absent" fill="#FF6B6B" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
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
                        style={{ width: animate ? `${item.value}%` : "0%", backgroundColor: item.color, boxShadow: `0 0 8px ${item.color}80` }} />
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
                  <Bar dataKey="Pending" fill="#FFE66D" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all"
              style={{ animation: "slideUp 0.5s ease forwards 580ms", opacity: 0 }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-black text-gray-800">👥 Users Distribution</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Students · Organizers</p>
                </div>
                <span className="material-symbols-outlined text-[#4ECDC4]" style={{ fontVariationSettings: "'FILL' 1" }}>donut_large</span>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-purple-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-500 font-medium">Students</p>
                  <p className="text-2xl font-black text-[#9B59B6]">{adminStats?.totalStudents ?? 0}</p>
                </div>
                <div className="bg-teal-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-500 font-medium">Organizers</p>
                  <p className="text-2xl font-black text-[#4ECDC4]">{adminStats?.totalOrganizers ?? 0}</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={160}>
                <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="85%"
                  data={usersRadialData} startAngle={180} endAngle={0}>
                  <RadialBar minAngle={15} dataKey="value" clockWise />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconSize={10} layout="horizontal" verticalAlign="bottom" align="center"
                    wrapperStyle={{ fontSize: 10, color: "#6b7280", paddingTop: 8 }} />
                </RadialBarChart>
              </ResponsiveContainer>
            </div>

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
      <span className="material-symbols-outlined text-5xl mb-3 opacity-50">star</span>
      <p className="text-sm font-semibold">No feedback data yet.</p>
    </div>
  ) : (
    <div className="space-y-3">
      {dashStats.topEvents.slice(0, 3).map((ev, i) => {  // Added slice(0,3)
        const reviewCount = ev.totalFeedbacks || 0;
        return (
          <div key={ev._id || i}  // Better key
            className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-all cursor-pointer">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black text-white shadow-md shrink-0"
                style={{ background: medalGradients[i] || medalGradients[2] }}>  {/* FIX: Fallback */}
                {i + 1}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-gray-700 truncate max-w-45">
                  {ev.title || ev.eventTitle || ev._id?.toString().slice(-6) || 'Unknown Event'}
                </p>
                <p className="text-[10px] text-gray-400">
                  {reviewCount} {reviewCount === 1 ? 'review' : 'reviews'}  {/* FIX: Singular/plural */}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-full shadow-sm shrink-0 ml-2">
              <span className="material-symbols-outlined text-sm text-amber-400" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              <span className="text-sm font-black text-amber-600">{typeof ev.avgRating === 'number' ? ev.avgRating.toFixed(1) : '0.0'}</span>
            </div>
          </div>
        );
      })}
    </div>
  )}
</div>
</div>

          {/* ── ROW 3: Recent Activities + Upcoming Events ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all"
              style={{ animation: "slideUp 0.5s ease forwards 720ms", opacity: 0 }}>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-base font-black text-gray-800">🔄 Recent Activities</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Latest system updates</p>
                </div>
                <span className="material-symbols-outlined text-[#4ECDC4]" style={{ fontVariationSettings: "'FILL' 1" }}>history</span>
              </div>
              {recentActivities.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                  <span className="material-symbols-outlined text-4xl mb-2 opacity-50">inbox</span>
                  <p className="text-sm font-semibold">No recent activities</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${activity.color}15` }}>
                        <span className="material-symbols-outlined text-sm" style={{ color: activity.color }}>
                          {activity.icon}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-700">{activity.message}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          {new Date(activity.time).toLocaleString('en-PK', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all"
  style={{ animation: "slideUp 0.5s ease forwards 780ms", opacity: 0 }}>
  <div className="flex items-center justify-between mb-5">
    <div>
      <h3 className="text-base font-black text-gray-800">📅 Upcoming Events</h3>
      <p className="text-xs text-gray-400 mt-0.5">Next approved events</p>
    </div>
    {/* ✅ CLICKABLE ICON */}
    <button
      onClick={() => navigate("/admin/events")}
      className="hover:scale-110 transition-transform duration-200"
      title="View all events"
    >
      <span className="material-symbols-outlined text-[#FF6B6B]" style={{ fontVariationSettings: "'FILL' 1" }}>
        event_upcoming
      </span>
    </button>
  </div>

  {upcomingEvents.length === 0 ? (
    <div className="flex flex-col items-center justify-center py-8 text-gray-400">
      <span className="material-symbols-outlined text-4xl mb-2 opacity-50">event_busy</span>
      <p className="text-sm font-semibold">No upcoming events</p>
    </div>
  ) : (
    <div className="space-y-3 max-h-80 overflow-y-auto">
      {upcomingEvents.map((event) => (
        <div key={event._id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-purple-50">
            <span className="material-symbols-outlined text-[#9B59B6] text-lg">event</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-gray-700">{event.title}</p>
            <div className="flex flex-wrap items-center gap-2 mt-0.5">
              <span className="text-[10px] text-gray-500 flex items-center gap-0.5">
                <span className="material-symbols-outlined text-[10px]">calendar_today</span>
                {new Date(event.start_date).toLocaleDateString('en-PK', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
              <span className="text-[10px] text-gray-500 flex items-center gap-0.5">
                <span className="material-symbols-outlined text-[10px]">location_on</span>
                {event.venue || 'TBA'}
              </span>
              {event.organizer_id?.name && (
                <span className="text-[10px] text-gray-400">• {event.organizer_id.name}</span>
              )}
            </div>
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