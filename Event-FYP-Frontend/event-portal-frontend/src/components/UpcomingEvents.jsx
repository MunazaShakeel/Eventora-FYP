// frontend/src/components/UpcomingEvents.jsx

import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";

const API = "http://localhost:5000";

const CATEGORY_STYLES = {
  Workshop: { bg: "#fff8e1", text: "#d97706", dot: "#f59e0b" },
  Seminar: { bg: "#edf9f8", text: "#0d9488", dot: "#4ECDC4" },
  Sports: { bg: "#fff0f0", text: "#ef4444", dot: "#FF6B6B" },
  Cultural: { bg: "#f5eefa", text: "#8b4fa2", dot: "#9B59B6" },
  Academic: { bg: "#eef2ff", text: "#4f46e5", dot: "#818cf8" },
  default: { bg: "#f3f4f6", text: "#6b7280", dot: "#9ca3af" },
};

const formatDate = (d) => {
  if (!d) return "TBA";
  const date = new Date(d);
  if (isNaN(date)) return "TBA";
  return date.toLocaleDateString("en-PK", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

/* ================= FORMAT TIME TO 12-HOUR ================= */
const formatTime = (timeStr) => {
  if (!timeStr) return "";
  const [hours, minutes] = timeStr.split(':');
  let hour = parseInt(hours);
  const minute = minutes || '00';
  const ampm = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12;
  hour = hour ? hour : 12;
  return `${hour}:${minute} ${ampm}`;
};

/* ================= HELPER: Check if event is upcoming (date + time) ================= */
const isEventUpcoming = (event) => {
  if (!event?.start_date) return false;
  
  const now = new Date();
  const eventDate = new Date(event.start_date);
  
  if (event.start_time) {
    const [hours, minutes] = event.start_time.split(':');
    eventDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  } else {
    eventDate.setHours(23, 59, 59, 999);
  }
  
  return eventDate > now;
};

/* ================= HELPER: Get event status ================= */
const getEventStatus = (event) => {
  if (!event?.start_date) return { label: 'Upcoming', color: '#4ECDC4' };
  
  const now = new Date();
  const eventDate = new Date(event.start_date);
  
  if (event.start_time) {
    const [hours, minutes] = event.start_time.split(':');
    eventDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  }
  
  if (eventDate > now) {
    return { label: 'Upcoming', color: '#4ECDC4' };
  } else {
    return { label: 'Ended', color: '#ef4444' };
  }
};

/* ================= EVENT CARD ================= */
const EventCard = ({ event, index }) => {
  const navigate = useNavigate();
  const cat = CATEGORY_STYLES[event.category] || CATEGORY_STYLES.default;
  const status = getEventStatus(event);

  const eventDate = new Date(event.start_date);
  const month = !isNaN(eventDate)
    ? eventDate.toLocaleString("en-PK", { month: "short" }).toUpperCase()
    : "TBA";

  const day = !isNaN(eventDate) ? eventDate.getDate() : "--";

  let imageUrl = null;
  if (event.image_url) {
    if (event.image_url.startsWith("http")) {
      imageUrl = event.image_url;
    } else {
      imageUrl = `${API}/${event.image_url
        .replace(/\\/g, "/")
        .replace(/^\/+/, "")}`;
    }
  }

  return (
    <div
      className="group relative bg-white rounded-3xl overflow-hidden flex flex-col cursor-pointer"
      style={{
        boxShadow: "0 4px 24px rgba(155,89,182,0.08)",
        border: "1px solid rgba(155,89,182,0.08)",
        animationDelay: `${index * 80}ms`,
        animation: "fadeSlideUp 0.5s ease both",
      }}
      onClick={() => navigate("/student-register")}
    >
      {/* IMAGE */}
      <div className="relative h-44 overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={event.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              e.target.src = "https://via.placeholder.com/400x300";
            }}
          />
        ) : (
          <div
            className="w-full h-full"
            style={{
              background: "linear-gradient(135deg, #9B59B6 0%, #4ECDC4 100%)",
            }}
          />
        )}

        <div className="absolute inset-0 bg-linear-to-t from-black/45 to-transparent" />

        {/* DATE */}
        <div className="absolute top-3 left-3 flex flex-col items-center justify-center w-12 h-12 rounded-2xl bg-white/95 shadow-lg">
          <span className="text-[9px] font-black text-[#9B59B6] uppercase">
            {month}
          </span>
          <span className="text-lg font-black text-gray-800">{day}</span>
        </div>

        {/* CATEGORY */}
        <div
          className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-black"
          style={{ background: cat.bg, color: cat.text }}
        >
          {event.category || "Event"}
        </div>

        {/* STATUS BADGE - UPCOMING/ENDED */}
        <div
          className="absolute bottom-3 right-3 px-3 py-1 rounded-full text-[10px] font-black text-white shadow-lg"
          style={{ 
            background: status.color,
            opacity: 0.9
          }}
        >
          {status.label}
        </div>
      </div>

      {/* CONTENT */}
      <div className="p-5 flex flex-col flex-1">
        <h3 className="text-base font-black text-gray-800 mb-2 line-clamp-2">
          {event.title}
        </h3>

        <div className="flex flex-col gap-1.5 mb-4">
          <span className="text-xs text-gray-400">📍 {event.venue || "TBA"}</span>
          <span className="text-xs text-gray-400">
            📅 {formatDate(event.start_date)} {event.start_time ? `at ${formatTime(event.start_time)}` : ''}
          </span>

          {event.max_participants && (
            <span className="text-xs text-gray-400">
              👥 {event.max_participants} seats
            </span>
          )}
        </div>

        <button
          className="mt-auto w-full py-2.5 rounded-2xl text-sm font-black text-white"
          style={{
            background: status.label === 'Upcoming' 
              ? "linear-gradient(135deg, #9B59B6, #6d3483)"
              : "linear-gradient(135deg, #9ca3af, #6b7280)",
            boxShadow: status.label === 'Upcoming' 
              ? "0 2px 10px rgba(139,79,162,0.25)"
              : "none",
            cursor: status.label === 'Upcoming' ? 'pointer' : 'not-allowed'
          }}
          onClick={(e) => {
            e.stopPropagation();
            if (status.label === 'Upcoming') {
              navigate("/student-register");
            }
          }}
        >
          {status.label === 'Upcoming' ? 'Register Now' : 'Event Ended'}
        </button>
      </div>
    </div>
  );
};

