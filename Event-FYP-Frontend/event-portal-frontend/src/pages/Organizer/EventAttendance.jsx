import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import OrganizerSidebar from "../../components/OrganizerSidebar";
import AttendanceStatsBar from "../../components/OrganizerComp/Attendance/AttendanceStatsBar";
import AttendanceTable from "../../components/OrganizerComp/Attendance/AttendanceTable";
import { useAuth } from "../../context/AuthContext";
import { ArrowLeft, Calendar, MapPin, Download, Users, CheckCircle, XCircle, TrendingUp } from "lucide-react";

const EventAttendance = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();

  // ✅ API URL from env
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [eventTitle, setEventTitle] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventVenue, setEventVenue] = useState("");

  useEffect(() => {
      if (!token) return;
    const fetchAttendance = async () => {
      try {
        // ✅ Use API_URL
        const res = await axios.get(
          `${API_URL}/registrations/events/${eventId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = res.data?.data || [];
        setRegistrations(data);
        if (data.length > 0) {
          setEventTitle(data[0]?.event_id?.title || "Event");
          setEventDate(data[0]?.event_id?.start_date || "");
          setEventVenue(data[0]?.event_id?.venue || "");
        }
      } catch (err) {
        setError("Failed to load attendance.");
      } finally {
        setLoading(false);
      }
    };
    fetchAttendance();
  }, [eventId, token, API_URL]);

  const presentCount = registrations.filter(r => r.attendance_status === "Present").length;
  const absentCount = registrations.length - presentCount;
  const attendanceRate = registrations.length > 0
    ? Math.round((presentCount / registrations.length) * 100) : 0;

  const handleDownload = () => {
    const rows = [
      ["#", "Student Name", "Email", "Department/Grade", "Semester", "Role", "Status"],
      ...registrations.map((reg, i) => [
        i + 1,
        reg.student_id?.name || "—",
        reg.student_id?.email || "—",
        reg.student_id?.department || reg.student_id?.grade || "—",
        reg.student_id?.semester || "—",
        reg.role,
        reg.attendance_status,
      ]),
    ];
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${eventTitle}-attendance.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex min-h-screen" style={{ background: "#f8f3fd" }}>
      <OrganizerSidebar />

      <main className="flex-1 md:ml-64 pb-24 md:pb-6">

        {/* Hero Banner */}
        <div className="relative overflow-hidden px-8 pt-10 pb-8"
          style={{ background: "linear-gradient(135deg, #8b4fa2 0%, #6b3d82 40%, #4ECDC4 100%)" }}>
          <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full opacity-10" style={{ background: "#fff" }} />
          <div className="absolute top-6 right-24 w-24 h-24 rounded-full opacity-10" style={{ background: "#FFE66D" }} />
          <div className="absolute -bottom-8 left-32 w-36 h-36 rounded-full opacity-10" style={{ background: "#4ECDC4" }} />

          <button onClick={() => navigate("/organizer/my-events")}
            className="flex items-center gap-2 mb-6 text-white/70 hover:text-white transition text-sm font-semibold">
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Back to Events
          </button>

          <div className="relative z-10">
            <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-2">Attendance Report</p>
            <h1 className="text-4xl md:text-5xl font-extrabold text-white leading-tight mb-3"
              style={{ textShadow: "0 2px 20px rgba(0,0,0,0.2)" }}>
              {eventTitle || "Event"}
            </h1>
            <div className="flex flex-wrap items-center gap-3 mt-2">
              {eventDate && (
                <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1">
                  <span className="material-symbols-outlined text-[14px] text-white/80">calendar_month</span>
                  <span className="text-white/90 text-xs font-semibold">
                    {new Date(eventDate).toLocaleDateString("en-PK", { day: "numeric", month: "long", year: "numeric" })}
                  </span>
                </div>
              )}
              {eventVenue && (
                <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1">
                  <span className="material-symbols-outlined text-[14px] text-white/80">location_on</span>
                  <span className="text-white/90 text-xs font-semibold">{eventVenue}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="px-6 md:px-8 mt-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-500 text-sm font-semibold mb-4">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
              <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin"
                style={{ borderColor: "#8b4fa2", borderTopColor: "transparent" }} />
              <p className="text-sm text-gray-400 font-semibold">Loading attendance...</p>
            </div>
          ) : (
            <>
              <AttendanceStatsBar
                registrations={registrations}
                presentCount={presentCount}
                absentCount={absentCount}
                attendanceRate={attendanceRate}
              />
              <AttendanceTable
                registrations={registrations}
                presentCount={presentCount}
                absentCount={absentCount}
                onDownload={handleDownload}
              />
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default EventAttendance;