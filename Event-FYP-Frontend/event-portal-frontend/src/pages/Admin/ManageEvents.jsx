import React, { useEffect, useState } from "react";
import AdminSidebar from "../../components/AdminSidebar";
import axios from "axios";
import {useAuth} from "../../context/AuthContext";

const ManageEvents = () => {
const { token } = useAuth();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [actioningId, setActioningId] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setError("");
      const res = await axios.get("http://localhost:5000/api/events/all", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const list = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.events)
        ? res.data.events
        : [];
      setEvents(list);
    } catch (err) {
      console.error(err);
      setError("Failed to load events.");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (eventId, approved) => {
    try {
      setActioningId(eventId);
      
      const response = await axios.put(
        `http://localhost:5000/api/events/${eventId}/approve`,
        { approved },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log("API Response:", response.data);
      
      const message = approved ? "Event approved successfully!" : "Event rejected successfully!";
      setActionMessage({ type: "success", text: message });
      setTimeout(() => setActionMessage(null), 3000);
      
      setEvents((prev) =>
        prev.map((e) => (e._id === eventId ? { ...e, approved } : e))
      );
      
      if (selectedEvent?._id === eventId) {
        setSelectedEvent((prev) => ({ ...prev, approved }));
      }
      
    } catch (err) {
      console.error("API Error:", err);
      const errorMsg = err.response?.data?.message || "Action failed. Please try again.";
      setActionMessage({ type: "error", text: errorMsg });
      setTimeout(() => setActionMessage(null), 3000);
    } finally {
      setActioningId(null);
    }
  };

  const tabs = [
    { key: "all", label: "All Events", count: events.length },
    { key: "pending", label: "Pending", count: events.filter((e) => !e.approved).length },
    { key: "approved", label: "Approved", count: events.filter((e) => e.approved).length },
  ];

  const filtered = events.filter((e) => {
    const matchTab =
      activeTab === "all" ||
      (activeTab === "pending" && !e.approved) ||
      (activeTab === "approved" && e.approved);
    const matchSearch =
      e.title?.toLowerCase().includes(search.toLowerCase()) ||
      e.venue?.toLowerCase().includes(search.toLowerCase()) ||
      e.organizer_id?.name?.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const formatDate = (d) => {
    if (!d) return "TBA";
    return new Date(d).toLocaleDateString("en-PK", {
      day: "numeric", month: "short", year: "numeric",
    });
  };

  // ✅ FIXED - Added quotes around "numeric"
  const formatDateLong = (d) => {
    if (!d) return "TBA";
    return new Date(d).toLocaleDateString("en-PK", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    });
  };

  // Helper function to convert time to AM/PM format
  const formatTimeWithAMPM = (timeString) => {
    if (!timeString) return "";
    
    // If time is already in HH:MM format (24-hour)
    if (typeof timeString === 'string' && timeString.match(/^([01]\d|2[0-3]):([0-5]\d)$/)) {
      let [hours, minutes] = timeString.split(':');
      hours = parseInt(hours);
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const hours12 = hours % 12 || 12;
      return `${hours12}:${minutes} ${ampm}`;
    }
    
    // If time is already in 12-hour format, just add AM/PM if missing
    if (typeof timeString === 'string' && !timeString.includes('AM') && !timeString.includes('PM')) {
      return `${timeString} ${timeString.includes('12') ? 'PM' : 'AM'}`; // Simple fallback
    }
    
    return timeString;
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />

      <main className="flex-1 md:ml-64 p-6 pb-24 md:pb-6">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Manage Events</h1>
          <p className="text-sm text-gray-400 mt-1">Review and approve or reject submitted events</p>
        </div>

        {/* Toast Message */}
        {actionMessage && (
          <div className={`mb-4 p-3 rounded-xl text-sm font-semibold ${
            actionMessage.type === "success" 
              ? "bg-green-100 text-green-700" 
              : "bg-red-100 text-red-700"
          }`}>
            {actionMessage.text}
          </div>
        )}

        {/* Tabs + Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex gap-2 flex-wrap">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-150
                  ${activeTab === tab.key
                    ? "bg-[#8b4fa2] text-white shadow-sm shadow-purple-200"
                    : "bg-white text-gray-500 border border-gray-100 hover:border-purple-200 hover:text-[#8b4fa2]"
                  }`}
              >
                {tab.label}
                <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full
                  ${activeTab === tab.key ? "bg-white/20 text-white" : "bg-gray-100 text-gray-400"}`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-72">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-[20px]">search</span>
            <input
              type="text"
              placeholder="Search events..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#8b4fa2] focus:border-transparent shadow-sm"
            />
          </div>
        </div>

        {error && <p className="text-red-500 font-semibold mb-4">{error}</p>}

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-10 h-10 border-4 border-[#8b4fa2] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <span className="material-symbols-outlined text-[48px] mb-3">event_busy</span>
            <p className="text-sm font-semibold">No events found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((event) => {
              const isPending = !event.approved;
              const isActioning = actioningId === event._id;

              return (
                <div
                  key={event._id}
                  onClick={() => setSelectedEvent(event)}
                  className="group bg-white rounded-2xl border border-gray-100 overflow-hidden flex flex-col hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                >
                  <div className="relative">
                    {event.image_url ? (
                      <img
                        src={event.image_url}
                        alt={event.title}
                        className="h-44 w-full object-cover group-hover:scale-105 transition duration-300"
                      />
                    ) : (
                      <div className="h-44 w-full flex items-center justify-center bg-[#f5eefa]">
                        <span className="material-symbols-outlined text-[56px] text-[#8b4fa2]" style={{ fontVariationSettings: "'FILL' 1" }}>
                          event
                        </span>
                      </div>
                    )}

                    <span className={`absolute top-3 right-3 text-[11px] font-bold px-3 py-1 rounded-full shadow-sm
                      ${event.approved ? "bg-green-100 text-green-600" : "bg-amber-100 text-amber-600"}`}>
                      {event.approved ? "Approved" : "Pending"}
                    </span>
                  </div>

                  <div className="p-5 flex flex-col flex-1 justify-between">
                    <div>
                      <h2 className="text-base font-bold text-gray-800 mb-2 line-clamp-2">{event.title}</h2>
                      <div className="space-y-1.5 text-xs text-gray-500 mb-4">
                        <p className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[14px] text-[#8b4fa2]">calendar_month</span>
                          {formatDate(event.start_date)}
                        </p>
                        <p className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[14px] text-[#8b4fa2]">location_on</span>
                          {event.venue || "TBA"}
                        </p>
                        {event.organizer_id?.name && (
                          <p className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-[14px] text-[#8b4fa2]">person</span>
                            {event.organizer_id.name}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                      {isPending ? (
                        <>
                          <button
                            onClick={() => handleApprove(event._id, true)}
                            disabled={isActioning}
                            className="flex-1 py-2 rounded-xl text-sm font-bold bg-[#8b4fa2] text-white hover:bg-[#7a3d91] transition-all disabled:opacity-50 shadow-sm shadow-purple-200"
                          >
                            {isActioning ? (
                              <span className="flex items-center justify-center gap-1">
                                <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                              </span>
                            ) : (
                              <span className="flex items-center justify-center gap-1">
                                <span className="material-symbols-outlined text-[15px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                                Approve
                              </span>
                            )}
                          </button>
                          <button
                            onClick={() => handleApprove(event._id, false)}
                            disabled={isActioning}
                            className="flex-1 py-2 rounded-xl text-sm font-bold bg-red-50 text-red-500 hover:bg-red-100 transition-all disabled:opacity-50"
                          >
                            <span className="flex items-center justify-center gap-1">
                              <span className="material-symbols-outlined text-[15px]" style={{ fontVariationSettings: "'FILL' 1" }}>cancel</span>
                              Reject
                            </span>
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleApprove(event._id, false)}
                          disabled={isActioning}
                          className="w-full py-2 rounded-xl text-sm font-bold bg-gray-50 text-gray-500 hover:bg-red-50 hover:text-red-500 transition-all border border-gray-100"
                        >
                          <span className="flex items-center justify-center gap-1">
                            <span className="material-symbols-outlined text-[15px]">block</span>
                            Revoke Approval
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
          onClick={() => setSelectedEvent(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {selectedEvent.image_url ? (
              <img src={selectedEvent.image_url} alt={selectedEvent.title} className="w-full h-52 object-cover rounded-t-2xl" />
            ) : (
              <div className="w-full h-52 flex items-center justify-center rounded-t-2xl bg-[#f5eefa]">
                <span className="material-symbols-outlined text-[72px] text-[#8b4fa2]" style={{ fontVariationSettings: "'FILL' 1" }}>event</span>
              </div>
            )}

            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className={`text-[11px] font-bold px-3 py-1 rounded-full
                  ${selectedEvent.approved ? "bg-green-100 text-green-600" : "bg-amber-100 text-amber-600"}`}>
                  {selectedEvent.approved ? "Approved" : "Pending Approval"}
                </span>
                <button onClick={() => setSelectedEvent(null)} className="text-gray-400 hover:text-gray-600 transition">
                  <span className="material-symbols-outlined text-[22px]">close</span>
                </button>
              </div>

              <h2 className="text-xl font-bold text-gray-800 mb-5">{selectedEvent.title}</h2>

              <div className="space-y-3 mb-5">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-[18px] text-[#8b4fa2] mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>calendar_month</span>
                  <div>
                    <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Date</p>
                    <p className="text-sm text-gray-700 font-medium">
                      {formatDateLong(selectedEvent.start_date)}
                      {selectedEvent.end_date && selectedEvent.end_date !== selectedEvent.start_date &&
                        ` — ${formatDateLong(selectedEvent.end_date)}`}
                    </p>
                  </div>
                </div>

                {selectedEvent.start_time && (
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-[18px] text-[#8b4fa2] mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>schedule</span>
                    <div>
                      <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Time</p>
                      <p className="text-sm text-gray-700 font-medium">
                        {formatTimeWithAMPM(selectedEvent.start_time)} {selectedEvent.end_time ? `— ${formatTimeWithAMPM(selectedEvent.end_time)}` : ""}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-[18px] text-[#8b4fa2] mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>location_on</span>
                  <div>
                    <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Venue</p>
                    <p className="text-sm text-gray-700 font-medium">{selectedEvent.venue || "TBA"}</p>
                  </div>
                </div>

                {selectedEvent.organizer_id?.name && (
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-[18px] text-[#8b4fa2] mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
                    <div>
                      <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Organizer</p>
                      <p className="text-sm text-gray-700 font-medium">{selectedEvent.organizer_id.name}</p>
                    </div>
                  </div>
                )}
              </div>

              {selectedEvent.description && (
                <div className="mb-6">
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-2">Description</p>
                  <p className="text-sm text-gray-600 leading-relaxed">{selectedEvent.description}</p>
                </div>
              )}

              <div className="flex gap-3">
                {!selectedEvent.approved ? (
                  <>
                    <button
                      onClick={() => handleApprove(selectedEvent._id, true)}
                      disabled={actioningId === selectedEvent._id}
                      className="flex-1 py-3 rounded-xl text-sm font-bold bg-[#8b4fa2] text-white hover:bg-[#7a3d91] transition-all shadow-md shadow-purple-200 disabled:opacity-50"
                    >
                      <span className="flex items-center justify-center gap-2">
                        <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                        Approve Event
                      </span>
                    </button>
                    <button
                      onClick={() => handleApprove(selectedEvent._id, false)}
                      disabled={actioningId === selectedEvent._id}
                      className="flex-1 py-3 rounded-xl text-sm font-bold bg-red-50 text-red-500 hover:bg-red-100 transition-all disabled:opacity-50"
                    >
                      <span className="flex items-center justify-center gap-2">
                        <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>cancel</span>
                        Reject Event
                      </span>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleApprove(selectedEvent._id, false)}
                    disabled={actioningId === selectedEvent._id}
                    className="w-full py-3 rounded-xl text-sm font-bold bg-gray-50 text-gray-500 hover:bg-red-50 hover:text-red-500 transition-all border border-gray-100"
                  >
                    <span className="flex items-center justify-center gap-2">
                      <span className="material-symbols-outlined text-[16px]">block</span>
                      Revoke Approval
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageEvents;