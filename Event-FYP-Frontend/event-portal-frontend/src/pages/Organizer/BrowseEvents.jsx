import React, { useEffect, useState } from "react";
import StudentSidebar from "../../components/StudentSidebar";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { Calendar, Clock, MapPin, User, X, CheckCircle, AlertCircle, Search, Grid3x3, List, ArrowUpDown, TrendingUp, Sparkles } from "lucide-react";

const BrowseEvents = () => {
  const { token } = useAuth();
  
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  const [events, setEvents] = useState([]);
  const [myRegisteredIds, setMyRegisteredIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [registeringId, setRegisteringId] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [modalEventId, setModalEventId] = useState(null);
  const [selectedRole, setSelectedRole] = useState("Student");
  const [sortBy, setSortBy] = useState("newest");
  const [viewMode, setViewMode] = useState("grid");



  // Helper function 
const isEventUpcoming = (event) => {
  if (!event?.start_date) return false;
  
  const now = new Date();
  const eventDate = new Date(event.start_date);
  
  if (event.start_time) {
    const [hours, minutes] = event.start_time.split(':');
    eventDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  }
  
  return eventDate > now;
};

  // Format time with AM/PM
  const formatTimeWithAMPM = (timeStr) => {
    if (!timeStr) return "TBA";
    const [hours, minutes] = timeStr.split(':');
    let hour = parseInt(hours);//
    const minute = minutes || '00';
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12;
    hour = hour ? hour : 12;
    return `${hour}:${minute} ${ampm}`;
  };

  // Calculate days remaining
  const getDaysRemaining = (dateStr) => {
    const eventDate = new Date(dateStr);
    const today = new Date();
    const diffTime = eventDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return "Ended";
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    return `${diffDays} days left`;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setError("");
        
        const eventsRes = await axios.get(`${API_URL}/events`);
        const eventList = Array.isArray(eventsRes.data)
          ? eventsRes.data
          : Array.isArray(eventsRes.data?.events)
          ? eventsRes.data.events
          : [];
        setEvents(eventList);

        if (token) {
          const regRes = await axios.get(
            `${API_URL}/registrations/my-registrations`,
            { headers: { Authorization: `Bearer ${token}` } }
          );

          const regList = Array.isArray(regRes.data?.data)
            ? regRes.data.data
            : Array.isArray(regRes.data?.registrations)
            ? regRes.data.registrations
            : Array.isArray(regRes.data)
            ? regRes.data
            : [];

          const ids = regList.map((r) => r?.event_id?._id || r?.event_id);
          setMyRegisteredIds(ids);
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load events.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token, API_URL]);

  const openRoleModal = (e, eventId) => {
    e.stopPropagation();
    if (!token) { alert("Please login first."); return; }
    setSelectedRole("Student");
    setModalEventId(eventId);
  };

  const handleRegister = async () => {
    try {
      setRegisteringId(modalEventId);
      await axios.post(
        `${API_URL}/registrations/register`,
        { event_id: modalEventId, role: selectedRole },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMyRegisteredIds((prev) => [...prev, modalEventId]);
      setModalEventId(null);
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "Registration failed.");
    } finally {
      setRegisteringId(null);
    }
  };

  // Filter and Sort Events (only search)
  let filteredEvents = events.filter((event) => {
    const matchesSearch = event.title?.toLowerCase().includes(search.toLowerCase()) ||
      event.venue?.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  // Sort events
  filteredEvents = [...filteredEvents].sort((a, b) => {
    if (sortBy === "newest") {
      return new Date(b.start_date) - new Date(a.start_date);
    } else if (sortBy === "oldest") {
      return new Date(a.start_date) - new Date(b.start_date);
    } else if (sortBy === "title") {
      return a.title?.localeCompare(b.title);
    } else if (sortBy === "popular") {
      return (b.registeredCount || 0) - (a.registeredCount || 0);
    }
    return 0;
  });

  const isRegistered = (eventId) => myRegisteredIds.includes(eventId);

  const formatDateShort = (dateStr) => {
    if (!dateStr) return "TBA";
    return new Date(dateStr).toLocaleDateString("en-PK", {
      weekday: "short", day: "numeric", month: "short", year: "numeric",
    });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "TBA";
    return new Date(dateStr).toLocaleDateString("en-PK", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    });
  };

  const getCategoryColor = (category) => {
    const map = {
      Technology: { bg: "#f5eefa", color: "#8b4fa2", icon: "💻" },
      Sports: { bg: "#fff1f1", color: "#FF6B6B", icon: "⚽" },
      Culture: { bg: "#edfafa", color: "#4ECDC4", icon: "🎭" },
      Business: { bg: "#fffbeb", color: "#f59e0b", icon: "💼" },
      Competition: { bg: "#fff1f1", color: "#FF6B6B", icon: "🏆" },
      Workshop: { bg: "#f5eefa", color: "#8b4fa2", icon: "🔧" },
    };
    return map[category] || { bg: "#f3f4f6", color: "#6b7280", icon: "📅" };
  };

  return (
    <div className="flex min-h-screen bg-[#f8f3fd]">
      <StudentSidebar />

      <main className="flex-1 md:ml-64 p-6 lg:p-8 pb-24 md:pb-6">
        
        {/* Yellow Border Card */}
        <div className="border-8 border-yellow-400 rounded-2xl bg-[#f8f3fd] shadow-lg overflow-hidden">
          <div className="p-6 lg:p-8">
            
            {/* Hero Header */}
          
            {/* ✅ CORRECTED HEADER */}
            <div className="mb-10 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-linear-to-br from-[#8b4fa2] to-[#4ECDC4] rounded-2xl shadow-lg mb-4">
               
              </div>
              <h1 className="text-3xl lg:text-5xl font-extrabold">
                Discover <span className="text-[#8b4fa2]">Events</span>
              </h1>
              <p className="text-gray-600 text-lg mt-2">
                Find and register for exciting campus events
              </p>
            </div>

            {/* Search and Sort Section */}
            <div className="space-y-4">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Search Bar */}
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="Search events by title or venue..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-gray-200 bg-white text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#8b4fa2] focus:border-transparent transition-all"
                  />
                </div>
                
                {/* Sort Dropdown */}
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="appearance-none pl-4 pr-10 py-3 rounded-xl border-2 border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#8b4fa2] cursor-pointer"
                  >
                    <option value="newest"> Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="title">A to Z</option>
                    <option value="popular"> Most Popular</option>
                  </select>
                  <ArrowUpDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>

                {/* View Toggle */}
                <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-2 rounded-lg transition ${viewMode === "grid" ? "bg-white shadow-md text-[#8b4fa2]" : "text-gray-500"}`}
                  >
                    <Grid3x3 size={18} />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-2 rounded-lg transition ${viewMode === "list" ? "bg-white shadow-md text-[#8b4fa2]" : "text-gray-500"}`}
                  >
                    <List size={18} />
                  </button>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mt-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-xl flex items-center gap-3">
                <AlertCircle className="text-red-500" size={20} />
                <p className="text-red-600 font-medium">{error}</p>
              </div>
            )}

            {/* Loading State */}
            {loading ? (
              <div className="flex flex-col items-center justify-center h-96">
                <div className="w-16 h-16 border-4 border-[#8b4fa2] border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-gray-500">Loading events...</p>
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-96 text-gray-400">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Calendar size={48} className="text-gray-300" />
                </div>
                <p className="text-lg font-semibold text-gray-500">No events found</p>
                <p className="text-sm mt-1">Try adjusting your search</p>
              </div>
            ) : (
              <>
                {/* Results Count */}
                <div className="flex justify-between items-center mt-6 mb-4">
                  <p className="text-sm text-gray-500">
                    Found <span className="font-semibold text-[#8b4fa2]">{filteredEvents.length}</span> events
                  </p>
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <TrendingUp size={12} />
                    <span>Sorted by {sortBy === "newest" ? "newest" : sortBy === "oldest" ? "oldest" : sortBy === "title" ? "title" : "popularity"}</span>
                  </div>
                </div>

                {/* Events Grid/List View */}
                {viewMode === "grid" ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredEvents.map((event) => {
                      const registered = isRegistered(event._id);
                      const isRegistering = registeringId === event._id;
                      const catStyle = getCategoryColor(event.category);
                    const isPast = !isEventUpcoming(event);
                      const daysLeft = getDaysRemaining(event.start_date);

                      return (
                        <div
                          key={event._id}
                          onClick={() => setSelectedEvent(event)}
                          className="group bg-white rounded-xl border-2 border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                        >
                          {/* Image Section */}
                          <div className="relative h-48 overflow-hidden">
                            {event.image_url ? (
                              <img 
                                src={event.image_url} 
                                alt={event.title} 
                                className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: catStyle.bg }}>
                                <span className="text-6xl">{catStyle.icon}</span>
                              </div>
                            )}
                            
                            {/* Category Badge */}
                            {event.category && (
                              <span 
                                className="absolute top-3 left-3 text-xs font-bold px-3 py-1.5 rounded-full shadow-md"
                                style={{ backgroundColor: catStyle.color, color: 'white' }}
                              >
                                {catStyle.icon} {event.category}
                              </span>
                            )}
                            
                            {/* Days Left Badge */}
                            {!isPast && (
                              <span className="absolute top-3 right-3 text-xs font-bold px-3 py-1.5 rounded-full bg-black/70 backdrop-blur-sm text-white">
                                {daysLeft}
                              </span>
                            )}
                          </div>

                          {/* Content Section */}
                          <div className="p-5">
                            <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-1">{event.title}</h3>
                            
                            <div className="space-y-2 text-sm text-gray-500">
                              <div className="flex items-center gap-2">
                                <Calendar size={14} className="text-[#8b4fa2]" />
                                <span>{formatDateShort(event.start_date)}</span>
                              </div>
                              {event.start_time && (
                                <div className="flex items-center gap-2">
                                  <Clock size={14} className="text-[#8b4fa2]" />
                                  <span>{formatTimeWithAMPM(event.start_time)}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-2">
                                <MapPin size={14} className="text-[#8b4fa2]" />
                                <span className="truncate">{event.venue || "TBA"}</span>
                              </div>
                            </div>

                            {/* Register Button */}
                            <button
                              onClick={(e) => !registered && !isPast && openRoleModal(e, event._id)}
                              disabled={registered || isPast || isRegistering}
                              className={`mt-4 w-full py-2.5 rounded-xl text-sm font-bold transition-all duration-200
                                ${registered 
                                  ? "bg-green-50 text-green-600 cursor-not-allowed border border-green-200"
                                  : isPast 
                                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                  : isRegistering 
                                  ? "bg-purple-100 text-[#8b4fa2] cursor-wait"
                                  : "bg-linear-to-r from-[#8b4fa2] to-[#7a3d91] text-white hover:shadow-lg transform hover:scale-105"
                                }`}
                            >
                              {isRegistering ? (
                                <span className="flex items-center justify-center gap-2">
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                  Registering...
                                </span>
                              ) : registered ? (
                                <span className="flex items-center justify-center gap-2">
                                  <CheckCircle size={16} />
                                  Registered
                                </span>
                              ) : isPast ? "Event Ended" : "Register Now"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* List View */
                  <div className="space-y-4">
                    {filteredEvents.map((event) => {
                      const registered = isRegistered(event._id);
                      const catStyle = getCategoryColor(event.category);
                     const isPast = !isEventUpcoming(event)

                      return (
                        <div
                          key={event._id}
                          onClick={() => setSelectedEvent(event)}
                          className="flex items-center gap-4 p-4 bg-white rounded-xl border-2 border-gray-100 hover:shadow-md hover:border-[#8b4fa2]/30 transition-all cursor-pointer"
                        >
                          <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0">
                            {event.image_url ? (
                              <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: catStyle.bg }}>
                                <span className="text-2xl">{catStyle.icon}</span>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-gray-800 mb-1">{event.title}</h3>
                            <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                              <span className="flex items-center gap-1"><Calendar size={12} />{formatDateShort(event.start_date)}</span>
                              {event.start_time && <span className="flex items-center gap-1"><Clock size={12} />{formatTimeWithAMPM(event.start_time)}</span>}
                              <span className="flex items-center gap-1"><MapPin size={12} />{event.venue || "TBA"}</span>
                            </div>
                          </div>
                          <button
                            onClick={(e) => !registered && !isPast && openRoleModal(e, event._id)}
                            disabled={registered || isPast}
                            className={`px-6 py-2 rounded-lg text-sm font-bold transition whitespace-nowrap
                              ${registered ? "bg-green-50 text-green-600" : isPast ? "bg-gray-100 text-gray-400" : "bg-[#8b4fa2] text-white hover:bg-[#7a3d91]"}`}
                          >
                            {registered ? "✓" : isPast ? "Ended" : "Register"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      {/* ===== EVENT DETAIL MODAL ===== */}
      {selectedEvent && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn"
          onClick={() => setSelectedEvent(null)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border-8 border-yellow-400"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Hero Image */}
            <div className="relative h-64">
              {selectedEvent.image_url ? (
                <img 
                  src={selectedEvent.image_url} 
                  alt={selectedEvent.title} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div 
                  className="w-full h-full flex items-center justify-center"
                  style={{ backgroundColor: getCategoryColor(selectedEvent.category).bg }}
                >
                  <span className="text-8xl">{getCategoryColor(selectedEvent.category).icon}</span>
                </div>
              )}
              
              <button 
                onClick={() => setSelectedEvent(null)}
                className="absolute top-4 right-4 w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/70 transition"
              >
                <X size={20} />
              </button>
              
              {selectedEvent.category && (
                <span 
                  className="absolute bottom-4 left-4 text-sm font-bold px-4 py-2 rounded-full shadow-lg"
                  style={{ backgroundColor: getCategoryColor(selectedEvent.category).color, color: 'white' }}
                >
                  {getCategoryColor(selectedEvent.category).icon} {selectedEvent.category}
                </span>
              )}
            </div>

            {/* Content */}
            <div className="p-6 lg:p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">{selectedEvent.title}</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                  <Calendar size={20} className="text-[#8b4fa2] mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-400 font-semibold uppercase">Date</p>
                    <p className="text-sm font-medium text-gray-700">{formatDate(selectedEvent.start_date)}</p>
                  </div>
                </div>

                {selectedEvent.start_time && (
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                    <Clock size={20} className="text-[#8b4fa2] mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-400 font-semibold uppercase">Time</p>
                      <p className="text-sm font-medium text-gray-700">
                        {formatTimeWithAMPM(selectedEvent.start_time)}
                        {selectedEvent.end_time && ` - ${formatTimeWithAMPM(selectedEvent.end_time)}`}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                  <MapPin size={20} className="text-[#8b4fa2] mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-400 font-semibold uppercase">Venue</p>
                    <p className="text-sm font-medium text-gray-700">{selectedEvent.venue || "To be announced"}</p>
                  </div>
                </div>

                {selectedEvent.organizer_id?.name && (
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                    <User size={20} className="text-[#8b4fa2] mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-400 font-semibold uppercase">Organizer</p>
                      <p className="text-sm font-medium text-gray-700">{selectedEvent.organizer_id.name}</p>
                    </div>
                  </div>
                )}
              </div>

              {selectedEvent.description && (
                <div className="mb-6">
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-2">About This Event</p>
                  <p className="text-gray-600 leading-relaxed">{selectedEvent.description}</p>
                </div>
              )}

              <div className="pt-4 border-t border-gray-100">
                {(() => {
                  const registered = isRegistered(selectedEvent._id);
                 const isPast = !isEventUpcoming(selectedEvent);
                  return (
                    <button
                      onClick={(e) => { if (!registered && !isPast) { setSelectedEvent(null); openRoleModal(e, selectedEvent._id); } }}
                      disabled={registered || isPast}
                      className={`w-full py-3 px-6 rounded-xl text-sm font-bold transition-all
                        ${registered 
                          ? "bg-green-500 text-white cursor-not-allowed"
                          : isPast 
                          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                          : "bg-linear-to-r from-[#8b4fa2] to-[#7a3d91] text-white hover:shadow-lg"
                        }`}
                    >
                      {registered ? "✓ Already Registered" : isPast ? "Event Ended" : "Register Now"}
                    </button>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== ROLE SELECTION MODAL ===== */}
      {modalEventId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 border-8 border-yellow-400 animate-slideUp">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-linear-to-br from-[#8b4fa2] to-[#7a3d91] rounded-xl flex items-center justify-center">
                <User size={24} className="text-white" />
              </div>
              <button onClick={() => setModalEventId(null)} className="text-gray-400 hover:text-gray-600 transition">
                <X size={22} />
              </button>
            </div>

            <h3 className="text-xl font-bold text-gray-800 mb-2">Join as?</h3>
            <p className="text-gray-500 text-sm mb-6">Choose your role for this event</p>

            <div className="space-y-3 mb-6">
              {["Student", "Volunteer"].map((role) => (
                <button
                  key={role}
                  onClick={() => setSelectedRole(role)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200
                    ${selectedRole === role 
                      ? "border-[#8b4fa2] bg-purple-50" 
                      : "border-gray-200 hover:border-purple-200 hover:bg-gray-50"
                    }`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all
                    ${selectedRole === role ? "bg-[#8b4fa2] text-white" : "bg-gray-100 text-gray-500"}`}>
                    <span className="text-2xl">{role === "Student" ? "👨‍🎓" : "🤝"}</span>
                  </div>
                  <div className="flex-1 text-left">
                    <p className={`font-bold ${selectedRole === role ? "text-[#8b4fa2]" : "text-gray-700"}`}>{role}</p>
                    <p className="text-xs text-gray-400">
                      {role === "Student" ? "Attend as a participant" : "Help organize & manage the event"}
                    </p>
                  </div>
                  {selectedRole === role && (
                    <CheckCircle size={20} className="text-[#8b4fa2]" />
                  )}
                </button>
              ))}
            </div>

            <button
              onClick={handleRegister}
              className="w-full py-3 rounded-xl bg-linear-to-r from-[#8b4fa2] to-[#7a3d91] text-white font-bold hover:shadow-lg transition-all"
            >
              Confirm Registration
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BrowseEvents;