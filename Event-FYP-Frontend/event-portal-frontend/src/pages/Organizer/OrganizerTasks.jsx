import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import OrganizerSidebar from "../../components/OrganizerSidebar";
import { useAuth } from "../../context/AuthContext";
import {
  Calendar,
  CheckCircle,
  Clock,
  Plus,
  Trash2,
  Pencil,
  Users,
  ListTodo,
  AlertCircle,
  UserCheck,
  Eye,
  EyeOff,
  X,
  AlertTriangle,
} from "lucide-react";
import VolunteersTable from "../../components/OrganizerComp/Attendance/VolunteersTable";

const OrganizerTasks = () => {
  const { token } = useAuth();

  // ✅ API URL from env
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [volunteers, setVolunteers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [showVolunteerTable, setShowVolunteerTable] = useState(false);

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

  // ✅ Edit Task modal state
  const [editingTask, setEditingTask] = useState(null);
  const [editFormData, setEditFormData] = useState({
    title: "",
    description: "",
    assigned_to: "",
  });
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState("");

  // ✅ Delete Confirmation Dialog state
  const [deleteDialog, setDeleteDialog] = useState({
    isOpen: false,
    taskId: null,
    taskTitle: "",
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
     if (!token) return; 
    fetchEvents();
  }, [token]);

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

  // ✅ Open delete confirmation dialog
  const openDeleteDialog = (taskId) => {
    const task = tasks.find((t) => t._id === taskId);
    setDeleteDialog({
      isOpen: true,
      taskId: taskId,
      taskTitle: task?.title || "Untitled",
    });
  };

  // ✅ Close delete confirmation dialog
  const closeDeleteDialog = () => {
    setDeleteDialog({
      isOpen: false,
      taskId: null,
      taskTitle: "",
    });
  };

  // ✅ Delete task after confirmation
  const confirmDeleteTask = async () => {
    const { taskId } = deleteDialog;
    if (!taskId) return;

    setError("");
    setSuccess("");
    try {
      await axios.delete(`${API_URL}/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTasks((prev) => prev.filter((task) => task._id !== taskId));
      setSuccess("Task deleted successfully.");
      closeDeleteDialog();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to delete task.");
      closeDeleteDialog();
    }
  };

  // ✅ Open the edit modal, pre-filled with the task's current values
  const handleOpenEdit = (task) => {
    setEditError("");
    setEditingTask(task);
    setEditFormData({
      title: task.title || "",
      description: task.description || "",
      assigned_to: task.assigned_to?._id || "",
    });
  };

  const handleCloseEdit = () => {
    setEditingTask(null);
    setEditError("");
  };

  // ✅ Submit the edited task to PUT /tasks/:id/edit
  const handleUpdateTask = async (e) => {
    e.preventDefault();
    setEditError("");

    if (!editFormData.title.trim()) {
      return setEditError("Task title is required.");
    }
    if (!editFormData.assigned_to) {
      return setEditError("Please assign a volunteer.");
    }

    setEditSubmitting(true);
    try {
      const res = await axios.put(
        `${API_URL}/tasks/${editingTask._id}/edit`,
        {
          title: editFormData.title.trim(),
          description: editFormData.description.trim(),
          assigned_to: editFormData.assigned_to,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const updatedTask = res.data?.task;

      setTasks((prev) =>
        prev.map((task) =>
          task._id === editingTask._id ? updatedTask || { ...task, ...editFormData } : task
        )
      );
      setSuccess("Task updated successfully.");
      handleCloseEdit();
    } catch (err) {
      setEditError(err?.response?.data?.message || "Failed to update task.");
    } finally {
      setEditSubmitting(false);
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
              <div className="mb-8 text-center">
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

              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-linear-to-r from-purple-50 to-purple-100 rounded-xl p-4 text-center">
                  <Users size={24} className="text-[#8b4fa2] mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-800">{volunteers.length}</p>
                  <p className="text-xs text-gray-500">Total Volunteers</p>
                </div>
                <div className="bg-linear-to-r from-blue-50 to-blue-100 rounded-xl p-4 text-center">
                  <ListTodo size={24} className="text-blue-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-800">{tasks.length}</p>
                  <p className="text-xs text-gray-500">Total Tasks</p>
                </div>
                <div className="bg-linear-to-r from-green-50 to-green-100 rounded-xl p-4 text-center">
                  <CheckCircle size={24} className="text-green-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-800">
                    {tasks.filter(t => t.status === "Completed").length}
                  </p>
                  <p className="text-xs text-gray-500">Completed Tasks</p>
                </div>
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
                  {/* Event Selection Card with Styled Show/Hide Button */}
                  <div className="bg-linear-to-r from-purple-50 to-pink-50 rounded-2xl p-6 mb-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
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

                      {/* Styled Show/Hide Volunteers Button */}
                      <button
                        onClick={() => setShowVolunteerTable(!showVolunteerTable)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 shadow-md hover:shadow-lg ${
                          showVolunteerTable
                            ? "bg-linear-to-r from-red-500 to-orange-500 text-white hover:opacity-90 hover:scale-[1.02]"
                            : "bg-linear-to-r from-[#8b4fa2] to-[#4ECDC4] text-white hover:opacity-90 hover:scale-[1.02]"
                        }`}
                      >
                        {showVolunteerTable ? (
                          <>
                            <EyeOff size={16} />
                            Hide Volunteers List
                          </>
                        ) : (
                          <>
                            <Eye size={16} />
                            Show Volunteers List
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Volunteers Table */}
                  {showVolunteerTable && (
                    <div className="mb-8">
                      {volunteers.length > 0 ? (
                        <VolunteersTable
                          volunteers={volunteers}
                          eventTitle={selectedEvent?.title}
                        />
                      ) : (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
                          <AlertCircle size={24} className="text-yellow-500 mx-auto mb-2" />
                          <p className="text-yellow-700 font-medium">No volunteers registered for this event yet.</p>
                          <p className="text-yellow-600 text-sm mt-1">Students can register as volunteers when signing up for events.</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Two Column Layout for Tasks */}
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
                          <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                            {tasks.map((task) => (
                              <div
                                key={task._id}
                                className="group border-2 border-gray-100 rounded-xl p-4 hover:shadow-md hover:border-[#8b4fa2]/30 transition-all"
                              >
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2 flex-wrap">
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

                                  {/* Edit + Delete actions */}
                                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                    <button
                                      onClick={() => handleOpenEdit(task)}
                                      className="p-2 text-[#8b4fa2] hover:text-[#7a3d91] hover:bg-purple-50 rounded-lg"
                                      title="Edit task"
                                    >
                                      <Pencil size={18} />
                                    </button>
                                    <button
                                      onClick={() => openDeleteDialog(task._id)}
                                      className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                      title="Delete task"
                                    >
                                      <Trash2 size={18} />
                                    </button>
                                  </div>
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

      {/* ✅ Edit Task Modal */}
      {editingTask && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={handleCloseEdit}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-linear-to-r from-[#8b4fa2] to-[#7a3d91] px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Pencil size={18} />
                Edit Task
              </h2>
              <button
                onClick={handleCloseEdit}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdateTask} className="p-6 space-y-5">
              {editError && (
                <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded-lg flex items-center gap-2">
                  <AlertCircle className="text-red-500 shrink-0" size={18} />
                  <p className="text-red-600 text-sm font-medium">{editError}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Task Title *</label>
                <input
                  type="text"
                  value={editFormData.title}
                  onChange={(e) => setEditFormData((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white focus:ring-2 focus:ring-[#8b4fa2] focus:border-transparent outline-none transition"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
                <textarea
                  rows={4}
                  value={editFormData.description}
                  onChange={(e) => setEditFormData((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white focus:ring-2 focus:ring-[#8b4fa2] focus:border-transparent outline-none transition resize-none"
                />
              </div>

              <div>
                <label className="flex text-sm font-bold text-gray-700 mb-2 items-center gap-2">
                  <Users size={16} className="text-[#8b4fa2]" />
                  Assign Volunteer *
                </label>
                <select
                  value={editFormData.assigned_to}
                  onChange={(e) => setEditFormData((prev) => ({ ...prev, assigned_to: e.target.value }))}
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
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCloseEdit}
                  className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="flex-1 py-3 rounded-xl bg-linear-to-r from-[#8b4fa2] to-[#7a3d91] text-white font-bold hover:shadow-lg transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {editSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ✅ Delete Confirmation Dialog */}
      {deleteDialog.isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={closeDeleteDialog}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-linear-to-r from-red-500 to-red-600 px-6 py-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <AlertTriangle size={22} className="text-white" />
              </div>
              <h2 className="text-lg font-bold text-white">Delete Task</h2>
            </div>

            <div className="p-6">
              <p className="text-gray-600 text-sm mb-2">
                Are you sure you want to delete the task:
              </p>
              <p className="font-bold text-gray-800 text-base mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                "{deleteDialog.taskTitle}"
              </p>
              <p className="text-xs text-gray-400 mb-6">
                This action cannot be undone. All data related to this task will be permanently removed.
              </p>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={closeDeleteDialog}
                  className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteTask}
                  className="flex-1 py-3 rounded-xl bg-linear-to-r from-red-500 to-red-600 text-white font-bold hover:shadow-lg transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
                >
                  <Trash2 size={18} />
                  Delete Task
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizerTasks;