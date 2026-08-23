import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import OrganizerSidebar from "../../components/OrganizerSidebar";
import { useAuth } from "../../context/AuthContext";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  PlusCircle, 
  Edit2, 
  Trash2, 
  Users, 
  AlertCircle,
  CheckCircle,
  XCircle,
  ImageIcon,
  Filter,
  Grid3x3,
  List,
  Search,
  Eye,
  X
} from "lucide-react";

// ✅ API URL from env
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const MyEvents = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteId, setDeleteId] = useState(null);
  const [activeFilter, setActiveFilter] = useState("all"); // all, approved, pending
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("grid"); // grid, list
  
  //  State for custom delete confirmation modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);

  const { token } = useAuth();

  const fetchEvents = async () => {
    try {
      const res = await axios.get(`${API_URL}/organizers/my-events`, {
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
     if (!token) return; 
    fetchEvents();
  }, [token]);

  // Apply filters whenever events, activeFilter, or searchTerm changes
  useEffect(() => {
    let filtered = [...events];

    // Filter by approval status
    if (activeFilter === "approved") {
      filtered = filtered.filter(event => event.approved === true);
    } else if (activeFilter === "pending") {
      filtered = filtered.filter(event => event.approved === false);
    }

    // Filter by search term
    if (searchTerm.trim()) {
      filtered = filtered.filter(event => 
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.venue?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredEvents(filtered);
  }, [events, activeFilter, searchTerm]);

  // ✅ Updated delete handler - shows custom modal instead of window.confirm
  const handleDeleteClick = (event) => {
    setEventToDelete(event);
    setShowDeleteModal(true);
  };

  // ✅ Confirm delete handler
  const handleConfirmDelete = async () => {
    if (!eventToDelete) return;
    
    setDeleteId(eventToDelete._id);
    setShowDeleteModal(false);
    
    try {
      await axios.delete(`${API_URL}/events/${eventToDelete._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEvents(events.filter((e) => e._id !== eventToDelete._id));
    } catch (err) {
      alert(err?.response?.data?.message || "Delete failed.");
    } finally {
      setDeleteId(null);
      setEventToDelete(null);
    }
  };

  // ✅ Cancel delete handler
  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setEventToDelete(null);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Upcoming": return "bg-blue-100 text-blue-700";
      case "Ongoing": return "bg-green-100 text-green-700";
      case "Completed": return "bg-gray-100 text-gray-700";
      case "Cancelled": return "bg-red-100 text-red-600";
      default: return "bg-gray-100 text-gray-500";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Upcoming": return <Calendar size={12} />;
      case "Ongoing": return <Clock size={12} />;
      case "Completed": return <CheckCircle size={12} />;
      case "Cancelled": return <XCircle size={12} />;
      default: return <AlertCircle size={12} />;
    }
  };

  const formatTimeWithAMPM = (timeString) => {
    if (!timeString) return "";
    
    if (typeof timeString === 'string' && timeString.match(/^([01]\d|2[0-3]):([0-5]\d)$/)) {
      let [hours, minutes] = timeString.split(':');
      hours = parseInt(hours);
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const hours12 = hours % 12 || 12;
      return `${hours12}:${minutes} ${ampm}`;
    }
    
    return timeString;
  };

  // Stats
  const totalEvents = events.length;
  const approvedEvents = events.filter(e => e.approved === true).length;
  const pendingEvents = events.filter(e => e.approved === false).length;

  if (loading) return (
    <div className="flex min-h-screen bg-linear-to-br from-purple-50 via-white to-gray-50">
      <OrganizerSidebar />
      <div className="flex-1 md:ml-64 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#8b4fa2] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 font-medium">Loading your events...</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-linear-to-br from-purple-50 via-white to-gray-50">
      <OrganizerSidebar />

      <main className="md:ml-64 flex-1 pb-20 px-6 md:px-10 pt-10">
        <div className="max-w-7xl mx-auto">

          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h1 className="text-4xl lg:text-5xl font-bold text-gray-800">
                  My <span className="text-[#8b4fa2]">Events</span>
                </h1>
                <p className="text-gray-500 mt-2">Manage and track all your created events</p>
                <div className="w-20 h-1 bg-[#8b4fa2] rounded-full mt-3"></div>
              </div>
              
              <button
                onClick={() => navigate("/organizer/create-event")}
                className="px-6 py-3 bg-[#8b4fa2] hover:bg-[#6b3d7a] text-white font-semibold rounded-xl transition-all duration-300 flex items-center gap-2 shadow-md hover:shadow-lg"
              >
                <PlusCircle size={18} />
                Create New Event
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-xl p-4 border-l-4 border-[#8b4fa2] shadow-sm">
              <p className="text-gray-500 text-sm">Total Events</p>
              <p className="text-3xl font-bold text-gray-800">{totalEvents}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border-l-4 border-green-500 shadow-sm">
              <p className="text-gray-500 text-sm">Approved Events</p>
              <p className="text-3xl font-bold text-green-600">{approvedEvents}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border-l-4 border-yellow-500 shadow-sm">
              <p className="text-gray-500 text-sm">Pending Approval</p>
              <p className="text-3xl font-bold text-yellow-600">{pendingEvents}</p>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              
              {/* Filter Tabs */}
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveFilter("all")}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                    activeFilter === "all" 
                      ? "bg-[#8b4fa2] text-white shadow-md" 
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  <Eye size={16} />
                  All Events
                </button>
                <button
                  onClick={() => setActiveFilter("approved")}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                    activeFilter === "approved" 
                      ? "bg-green-500 text-white shadow-md" 
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  <CheckCircle size={16} />
                  Approved
                </button>
                <button
                  onClick={() => setActiveFilter("pending")}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                    activeFilter === "pending" 
                      ? "bg-yellow-500 text-white shadow-md" 
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  <AlertCircle size={16} />
                  Pending
                </button>
              </div>

              {/* Search and View Toggle */}
              <div className="flex items-center gap-3">
                {/* Search Box */}
                <div className="relative">
                  <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search events..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8b4fa2] w-48 md:w-64"
                  />
                </div>

                {/* View Mode Toggle */}
                <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-2 rounded-md transition-all duration-200 ${
                      viewMode === "grid" ? "bg-white shadow-sm text-[#8b4fa2]" : "text-gray-500"
                    }`}
                  >
                    <Grid3x3 size={18} />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-2 rounded-md transition-all duration-200 ${
                      viewMode === "list" ? "bg-white shadow-sm text-[#8b4fa2]" : "text-gray-500"
                    }`}
                  >
                    <List size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-xl flex items-center gap-3">
              <AlertCircle className="text-red-500" size={20} />
              <p className="text-red-600 font-medium">{error}</p>
            </div>
          )}

          {/* Empty State */}
          {filteredEvents.length === 0 ? (
            <div className="bg-white rounded-2xl border-8 border-yellow-400 shadow-xl p-12 text-center">
              <div className="w-24 h-24 bg-[#f3e8ff] rounded-full flex items-center justify-center mx-auto mb-6">
                <Calendar size={48} className="text-[#8b4fa2]" />
              </div>
              <h3 className="text-2xl font-bold text-gray-600 mb-2">
                {events.length === 0 ? "No Events Yet" : "No matching events found"}
              </h3>
              <p className="text-gray-400 mb-6">
                {events.length === 0 
                  ? "Create your first event to get started!" 
                  : "Try adjusting your filters or search term"}
              </p>
              {events.length === 0 && (
                <button
                  onClick={() => navigate("/organizer/create-event")}
                  className="px-6 py-3 bg-[#8b4fa2] hover:bg-[#6b3d7a] text-white font-semibold rounded-xl transition-all duration-300 flex items-center gap-2 mx-auto"
                >
                  <PlusCircle size={18} />
                  Create Event
                </button>
              )}
            </div>
          ) : viewMode === "grid" ? (
            /* Grid View */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map((event) => (
                <div
                  key={event._id}
                  className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col hover:-translate-y-1"
                >
                  {/* Event Image */}
                  <div className="relative h-48 overflow-hidden bg-linear-to-br from-purple-100 to-purple-50">
                    {event.image_url ? (
                      <img 
                        src={event.image_url} 
                        alt={event.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon size={48} className="text-[#8b4fa2] opacity-40" />
                      </div>
                    )}
                    
                    {/* Status Badge */}
                    <div className="absolute top-3 left-3">
                      <span className={`text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1 ${getStatusColor(event.status)} shadow-sm`}>
                        {getStatusIcon(event.status)}
                        {event.status}
                      </span>
                    </div>
                    
                    {/* Approval Badge */}
                    <div className="absolute top-3 right-3">
                      <span className={`text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1 ${
                        event.approved 
                          ? "bg-green-100 text-green-700" 
                          : "bg-yellow-100 text-yellow-700"
                      } shadow-sm`}>
                        {event.approved ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
                        {event.approved ? "Approved" : "Pending"}
                      </span>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-5 flex flex-col flex-1">
                    
                    <h3 className="text-xl font-bold text-gray-800 mb-2 line-clamp-1">
                      {event.title}
                    </h3>

                    <p className="text-gray-500 text-sm line-clamp-2 mb-4">
                      {event.description || "No description provided."}
                    </p>

                    <div className="space-y-2.5 mb-5">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin size="16" className="text-[#8b4fa2] shrink-0" />
                        <span className="truncate">{event.venue || "Venue not specified"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar size="16" className="text-[#8b4fa2] shrink-0" />
                        <span>{new Date(event.start_date).toLocaleDateString()} at {formatTimeWithAMPM(event.start_time)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock size="16" className="text-[#8b4fa2] shrink-0" />
                        <span>{new Date(event.end_date).toLocaleDateString()} at {formatTimeWithAMPM(event.end_time)}</span>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-auto">
                      <button
                        onClick={() => navigate(`/organizer/attendance/${event._id}`)}
                        className="flex-1 py-2.5 bg-teal-50 hover:bg-teal-600 text-teal-600 hover:text-white font-semibold rounded-xl transition-all duration-300 text-sm flex items-center justify-center gap-2"
                      >
                        <Users size="14" />
                        Attendance
                      </button>
                      <button
                        onClick={() => navigate(`/organizer/edit-event/${event._id}`, { state: { event } })}
                        className="flex-1 py-2.5 bg-purple-50 hover:bg-[#8b4fa2] text-[#8b4fa2] hover:text-white font-semibold rounded-xl transition-all duration-300 text-sm flex items-center justify-center gap-2"
                      >
                        <Edit2 size="14" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteClick(event)} // ✅ Updated to use custom modal
                        disabled={deleteId === event._id}
                        className="flex-1 py-2.5 bg-red-50 hover:bg-red-500 text-red-500 hover:text-white font-semibold rounded-xl transition-all duration-300 text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {deleteId === event._id ? (
                          <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <Trash2 size="14" />
                        )}
                        Delete
                      </button>
                    </div>

                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* List View */
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="divide-y divide-gray-100">
                {filteredEvents.map((event) => (
                  <div key={event._id} className="p-5 hover:bg-gray-50 transition-all duration-200">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      
                      {/* Image Thumbnail */}
                      <div className="w-full md:w-32 h-24 rounded-lg overflow-hidden bg-linear-to-br from-purple-100 to-purple-50 shrink-0">
                        {event.image_url ? (
                          <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon size={24} className="text-[#8b4fa2] opacity-40" />
                          </div>
                        )}
                      </div>

                      {/* Event Info */}
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h3 className="text-lg font-bold text-gray-800">{event.title}</h3>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${getStatusColor(event.status)}`}>
                            {getStatusIcon(event.status)}
                            {event.status}
                          </span>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                            event.approved ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                          }`}>
                            {event.approved ? <CheckCircle size={10} /> : <AlertCircle size={10} />}
                            {event.approved ? "Approved" : "Pending"}
                          </span>
                        </div>
                        
                        <p className="text-gray-500 text-sm line-clamp-1 mb-2">
                          {event.description || "No description provided."}
                        </p>
                        
                        <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1"><MapPin size={12} /> {event.venue || "—"}</span>
                          <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(event.start_date).toLocaleDateString()}</span>
                          <span className="flex items-center gap-1"><Clock size={12} /> {formatTimeWithAMPM(event.start_time)}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => navigate(`/organizer/attendance/${event._id}`)}
                          className="px-4 py-2 bg-teal-50 hover:bg-teal-600 text-teal-600 hover:text-white font-semibold rounded-xl transition-all duration-300 text-sm flex items-center gap-1"
                        >
                          <Users size="14" /> 
                          <span className="hidden sm:inline">Attendance</span>
                        </button>
                        <button
                          onClick={() => navigate(`/organizer/edit-event/${event._id}`, { state: { event } })}
                          className="px-4 py-2 bg-purple-50 hover:bg-[#8b4fa2] text-[#8b4fa2] hover:text-white font-semibold rounded-xl transition-all duration-300 text-sm flex items-center gap-1"
                        >
                          <Edit2 size="14" />
                          <span className="hidden sm:inline">Edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteClick(event)} // ✅ Updated to use custom modal
                          disabled={deleteId === event._id}
                          className="px-4 py-2 bg-red-50 hover:bg-red-500 text-red-500 hover:text-white font-semibold rounded-xl transition-all duration-300 text-sm flex items-center gap-1 disabled:opacity-50"
                        >
                          {deleteId === event._id ? (
                            <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <Trash2 size="14" />
                          )}
                          <span className="hidden sm:inline">Delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ✅ Custom Delete Confirmation Modal */}
      {showDeleteModal && eventToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleCancelDelete}
          ></div>
          
          {/* Modal */}
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            <button
              onClick={handleCancelDelete}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>
            
            <div className="text-center">
              {/* Icon */}
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={32} className="text-red-600" />
              </div>
              
              {/* Title */}
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                Delete Event?
              </h3>
              
              {/* Description */}
              <p className="text-gray-500 mb-6">
                Are you sure you want to delete <strong className="text-gray-700">"{eventToDelete.title}"</strong>? 
                <br />
                <span className="text-sm text-red-500">This action cannot be undone.</span>
              </p>
              
              {/* Event Details Preview */}
              <div className="bg-gray-50 rounded-lg p-3 mb-6 text-left text-sm">
                <p className="text-gray-600">
                  <span className="font-medium">Date:</span> {new Date(eventToDelete.start_date).toLocaleDateString()}
                </p>
                <p className="text-gray-600">
                  <span className="font-medium">Venue:</span> {eventToDelete.venue || "Not specified"}
                </p>
                <p className="text-gray-600">
                  <span className="font-medium">Status:</span> 
                  <span className={`ml-1 ${eventToDelete.approved ? "text-green-600" : "text-yellow-600"}`}>
                    {eventToDelete.approved ? "Approved" : "Pending"}
                  </span>
                </p>
              </div>
              
              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleCancelDelete}
                  className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all duration-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <Trash2 size={16} />
                  Delete Event
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyEvents;