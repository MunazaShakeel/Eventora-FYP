import React, { useEffect, useState } from "react";
import OrganizerSidebar from "../../components/OrganizerSidebar";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const Stars = ({ rating, size = 15 }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((s) => (
      <span
        key={s}
        className="material-symbols-outlined"
        style={{
          fontSize: size,
          color: s <= rating ? "#FFE66D" : "#e5e7eb",
          fontVariationSettings: "'FILL' 1",
          filter: s <= rating ? "drop-shadow(0 0 3px rgba(255,230,109,0.6))" : "none",
        }}
      >
        star
      </span>
    ))}
  </div>
);

const RatingBar = ({ star, count, total }) => {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  const colors = { 5: "#9B59B6", 4: "#8b4fa2", 3: "#6d3483", 2: "#FF6B6B", 1: "#ef4444" };
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] font-black text-gray-500 w-3">{star}</span>
      <span className="material-symbols-outlined text-[11px]" style={{ color: "#FFE66D", fontVariationSettings: "'FILL' 1" }}>star</span>
      <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: colors[star] }} />
      </div>
      <span className="text-[11px] font-bold text-gray-400 w-4 text-right">{count}</span>
    </div>
  );
};

const AVATAR_GRADS = [
  "linear-gradient(135deg,#9B59B6,#6d3483)",
  "linear-gradient(135deg,#8b4fa2,#6d3483)",
  "linear-gradient(135deg,#a866c5,#7a3d91)",
  "linear-gradient(135deg,#b577d4,#8b4fa2)",
  "linear-gradient(135deg,#c488e3,#9B59B6)",
];

