import React, { useEffect, useState } from "react";
import StudentSidebar from "../../components/StudentSidebar";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";  // ✅ ADD, jwtDecode wali line hatao

const StudentDashboard = () => {
  const navigate = useNavigate();
  const { user, token } = useAuth();  // ✅ ADD

  const [studentName, setStudentName] = useState("");
  const [myRegistrations, setMyRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setError("");

        if (token) {
          // ✅ user.id directly milega, jwtDecode hatao
          const studentId = user.id;

          // Fetch student profile
          const profileRes = await axios.get(
            `http://localhost:5000/api/students/${studentId}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const profile = profileRes.data?.student || profileRes.data;
          if (profile?.name) setStudentName(profile.name);

          // Fetch my registrations
          const regRes = await axios.get(
            "http://localhost:5000/api/registrations/my-registrations",
            { headers: { Authorization: `Bearer ${token}` } }
          );

          const regList = Array.isArray(regRes.data)
            ? regRes.data
            : Array.isArray(regRes.data?.data)
            ? regRes.data.data
            : Array.isArray(regRes.data?.registrations)
            ? regRes.data.registrations
            : [];

          setMyRegistrations(regList);
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);  // ✅ dependency same rehti hai

  // ... baaki sab bilkul same!

  // --- Derived Stats ---
  const now = new Date();

  const totalRegistered = myRegistrations.length;

  const upcomingRegistrations = myRegistrations.filter((reg) => {
    const eventDate = new Date(reg?.event_id?.start_date);
    return eventDate >= now;
  });

  // ✅ Fixed: attendance_status instead of attended
  const attendedRegistrations = myRegistrations.filter(
    (reg) => reg.attendance_status === "Present"
  );

  const recentActivity = attendedRegistrations.slice(0, 3);
  const upcomingEvents = upcomingRegistrations.slice(0, 3);

  const stats = [
    {
      label: "Registered Events",
      value: totalRegistered,
      icon: "app_registration",
      color: "#8b4fa2",
      bg: "#f5eefa",
    },
    {
      label: "Upcoming Events",
      value: upcomingRegistrations.length,
      icon: "event",
      color: "#4ECDC4",
      bg: "#edfafa",
    },
    {
      label: "Events Attended",
      value: attendedRegistrations.length,
      icon: "task_alt",
      color: "#FF6B6B",
      bg: "#fff1f1",
    },
    {
      label: "Certificates Earned",
      value: 0,
      icon: "workspace_premium",
      color: "#f59e0b",
      bg: "#fffbeb",
    },
  ];

  const displayName = studentName ? studentName.split(" ")[0] : "Student";

  return (
    <div className="flex min-h-screen bg-gray-50">
      <StudentSidebar />

      <main className="flex-1 md:ml-64 p-6 pb-24 md:pb-6">

        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Welcome back,{" "}
              <span className="text-[#8b4fa2]">{displayName}</span>
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              Here's what's happening on campus
            </p>
          </div>
          <div className="w-11 h-11 rounded-full bg-[#8b4fa2] flex items-center justify-center text-white font-bold text-lg shadow-md">
            {displayName.charAt(0)}
          </div>
        </div>

        {/* Error */}
        {error && (
          <p className="text-red-500 font-semibold mb-4">{error}</p>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-10 h-10 border-4 border-[#8b4fa2] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {stats.map((stat, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col gap-3 hover:shadow-md transition-shadow duration-200"
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: stat.bg }}
                  >
                    <span
                      className="material-symbols-outlined text-[20px]"
                      style={{ color: stat.color, fontVariationSettings: "'FILL' 1" }}
                    >
                      {stat.icon}
                    </span>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                    <p className="text-xs text-gray-400 font-medium mt-0.5">{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Two Column */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Upcoming Events */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-base font-bold text-gray-800">Upcoming Events</h2>
                  <button
                    onClick={() => navigate("/student/my-registrations")}
                    className="text-xs font-semibold text-[#8b4fa2] hover:underline"
                  >
                    View All
                  </button>
                </div>

                {upcomingEvents.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                    <span className="material-symbols-outlined text-[40px] mb-2">event_busy</span>
                    <p className="text-sm font-semibold">No upcoming events</p>
                    <p className="text-xs mt-1">Go explore and register!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {upcomingEvents.map((reg) => {
                      const event = reg?.event_id;
                      if (!event) return null;
                      const date = new Date(event.start_date);
                      const month = date.toLocaleString("en-PK", { month: "short" });
                      const day = date.getDate();
                      return (
                        <div
                          key={reg._id}
                          className="flex items-start gap-4 p-3 rounded-xl hover:bg-gray-50 transition-all cursor-pointer"
                          onClick={() => navigate(`/student/browse-events`)}
                        >
                          <div className="min-w-11.5 h-11.5 rounded-xl bg-[#f5eefa] flex flex-col items-center justify-center">
                            <span className="text-[10px] font-bold text-[#8b4fa2] uppercase">{month}</span>
                            <span className="text-lg font-bold text-[#8b4fa2] leading-tight">{day}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-800 truncate">{event.title}</p>
                            <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                              <span className="material-symbols-outlined text-[13px]">location_on</span>
                              {event.venue || "TBA"}
                            </p>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-purple-50 text-[#8b4fa2] whitespace-nowrap">
                            Registered
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-base font-bold text-gray-800">Recent Activity</h2>
                  <button
                    onClick={() => navigate("/student/my-registrations")}
                    className="text-xs font-semibold text-[#8b4fa2] hover:underline"
                  >
                    View All
                  </button>
                </div>

                {recentActivity.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                    <span className="material-symbols-outlined text-[40px] mb-2">history</span>
                    <p className="text-sm font-semibold">No attended events yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentActivity.map((reg) => {
                      const event = reg?.event_id;
                      if (!event) return null;
                      return (
                        <div
                          key={reg._id}
                          className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center">
                              <span
                                className="material-symbols-outlined text-[18px] text-green-500"
                                style={{ fontVariationSettings: "'FILL' 1" }}
                              >
                                check_circle
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-800">{event.title}</p>
                              <p className="text-xs text-gray-400">
                                {new Date(event.start_date).toLocaleDateString("en-PK", {
                                  day: "numeric", month: "short", year: "numeric",
                                })}
                              </p>
                            </div>
                          </div>
                          <span className="text-[11px] font-bold px-2 py-1 rounded-full bg-green-50 text-green-500">
                            Attended
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Browse Events CTA */}
            <div
              className="mt-6 rounded-2xl p-6 flex items-center justify-between"
              style={{ background: "linear-gradient(135deg, #8b4fa2 0%, #6a3080 100%)" }}
            >
              <div>
                <p className="text-white font-bold text-base">Discover New Events</p>
                <p className="text-purple-200 text-sm mt-0.5">
                  Explore upcoming campus events and register now
                </p>
              </div>
              <button
                onClick={() => navigate("/student/browse-events")}
                className="bg-white text-[#8b4fa2] text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-purple-50 transition-all shadow-md whitespace-nowrap"
              >
                Browse Events
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default StudentDashboard;