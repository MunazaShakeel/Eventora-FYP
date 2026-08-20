import React, { useState, useEffect } from "react";
import axios from "axios";
import StudentSidebar from "../../components/StudentSidebar";
import { useAuth } from "../../context/AuthContext";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

const StudentTasks = () => {
  const { token } = useAuth();

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [updateModal, setUpdateModal] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("");

  useEffect(() => {
    if (!token) return;
    fetchMyTasks();
  }, [token]);

  const fetchMyTasks = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/api/tasks/my-tasks`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const list = res.data || [];
      setTasks(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error(err);
      setError("Failed to load tasks.");
    } finally {
      setLoading(false);
    }
  };

  // Filter tasks based on active tab
  const filteredTasks = tasks.filter((task) => {
    if (activeTab === "all") return true;
    if (activeTab === "pending") return task.status === "Pending";
    if (activeTab === "inprogress") return task.status === "In Progress";
    if (activeTab === "completed") return task.status === "Completed";
    return true;
  });

  const handleUpdateStatus = async () => {
    if (!updateModal || !selectedStatus) return;
    
    setUpdating(true);
    try {
      await axios.put(
        `${API}/api/tasks/${updateModal.taskId}`,
        { status: selectedStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update local state
      setTasks((prev) =>
        prev.map((task) =>
          task._id === updateModal.taskId ? { ...task, status: selectedStatus } : task
        )
      );
      
      setUpdateModal(null);
      setSelectedStatus("");
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to update task status.");
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "TBA";
    return new Date(dateStr).toLocaleDateString("en-PK", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusConfig = (status) => {
    const configs = {
      Pending: {
        icon: "pending",
        color: "#d97706",
        bg: "#fff8e6",
        label: "Pending",
        nextStatuses: ["In Progress"]
      },
      "In Progress": {
        icon: "progress_activity",
        color: "#0d9488",
        bg: "#edfafa",
        label: "In Progress",
        nextStatuses: ["Completed"]
      },
      Completed: {
        icon: "task_alt",
        color: "#10b981",
        bg: "#e8f9f0",
        label: "Completed",
        nextStatuses: []
      }
    };
    return configs[status] || configs.Pending;
  };

  const tabs = [
    { key: "all", label: "All", icon: "grid_view", count: tasks.length },
    {
      key: "pending",
      label: "Pending",
      icon: "pending",
      count: tasks.filter((t) => t.status === "Pending").length,
    },
    {
      key: "inprogress",
      label: "In Progress",
      icon: "progress_activity",
      count: tasks.filter((t) => t.status === "In Progress").length,
    },
    {
      key: "completed",
      label: "Completed",
      icon: "task_alt",
      count: tasks.filter((t) => t.status === "Completed").length,
    },
  ];

  // Calculate stats
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "Completed").length;
  const inProgressTasks = tasks.filter((t) => t.status === "In Progress").length;
  const pendingTasks = tasks.filter((t) => t.status === "Pending").length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

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
              <div className="inline-block px-5 py-1 mb-8 rounded-full bg-[#FFE66D] text-[#1A1A1A] text-xs font-black tracking-widest uppercase">
                Volunteer Portal
              </div>
              <h1 className="text-3xl font-black text-white leading-tight">My Tasks</h1>
              <p className="text-purple-200 text-sm mt-1">
                Track and manage all your assigned volunteer tasks
              </p>
            </div>

            {/* Stats Pills */}
            <div className="flex gap-3 flex-wrap">
              {[
                { label: "Total", value: totalTasks, color: "#FFE66D" },
                { label: "Completed", value: completedTasks, color: "#4ECDC4" },
                { label: "In Progress", value: inProgressTasks, color: "#FF6B6B" },
                { label: "Pending", value: pendingTasks, color: "#FFB347" },
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

          {/* Completion Rate Card */}
          {totalTasks > 0 && (
            <div className="mb-6 bg-linear-to-r from-purple-50 to-pink-50 rounded-2xl p-4 border border-purple-100">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <p className="text-xs font-black text-gray-400 uppercase tracking-wider">Your Progress</p>
                  <p className="text-2xl font-black text-gray-800">{completionRate}% Complete</p>
                </div>
                <div className="flex-1 max-w-md">
                  <div className="h-2 bg-purple-200 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${completionRate}%`, background: "linear-gradient(90deg, #9B59B6, #4ECDC4)" }}
                    />
                  </div>
                </div>
                <div className="flex gap-4 text-center">
                  <div>
                    <p className="text-lg font-black text-green-600">{completedTasks}</p>
                    <p className="text-[10px] text-gray-400">Done</p>
                  </div>
                  <div className="w-px h-8 bg-purple-200" />
                  <div>
                    <p className="text-lg font-black text-blue-600">{inProgressTasks}</p>
                    <p className="text-[10px] text-gray-400">In Progress</p>
                  </div>
                  <div className="w-px h-8 bg-purple-200" />
                  <div>
                    <p className="text-lg font-black text-yellow-600">{pendingTasks}</p>
                    <p className="text-[10px] text-gray-400">Pending</p>
                  </div>
                </div>
              </div>
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
              <p className="text-sm text-gray-400 font-medium">Loading your tasks...</p>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400 bg-white rounded-3xl border border-dashed border-gray-200">
              <span className="material-symbols-outlined text-[56px] mb-3" style={{ color: "#d8b4fe" }}>
                assignment_turned_in
              </span>
              <p className="text-base font-bold text-gray-600">No tasks found</p>
              <p className="text-sm mt-1 text-gray-400">
                {activeTab === "all" 
                  ? "You haven't been assigned any tasks yet." 
                  : `No ${activeTab} tasks available.`}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTasks.map((task) => {
                const statusConfig = getStatusConfig(task.status);
                const event = task.event_id;
                const canUpdate = task.status !== "Completed";

                return (
                  <div
                    key={task._id}
                    className="bg-white rounded-3xl border border-gray-100 overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
                    style={{ boxShadow: "0 2px 12px rgba(155,89,182,0.07)" }}
                  >
                    {/* Top accent bar based on status */}
                    <div
                      className="h-1 w-full"
                      style={{
                        background:
                          task.status === "Completed"
                            ? "linear-gradient(90deg,#4ECDC4,#2bb5ac)"
                            : task.status === "In Progress"
                            ? "linear-gradient(90deg,#0d9488,#2bb5ac)"
                            : "linear-gradient(90deg,#9B59B6,#FF6B6B)",
                      }}
                    />

                    <div className="p-5 flex flex-col md:flex-row md:items-center gap-4">
                      {/* Status Icon Badge */}
                      <div
                        className="shrink-0 w-14 h-14 rounded-2xl flex flex-col items-center justify-center"
                        style={{
                          background: `linear-gradient(135deg, ${statusConfig.color}, ${statusConfig.color}cc)`,
                        }}
                      >
                        <span className="material-symbols-outlined text-2xl text-white">
                          {statusConfig.icon}
                        </span>
                      </div>

                      {/* Task Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                          <h3
                            className="text-base font-black text-gray-800"
                            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                          >
                            {task.title}
                          </h3>
                          {/* Status Badge */}
                          <span
                            className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                            style={{ background: statusConfig.bg, color: statusConfig.color }}
                          >
                            {statusConfig.label}
                          </span>
                        </div>

                        <p className="text-sm text-gray-500 mb-2">{task.description || "No description provided"}</p>

                        <div className="flex flex-wrap gap-x-4 gap-y-1">
                          {event && (
                            <>
                              <span className="text-xs text-gray-400 flex items-center gap-1">
                                <span className="material-symbols-outlined text-[13px]">event</span>
                                {event.title}
                              </span>
                              {event.start_date && (
                                <span className="text-xs text-gray-400 flex items-center gap-1">
                                  <span className="material-symbols-outlined text-[13px]">calendar_month</span>
                                  {formatDate(event.start_date)}
                                </span>
                              )}
                              {event.venue && (
                                <span className="text-xs text-gray-400 flex items-center gap-1">
                                  <span className="material-symbols-outlined text-[13px]">location_on</span>
                                  {event.venue}
                                </span>
                              )}
                            </>
                          )}
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[13px]">schedule</span>
                            Assigned: {formatDate(task.createdAt)}
                          </span>
                        </div>
                      </div>

                      {/* Update Button */}
                      {canUpdate && (
                        <button
                          onClick={() => setUpdateModal({ taskId: task._id, taskTitle: task.title, currentStatus: task.status })}
                          className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-2 rounded-xl transition"
                          style={{ background: "#f5eefa", color: "#8b4fa2" }}
                        >
                          <span className="material-symbols-outlined text-[14px]">edit_note</span>
                          Update Status
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* ── UPDATE STATUS MODAL ── */}
      {updateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-7">
            {/* Header */}
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-lg font-black text-gray-800" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Update Task Status
              </h3>
              <button
                onClick={() => { setUpdateModal(null); setSelectedStatus(""); }}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <span className="material-symbols-outlined text-[22px]">close</span>
              </button>
            </div>
            <p className="text-sm text-[#9B59B6] font-semibold mb-5">{updateModal.taskTitle}</p>

            {/* Status Options */}
            <div className="mb-6">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Current Status</p>
              <div className="mb-4 p-3 rounded-xl" style={{ background: "#f5eefa" }}>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]" style={{ color: "#8b4fa2" }}>
                    {updateModal.currentStatus === "Pending" && "pending"}
                    {updateModal.currentStatus === "In Progress" && "progress_activity"}
                    {updateModal.currentStatus === "Completed" && "task_alt"}
                  </span>
                  <span className="text-sm font-semibold" style={{ color: "#8b4fa2" }}>
                    {updateModal.currentStatus}
                  </span>
                </div>
              </div>

              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Change to</p>
              <div className="space-y-3">
                {updateModal.currentStatus !== "In Progress" && (
                  <label className="flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all hover:bg-gray-50">
                    <input
                      type="radio"
                      name="status"
                      value="In Progress"
                      checked={selectedStatus === "In Progress"}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="w-4 h-4 accent-[#8b4fa2]"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px]" style={{ color: "#0d9488" }}>
                          progress_activity
                        </span>
                        <span className="font-semibold text-gray-700">In Progress</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">Task is currently being worked on</p>
                    </div>
                  </label>
                )}

                {updateModal.currentStatus !== "Completed" && updateModal.currentStatus !== "Pending" && (
                  <label className="flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all hover:bg-gray-50">
                    <input
                      type="radio"
                      name="status"
                      value="Completed"
                      checked={selectedStatus === "Completed"}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="w-4 h-4 accent-[#8b4fa2]"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px]" style={{ color: "#10b981" }}>
                          task_alt
                        </span>
                        <span className="font-semibold text-gray-700">Completed</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">Task has been finished successfully</p>
                    </div>
                  </label>
                )}
              </div>
            </div>

            {/* Warning if no option selected */}
            {updateModal.currentStatus === "Completed" && (
              <div className="mb-6 p-3 bg-amber-50 rounded-xl border border-amber-100">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-amber-500">info</span>
                  <p className="text-xs text-amber-700">Task is already completed. No further updates possible.</p>
                </div>
              </div>
            )}

            <button
              onClick={handleUpdateStatus}
              disabled={updating || !selectedStatus || updateModal.currentStatus === "Completed"}
              className="w-full py-3 rounded-2xl text-white text-sm font-black transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: "linear-gradient(135deg, #9B59B6, #6d3483)", boxShadow: "0 4px 15px rgba(139,79,162,0.35)" }}
            >
              {updating ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Updating...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-[16px]">check_circle</span>
                  Update Status
                </span>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentTasks;