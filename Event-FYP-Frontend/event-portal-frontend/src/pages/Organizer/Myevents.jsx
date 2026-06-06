import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import OrganizerSidebar from "../../components/OrganizerSidebar";
import { useAuth } from "../../context/AuthContext";

const MyEvents = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

 const { token } = useAuth();

  const fetchEvents = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/organizers/my-events", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEvents(res.data.events || []);
    } catch (err) {
      setError("Failed to load events.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this event?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/events/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEvents(events.filter((e) => e._id !== id));
    } catch (err) {
      alert(err?.response?.data?.message || "Delete failed.");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Upcoming": return "bg-blue-100 text-blue-600";
      case "Ongoing": return "bg-green-100 text-green-600";
      case "Completed": return "bg-gray-100 text-gray-600";
      case "Cancelled": return "bg-red-100 text-red-500";
      default: return "bg-gray-100 text-gray-500";
    }
  };

  const getApprovalBadge = (approved) => {
    return approved
      ? "bg-green-100 text-green-600"
      : "bg-yellow-100 text-yellow-600";
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

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <p className="text-[#8b4fa2] font-bold text-xl animate-pulse">Loading Events...</p>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#f8f3fd] font-sans text-[#1A1A1A]">
      <OrganizerSidebar />

      <main className="md:ml-64 flex-1 pb-20 px-6 md:px-10 pt-10">
        <div className="max-w-6xl mx-auto">

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
            <div>
              <h1 className="text-4xl font-extrabold">
                My <span className="text-[#8b4fa2]">Events</span>
              </h1>
              <p className="text-gray-400 text-sm mt-1">Manage and track all your created events</p>
              <div className="w-20 h-1 bg-linear-to-r from-[#8b4fa2] to-[#4ECDC4] rounded-full mt-3" />
            </div>
            <button
              onClick={() => navigate("/organizer/create-event")}
              className="px-6 py-3 bg-[#8b4fa2] hover:bg-[#724286] text-white font-bold rounded-xl transition shadow-md self-start md:self-auto"
            >
              + Create New Event
            </button>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-xl text-red-600 font-semibold text-sm">
              {error}
            </div>
          )}

          {events.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <span className="text-6xl mb-4">📭</span>
              <h3 className="text-xl font-bold text-gray-500">No events yet</h3>
              <p className="text-gray-400 text-sm mt-2">Create your first event to get started!</p>
              <button
                onClick={() => navigate("/organizer/create-event")}
                className="mt-6 px-6 py-3 bg-[#8b4fa2] hover:bg-[#724286] text-white font-bold rounded-xl transition"
              >
                Create Event
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <div
                  key={event._id}
                  className="bg-white border-2 border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition overflow-hidden flex flex-col"
                >
                  {/* Event Image */}
                  {event.image_url ? (
                    <img src={event.image_url} alt={event.title} className="w-full h-44 object-cover" />
                  ) : (
                    
                    <div className="w-full h-44 bg-linear-to-br from-[#F3E5FF] to-[#E5F9F7] flex items-center justify-center">
                      <span className="text-4xl">🎉</span>
                    </div>
                  )}

                  {/* Card Body */}
                  <div className="p-5 flex flex-col flex-1">

                    {/* Badges */}
                    <div className="flex gap-2 mb-3 flex-wrap">
                      <span className={`text-xs font-bold px-3 py-1 rounded-full ${getStatusColor(event.status)}`}>
                        {event.status}
                      </span>
                      <span className={`text-xs font-bold px-3 py-1 rounded-full ${getApprovalBadge(event.approved)}`}>
                        {event.approved ? "Approved" : "Pending Approval"}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-extrabold text-[#1A1A1A] mb-1 line-clamp-1">
                      {event.title}
                    </h3>

                    {/* Description */}
                    <p className="text-gray-500 text-sm line-clamp-2 mb-4">
                      {event.description || "No description provided."}
                    </p>

                    {/* Details */}
                    <div className="space-y-1 text-xs text-gray-500 mb-4">
                      <p><span className="font-semibold text-gray-700">Venue:</span> {event.venue || "—"}</p>
                      <p><span className="font-semibold text-gray-700">Start:</span> {new Date(event.start_date).toLocaleDateString()} {formatTimeWithAMPM(event.start_time)}</p>
                      <p><span className="font-semibold text-gray-700">End:</span> {new Date(event.end_date).toLocaleDateString()} {formatTimeWithAMPM(event.end_time)}</p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 mt-auto flex-wrap">
                      <button
                        onClick={() => navigate(`/organizer/attendance/${event._id}`)}
                        className="flex-1 py-2 border-2 border-[#4ECDC4] text-[#4ECDC4] font-bold rounded-xl hover:bg-[#4ECDC4] hover:text-white transition text-sm"
                      >
                        Attendance
                      </button>
                      <button
                        onClick={() => navigate(`/organizer/edit-event/${event._id}`, { state: { event } })}
                        className="flex-1 py-2 border-2 border-[#8b4fa2] text-[#8b4fa2] font-bold rounded-xl hover:bg-[#8b4fa2] hover:text-white transition text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(event._id)}
                        className="flex-1 py-2 border-2 border-red-400 text-red-400 font-bold rounded-xl hover:bg-red-400 hover:text-white transition text-sm"
                      >
                        Delete
                      </button>
                    </div>

                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default MyEvents;