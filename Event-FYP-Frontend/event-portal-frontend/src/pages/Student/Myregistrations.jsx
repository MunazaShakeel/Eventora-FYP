import React, { useEffect, useState } from "react";
import StudentSidebar from "../../components/StudentSidebar";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

const API = "http://localhost:5000";

const MyRegistrations = () => {
const { token, user } = useAuth();
const navigate = useNavigate();

  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [timeFilter, setTimeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [feedbackModal, setFeedbackModal] = useState(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [qrModal, setQrModal] = useState(null);
  const [cancelModal, setCancelModal] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/api/registrations/my-registrations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const list = res.data?.data || res.data || [];
      setRegistrations(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error(err);
      setError("Failed to load registrations.");
    } finally {
      setLoading(false);
    }
  };

  const now = new Date();

  // ── Time Filter Functions ──
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

  // ── Filter and Sort ──
  const filtered = registrations.filter((reg) => {
    const eventDate = new Date(reg?.event_id?.start_date);
    if (activeTab === "upcoming") return eventDate >= now;
    if (activeTab === "attended") return reg.attendance_status === "Present";
    if (activeTab === "volunteer") return reg.role === "Volunteer";
    const matchTime = isEventInRange(eventDate, timeFilter);
    return matchTime;
  });

  // ── Sort Function ──
  const sortedRegistrations = [...filtered].sort((a, b) => {
    const dateA = new Date(a?.event_id?.start_date);
    const dateB = new Date(b?.event_id?.start_date);
    
    switch(sortBy) {
      case "newest":
        return dateB - dateA;
      case "oldest":
        return dateA - dateB;
      case "upcoming":
        return dateA - dateB;
      case "attended":
        return (a.attendance_status === "Present" ? 0 : 1) - (b.attendance_status === "Present" ? 0 : 1);
      default:
        return 0;
    }
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return "TBA";
    return new Date(dateStr).toLocaleDateString("en-PK", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatDateLong = (dateStr) => {
    if (!dateStr) return "TBA";
    return new Date(dateStr).toLocaleDateString("en-PK", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const handleFeedbackSubmit = async () => {
    if (!feedbackText.trim()) return;
    try {
      setSubmittingFeedback(true);
      await axios.post(
        `${API}/api/feedbacks`,
        { event_id: feedbackModal.eventId, rating: feedbackRating, comments: feedbackText },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setFeedbackModal(null);
      setFeedbackText("");
      setFeedbackRating(5);
     
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to submit feedback.");
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const handleCancelRegistration = async () => {
    if (!cancelModal) return;
    try {
      setCancellingId(cancelModal.regId);
      await axios.delete(`${API}/api/registrations/${cancelModal.regId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRegistrations((prev) => prev.filter((r) => r._id !== cancelModal.regId));
      setCancelModal(null);
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to cancel registration.");
    } finally {
      setCancellingId(null);
    }
  };

  // ── QR CODE DOWNLOAD FUNCTIONS ──
  const handleDownloadQR = (qrCode, eventTitle) => {
    const link = document.createElement('a');
    link.download = `QR-${eventTitle.replace(/\s+/g, '-')}.png`;
    link.href = qrCode;
    link.click();
  };

  const handlePrintQR = (qrCode, eventTitle, studentName, studentEmail, eventDate, eventVenue, registrationId) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>QR Code - ${eventTitle}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              font-family: 'Segoe UI', Arial, sans-serif;
              background: #f7f4fb;
              padding: 20px;
            }
            .qr-container {
              background: white;
              padding: 40px 45px;
              border-radius: 24px;
              box-shadow: 0 20px 60px rgba(0,0,0,0.12);
              text-align: center;
              max-width: 450px;
              width: 100%;
              border: 1px solid #f0ecf5;
            }
            .qr-container .header {
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 10px;
              margin-bottom: 8px;
            }
            .qr-container .header .badge {
              background: #FFE66D;
              color: #1A1A1A;
              font-size: 10px;
              font-weight: 900;
              padding: 4px 14px;
              border-radius: 20px;
              letter-spacing: 1px;
              text-transform: uppercase;
            }
            .qr-container h2 {
              color: #1A1A1A;
              font-size: 22px;
              font-weight: 800;
              margin-bottom: 4px;
            }
            .qr-container .subtitle {
              color: #8b4fa2;
              font-size: 14px;
              font-weight: 600;
              margin-bottom: 16px;
            }
            .qr-container .divider {
              height: 2px;
              background: linear-gradient(90deg, #9B59B6, #4ECDC4);
              margin: 16px 0 18px 0;
              border-radius: 2px;
            }
            .qr-container img {
              width: 200px;
              height: 200px;
              margin: 10px 0 16px 0;
              border-radius: 16px;
              background: #f7f4fb;
              padding: 8px;
            }
            .qr-container .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 8px 16px;
              text-align: left;
              margin: 12px 0 16px 0;
              background: #faf8fc;
              padding: 14px 18px;
              border-radius: 14px;
            }
            .qr-container .info-grid .label {
              font-size: 10px;
              font-weight: 700;
              color: #9ca3af;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .qr-container .info-grid .value {
              font-size: 13px;
              font-weight: 600;
              color: #1A1A1A;
            }
            .qr-container .info-grid .full-width {
              grid-column: 1 / -1;
            }
            .qr-container .footer-note {
              font-size: 12px;
              color: #6b7280;
              margin-top: 12px;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 6px;
            }
            .qr-container .footer-note span {
              font-size: 16px;
            }
            .qr-container .generated {
              font-size: 10px;
              color: #d1d5db;
              margin-top: 10px;
            }
            .qr-container .qr-code-wrapper {
              background: #f7f4fb;
              border-radius: 16px;
              display: inline-block;
              padding: 8px;
            }
            @media print {
              body { background: white; padding: 10px; }
              .qr-container { box-shadow: none; border: 1px solid #e5e7eb; }
              .qr-container .footer-note { color: #9ca3af; }
            }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <div class="header">
              <span class="badge">🎫 Student Pass</span>
            </div>
            <h2>${eventTitle}</h2>
            <p class="subtitle">✦ Event Entry QR Code ✦</p>
            
            <div class="divider"></div>
            
            <div class="qr-code-wrapper">
              <img src="${qrCode}" alt="QR Code" />
            </div>
            
            <div class="info-grid">
              <div class="full-width">
                <div class="label">👤 Student</div>
                <div class="value">${studentName || 'N/A'}</div>
              </div>
              <div class="full-width">
                <div class="label">📧 Email</div>
                <div class="value">${studentEmail || 'N/A'}</div>
              </div>
              <div>
                <div class="label">📅 Date</div>
                <div class="value">${eventDate || 'TBA'}</div>
              </div>
              <div>
                <div class="label">📍 Venue</div>
                <div class="value">${eventVenue || 'TBA'}</div>
              </div>
              <div class="full-width">
                <div class="label">🆔 Registration ID</div>
                <div class="value" style="font-size:11px; font-family:monospace; color:#6b7280;">${registrationId || 'N/A'}</div>
              </div>
            </div>
            
            <div class="footer-note">
              <span>📌</span> Show this QR code at the event entrance for check-in
            </div>
            <div class="generated">
              Generated on ${new Date().toLocaleDateString('en-PK', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  const tabs = [
    { key: "all", label: "All", icon: "grid_view", count: registrations.length },
    {
      key: "upcoming",
      label: "Upcoming",
      icon: "upcoming",
      count: registrations.filter((r) => new Date(r?.event_id?.start_date) >= now).length,
    },
    {
      key: "attended",
      label: "Attended",
      icon: "task_alt",
      count: registrations.filter((r) => r.attendance_status === "Present").length,
    },
    {
      key: "volunteer",
      label: "Volunteer",
      icon: "volunteer_activism",
      count: registrations.filter((r) => r.role === "Volunteer").length,
    },
  ];

  const getCategoryColor = (category) => {
    const map = {
      Workshop: { bg: "bg-[#fff8e1]", text: "text-[#d97706]" },
      Seminar: { bg: "bg-[#edf9f8]", text: "text-[#0d9488]" },
      Sports: { bg: "bg-[#fff0f0]", text: "text-[#ef4444]" },
      Cultural: { bg: "bg-[#f5eefa]", text: "text-[#8b4fa2]" },
      Academic: { bg: "bg-[#eef2ff]", text: "text-[#4f46e5]" },
    };
    return map[category] || { bg: "bg-gray-100", text: "text-gray-500" };
  };

  const getFilterLabel = () => {
    const timeLabels = {
      all: "All Time",
      week: "This Week",
      month: "This Month",
      year: "This Year"
    };
    const sortLabels = {
      newest: "Newest First",
      oldest: "Oldest First",
      upcoming: "Upcoming",
      attended: "Attended First"
    };
    return `${timeLabels[timeFilter] || "All Time"} • ${sortLabels[sortBy] || "Newest"}`;
  };

  return (
    <div className="flex min-h-screen" style={{ background: "#f7f4fb" }}>
      <StudentSidebar />

      <main className="flex-1 md:ml-64 pb-24 md:pb-6">
        {/* ── HEADER BANNER ── */}
        <div
          className="relative overflow-hidden px-5 pt-5 pb-8"
          style={{
            background: "linear-gradient(135deg, #9B59B6 0%, #6d3483 100%, #4ECDC4 100%)",
          }}
        >
          <div className="relative z-10 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <div className="inline-block px-5 py-1 mb-8 rounded-full bg-[#FFE66D] text-[#1A1A1A] text-xs font-black tracking-widest uppercase ">
                Student Portal
              </div>

              <h1
                className="text-3xl font-black text-white leading-tight"
              >
                My Registrations
              </h1>
              <p className="text-purple-200 text-sm mt-1">
                Track, manage, and review all your event registrations
              </p>
            </div>

            {/* Stats Pills */}
            <div className="flex gap-3 flex-wrap">
              {[
                { label: "Total", value: registrations.length, color: "#FFE66D" },
                {
                  label: "Upcoming",
                  value: registrations.filter((r) => new Date(r?.event_id?.start_date) >= now).length,
                  color: "#4ECDC4",
                },
                {
                  label: "Attended",
                  value: registrations.filter((r) => r.attendance_status === "Present").length,
                  color: "#FF6B6B",
                },
              ].map((s) => (
                <div
                  key={s.label}
                  className="flex items-center gap-2 px-4 py-2 rounded-full"
                  style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)" }}
                >
                  <span
                    className="text-xl font-black"
                    style={{ color: s.color, fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    {s.value}
                  </span>
                  <span className="text-white/80 text-xs font-semibold">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 pt-6">
          {/* ── TABS + FILTER DROPDOWN ── */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            {/* Tabs */}
            <div className="flex gap-2 flex-wrap">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all duration-200 ${
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
                  <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
                  {tab.label}
                  <span
                    className={`text-[11px] font-black px-1.5 py-0.5 rounded-full min-w-5 text-center ${
                      activeTab === tab.key ? "bg-white/25 text-white" : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* ── FILTER DROPDOWN BUTTON ── */}
            <div className="relative">
              <button
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all duration-200 bg-white border border-gray-100 text-gray-600 hover:border-[#8b4fa2] hover:text-[#8b4fa2] shadow-sm"
              >
                <span className="material-symbols-outlined text-[16px]">filter_list</span>
                Filter
                <span className="material-symbols-outlined text-[14px]">expand_more</span>
              </button>

              {/* ── DROPDOWN MENU ── */}
              {showFilterDropdown && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 z-50 animate-fadeIn">
                  {/* Time Filter Section */}
                  <div className="mb-4">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2">📅 Time Period</p>
                    <div className="flex flex-col gap-1">
                      {[
                        { key: "all", label: "All Time", icon: "📅" },
                        { key: "week", label: "This Week", icon: "📆" },
                        { key: "month", label: "This Month", icon: "📊" },
                        { key: "year", label: "This Year", icon: "🗓️" },
                      ].map((opt) => (
                        <button
                          key={opt.key}
                          onClick={() => {
                            setTimeFilter(opt.key);
                            setShowFilterDropdown(false);
                          }}
                          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                            timeFilter === opt.key
                              ? "bg-[#f5eefa] text-[#8b4fa2]"
                              : "text-gray-500 hover:bg-gray-50"
                          }`}
                        >
                          <span>{opt.icon}</span>
                          {opt.label}
                          {timeFilter === opt.key && (
                            <span className="ml-auto text-[#8b4fa2]">✓</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="h-px bg-gray-100 my-3" />

                  {/* Sort Section */}
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2">🔽 Sort By</p>
                    <div className="flex flex-col gap-1">
                      {[
                        { key: "newest", label: "Newest First", icon: "⬇️" },
                        { key: "oldest", label: "Oldest First", icon: "⬆️" },
                        { key: "upcoming", label: "Upcoming First", icon: "📅" },
                        { key: "attended", label: "Attended First", icon: "✅" },
                      ].map((opt) => (
                        <button
                          key={opt.key}
                          onClick={() => {
                            setSortBy(opt.key);
                            setShowFilterDropdown(false);
                          }}
                          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                            sortBy === opt.key
                              ? "bg-[#f5eefa] text-[#8b4fa2]"
                              : "text-gray-500 hover:bg-gray-50"
                          }`}
                        >
                          <span>{opt.icon}</span>
                          {opt.label}
                          {sortBy === opt.key && (
                            <span className="ml-auto text-[#8b4fa2]">✓</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Active Filter Summary */}
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-[10px] text-gray-400">
                      Active: <span className="font-semibold text-gray-600">{getFilterLabel()}</span>
                    </p>
                    {(timeFilter !== "all" || sortBy !== "newest") && (
                      <button
                        onClick={() => {
                          setTimeFilter("all");
                          setSortBy("newest");
                          setShowFilterDropdown(false);
                        }}
                        className="mt-1 text-[10px] font-bold text-red-400 hover:text-red-600 transition"
                      >
                        Reset Filters
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Active Filters Badges ── */}
          {(timeFilter !== "all" || sortBy !== "newest") && (
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="text-xs text-gray-400 font-medium">Active Filters:</span>
              {timeFilter !== "all" && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                  {timeFilter === "week" && "📆 This Week"}
                  {timeFilter === "month" && "📊 This Month"}
                  {timeFilter === "year" && "🗓️ This Year"}
                  <button onClick={() => setTimeFilter("all")} className="hover:text-purple-900">
                    <span className="material-symbols-outlined text-[12px]">close</span>
                  </button>
                </span>
              )}
              {sortBy !== "newest" && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                  {sortBy === "oldest" && "⬆️ Oldest First"}
                  {sortBy === "upcoming" && "📅 Upcoming First"}
                  {sortBy === "attended" && "✅ Attended First"}
                  <button onClick={() => setSortBy("newest")} className="hover:text-blue-900">
                    <span className="material-symbols-outlined text-[12px]">close</span>
                  </button>
                </span>
              )}
              <button
                onClick={() => {
                  setTimeFilter("all");
                  setSortBy("newest");
                }}
                className="text-xs text-red-400 font-medium hover:text-red-600 transition"
              >
                Clear All
              </button>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-4 text-sm font-semibold">
              <span className="material-symbols-outlined text-[18px]">error</span>
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
              <div
                className="w-12 h-12 rounded-full border-[3px] border-t-transparent animate-spin"
                style={{ borderColor: "#9B59B6", borderTopColor: "transparent" }}
              />
              <p className="text-sm text-gray-400 font-medium">Loading your registrations...</p>
            </div>
          ) : sortedRegistrations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400 bg-white rounded-3xl border border-dashed border-gray-200">
              <span className="material-symbols-outlined text-[56px] mb-3" style={{ color: "#d8b4fe" }}>
                app_registration
              </span>
              <p className="text-base font-bold text-gray-600">No registrations found</p>
              <p className="text-sm mt-1 text-gray-400">Browse events and sign up for something exciting!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedRegistrations.map((reg) => {
                const event = reg?.event_id;
                if (!event) return null;
                const isPast = new Date(event.start_date) < now;
                const isAttended = reg.attendance_status === "Present";
                const isVolunteer = reg.role === "Volunteer";
                const catStyle = getCategoryColor(event.category);
                const canCancel = !isPast && !isAttended;

                const studentName = reg.student_id?.name || user?.name || 'Student';
                const studentEmail = reg.student_id?.email || user?.email || '';

                return (
                  <div
                    key={reg._id}
                    className="bg-white rounded-3xl border border-gray-100 overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
                    style={{ boxShadow: "0 2px 12px rgba(155,89,182,0.07)" }}
                  >
                    {/* Top accent bar */}
                    <div
                      className="h-1 w-full"
                      style={{
                        background: isAttended
                          ? "linear-gradient(90deg,#4ECDC4,#2bb5ac)"
                          : isPast
                          ? "linear-gradient(90deg,#d1d5db,#9ca3af)"
                          : "linear-gradient(90deg,#9B59B6,#FF6B6B)",
                      }}
                    />

                    <div className="p-5 flex flex-col md:flex-row md:items-center gap-4">
                      {/* Date Badge */}
                      <div
                        className="shrink-0 w-14 h-14 rounded-2xl flex flex-col items-center justify-center"
                        style={{
                          background: isAttended
                            ? "linear-gradient(135deg,#4ECDC4,#2bb5ac)"
                            : isPast
                            ? "linear-gradient(135deg,#e5e7eb,#d1d5db)"
                            : "linear-gradient(135deg,#9B59B6,#6d3483)",
                        }}
                      >
                        <span className="text-[9px] font-black uppercase text-white/80 tracking-wider">
                          {new Date(event.start_date).toLocaleString("en-PK", { month: "short" })}
                        </span>
                        <span className="text-xl font-black text-white leading-tight">
                          {new Date(event.start_date).getDate()}
                        </span>
                      </div>

                      {/* Event Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                          <h3
                            className="text-base font-black text-gray-800"
                            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                          >
                            {event.title}
                          </h3>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              isVolunteer
                                ? "bg-[#edfafa] text-[#0d9488]"
                                : "bg-[#f5eefa] text-[#8b4fa2]"
                            }`}
                          >
                            {isVolunteer ? "Volunteer" : "Attendee"}
                          </span>
                          {event.category && (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${catStyle.bg} ${catStyle.text}`}>
                              {event.category}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-x-4 gap-y-1">
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[13px]">calendar_month</span>
                            {formatDate(event.start_date)}
                            {event.end_date && event.end_date !== event.start_date && ` — ${formatDate(event.end_date)}`}
                          </span>
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[13px]">location_on</span>
                            {event.venue || "TBA"}
                          </span>
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[13px]">how_to_reg</span>
                            Registered {formatDate(reg.registration_date)}
                          </span>
                        </div>
                      </div>

                      {/* Right Section */}
                      <div className="flex flex-col items-end gap-2.5 shrink-0">
                        <span
                          className={`flex items-center gap-1 text-[11px] font-bold px-3 py-1 rounded-full ${
                            isAttended
                              ? "bg-[#edfafa] text-[#0d9488]"
                              : isPast
                              ? "bg-gray-100 text-gray-400"
                              : "bg-[#fff8e6] text-[#d97706]"
                          }`}
                        >
                          <span
                            className="material-symbols-outlined text-[13px]"
                            style={{ fontVariationSettings: "'FILL' 1" }}
                          >
                            {isAttended ? "task_alt" : isPast ? "cancel" : "pending"}
                          </span>
                          {isAttended ? "Attended" : isPast ? "Absent" : "Upcoming"}
                        </span>

                        <div className="flex gap-2 flex-wrap justify-end">
                          {reg.qrCode && (
                            <button
                              onClick={() => setQrModal({ 
                                qrCode: reg.qrCode, 
                                eventTitle: event.title,
                                regId: reg._id,
                                studentName: studentName,
                                studentEmail: studentEmail,
                                eventDate: formatDateLong(event.start_date),
                                eventVenue: event.venue || 'TBA'
                              })}
                              className="flex items-center gap-1 text-[11px] font-bold px-3 py-1.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100 transition"
                            >
                              <span className="material-symbols-outlined text-[14px]">qr_code_2</span>
                              QR Code
                            </button>
                          )}

                          {isAttended && (
                            <button
                              onClick={() => setFeedbackModal({ eventId: event._id, eventTitle: event.title })}
                              className="flex items-center gap-1 text-[11px] font-bold px-3 py-1.5 rounded-xl transition"
                              style={{ background: "#f5eefa", color: "#8b4fa2" }}
                            >
                              <span className="material-symbols-outlined text-[14px]">rate_review</span>
                              Feedback
                            </button>
                          )}
                           
                          {isVolunteer && (
                            <button
                              onClick={() => navigate("/student/tasks")}
                              className="flex items-center gap-1 text-[11px] font-bold px-3 py-1.5 rounded-xl transition"
                              style={{ background: "#edfafa", color: "#0d9488" }}
                            >
                              <span className="material-symbols-outlined text-[14px]">task_alt</span>
                              My Tasks
                            </button>
                          )}

                          {canCancel && (
                            <button
                              onClick={() => setCancelModal({ regId: reg._id, eventTitle: event.title })}
                              className="flex items-center gap-1 text-[11px] font-bold px-3 py-1.5 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 border border-red-100 transition"
                            >
                              <span className="material-symbols-outlined text-[14px]">cancel</span>
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* QR MODAL */}
      {qrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-7 text-center max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-black text-gray-800" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                🎫 Event Pass
              </h3>
              <button onClick={() => setQrModal(null)} className="text-gray-400 hover:text-gray-600 transition">
                <span className="material-symbols-outlined text-[22px]">close</span>
              </button>
            </div>

            <p className="text-sm font-bold text-[#8b4fa2] mb-1">{qrModal.eventTitle}</p>
            <div className="w-12 h-0.5 bg-[#8b4fa2] mx-auto mb-4 rounded-full" />

            <div className="p-3 rounded-2xl bg-[#f7f4fb] inline-block mx-auto mb-4">
              <img src={qrModal.qrCode} alt="QR Code" className="w-40 h-40 rounded-xl" />
            </div>

            <div className="bg-[#faf8fc] rounded-2xl p-4 text-left mb-4 space-y-2">
              <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Student</span>
                <span className="text-sm font-semibold text-gray-800">{qrModal.studentName || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Email</span>
                <span className="text-sm font-medium text-gray-600">{qrModal.studentEmail || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Event</span>
                <span className="text-sm font-semibold text-[#8b4fa2]">{qrModal.eventTitle}</span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Date</span>
                <span className="text-sm font-medium text-gray-600">{qrModal.eventDate || 'TBA'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Venue</span>
                <span className="text-sm font-medium text-gray-600">{qrModal.eventVenue || 'TBA'}</span>
              </div>
            </div>
            
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => handleDownloadQR(qrModal.qrCode, qrModal.eventTitle)}
                className="flex-1 flex items-center justify-center gap-2 text-xs font-bold px-4 py-2.5 rounded-xl transition"
                style={{ background: "#f5eefa", color: "#8b4fa2" }}
              >
                <span className="material-symbols-outlined text-[16px]">download</span>
                Download
              </button>
              <button
                onClick={() => handlePrintQR(
                  qrModal.qrCode, 
                  qrModal.eventTitle, 
                  qrModal.studentName, 
                  qrModal.studentEmail,
                  qrModal.eventDate,
                  qrModal.eventVenue,
                  qrModal.regId
                )}
                className="flex-1 flex items-center justify-center gap-2 text-xs font-bold px-4 py-2.5 rounded-xl transition"
                style={{ background: "#edfafa", color: "#0d9488" }}
              >
                <span className="material-symbols-outlined text-[16px]">print</span>
                Print
              </button>
            </div>

            <p className="text-xs text-gray-400 flex items-center justify-center gap-1">
              <span className="material-symbols-outlined text-[14px] text-[#9B59B6]">info</span>
              Show this QR code at the event entrance for check-in
            </p>
          </div>
        </div>
      )}

      {/* FEEDBACK MODAL */}
      {feedbackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-7">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-lg font-black text-gray-800" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Give Feedback
              </h3>
              <button
                onClick={() => { setFeedbackModal(null); setFeedbackText(""); setFeedbackRating(5); }}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <span className="material-symbols-outlined text-[22px]">close</span>
              </button>
            </div>
            <p className="text-sm text-[#9B59B6] font-semibold mb-5">{feedbackModal.eventTitle}</p>

            <div className="mb-5">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Your Rating</p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} onClick={() => setFeedbackRating(star)} className="transition-transform hover:scale-125 active:scale-90">
                    <span
                      className="material-symbols-outlined text-[32px] transition-colors duration-150"
                      style={{
                        color: star <= feedbackRating ? "#FFE66D" : "#e5e7eb",
                        fontVariationSettings: "'FILL' 1",
                        filter: star <= feedbackRating ? "drop-shadow(0 0 4px rgba(255,230,109,0.5))" : "none",
                      }}
                    >
                      star
                    </span>
                  </button>
                ))}
                <span className="ml-2 self-center text-sm font-bold text-gray-500">{feedbackRating}/5</span>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Your Comment</p>
              <textarea
                rows={4}
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Share your experience about this event..."
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-sm text-gray-700 placeholder-gray-300 focus:outline-none transition resize-none"
                style={{ focusRingColor: "#9B59B6" }}
                onFocus={(e) => (e.target.style.borderColor = "#9B59B6")}
                onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
              />
            </div>

            <button
              onClick={handleFeedbackSubmit}
              disabled={submittingFeedback || !feedbackText.trim()}
              className="w-full py-3 rounded-2xl text-white text-sm font-black transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: "linear-gradient(135deg, #9B59B6, #6d3483)", boxShadow: "0 4px 15px rgba(139,79,162,0.35)" }}
            >
              {submittingFeedback ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Submitting...
                </span>
              ) : (
                "Submit Feedback"
              )}
            </button>
          </div>
        </div>
      )}

      {/* CANCEL MODAL */}
      {cancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-7 text-center">
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <span
                className="material-symbols-outlined text-[36px] text-red-400"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                cancel
              </span>
            </div>
            <h3 className="text-lg font-black text-gray-800 mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Cancel Registration?
            </h3>
            <p className="text-sm text-gray-500 mb-1">You are about to cancel your registration for:</p>
            <p className="text-sm font-bold text-[#9B59B6] mb-6">"{cancelModal.eventTitle}"</p>

            <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3 mb-6 text-left">
              <span className="material-symbols-outlined text-[18px] text-amber-500 shrink-0">warning</span>
              <p className="text-xs text-amber-700 font-medium">
                This action cannot be undone. Your spot will be released.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setCancelModal(null)}
                className="flex-1 py-3 rounded-2xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition"
              >
                Keep It
              </button>
              <button
                onClick={handleCancelRegistration}
                disabled={!!cancellingId}
                className="flex-1 py-3 rounded-2xl text-white text-sm font-black transition-all disabled:opacity-60"
                style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)", boxShadow: "0 4px 12px rgba(239,68,68,0.3)" }}
              >
                {cancellingId ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Cancelling...
                  </span>
                ) : (
                  "Yes, Cancel"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default MyRegistrations;