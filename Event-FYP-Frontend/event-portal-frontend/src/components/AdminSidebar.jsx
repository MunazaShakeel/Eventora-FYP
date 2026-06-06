import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

const AdminSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { label: "Dashboard", path: "/admin-dashboard", icon: "dashboard" },
    { label: "Manage Events", path: "/admin/events", icon: "event" },
    { label: "Manage Students", path: "/admin/students", icon: "school" },
    { label: "Manage Organizers", path: "/admin/organizers", icon: "badge" },
    { label: "Volunteers", path: "/admin/volunteers", icon: "volunteer_activism" },
    { label: "Feedback", path: "/admin/feedback", icon: "rate_review" },
    { label: "Gallery", path: "/admin/gallery", icon: "photo_library" },
    { label: "Certificates", path: "/admin/certificates", icon: "workspace_premium" },
  ];

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login-admin");
  };

  return (
    <>
      {/* ===== DESKTOP SIDEBAR ===== */}
      <aside className="hidden md:flex h-screen w-64 fixed left-0 top-0 bg-white border-r border-gray-100 flex-col py-8 z-50 shadow-sm">

        {/* Logo */}
        <div className="px-8 mb-8">
          <Link to="/admin-dashboard" className="flex items-center gap-3">
            <span
              className="text-5xl font-bold relative"
              style={{ fontFamily: "Great Vibes, cursive" }}
            >
              <span className="text-[#9B59B6]">Event</span>
              <span className="text-yellow-500">ora</span>
              <span className="absolute left-0 bottom-0 w-full h-0.5 bg-linear-to-r from-[#9B59B6] to-yellow-400 rounded-full"></span>
            </span>
          </Link>
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mt-1">
            Admin Portal
          </p>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 space-y-1 px-4 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200
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
        <div className="px-4 mt-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-red-400 hover:bg-red-50 hover:text-red-500 transition-all duration-200"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
            Logout
          </button>
        </div>
      </aside>

      {/* ===== MOBILE BOTTOM NAV ===== */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex justify-around items-center h-16 px-2 z-50 shadow-lg">
        {[
          { label: "Home", path: "/admin-dashboard", icon: "dashboard" },
          { label: "Events", path: "/admin/events", icon: "event" },
          { label: "Students", path: "/admin/students", icon: "school" },
          { label: "Volunteers", path: "/admin/volunteers", icon: "volunteer_activism" },
          { label: "More", path: "/admin/feedback", icon: "grid_view" },
          
        ].map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-all
                ${isActive ? "text-[#8b4fa2]" : "text-gray-400"}`}
            >
              <span
                className="material-symbols-outlined text-[22px]"
                style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
              >
                {item.icon}
              </span>
              <span className="text-[9px] font-bold uppercase tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};

export default AdminSidebar;