/* ================= UPCOMING EVENTS ================= */
const UpcomingEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const location = useLocation();

  /* SCROLL FIX */
  useEffect(() => {
    if (window.location.hash === '#upcoming-events') {
      const element = document.getElementById('upcoming-events');
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    }
  }, [location]);

  /* FETCH EVENTS - WITH TIME COMPARISON */
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await axios.get(`${API}/api/events`);

        const allEvents = res.data?.data || res.data?.events || res.data || [];

        const now = new Date();

        const upcoming = allEvents
          .filter((e) => {
            if (!e.start_date) return false;
            
            const eventDate = new Date(e.start_date);
            
            if (e.start_time) {
              const [hours, minutes] = e.start_time.split(':');
              eventDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
            } else {
              eventDate.setHours(0, 0, 0, 0);
            }
            
            return eventDate > now;
          })
          .sort((a, b) => {
            const dateA = new Date(a.start_date);
            const dateB = new Date(b.start_date);
            
            if (a.start_time) {
              const [hA, mA] = a.start_time.split(':');
              dateA.setHours(parseInt(hA), parseInt(mA), 0, 0);
            }
            if (b.start_time) {
              const [hB, mB] = b.start_time.split(':');
              dateB.setHours(parseInt(hB), parseInt(mB), 0, 0);
            }
            
            return dateA - dateB;
          })
          .slice(0, 6);

        setEvents(upcoming);
      } catch (err) {
        console.error("API Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  return (
    <section
      id="upcoming-events"
      className="py-20 px-6"
      style={{ background: "#f7f4fb" }}
    >
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>

      <div className="max-w-6xl mx-auto">
        {/* HEADER */}
        <div className="flex justify-between mb-10">
          <h2 className="text-3xl font-bold">Upcoming Events</h2>

          <button
            onClick={() => navigate("/student-register")}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold border-2 transition-all duration-200 hover:shadow-md"
            style={{ borderColor: "#9B59B6", color: "#9B59B6" }}
          >
            View All →
          </button>
        </div>

        {/* CONTENT */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-12 h-12 border-4 border-[#9B59B6] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-lg font-semibold">No upcoming events</p>
            <p className="text-sm mt-1">Check back later for new events</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event, i) => (
              <EventCard key={event._id} event={event} index={i} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default UpcomingEvents;