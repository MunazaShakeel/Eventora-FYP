import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const AdminSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { token, logout, user } = useAuth();
  const socket = useSocket();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const notifRef = useRef(null);

  const navItems = [
    { label: "Dashboard", path: "/admin-dashboard", icon: "dashboard" },
    { label: "Manage Events", path: "/admin/events", icon: "event" },
    { label: "Manage Students", path: "/admin/students", icon: "school" },
    { label: "Manage Organizers", path: "/admin/organizers", icon: "badge" },
    { label: "Attendance Reports", path: "/admin/attendance-reports", icon: "bar_chart" },
    { label: "Task Management", path: "/admin/manage-tasks", icon: "task" },
    { label: "Feedback", path: "/admin/feedback", icon: "rate_review" },
    { label: "Gallery", path: "/admin/gallery", icon: "photo_library" },
    { label: "Certificates", path: "/admin/certificates", icon: "workspace_premium" },
  ];

  const handleLogout = () => {
    logout();
    navigate("/login-admin");
  };

  // ── Notification Functions ──
  const fetchNotifications = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get(`${API_URL}/notifications`, { headers });
      if (response.data.success) {
        const notifs = response.data.notifications.map(notif => ({
          id: notif._id,
          _id: notif._id,
          title: notif.title,
          message: notif.message,
          type: notif.type,
          isRead: notif.isRead,
          time: notif.createdAt ? new Date(notif.createdAt).toLocaleString() : "",
          icon: getIconByType(notif.type),
          color: getColorByType(notif.type),
          bg: getBgByType(notif.type),
        }));
        setNotifications(notifs);
        setUnreadCount(response.data.unreadCount);
      }
    } catch (err) {
      console.error("Notification fetch failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const getIconByType = (type) => {
    switch (type) {
      case "event": return "event";
      case "certificate": return "workspace_premium";
      case "attendance": return "qr_code_scanner";
      case "task": return "task_alt";
      default: return "notifications";
    }
  };

  const getColorByType = (type) => {
    switch (type) {
      case "event": return "#8b4fa2";
      case "certificate": return "#FFE66D";
      case "attendance": return "#4ECDC4";
      case "task": return "#FF6B6B";
      default: return "#8b4fa2";
    }
  };

  const getBgByType = (type) => {
    switch (type) {
      case "event": return "#f5eefa";
      case "certificate": return "#fff9e6";
      case "attendance": return "#e6faf8";
      case "task": return "#ffe6e6";
      default: return "#f5eefa";
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
        headers: { Authorization: `Bearer ${token}` },
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

  // ── Socket Listeners ──
  useEffect(() => {
    if (!socket) return;
    socket.on("new-notification", (notification) => {
      const newNotif = {
        id: notification._id,
        _id: notification._id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        isRead: false,
        time: new Date().toLocaleString(),
        icon: getIconByType(notification.type),
        color: getColorByType(notification.type),
        bg: getBgByType(notification.type),
      };
      setNotifications(prev => [newNotif, ...prev]);
      setUnreadCount(prev => prev + 1);
      showToast(notification);
    });
    return () => socket.off("new-notification");
  }, [socket]);

  const showToast = (notification) => {
    const toast = document.createElement("div");
    toast.className = "fixed bottom-20 right-4 bg-white rounded-lg shadow-2xl p-3 max-w-sm z-50 animate-slide-up";
    toast.innerHTML = `
      <div class="flex items-start gap-2">
        <div class="w-8 h-8 rounded-full flex items-center justify-center" style="background:linear-gradient(to right,#8b4fa2,#4ECDC4)">
          <span class="text-white text-sm">🔔</span>
        </div>
        <div class="flex-1">
          <h4 class="font-bold text-gray-800 text-sm">${notification.title}</h4>
          <p class="text-xs text-gray-600">${notification.message}</p>
        </div>
      </div>`;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = "0";
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  };

  // ── Fetch on mount & interval ──
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [token]);

  // ── Click outside to close notification dropdown ──
  useEffect(() => {
    const handleClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // ── Shared Sidebar Content ──
  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="px-8 py-6 shrink-0">
        <Link to="/admin-dashboard" className="flex items-center gap-3" onClick={() => setSidebarOpen(false)}>
          <span className="text-5xl font-bold relative" style={{ fontFamily: "Great Vibes, cursive" }}>
            <span className="text-[#9B59B6]">Event</span>
            <span className="text-yellow-500">ora</span>
            <span className="absolute left-0 bottom-0 w-full h-0.5 bg-linear-to-r from-[#9B59B6] to-yellow-400 rounded-full"></span>
          </span>
        </Link>
        <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mt-1">Admin Portal</p>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 overflow-y-auto px-4 space-y-0.5">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => { navigate(item.path); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200
                ${isActive
                  ? "bg-[#8b4fa2] text-white shadow-md shadow-purple-200"
                  : "text-gray-500 hover:bg-purple-50 hover:text-[#8b4fa2]"
                }`}
            >
              <span
                className="material-symbols-outlined text-[20px]"
                style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
              >
                {item.icon}
              </span>
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-4 py-4 shrink-0">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-red-400 hover:bg-red-50 hover:text-red-500 transition-all duration-200"
        >
          <span className="material-symbols-outlined text-[20px]">logout</span>
          Logout
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* ── DESKTOP SIDEBAR ── */}
      <aside className="hidden md:flex h-screen w-64 fixed left-0 top-0 bg-white border-r border-gray-100 flex-col z-50 shadow-sm">
        <SidebarContent />
      </aside>

      {/* ── MOBILE: Top Header Bar ── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100 shadow-sm px-4 h-14 flex items-center justify-between">
        <button
          onClick={() => setSidebarOpen(true)}
          className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition"
        >
          <span className="material-symbols-outlined text-[22px] text-gray-600">menu</span>
        </button>

        <span className="text-2xl font-bold" style={{ fontFamily: "Great Vibes, cursive" }}>
          <span className="text-[#9B59B6]">Event</span>
          <span className="text-yellow-500">ora</span>
        </span>

        {/* Notification Bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition relative"
          >
            <span className="material-symbols-outlined text-[22px] text-gray-600">notifications</span>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center animate-pulse">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-11 w-72 sm:w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-linear-to-r from-purple-50 to-teal-50">
                <p className="text-sm font-black text-gray-800">Notifications</p>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button onClick={markAllAsRead} className="text-[10px] font-bold text-[#8b4fa2] bg-purple-100 px-2 py-0.5 rounded-full hover:bg-purple-200 transition">
                      Mark all read
                    </button>
                  )}
                  <span className="text-[10px] font-bold text-[#8b4fa2] bg-purple-50 px-2 py-0.5 rounded-full">
                    {notifications.filter(n => !n.isRead).length} new
                  </span>
                </div>
              </div>
              {loading ? (
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
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition cursor-pointer ${!n.isRead ? "bg-purple-50/30" : ""}`}
                      onClick={() => !n.isRead && markAsRead(n._id)}
                    >
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: n.bg }}>
                        <span className="material-symbols-outlined text-[16px]" style={{ color: n.color, fontVariationSettings: "'FILL' 1" }}>
                          {n.icon}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-700 leading-snug">{n.message}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{n.time}</p>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); deleteNotification(n._id); }} className="text-gray-300 hover:text-red-400 transition">
                        <span className="material-symbols-outlined text-[14px]">close</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── MOBILE SIDEBAR OVERLAY ── */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-64 h-full bg-white flex flex-col shadow-2xl animate-slideIn">
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 transition"
            >
              <span className="material-symbols-outlined text-[20px] text-gray-400">close</span>
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* ── MOBILE BOTTOM NAV ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex justify-around items-center h-16 px-1 z-40 shadow-lg">
        {[
          { label: "Home", path: "/admin-dashboard", icon: "dashboard" },
          { label: "Events", path: "/admin/events", icon: "event" },
          { label: "Students", path: "/admin/students", icon: "school" },
          { label: "Reports", path: "/admin/attendance-reports", icon: "bar_chart" },
        ].map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-all ${isActive ? "text-[#8b4fa2]" : "text-gray-400"}`}
            >
              <span className="material-symbols-outlined text-[20px] sm:text-[22px]" style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}>
                {item.icon}
              </span>
              <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-tight">{item.label}</span>
            </button>
          );
        })}

        {/* "More" poora sidebar menu kholta hai */}
        <button
          onClick={() => setSidebarOpen(true)}
          className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-all ${sidebarOpen ? "text-[#8b4fa2]" : "text-gray-400"}`}
        >
          <span className="material-symbols-outlined text-[20px] sm:text-[22px]">grid_view</span>
          <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-tight">More</span>
        </button>
      </nav>

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slideIn { animation: slideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-slide-up { animation: slide-up 0.3s ease-out; }
        @media (max-width: 767px) {
          main { padding-top: 3.5rem !important; padding-bottom: 4rem !important; }
        }
      `}</style>
    </>
  );
};

export default AdminSidebar;