const OrganizerFeedback = () => {
  const { token } = useAuth();
  const [feedbacks, setFeedbacks] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [deleteModal, setDeleteModal] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        setError(null);
        
        const evRes = await axios.get(`${API_URL}/api/events/organizer`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        const evList = evRes.data?.data || evRes.data || [];
        const evArray = Array.isArray(evList) ? evList : [];
        setEvents(evArray);

        if (evArray.length === 0) { 
          setLoading(false); 
          return; 
        }

        const results = await Promise.all(
          evArray.map((ev) =>
            axios
              .get(`${API_URL}/api/feedbacks/event/${ev._id}`, {
                headers: { Authorization: `Bearer ${token}` },
              })
              .then((r) => {
                const list = Array.isArray(r.data) ? r.data : (r.data?.data || []);
                return list.map((f) => ({ ...f, eventTitle: ev.title, eventId: ev._id }));
              })
              .catch((err) => {
                console.error(`Feedback fetch failed for ${ev.title}:`, err.message);
                return [];
              })
          )
        );
        setFeedbacks(results.flat());
      } catch (err) {
        console.error("Init error:", err);
        setError("Failed to load feedback data");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [token]);

  const handleDelete = async () => {
    if (!deleteModal) return;
    try {
      setDeleting(true);
      await axios.delete(`${API_URL}/api/feedbacks/${deleteModal}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFeedbacks((prev) => prev.filter((f) => f._id !== deleteModal));
      setDeleteModal(null);
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to delete.");
    } finally {
      setDeleting(false);
    }
  };

  const filtered = feedbacks
    .filter((f) => selectedEvent === "all" || f.eventId === selectedEvent)
    .sort((a, b) => {
      const da = new Date(a.createdAt || a.submitted_at);
      const db = new Date(b.createdAt || b.submitted_at);
      if (sortBy === "newest") return db - da;
      if (sortBy === "oldest") return da - db;
      if (sortBy === "highest") return b.rating - a.rating;
      if (sortBy === "lowest") return a.rating - b.rating;
      return 0;
    });

  const avgRating =
    filtered.length > 0
      ? (filtered.reduce((s, f) => s + (f.rating || 0), 0) / filtered.length).toFixed(1)
      : null;

  const ratingCounts = [5, 4, 3, 2, 1].map((s) => ({
    star: s,
    count: filtered.filter((f) => f.rating === s).length,
  }));

  const formatDate = (d) => {
    if (!d) return "";
    return new Date(d).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" });
  };

  const getRatingAccent = (r) => {
    if (r >= 4) return "linear-gradient(90deg,#9B59B6,#6d3483)";
    if (r === 3) return "linear-gradient(90deg,#a866c5,#7a3d91)";
    return "linear-gradient(90deg,#FF6B6B,#dc2626)";
  };

  const getRatingChip = (r) => {
    if (r >= 4) return { bg: "#f5eefa", color: "#8b4fa2" };
    if (r === 3) return { bg: "#fff8e6", color: "#d97706" };
    return { bg: "#fff0f0", color: "#ef4444" };
  };

  return (
    <div className="flex min-h-screen" style={{ background: "#f7f4fb" }}>
      <OrganizerSidebar />

      <main className="flex-1 md:ml-64 pb-24 md:pb-8">

        <div
          className="relative overflow-hidden px-8 pt-10 pb-8"
          style={{ background: "linear-gradient(135deg,#9B59B6 0%,#6d3483 100%)" }}
        >
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <p className="inline-block px-5 py-1 mb-4 rounded-full bg-[#FFE66D] text-[#1A1A1A] text-xs font-black tracking-widest uppercase ">
          Organizer Portal
        </p>
              <h1 className="text-3xl font-black text-white">
                Event Feedback
              </h1>
              <p className="text-purple-200 text-sm mt-1">See what students say about your events</p>
            </div>
            
            <div className="flex gap-3 flex-wrap">
              {[
                { icon: "reviews", label: "Total Reviews", value: feedbacks.length },
                { icon: "star", label: "Avg Rating", value: avgRating ? `${avgRating}` : "—" },
                { icon: "event", label: "My Events", value: events.length },
              ].map((s) => (
                <div key={s.label} className="group flex items-center gap-2 px-4 py-2 rounded-full transition-all hover:scale-105"
                  style={{ background: "rgba(255,255,255,0.15)" }}>
                  <span className="material-symbols-outlined text-white text-sm group-hover:animate-pulse">
                    {s.icon === "reviews" ? "rate_review" : s.icon === "star" ? "star" : "event"}
                  </span>
                  <span className="text-xl font-black text-white">{s.value}</span>
                  <span className="text-purple-200 text-xs font-semibold">{s.label}</span>
                  {s.icon === "star" && avgRating && <span className="text-yellow-200 text-xs">★</span>}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 pt-6 max-w-7xl mx-auto">
          
          {error && (
            <div className="mb-6 p-4 bg-red-50 rounded-2xl border border-red-200">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-red-500">error</span>
                <p className="text-sm text-red-600 font-semibold">{error}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            <div className="lg:col-span-4 space-y-5">

              <div className="bg-white rounded-3xl overflow-hidden"
                style={{ boxShadow: "0 4px 24px rgba(155,89,182,0.09)", border: "1px solid rgba(155,89,182,0.08)" }}>
                
                <div className="bg-linear-to-r from-[#8b4fa2]/5 to-transparent px-6 pt-5 pb-3 border-b border-purple-100">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#8b4fa2]">analytics</span>
                    <p className="text-xs font-black text-gray-500 uppercase tracking-wider">Overview</p>
                  </div>
                </div>

                <div className="p-6 text-center">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Average Rating</p>
                  {avgRating && filtered.length > 0 ? (
                    <>
                      <div className="text-6xl font-black mb-2 leading-none"
                        style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", background: "linear-gradient(135deg,#FFE66D,#f59e0b)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                        {avgRating}
                      </div>
                      <Stars rating={Math.round(parseFloat(avgRating))} size={22} />
                      <div className="mt-3 flex items-center justify-center gap-2">
                        <span className="material-symbols-outlined text-sm text-gray-400">people</span>
                        <p className="text-xs text-gray-500 font-medium">{filtered.length} student {filtered.length === 1 ? "review" : "reviews"}</p>
                      </div>
                    </>
                  ) : (
                    <div className="py-4">
                      <p className="text-gray-300 font-black text-4xl mt-2">—</p>
                      <p className="text-xs text-gray-400 mt-2">No reviews yet</p>
                    </div>
                  )}
                </div>
              </div>

              {filtered.length > 0 && (
                <div className="bg-white rounded-3xl overflow-hidden"
                  style={{ boxShadow: "0 4px 24px rgba(155,89,182,0.07)", border: "1px solid rgba(155,89,182,0.07)" }}>
                  
                  <div className="bg-linear-to-r from-[#8b4fa2]/5 to-transparent px-6 pt-5 pb-3 border-b border-purple-100">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#8b4fa2]">bar_chart</span>
                      <p className="text-xs font-black text-gray-500 uppercase tracking-wider">Rating Breakdown</p>
                    </div>
                  </div>

                  <div className="p-5">
                    <div className="space-y-2.5">
                      {ratingCounts.map(({ star, count }) => (
                        <RatingBar key={star} star={star} count={count} total={filtered.length} />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-white rounded-3xl overflow-hidden"
                style={{ boxShadow: "0 4px 24px rgba(155,89,182,0.07)", border: "1px solid rgba(155,89,182,0.07)" }}>
                
                <div className="bg-linear-to-r from-[#8b4fa2]/5 to-transparent px-6 pt-5 pb-3 border-b border-purple-100">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#8b4fa2]">filter_list</span>
                    <p className="text-xs font-black text-gray-500 uppercase tracking-wider">Filter by Event</p>
                  </div>
                </div>

                <div className="p-4">
                  <div className="space-y-1.5 max-h-80 overflow-y-auto custom-scrollbar pr-1">
                    <button onClick={() => setSelectedEvent("all")}
                      className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200"
                      style={selectedEvent === "all" ? { background: "linear-gradient(135deg,#9B59B6,#6d3483)", color: "white", boxShadow: "0 2px 8px rgba(155,89,182,0.3)" } : { color: "#4b5563", background: "#fafafa" }}>
                      <span className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-sm">all_inbox</span>
                          All Events
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${selectedEvent === "all" ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"}`}>
                          {feedbacks.length}
                        </span>
                      </span>
                    </button>
                    
                    {events.map((ev) => {
                      const count = feedbacks.filter((f) => f.eventId === ev._id).length;
                      const isActive = selectedEvent === ev._id;
                      return (
                        <button key={ev._id} onClick={() => setSelectedEvent(ev._id)}
                          className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200"
                          style={isActive ? { background: "linear-gradient(135deg,#9B59B6,#6d3483)", color: "white", boxShadow: "0 2px 8px rgba(155,89,182,0.3)" } : { color: "#4b5563", background: "#fafafa" }}>
                          <span className="flex items-center justify-between gap-2">
                            <span className="flex items-center gap-2 truncate">
                              <span className="material-symbols-outlined text-sm">event_note</span>
                              <span className="truncate">{ev.title}</span>
                            </span>
                            <span className={`shrink-0 text-[10px] px-2 py-0.5 rounded-full font-black ${isActive ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"}`}>
                              {count}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-8 space-y-4">

              <div className="flex items-center justify-between flex-wrap gap-3 bg-white rounded-2xl px-5 py-3"
                style={{ boxShadow: "0 2px 12px rgba(155,89,182,0.06)", border: "1px solid rgba(155,89,182,0.06)" }}>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#8b4fa2] text-lg">rate_review</span>
                  <p className="text-sm font-black text-gray-700">
                    {filtered.length} {filtered.length === 1 ? "Review" : "Reviews"}
                  </p>
                  {selectedEvent !== "all" && (
                    <span className="ml-2 text-xs font-bold px-2 py-1 rounded-full bg-purple-100 text-[#8b4fa2]">
                      {events.find((e) => e._id === selectedEvent)?.title}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-gray-400 text-sm">sort</span>
                  <span className="text-xs text-gray-500 font-semibold">Sort:</span>
                  <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
                    className="text-xs font-bold text-gray-700 bg-white border border-gray-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#8b4fa2] cursor-pointer">
                    <option value="newest">📅 Newest First</option>
                    <option value="oldest">📅 Oldest First</option>
                    <option value="highest">⭐ Highest Rating</option>
                    <option value="lowest">⭐ Lowest Rating</option>
                  </select>
                </div>
              </div>

              {loading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="bg-white rounded-3xl p-6 animate-pulse">
                      <div className="flex gap-3 mb-4">
                        <div className="w-11 h-11 rounded-2xl bg-gray-100" />
                        <div className="flex-1 space-y-2">
                          <div className="h-3 bg-gray-100 rounded-full w-1/3" />
                          <div className="h-3 bg-gray-100 rounded-full w-1/4" />
                        </div>
                        <div className="w-14 h-6 bg-gray-100 rounded-full" />
                      </div>
                      <div className="h-3 bg-gray-100 rounded-full w-full mb-2" />
                      <div className="h-3 bg-gray-100 rounded-full w-3/4" />
                    </div>
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-200">
                  <div className="w-24 h-24 rounded-full bg-purple-50 flex items-center justify-center mb-4">
                    <span className="material-symbols-outlined text-5xl text-[#8b4fa2]" style={{ fontVariationSettings: "'FILL' 1" }}>rate_review</span>
                  </div>
                  <p className="text-base font-black text-gray-600">No feedback yet</p>
                  <p className="text-sm text-gray-400 mt-1 max-w-md text-center">
                    {selectedEvent === "all" 
                      ? "Students haven't reviewed your events yet. Feedback will appear here once students submit reviews." 
                      : "No reviews for this event yet"}
                  </p>
                  {selectedEvent !== "all" && (
                    <button onClick={() => setSelectedEvent("all")}
                      className="mt-4 px-4 py-2 rounded-xl bg-[#8b4fa2] text-white text-xs font-bold hover:bg-[#724286] transition">
                      View All Events
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {filtered.map((fb, idx) => {
                    const chip = getRatingChip(fb.rating);
                    const studentName = fb.student_id?.name || "Anonymous Student";
                    const studentEmail = fb.student_id?.email || "";
                    const initials = studentName === "Anonymous Student" 
                      ? "👤" 
                      : studentName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
                    
                    const isAnonymous = studentName === "Anonymous Student";

                    return (
                      <div key={fb._id}
                        className="bg-white rounded-3xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group"
                        style={{ boxShadow: "0 2px 16px rgba(155,89,182,0.08)", border: "1px solid rgba(155,89,182,0.08)" }}>

                        <div className="h-1 w-full transition-all duration-300 group-hover:h-1.5" style={{ background: getRatingAccent(fb.rating) }} />

                        <div className="p-5">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 text-white text-base font-black shadow-md transition-transform group-hover:scale-105"
                              style={{ background: isAnonymous ? "linear-gradient(135deg,#94a3b8,#64748b)" : AVATAR_GRADS[idx % AVATAR_GRADS.length] }}>
                              {initials}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 flex-wrap mb-1">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <p className="text-sm font-black text-gray-800">
                                      {studentName}
                                      {isAnonymous && <span className="ml-1 text-xs font-normal text-gray-400">(Anonymous)</span>}
                                    </p>
                                    {studentEmail && !isAnonymous && (
                                      <span className="text-[10px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">{studentEmail}</span>
                                    )}
                                  </div>
                                </div>
                                <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black shrink-0 shadow-sm"
                                  style={{ background: chip.bg, color: chip.color }}>
                                  <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1", color: "#FFE66D" }}>star</span>
                                  {fb.rating}/5
                                </span>
                              </div>

                              <div className="mb-2"><Stars rating={fb.rating} size={13} /></div>

                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-linear-to-r from-purple-50 to-purple-100 text-[#8b4fa2] mb-3 shadow-sm">
                                <span className="material-symbols-outlined text-[12px]">event</span>
                                {fb.eventTitle}
                              </span>

                              {fb.comments && (
                                <div className="bg-gray-50 rounded-2xl px-4 py-3 mt-2 border border-gray-100">
                                  <div className="flex items-start gap-2">
                                    <p className="text-sm text-gray-700 leading-relaxed italic">"{fb.comments}"</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                            <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                              <span className="material-symbols-outlined text-[13px]">schedule</span>
                              <span>{formatDate(fb.createdAt || fb.submitted_at)}</span>
                            </div>
                            <button 
                              onClick={() => setDeleteModal(fb._id)}
                              className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-xl bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 border border-red-100 transition-all duration-200 hover:shadow-md">
                              <span className="material-symbols-outlined text-[14px]">delete</span>
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-7 text-center transform transition-all duration-200 scale-100">
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-[34px] text-red-500" style={{ fontVariationSettings: "'FILL' 1" }}>delete_forever</span>
            </div>
            <h3 className="text-lg font-black text-gray-800 mb-2">Delete Review?</h3>
            <p className="text-sm text-gray-500 mb-6">This review will be permanently removed from your event.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteModal(null)}
                className="flex-1 py-3 rounded-2xl border-2 border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all hover:border-gray-300">
                Keep It
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex-1 py-3 rounded-2xl text-white text-sm font-black transition-all disabled:opacity-60 shadow-md hover:shadow-lg"
                style={{ background: "linear-gradient(135deg,#ef4444,#dc2626)" }}>
                {deleting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Deleting...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-sm">delete</span>
                    Yes, Delete
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #d8b4fe;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #9B59B6;
        }
      `}</style>
    </div>
  );
};

export default OrganizerFeedback;