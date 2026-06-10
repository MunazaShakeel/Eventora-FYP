import React, { useEffect, useState } from "react";
import StudentSidebar from "../../components/StudentSidebar";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

const API = "http://localhost:5000";

const MyRegistrations = () => {
const { token } = useAuth();
const navigate = useNavigate();

  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [feedbackModal, setFeedbackModal] = useState(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [qrModal, setQrModal] = useState(null);
  const [cancelModal, setCancelModal] = useState(null); // { regId, eventTitle }
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

  const filtered = registrations.filter((reg) => {
    const eventDate = new Date(reg?.event_id?.start_date);
    if (activeTab === "upcoming") return eventDate >= now;
    if (activeTab === "attended") return reg.attendance_status === "Present";
    if (activeTab === "volunteer") return reg.role === "Volunteer";
    return true;
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return "TBA";
    return new Date(dateStr).toLocaleDateString("en-PK", {
      day: "numeric",
      month: "short",
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
      alert("Feedback submitted!");
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
          {/* ── TABS ── */}
          <div className="flex gap-2 mb-6 flex-wrap">
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
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400 bg-white rounded-3xl border border-dashed border-gray-200">
              <span className="material-symbols-outlined text-[56px] mb-3" style={{ color: "#d8b4fe" }}>
                app_registration
              </span>
              <p className="text-base font-bold text-gray-600">No registrations found</p>
              <p className="text-sm mt-1 text-gray-400">Browse events and sign up for something exciting!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map((reg) => {
                const event = reg?.event_id;
                if (!event) return null;
                const isPast = new Date(event.start_date) < now;
                const isAttended = reg.attendance_status === "Present";
                const isVolunteer = reg.role === "Volunteer";
                const catStyle = getCategoryColor(event.category);
                const canCancel = !isPast && !isAttended;

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
                          {/* Role Badge */}
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              isVolunteer
                                ? "bg-[#edfafa] text-[#0d9488]"
                                : "bg-[#f5eefa] text-[#8b4fa2]"
                            }`}
                          >
                            {isVolunteer ? "Volunteer" : "Attendee"}
                          </span>
                          {/* Category Badge */}
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
                        {/* Attendance Status Chip */}
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

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                          {/* QR Button */}
                          {reg.qrCode && (
                            <button
                              onClick={() => setQrModal({ qrCode: reg.qrCode, eventTitle: event.title })}
                              className="flex items-center gap-1 text-[11px] font-bold px-3 py-1.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100 transition"
                            >
                              <span className="material-symbols-outlined text-[14px]">qr_code_2</span>
                              QR Code
                            </button>
                          )}

                          {/* Feedback Button */}
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
                           
                          {/* View Tasks Button - only for volunteers */}
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

                          {/* Cancel Button */}
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

      {/* ══════════════════════════════
           QR CODE MODAL
      ══════════════════════════════ */}
      {qrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xs p-7 text-center">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-black text-gray-800" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Your QR Code
              </h3>
              <button onClick={() => setQrModal(null)} className="text-gray-400 hover:text-gray-600 transition">
                <span className="material-symbols-outlined text-[22px]">close</span>
              </button>
            </div>
            <p className="text-xs text-gray-400 mb-5 font-medium">{qrModal.eventTitle}</p>
            <div className="p-3 rounded-2xl bg-[#f7f4fb] inline-block mx-auto mb-4">
              <img src={qrModal.qrCode} alt="QR Code" className="w-44 h-44 rounded-xl" />
            </div>
            <p className="text-xs text-gray-400 flex items-center justify-center gap-1">
              <span className="material-symbols-outlined text-[14px] text-[#9B59B6]">info</span>
              Show this to the organizer for attendance
            </p>
          </div>
        </div>
      )}

      {/* ══════════════════════════════
           FEEDBACK MODAL
      ══════════════════════════════ */}
      {feedbackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-7">
            {/* Header */}
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

            {/* Star Rating */}
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

            {/* Comment */}
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

      {/* ══════════════════════════════
           CANCEL REGISTRATION MODAL
      ══════════════════════════════ */}
      {cancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-7 text-center">
            {/* Icon */}
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
    </div>
  );
};

export default MyRegistrations;