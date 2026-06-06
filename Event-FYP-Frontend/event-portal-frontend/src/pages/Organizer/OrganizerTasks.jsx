import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import OrganizerSidebar from "../../components/OrganizerSidebar";
import { useAuth } from "../../context/AuthContext";
import { Calendar, CheckCircle, Clock, Plus, Trash2, Users, ListTodo, AlertCircle, Sparkles, UserCheck } from "lucide-react";

const OrganizerTasks = () => {
  const { token } = useAuth();
  
  // ✅ API URL from env
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [volunteers, setVolunteers] = useState([]);
  const [tasks, setTasks] = useState([]);

  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    assigned_to: "",
  });

  const selectedEvent = useMemo(
    () => events.find((event) => event._id === selectedEventId),
    [events, selectedEventId]
  );

  const getTaskStatusClass = (status) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-700 border-green-200";
      case "In Progress":
        return "bg-blue-100 text-blue-700 border-blue-200";
      default:
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
    }
  };

  const getTaskStatusIcon = (status) => {
    switch (status) {
      case "Completed":
        return <CheckCircle size={14} />;
      case "In Progress":
        return <Clock size={14} />;
      default:
        return <AlertCircle size={14} />;
    }
  };

  const fetchEvents = async () => {
    setLoadingEvents(true);
    setError("");
    try {
      // ✅ Use API_URL
      const res = await axios.get(`${API_URL}/organizers/my-events`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const myEvents = res.data?.events || [];
      setEvents(myEvents);
      if (myEvents.length > 0) {
        setSelectedEventId(myEvents[0]._id);
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load your events.");
    } finally {
      setLoadingEvents(false);
    }
  };

  const fetchTasksAndVolunteers = async (eventId) => {
    if (!eventId) return;
    setLoadingData(true);
    setError("");
    try {
      // ✅ Use API_URL
      const [tasksRes, registrationsRes] = await Promise.all([
        axios.get(`${API_URL}/tasks/event/${eventId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API_URL}/registrations/events/${eventId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setTasks(tasksRes.data || []);

      const allRegistrations = registrationsRes.data?.data || [];
      const volunteerRegistrations = allRegistrations.filter(
        (registration) => registration.role === "Volunteer"
      );
      setVolunteers(volunteerRegistrations);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load tasks data.");
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    fetchTasksAndVolunteers(selectedEventId);
  }, [selectedEventId]);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!selectedEventId) return setError("Please select an event.");
    if (!formData.title.trim()) return setError("Task title is required.");
    if (!formData.assigned_to) return setError("Please assign a volunteer.");

    setSubmitting(true);
    try {
      // ✅ Use API_URL
      await axios.post(
        `${API_URL}/tasks`,
        {
          event_id: selectedEventId,
          title: formData.title.trim(),
          description: formData.description.trim(),
          assigned_to: formData.assigned_to,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setSuccess("Task created successfully.");
      setFormData({ title: "", description: "", assigned_to: "" });
      fetchTasksAndVolunteers(selectedEventId);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to create task.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    setError("");
    setSuccess("");
    try {
      // ✅ Use API_URL
      await axios.delete(`${API_URL}/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTasks((prev) => prev.filter((task) => task._id !== taskId));
      setSuccess("Task deleted successfully.");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to delete task.");
    }
  };

  if (loadingEvents) {
    return (
      <div className="flex min-h-screen bg-linear-to-br from-purple-50 via-white to-gray-50">
        <OrganizerSidebar />
        <div className="flex-1 md:ml-64 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-[#8b4fa2] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500 font-medium">Loading tasks...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-linear-to-br from-purple-50 via-white to-gray-50">
      <OrganizerSidebar />

      <main className="flex-1 md:ml-64 p-6 lg:p-8 pb-20">
        <div className="max-w-7xl mx-auto">
          
          {/* Yellow Border Card */}
          <div className="border-8 border-yellow-400 rounded-2xl bg-white shadow-lg overflow-hidden">
            <div className="p-6 lg:p-8">
              
              {/* Header */}
              <div className="mb-10 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-linear-to-br from-[#8b4fa2] to-[#4ECDC4] rounded-2xl shadow-lg mb-4">
                  <ListTodo size={32} className="text-white" />
                </div>
                <h1 className="text-3xl lg:text-5xl font-extrabold">
                  Manage <span className="text-[#8b4fa2]">Tasks</span>
                </h1>
                <p className="text-gray-600 text-lg mt-2">
                  Create, assign, and track volunteer tasks for your events
                </p>
              </div>

              {/* Error/Success Messages */}
              {error && (
                <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-xl flex items-center gap-3">
                  <AlertCircle className="text-red-500" size={20} />
                  <p className="text-red-600 font-medium">{error}</p>
                </div>
              )}
              {success && (
                <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded-xl flex items-center gap-3">
                  <CheckCircle className="text-green-500" size={20} />
                  <p className="text-green-600 font-medium">{success}</p>
                </div>
              )}

              {events.length === 0 ? (
                <div className="bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300 p-12 text-center">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar size={40} className="text-gray-400" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-600">No Events Found</h2>
                  <p className="text-gray-400 mt-2">
                    Create at least one event before assigning tasks.
                  </p>
                </div>
              ) : (
                <>
                  {/* Event Selection Card */}
                  <div className="bg-linear-to-r from-purple-50 to-pink-50 rounded-2xl p-6 mb-8">
                    <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3">
                      <Calendar size={18} className="text-[#8b4fa2]" />
                      Select Event
                    </label>
                    <select
                      value={selectedEventId}
                      onChange={(e) => {
                        setSelectedEventId(e.target.value);
                        setFormData((prev) => ({ ...prev, assigned_to: "" }));
                      }}
                      className="w-full md:w-96 px-5 py-3 rounded-xl border-2 border-gray-200 bg-white focus:ring-2 focus:ring-[#8b4fa2] focus:border-transparent outline-none transition cursor-pointer"
                    >
                      {events.map((event) => (
                        <option key={event._id} value={event._id}>
                          {event.title}
                        </option>
                      ))}
                    </select>
                    {selectedEvent && (
                      <p className="text-xs text-gray-500 mt-2">
                        📍 {selectedEvent.venue} • 📅 {new Date(selectedEvent.start_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  {/* Two Column Layout */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    
                    {/* Create Task Form */}
                    <div className="bg-white rounded-2xl border-2 border-gray-100 shadow-sm overflow-hidden">
                      <div className="bg-linear-to-r from-[#8b4fa2] to-[#7a3d91] px-6 py-4">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                          <Plus size={20} />
                          Create New Task
                        </h2>
                        <p className="text-purple-100 text-sm mt-1">
                          Event: <span className="font-semibold">{selectedEvent?.title}</span>
                        </p>
                      </div>

                      <form onSubmit={handleCreateTask} className="p-6 space-y-5">
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">Task Title *</label>
                          <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                            placeholder="e.g., Manage stage setup"
                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white focus:ring-2 focus:ring-[#8b4fa2] focus:border-transparent outline-none transition"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
                          <textarea
                            rows={4}
                            value={formData.description}
                            onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                            placeholder="Add task details, deadlines, or special instructions..."
                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white focus:ring-2 focus:ring-[#8b4fa2] focus:border-transparent outline-none transition resize-none"
                          />
                        </div>

                        <div>
                          <label className="flex text-sm font-bold text-gray-700 mb-2 items-center gap-2">
                            <Users size={16} className="text-[#8b4fa2]" />
                            Assign Volunteer *
                          </label>
                          <select
                            value={formData.assigned_to}
                            onChange={(e) => setFormData((prev) => ({ ...prev, assigned_to: e.target.value }))}
                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white focus:ring-2 focus:ring-[#8b4fa2] focus:border-transparent outline-none transition cursor-pointer"
                            required
                          >
                            <option value="">Select a volunteer</option>
                            {volunteers.map((registration) => (
                              <option key={registration._id} value={registration._id}>
                                👤 {registration.student_id?.name || "Volunteer"} - {registration.student_id?.email || "No email"}
                              </option>
                            ))}
                          </select>
                          {volunteers.length === 0 && (
                            <div className="mt-2 flex items-center gap-2 text-xs text-yellow-600 bg-yellow-50 p-2 rounded-lg">
                              <AlertCircle size={14} />
                              <span>No volunteers registered for this event yet.</span>
                            </div>
                          )}
                        </div>

                        <button
                          type="submit"
                          disabled={submitting || volunteers.length === 0}
                          className="w-full py-3 rounded-xl bg-linear-to-r from-[#8b4fa2] to-[#7a3d91] text-white font-bold hover:shadow-lg transition-all transform hover:scale-[1.02] disabled:opacity-60 disabled:hover:scale-100 flex items-center justify-center gap-2"
                        >
                          {submitting ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              Creating...
                            </>
                          ) : (
                            <>
                              <Plus size={18} />
                              Create Task
                            </>
                          )}
                        </button>
                      </form>
                    </div>

                    {/* Tasks List */}
                    <div className="bg-white rounded-2xl border-2 border-gray-100 shadow-sm overflow-hidden">
                      <div className="bg-linear-to-r from-[#4ECDC4] to-[#3ba89f] px-6 py-4">
                        <div className="flex items-center justify-between">
                          <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <CheckCircle size={20} />
                            Event Tasks
                          </h2>
                          <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-white text-sm font-semibold">
                            {tasks.length} Total
                          </span>
                        </div>
                      </div>

                      <div className="p-6">
                        {loadingData ? (
                          <div className="flex items-center justify-center py-12">
                            <div className="w-8 h-8 border-3 border-[#8b4fa2] border-t-transparent rounded-full animate-spin"></div>
                          </div>
                        ) : tasks.length === 0 ? (
                          <div className="text-center py-12">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                              <ListTodo size={32} className="text-gray-400" />
                            </div>
                            <p className="text-gray-500 font-medium">No tasks yet</p>
                            <p className="text-sm text-gray-400 mt-1">Create your first task for this event</p>
                          </div>
                        ) : (
                          <div className="space-y-3 max-h-125 overflow-y-auto pr-2">
                            {tasks.map((task) => (
                              <div
                                key={task._id}
                                className="group border-2 border-gray-100 rounded-xl p-4 hover:shadow-md hover:border-[#8b4fa2]/30 transition-all"
                              >
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      <h3 className="font-extrabold text-gray-800">{task.title}</h3>
                                      <span
                                        className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${getTaskStatusClass(
                                          task.status
                                        )}`}
                                      >
                                        {getTaskStatusIcon(task.status)}
                                        {task.status}
                                      </span>
                                    </div>
                                    <p className="text-sm text-gray-500 mt-1">
                                      {task.description || "No description provided."}
                                    </p>
                                    <div className="flex items-center gap-2 mt-3 text-xs text-gray-400">
                                      <UserCheck size={12} />
                                      <span>
                                        Assigned to:{" "}
                                        <span className="font-semibold text-gray-700">
                                          {task.assigned_to?.student_id?.name || "Unknown Volunteer"}
                                        </span>
                                      </span>
                                    </div>
                                  </div>

                                  <button
                                    onClick={() => handleDeleteTask(task._id)}
                                    className="opacity-0 group-hover:opacity-100 transition-all p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                    title="Delete task"
                                  >
                                    <Trash2 size={18} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default OrganizerTasks;