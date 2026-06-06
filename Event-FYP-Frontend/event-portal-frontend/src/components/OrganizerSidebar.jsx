import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const OrganizerSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { token, logout } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const notifRef = useRef(null);

  const navItems = [
    { label: "Dashboard",       path: "/organizer-dashboard",        icon: "dashboard" },
    { label: "Create Event",    path: "/organizer/create-event",     icon: "add_circle" },
    { label: "My Events",       path: "/organizer/my-events",        icon: "calendar_month" },
    { label: "Tasks",           path: "/organizer/tasks",            icon: "task_alt" },
    { label: "Gallery",         path: "/organizer/gallery",          icon: "photo_library" },
    { label: "Feedback",        path: "/organizer/feedback",         icon: "rate_review" },
    { label: "Certificates",    path: "/organizer/certificates",     icon: "workspace_premium" },
    { label: "Scan Attendance", path: "/organizer/scan-attendance",  icon: "qr_code_scanner" },
    { path: "/organizer/profile", icon: "person", label: "Profile" }
  ];

  const handleLogout = () => {
    logout();
    navigate("/login-organizer");
  };

  // ── Fetch notifications from existing APIs ──
  const fetchNotifications = async () => {
    if (!token) return;
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [eventsRes, regsRes] = await Promise.all([
        axios.get("http://localhost:5000/api/organizer-dashboard/upcoming-events", { headers }),
        axios.get("http://localhost:5000/api/organizer-dashboard/recent-registrations", { headers }),
      ]);

      const notifs = [];

      // Event status notifications
      const events = eventsRes.data?.upcomingEvents || [];
      events.slice(0, 3).forEach((ev) => {
        notifs.push({
          id: `ev-${ev._id}`,
          icon: "event",
          color: "#8b4fa2",
          bg: "#f5eefa",
          message: `"${ev.title}" is coming up`,
          time: ev.start_date
            ? new Date(ev.start_date).toLocaleDateString("en-PK", { day: "numeric", month: "short" })
            : "",
        });
      });

      // Recent registrations
      const regs = regsRes.data?.recentRegistrations || [];
      regs.slice(0, 3).forEach((reg) => {
        const name = reg?.student_id?.name || "A student";
        const event = reg?.event_id?.title || "your event";
        notifs.push({
          id: `reg-${reg._id}`,
          icon: "person_add",
          color: "#4ECDC4",
          bg: "#edfafa",
          message: `${name} registered for "${event}"`,
          time: reg.registration_date
            ? new Date(reg.registration_date).toLocaleDateString("en-PK", { day: "numeric", month: "short" })
            : "",
        });
      });

      setNotifications(notifs);
      setUnreadCount(notifs.length);
    } catch (err) {
      console.error("Notification fetch failed:", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // poll every 30s
    return () => clearInterval(interval);
  }, [token]);

  // Close notif dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="px-8 py-6 shrink-0">
        <Link to="/organizer-dashboard" className="flex items-center gap-3" onClick={() => setSidebarOpen(false)}>
          <span className="text-5xl font-bold relative" style={{ fontFamily: "Great Vibes, cursive" }}>
            <span className="text-[#9B59B6]">Event</span>
            <span className="text-yellow-500">ora</span>
            <span className="absolute left-0 bottom-0 w-full h-0.5 bg-linear-to-r from-[#9B59B6] to-yellow-400 rounded-full"></span>
          </span>
        </Link>
        <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mt-1">Organizer Portal</p>
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
              <span className="material-symbols-outlined text-[20px]"
                style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}>
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
        {/* Hamburger */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition"
        >
          <span className="material-symbols-outlined text-[22px] text-gray-600">menu</span>
        </button>

        {/* Logo */}
        <span className="text-2xl font-bold" style={{ fontFamily: "Great Vibes, cursive" }}>
          <span className="text-[#9B59B6]">Event</span>
          <span className="text-yellow-500">ora</span>
        </span>

        {/* Notification Bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => { setNotifOpen(!notifOpen); setUnreadCount(0); }}
            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition relative"
          >
            <span className="material-symbols-outlined text-[22px] text-gray-600">notifications</span>
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {/* Notification Dropdown */}
          {notifOpen && (
            <div className="absolute right-0 top-11 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <p className="text-sm font-black text-gray-800">Notifications</p>
                <span className="text-[10px] font-bold text-[#8b4fa2] bg-purple-50 px-2 py-0.5 rounded-full">
                  {notifications.length} new
                </span>
              </div>
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                  <span className="material-symbols-outlined text-[36px] mb-2">notifications_none</span>
                  <p className="text-sm font-semibold">No notifications</p>
                </div>
              ) : (
                <div className="max-h-72 overflow-y-auto divide-y divide-gray-50">
                  {notifications.map((n) => (
                    <div key={n.id} className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition cursor-pointer">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                        style={{ backgroundColor: n.bg }}>
                        <span className="material-symbols-outlined text-[16px]" style={{ color: n.color, fontVariationSettings: "'FILL' 1" }}>
                          {n.icon}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-700 leading-snug">{n.message}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{n.time}</p>
                      </div>
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
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          {/* Drawer */}
          <aside className="relative w-64 h-full bg-white flex flex-col shadow-2xl animate-slideIn">
            {/* Close button */}
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
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex justify-around items-center h-16 px-2 z-40 shadow-lg">
        {[
          { label: "Home",   path: "/organizer-dashboard",       icon: "dashboard" },
          { label: "Events", path: "/organizer/my-events",       icon: "calendar_month" },
          { label: "New",    path: "/organizer/create-event",    icon: "add_circle" },
          { label: "Scan",   path: "/organizer/scan-attendance", icon: "qr_code_scanner" },
          { label: "More",   path: "/organizer/gallery",         icon: "grid_view" },
        ].map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-all
                ${isActive ? "text-[#8b4fa2]" : "text-gray-400"}`}
            >
              <span className="material-symbols-outlined text-[22px]"
                style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}>
                {item.icon}
              </span>
              <span className="text-[9px] font-bold uppercase tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Slide-in animation */}
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
        .animate-slideIn { animation: slideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .md\\:flex { padding-top: 0 !important; }
        @media (max-width: 767px) {
          main { padding-top: 3.5rem !important; }
        }
      `}</style>
    </>
  );
};

export default OrganizerSidebar;